from __future__ import annotations
import json
from datetime import datetime, timezone
from typing import Any
from sqlalchemy.orm import Session
from app.config import settings
from app.models import AgentRun, AgentEvent, Conversation, ConversationMessage, AgentMemory, Approval, SupplierRequest
from app.services.ai_tools import ToolContext, tool_descriptions, execute_tool
from app.services.rag import retrieve
from app.services.audit import log_action

AGENTS = {
    "customer_support": {
        "mission":"Answer customer/business questions using only authorized business data and knowledge.",
        "tools":["get_product","get_order_status","list_orders","get_business_policy","search_business_knowledge"]},
    "order": {
        "mission":"Handle real order questions, totals and order creation using current product/stock/order data.",
        "tools":["get_product","get_order_status","list_orders","calculate_order_total","create_order","get_business_policy"]},
    "inventory": {
        "mission":"Inspect current stock and reorder levels and reason about restocking needs.",
        "tools":["check_inventory","get_product","generate_business_report"]},
    "supplier": {
        "mission":"Inspect suppliers and prepare supplier restocking requests. Important actions must remain pending approval.",
        "tools":["get_supplier","check_inventory","get_product","prepare_supplier_request"]},
    "analytics": {
        "mission":"Analyze actual business data and produce evidence-based operational insights.",
        "tools":["generate_business_report","check_inventory","get_product","get_order_status","list_orders"]},
}

ROLE_AGENTS={
 "owner":set(AGENTS), "admin":set(AGENTS), "staff":{"customer_support","order","inventory","supplier"}, "customer":{"customer_support","order"}
}

class AIServiceError(Exception): pass

def _client():
    if not settings.groq_api_key:
        raise AIServiceError("GROQ_API_KEY is not configured in .env")
    try:
        from groq import Groq
    except ImportError as exc:
        raise AIServiceError("The Groq package is not installed. Run pip install -r requirements.txt") from exc
    return Groq(api_key=settings.groq_api_key, timeout=settings.groq_timeout_seconds)

def _json(text: str):
    text=text.strip()
    if text.startswith("```"):
        text=text.split("\n",1)[1].rsplit("```",1)[0]
    try:return json.loads(text)
    except Exception:
        start=min([x for x in [text.find("{"),text.find("[")] if x>=0],default=-1)
        if start>=0:
            try:return json.loads(text[start:])
            except Exception:pass
    return None

def _complete(messages, temperature=0.1):
    try:
        response=_client().chat.completions.create(model=settings.effective_groq_model,messages=messages,temperature=temperature)
        return response.choices[0].message.content or ""
    except Exception as exc:
     raise AIServiceError(f"Groq request failed: {type(exc).__name__}: {str(exc)}") from exc

def _memory(db,user):
    rows=(db.query(AgentMemory).filter(AgentMemory.business_id==user.business_id,AgentMemory.user_id==user.id).order_by(AgentMemory.created_at.desc()).limit(settings.memory_turn_limit).all())
    return [m.content for m in reversed(rows)]

def _recent_messages(conversation):
    return [{"role":m.role if m.role in {"user","assistant"} else "assistant","content":m.content} for m in conversation.messages[-settings.memory_turn_limit:]]

def _record_event(db,user,run,agent,event,tool=None,payload=None):
    db.add(AgentEvent(business_id=user.business_id,user_id=user.id,run_id=run.id if run else None,agent_name=agent,event_type=event,tool_name=tool,payload=json.dumps(payload)[:8000] if payload is not None else None))

def _allowed_plan(plan,user):
    allowed=ROLE_AGENTS[user.role]
    agents=[]
    for name in plan.get("agents",[]):
        if name in allowed and name in AGENTS and name not in agents:agents.append(name)
    return agents or ["customer_support"]

def _manager_plan(user, question, memory, history):
    prompt=f'''You are AURA's Manager/Orchestrator. You do not answer the business question yourself. Decide which specialist agents are required for the user's request.\nAvailable agents: {json.dumps({k:v["mission"] for k,v in AGENTS.items()})}\nReturn JSON only: {{"agents":["customer_support"|"order"|"inventory"|"supplier"|"analytics"],"objective":"...","needs_approval":true|false}}. Select only agents genuinely needed. Never invent business facts.\nUser role: {user.role}\nQuestion: {question}\nRelevant memory: {memory}\nRecent conversation: {history}'''
    result=_json(_complete([{"role":"system","content":"You are a routing planner. Output valid JSON only."},{"role":"user","content":prompt}]))
    if not result:return {"agents":["customer_support"],"objective":"Answer using authorized data","needs_approval":False}
    return result

def _agent_turn(db,user,run,name,question,objective,context,history,memory):
    spec=AGENTS[name]
    tool_text=json.dumps(tool_descriptions(spec["tools"]))
    system=f'''You are the {name.replace('_',' ').title()} Agent inside AURA. Mission: {spec["mission"]}\nUse tools for factual business information. You may not invent prices, stock, policies, orders, suppliers or document content. If information is missing, say so. For customer questions about policies, returns, delivery, business rules, FAQs or other owner-provided information, use search_business_knowledge and base the answer on retrieved business documents. For inventory questions, always inspect current stock; explicitly flag every low-stock item and every out-of-stock item as an operational warning. For product questions, include real product descriptions when available. You are allowed to communicate findings to the manager, not directly execute unapproved high-impact actions.\nAvailable tools: {tool_text}\nFor every tool call, output JSON only: {{"type":"tool","name":"TOOL_NAME","arguments":{{...}}}}. After enough evidence, output JSON only: {{"type":"final","answer":"...","evidence":[...],"proposed_action":null or {{...}}}}. Never claim a tool was called unless its result is supplied.''' 
    evidence=[]

    # Knowledge questions must always consult the owner's indexed documents.
    # Do this deterministically instead of relying on the LLM to remember to
    # call the RAG tool. This makes policy/FAQ answers reliably grounded in
    # the business Knowledge Base.
    knowledge_request = name == "customer_support"
    if knowledge_request:
        rag_result = execute_tool(
            ToolContext(db,user),
            "search_business_knowledge",
            {"query": question, "top_k": 5}
        )
        _record_event(
            db,
            user,
            run,
            name,
            "tool_call",
            "search_business_knowledge",
            {"arguments": {"query": question, "top_k": 5}, "result": rag_result}
        )
        db.flush()
        evidence.append({
            "tool": "search_business_knowledge",
            "result": rag_result
        })

    for _ in range(5):
        user_prompt={"question":question,"objective":objective,"context":context,"memory":memory,"other_agent_findings":evidence,"conversation":history}
        raw=_complete([{"role":"system","content":system},{"role":"user","content":json.dumps(user_prompt,default=str)}])
        parsed=_json(raw)
        if not parsed:
            return {"agent":name,"answer":raw,"evidence":evidence}
        if parsed.get("type")=="tool":
            tool=parsed.get("name"); args=parsed.get("arguments") or {}
            if tool not in spec["tools"]:
                result={"error":"Tool is not available to this agent."}
            else:
                result=execute_tool(ToolContext(db,user),tool,args)
            _record_event(db,user,run,name,"tool_call",tool,{"arguments":args,"result":result})
            db.flush()
            evidence.append({"tool":tool,"result":result})
            continue
        if parsed.get("type")=="final":
            parsed["agent"]=name; parsed["evidence"]=evidence
            _record_event(db,user,run,name,"agent_final",payload={"answer":parsed.get("answer"),"evidence_count":len(evidence)})
            db.flush()
            return parsed
    return {"agent":name,"answer":"The agent could not complete its evidence-gathering cycle.","evidence":evidence}

def _approval_from_action(db,user,run,action):
    details=dict(action)
    approval=Approval(business_id=user.business_id,requested_by=user.id,action=action.get("action","business_action"),status="pending",details=json.dumps(details,default=str))
    db.add(approval); db.flush()
    _record_event(db,user,run,"manager","approval_requested",payload={"approval_id":approval.id,"action":action.get("action")})
    log_action(db,user,"ai_approval_requested","approval",approval.id,details={"action":action.get("action")})
    return approval

def _evaluate_findings(question, results):
    raw=_complete([
        {"role":"system","content":"You are AURA's evidence evaluator. Check whether the specialist answer is supported by its supplied tool outputs. An answer is grounded when its factual claims are directly supported by evidence, even if some optional information requested by the user is unavailable. Do not mark an otherwise supported inventory/product/order answer ungrounded merely because an optional description or secondary field was not returned. Return JSON only: {\"grounded\":true|false,\"missing_information\":[...],\"conflicts\":[...],\"usable_findings\":[agent names]}. Do not add facts."},
        {"role":"user","content":json.dumps({"question":question,"findings":results},default=str)}
    ])
    parsed=_json(raw)
    return parsed or {"grounded":False,"missing_information":["Evidence evaluator returned invalid output"],"conflicts":[],"usable_findings":[]}

def execute_approved_action(db,user,approval):
    if approval.action!="create_supplier_request":
        raise ValueError("Unsupported approval action")
    data=json.loads(approval.details or "{}")
    supplier=data.get("supplier",{}); items=data.get("items",[])
    req=SupplierRequest(business_id=user.business_id,supplier_id=int(supplier["id"]),requested_by=approval.requested_by,status="approved",request_data=json.dumps({"supplier":supplier,"items":items,"reason":data.get("reason")},default=str))
    db.add(req)
    approval.status="approved"; approval.approved_by=user.id; approval.resolved_at=datetime.now(timezone.utc)
    db.flush(); log_action(db,user,"ai_approved_action","supplier_request",req.id,details={"approval_id":approval.id})
    db.commit(); return req

def reject_approval(db,user,approval):
    approval.status="rejected"; approval.approved_by=user.id; approval.resolved_at=datetime.now(timezone.utc); db.commit(); log_action(db,user,"ai_rejected_action","approval",approval.id); return approval

def run_agentic(db,user,question,conversation_id=None):
    if not question.strip(): raise AIServiceError("Question cannot be empty")
    conversation=None
    if conversation_id:
        conversation=db.query(Conversation).filter(Conversation.id==conversation_id,Conversation.business_id==user.business_id,Conversation.user_id==user.id).first()
        if not conversation: raise AIServiceError("Conversation not found")
    if not conversation:
        conversation=Conversation(business_id=user.business_id,user_id=user.id,title=question[:120]); db.add(conversation); db.flush()
    history=_recent_messages(conversation)
    memory=_memory(db,user)
    conversation.messages.append(ConversationMessage(role="user",content=question))
    run=AgentRun(business_id=user.business_id,user_id=user.id,conversation_id=conversation.id,agent_name="manager",action="orchestrate",status="started",input_summary=question[:1000]); db.add(run); db.flush()
    _record_event(db,user,run,"manager","plan_started",payload={"question":question})
    try:
        plan=_manager_plan(user,question,memory,history)
        agents=_allowed_plan(plan,user)
        context=[]
        results=[]
        for name in agents:
            result=_agent_turn(db,user,run,name,question,plan.get("objective",""),context,history,memory)
            results.append(result); context.append({"agent":name,"answer":result.get("answer"),"evidence":result.get("evidence",[])})
        evaluation=_evaluate_findings(question,results)
        _record_event(db,user,run,"manager","evaluation",payload=evaluation); db.flush()
        synth=_complete([{"role":"system","content":"You are AURA's Manager. Synthesize specialist findings into one concise, grounded answer. Use the evidence evaluation to avoid unsupported claims. For inventory findings, clearly surface LOW STOCK and OUT OF STOCK warnings first, followed by recommended next steps. For customer questions, answer using owner-provided knowledge evidence when available and do not invent policy details. Only state facts supported by the supplied findings. If evidence is missing, explicitly say the information is unavailable. Mention source document names/pages when RAG evidence exists. Do not claim actions were executed unless the findings show execution. If a proposed action requires approval, state PENDING APPROVAL."},{"role":"user","content":json.dumps({"question":question,"plan":plan,"specialist_findings":results,"evidence_evaluation":evaluation},default=str)}])
        proposed=None
        for r in results:
            pa=r.get("proposed_action") if isinstance(r,dict) else None
            if pa and pa.get("requires_approval"): proposed=pa; break
        approval=None
        if proposed: approval=_approval_from_action(db,user,run,proposed)
        answer=synth
        if approval: answer += f"\n\nPENDING APPROVAL — approval #{approval.id}. No supplier request has been executed."
        conversation.messages.append(ConversationMessage(role="assistant",content=answer,agent="manager"))
        db.add(AgentMemory(business_id=user.business_id,user_id=user.id,memory_type="conversation",content=f"User asked: {question}\nAURA answered: {answer[:2500]}"))
        run.status="completed"; run.output_summary=answer[:5000]; run.completed_at=datetime.now(timezone.utc); db.commit()
        return {"conversation_id":conversation.id,"run_id":run.id,"answer":answer,"plan":plan,"agents":results,"evaluation":evaluation,"approval_id":approval.id if approval else None}
    except AIServiceError:
        run.status="failed"; run.completed_at=datetime.now(timezone.utc); db.commit(); raise
    except Exception as exc:
        db.rollback(); raise AIServiceError("AURA could not complete this request safely.") from exc
