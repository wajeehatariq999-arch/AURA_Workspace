from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CustomerFeedback
from app.schemas.schemas import FeedbackIn
from app.auth.dependencies import get_current_user, require_csrf
from app.services.audit import log_action
from app.services.agentic import run_agentic, AIServiceError

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

@router.get("")
def list_feedback(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in {"owner", "admin", "staff"}:
        raise HTTPException(403, "Staff access required")
    rows = (
        db.query(CustomerFeedback)
        .filter(CustomerFeedback.business_id == user.business_id)
        .order_by(CustomerFeedback.created_at.desc())
        .limit(200)
        .all()
    )
    return [{
        "id": x.id,
        "kind": x.kind,
        "rating": x.rating,
        "subject": x.subject,
        "message": x.message,
        "ai_answer": x.ai_answer,
        "status": x.status,
        "customer": x.customer.full_name if x.customer else None,
        "customer_email": x.customer.email if x.customer else None,
        "created_at": x.created_at.isoformat(),
    } for x in rows]

@router.post("/query", dependencies=[Depends(require_csrf)])
def ask_aura_query(payload: FeedbackIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "customer":
        raise HTTPException(403, "Customer access required")
    try:
        result = run_agentic(db, user, payload.message)
    except AIServiceError as exc:
        raise HTTPException(503, str(exc))
    row = CustomerFeedback(
        business_id=user.business_id,
        customer_id=user.id,
        kind="query",
        subject=payload.subject,
        message=payload.message.strip(),
        ai_answer=result.get("answer"),
        status="resolved",
    )
    db.add(row)
    db.flush()
    log_action(db, user, "customer_ai_query", "customer_feedback", row.id)
    db.commit()
    return {
        "id": row.id,
        "answer": row.ai_answer,
        "run_id": result.get("run_id"),
        "conversation_id": result.get("conversation_id"),
    }

@router.post("", dependencies=[Depends(require_csrf)])
def create_feedback(payload: FeedbackIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "customer":
        raise HTTPException(403, "Customer access required")
    row = CustomerFeedback(
        business_id=user.business_id,
        customer_id=user.id,
        kind=payload.kind,
        rating=payload.rating,
        subject=payload.subject,
        message=payload.message.strip(),
        status="new",
    )
    db.add(row)
    db.flush()
    log_action(db, user, "create_customer_feedback", "customer_feedback", row.id, details={"kind": row.kind})
    db.commit()
    return {
        "id": row.id,
        "kind": row.kind,
        "rating": row.rating,
        "subject": row.subject,
        "message": row.message,
        "status": row.status,
        "created_at": row.created_at.isoformat(),
    }

@router.patch("/{feedback_id}", dependencies=[Depends(require_csrf)])
def update_feedback(feedback_id: int, status: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role not in {"owner", "admin", "staff"}:
        raise HTTPException(403, "Staff access required")
    if status not in {"new", "reviewed", "resolved"}:
        raise HTTPException(400, "Invalid feedback status")
    row = db.query(CustomerFeedback).filter(
        CustomerFeedback.id == feedback_id,
        CustomerFeedback.business_id == user.business_id
    ).first()
    if not row:
        raise HTTPException(404, "Feedback not found")
    row.status = status
    log_action(db, user, "update_customer_feedback", "customer_feedback", row.id, details={"status": status})
    db.commit()
    return {"message": "Feedback updated", "status": row.status}
