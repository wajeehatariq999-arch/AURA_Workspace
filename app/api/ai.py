from __future__ import annotations
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.auth.dependencies import get_current_user, require_roles, require_csrf
from app.database import get_db
from app.models import User, AgentRun, AgentEvent, Approval, KnowledgeDocument, KnowledgeChunk
from app.schemas.schemas import AIChatIn
from app.services.agentic import run_agentic, AIServiceError, execute_approved_action, reject_approval
from app.services.document_storage import save_document
from app.services.rag import index_document, delete_document_vectors, DOC_DIR
from app.services.audit import log_action

router=APIRouter(prefix="/api",tags=["agentic-ai"])
admin=Depends(require_roles("owner","admin"))

@router.post("/ai/chat", dependencies=[Depends(require_csrf)])
def ai_chat(payload:AIChatIn,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    try:return run_agentic(db,user,payload.message,payload.conversation_id)
    except AIServiceError as exc: raise HTTPException(503,str(exc))

@router.get("/ai/runs/{run_id}")
def ai_run(run_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    run=db.query(AgentRun).filter(AgentRun.id==run_id,AgentRun.business_id==user.business_id,AgentRun.user_id==user.id).first()
    if not run:
        if user.role not in {"owner","admin"}: raise HTTPException(404,"Agent run not found")
        run=db.query(AgentRun).filter(AgentRun.id==run_id,AgentRun.business_id==user.business_id).first()
    if not run: raise HTTPException(404,"Agent run not found")
    events=db.query(AgentEvent).filter(AgentEvent.run_id==run.id,AgentEvent.business_id==user.business_id).order_by(AgentEvent.created_at).all()
    return {"id":run.id,"agent":run.agent_name,"action":run.action,"status":run.status,"created_at":run.created_at.isoformat(),"completed_at":run.completed_at.isoformat() if run.completed_at else None,"events":[{"agent":e.agent_name,"event":e.event_type,"tool":e.tool_name,"payload":e.payload,"created_at":e.created_at.isoformat()} for e in events]}

@router.get("/ai/activity")
def ai_activity(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    q=db.query(AgentEvent).filter(AgentEvent.business_id==user.business_id)
    if user.role=="customer":q=q.filter(AgentEvent.user_id==user.id)
    events=q.order_by(AgentEvent.created_at.desc()).limit(100).all()
    return [{"id":e.id,"agent":e.agent_name,"event":e.event_type,"tool":e.tool_name,"created_at":e.created_at.isoformat()} for e in events]

@router.get("/ai/approvals")
def list_approvals(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    if user.role not in {"owner","admin"}: raise HTTPException(403,"Owner/admin approval access required")
    rows=db.query(Approval).filter(Approval.business_id==user.business_id).order_by(Approval.created_at.desc()).limit(100).all()
    return [{"id":a.id,"action":a.action,"status":a.status,"requested_by":a.requested_by,"approved_by":a.approved_by,"details":a.details,"created_at":a.created_at.isoformat(),"resolved_at":a.resolved_at.isoformat() if a.resolved_at else None} for a in rows]

@router.post("/ai/approvals/{approval_id}/approve",dependencies=[admin,Depends(require_csrf)])
def approve(approval_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    a=db.query(Approval).filter(Approval.id==approval_id,Approval.business_id==user.business_id).first()
    if not a: raise HTTPException(404,"Approval not found")
    if a.status!="pending": raise HTTPException(409,"Approval is already resolved")
    try:
        req=execute_approved_action(db,user,a)
        return {"message":"Approved action executed","supplier_request_id":req.id,"status":req.status}
    except Exception as exc:
        db.rollback(); raise HTTPException(500,"Approved action could not be executed safely") from exc

@router.post("/ai/approvals/{approval_id}/reject",dependencies=[admin,Depends(require_csrf)])
def reject(approval_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    a=db.query(Approval).filter(Approval.id==approval_id,Approval.business_id==user.business_id).first()
    if not a: raise HTTPException(404,"Approval not found")
    if a.status!="pending": raise HTTPException(409,"Approval is already resolved")
    reject_approval(db,user,a); return {"message":"Approval rejected"}

@router.get("/knowledge")
def list_knowledge(user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    if user.role not in {"owner","admin"}: raise HTTPException(403,"Knowledge-base access requires owner/admin")
    docs=db.query(KnowledgeDocument).filter(KnowledgeDocument.business_id==user.business_id).order_by(KnowledgeDocument.created_at.desc()).all()
    return [{"id":d.id,"name":d.original_name,"mime_type":d.mime_type,"size":d.file_size,"status":d.status,"chunks":d.chunk_count,"version":d.version,"created_at":d.created_at.isoformat()} for d in docs]

@router.post("/knowledge",dependencies=[admin,Depends(require_csrf)])
async def upload_knowledge(file:UploadFile=File(...),user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    storage,original,size,path=await save_document(file)
    doc=KnowledgeDocument(business_id=user.business_id,uploaded_by=user.id,original_name=original,storage_name=storage,mime_type=file.content_type,file_size=size,status="indexing",version=1)
    db.add(doc); db.flush()
    try:
        index_document(db,doc,path)
        log_action(db,user,"upload_knowledge_document","knowledge_document",doc.id,details={"name":original,"chunks":doc.chunk_count})
        db.commit()
        return {"id":doc.id,"name":doc.original_name,"status":doc.status,"chunks":doc.chunk_count,"version":doc.version}
    except Exception as exc:
        db.rollback()
        if path.exists():path.unlink(missing_ok=True)
        raise HTTPException(422,"Document could not be extracted or indexed safely") from exc

@router.post("/knowledge/{document_id}/reindex",dependencies=[admin,Depends(require_csrf)])
def reindex(document_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    doc=db.query(KnowledgeDocument).filter(KnowledgeDocument.id==document_id,KnowledgeDocument.business_id==user.business_id).first()
    if not doc: raise HTTPException(404,"Document not found")
    path=DOC_DIR/doc.storage_name
    if not path.exists(): raise HTTPException(404,"Stored document is missing")
    try:
        delete_document_vectors(doc)
        db.query(KnowledgeChunk).filter(KnowledgeChunk.document_id==doc.id).delete(synchronize_session=False)
        doc.version+=1; doc.status="indexing"; db.commit(); index_document(db,doc,path); log_action(db,user,"reindex_knowledge_document","knowledge_document",doc.id); db.commit(); return {"status":"indexed","version":doc.version,"chunks":doc.chunk_count}
    except Exception as exc:
        db.rollback(); raise HTTPException(422,"Document could not be re-indexed") from exc

@router.post("/knowledge/{document_id}/replace",dependencies=[admin,Depends(require_csrf)])
async def replace_knowledge(document_id:int,file:UploadFile=File(...),user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    doc=db.query(KnowledgeDocument).filter(KnowledgeDocument.id==document_id,KnowledgeDocument.business_id==user.business_id).first()
    if not doc: raise HTTPException(404,"Document not found")
    storage,original,size,path=await save_document(file)
    old_path=DOC_DIR/doc.storage_name
    try:
        delete_document_vectors(doc)
        from app.models import KnowledgeChunk
        db.query(KnowledgeChunk).filter(KnowledgeChunk.document_id==doc.id).delete(synchronize_session=False)
        doc.storage_name=storage; doc.original_name=original; doc.mime_type=file.content_type; doc.file_size=size; doc.version+=1; doc.status="indexing"; db.commit()
        index_document(db,doc,path); log_action(db,user,"replace_knowledge_document","knowledge_document",doc.id,details={"name":original,"version":doc.version}); db.commit()
        old_path.unlink(missing_ok=True)
        return {"id":doc.id,"status":"indexed","version":doc.version,"chunks":doc.chunk_count}
    except Exception as exc:
        db.rollback(); path.unlink(missing_ok=True); raise HTTPException(422,"Replacement document could not be indexed") from exc

@router.delete("/knowledge/{document_id}",dependencies=[admin,Depends(require_csrf)])
def delete_knowledge(document_id:int,user:User=Depends(get_current_user),db:Session=Depends(get_db)):
    doc=db.query(KnowledgeDocument).filter(KnowledgeDocument.id==document_id,KnowledgeDocument.business_id==user.business_id).first()
    if not doc: raise HTTPException(404,"Document not found")
    try: delete_document_vectors(doc)
    except Exception: pass
    (DOC_DIR/doc.storage_name).unlink(missing_ok=True)
    db.delete(doc); log_action(db,user,"delete_knowledge_document","knowledge_document",document_id); db.commit(); return {"message":"Knowledge document deleted"}
