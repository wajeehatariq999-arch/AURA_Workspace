from __future__ import annotations
import json
from decimal import Decimal
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.models import Product, Inventory, Supplier, Order, OrderItem, Business, BusinessSettings, KnowledgeDocument, SupplierRequest
from app.services.rag import retrieve

class ToolContext:
    def __init__(self, db: Session, user):
        self.db, self.user = db, user


def _product(ctx, product_id=None, name=None):
    q = ctx.db.query(Product).options(joinedload(Product.inventory), joinedload(Product.category)).filter(Product.business_id == ctx.user.business_id)
    if product_id is not None: q=q.filter(Product.id==int(product_id))
    elif name: q=q.filter(Product.name.ilike(f"%{name}%"))
    else: return None
    return q.first()


def check_inventory(ctx, product_id=None, low_only=False):
    q=ctx.db.query(Product).options(joinedload(Product.inventory)).filter(Product.business_id==ctx.user.business_id)
    rows=[]
    for p in q.all():
        qty=p.inventory.quantity if p.inventory else 0
        level=p.inventory.reorder_level if p.inventory else 0
        low=qty<=level
        if low_only and not low: continue
        if product_id is not None and p.id != int(product_id): continue
        rows.append({"product_id":p.id,"product":p.name,"stock":qty,"reorder_level":level,"low_stock":low,"available":p.is_available})
    return rows


def get_product(ctx, product_id=None, name=None):
    p=_product(ctx,product_id,name)
    if not p: return {"found":False}
    return {"found":True,"id":p.id,"name":p.name,"description":p.description,"price":float(p.price),"category":p.category.name if p.category else None,"available":p.is_available,"stock":p.inventory.quantity if p.inventory else 0}


def get_order_status(ctx, order_id=None):
    q=ctx.db.query(Order).options(joinedload(Order.items).joinedload(OrderItem.product)).filter(Order.business_id==ctx.user.business_id)
    if ctx.user.role=="customer": q=q.filter(Order.customer_id==ctx.user.id)
    if order_id is not None: q=q.filter(Order.id==int(order_id))
    orders=q.order_by(Order.created_at.desc()).limit(20).all()
    return [{"order_id":o.id,"status":o.status,"total":float(o.total_amount),"created_at":o.created_at.isoformat(),"items":[{"product":i.product.name,"quantity":i.quantity,"unit_price":float(i.unit_price)} for i in o.items]} for o in orders]

def list_orders(ctx, date_from=None, date_to=None, status=None, limit=50):
    q=ctx.db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
        joinedload(Order.customer),
    ).filter(Order.business_id==ctx.user.business_id)
    if ctx.user.role=="customer":
        q=q.filter(Order.customer_id==ctx.user.id)
    if date_from:
        q=q.filter(Order.created_at >= f"{date_from}T00:00:00")
    if date_to:
        q=q.filter(Order.created_at < f"{date_to}T23:59:59.999999")
    if status:
        q=q.filter(Order.status==status)
    rows=q.order_by(Order.created_at.desc()).limit(min(int(limit),100)).all()
    return [{
        "order_id":o.id,
        "status":o.status,
        "total":float(o.total_amount),
        "created_at":o.created_at.isoformat(),
        "customer":o.customer.full_name if o.customer else None,
        "phone":_note_value(o.notes,"Phone"),
        "address":_note_value(o.notes,"Delivery address"),
        "expected_delivery_date":o.expected_delivery_date.isoformat() if o.expected_delivery_date else None,
        "items":[{"product":i.product.name,"quantity":i.quantity,"unit_price":float(i.unit_price)} for i in o.items],
    } for o in rows]

def _note_value(notes, label):
    if not notes:
        return None
    prefix=label.lower()+":"
    for line in str(notes).splitlines():
        if line.strip().lower().startswith(prefix):
            return line.split(":",1)[1].strip()
    return None


def calculate_order_total(ctx, items):
    total=Decimal("0"); details=[]
    for item in items:
        p=_product(ctx,item.get("product_id"),item.get("name"))
        if not p: return {"error":f"Product not found: {item}"}
        qty=int(item["quantity"])
        if not p.is_available or not p.inventory or p.inventory.quantity < qty: return {"error":f"Insufficient or unavailable stock for {p.name}"}
        line=p.price*qty; total+=line; details.append({"product_id":p.id,"product":p.name,"quantity":qty,"unit_price":float(p.price),"line_total":float(line)})
    return {"total":float(total),"items":details}


def create_order(ctx, items, notes=None):
    if ctx.user.role not in {"owner","admin","staff","customer"}: return {"error":"Unauthorized"}
    calc=calculate_order_total(ctx,items)
    if "error" in calc:return calc
    order=Order(business_id=ctx.user.business_id,customer_id=ctx.user.id if ctx.user.role=="customer" else None,status="pending",notes=notes,total_amount=Decimal(str(calc["total"])))
    ctx.db.add(order); ctx.db.flush()
    for item in calc["items"]:
        p=ctx.db.get(Product,item["product_id"]); p.inventory.quantity-=item["quantity"]
        ctx.db.add(OrderItem(order_id=order.id,product_id=p.id,quantity=item["quantity"],unit_price=p.price))
    ctx.db.commit()
    return {"created":True,"order_id":order.id,"total":float(order.total_amount),"status":order.status}


def get_supplier(ctx, supplier_id=None, name=None):
    q=ctx.db.query(Supplier).filter(Supplier.business_id==ctx.user.business_id)
    if supplier_id is not None:q=q.filter(Supplier.id==int(supplier_id))
    elif name:q=q.filter(Supplier.name.ilike(f"%{name}%"))
    suppliers=q.all()
    return [{"id":s.id,"name":s.name,"contact_name":s.contact_name,"email":s.email,"phone":s.phone,"address":s.address} for s in suppliers]


def prepare_supplier_request(ctx, supplier_id, items, reason):
    s=ctx.db.query(Supplier).filter(Supplier.id==int(supplier_id),Supplier.business_id==ctx.user.business_id).first()
    if not s:return {"error":"Supplier not found"}
    clean=[]
    for item in items:
        p=_product(ctx,item.get("product_id"),item.get("name"))
        if not p:return {"error":f"Product not found: {item}"}
        clean.append({"product_id":p.id,"product":p.name,"quantity":int(item["quantity"])})
    return {"requires_approval":True,"action":"create_supplier_request","supplier":{"id":s.id,"name":s.name,"email":s.email},"items":clean,"reason":reason}


def get_business_policy(ctx):
    b=ctx.db.get(Business,ctx.user.business_id); s=b.settings
    return {"business_name":b.name,"policies":s.policies if s else None,"business_hours":s.business_hours if s else None,"currency":b.currency,"contact_email":b.contact_email,"contact_phone":b.contact_phone,"address":b.address}


def search_business_knowledge(ctx, query, top_k=5):
    return retrieve(ctx.db,ctx.user.business_id,query,int(top_k))


def generate_business_report(ctx, metric="overview"):
    base=ctx.db.query(Order).filter(Order.business_id==ctx.user.business_id)
    completed=base.filter(Order.status=="completed")
    revenue=float(completed.with_entities(func.coalesce(func.sum(Order.total_amount),0)).scalar() or 0)
    order_count=base.count()
    completed_count=completed.count()
    products=check_inventory(ctx)
    low=[x for x in products if x["low_stock"]]
    top=(ctx.db.query(Product.name,func.sum(OrderItem.quantity).label("qty"))
         .join(OrderItem,OrderItem.product_id==Product.id).join(Order,Order.id==OrderItem.order_id)
         .filter(Product.business_id==ctx.user.business_id).group_by(Product.id).order_by(func.sum(OrderItem.quantity).desc()).limit(10).all())
    return {"metric":metric,"orders":order_count,"completed_orders":completed_count,"completed_revenue":revenue,"low_stock_count":len(low),"low_stock_products":low,"top_products":[{"product":n,"units":int(q)} for n,q in top]}

TOOLS={
 "check_inventory": (check_inventory,"Inspect real inventory and reorder levels.",{"product_id":"integer|null","low_only":"boolean"}),
 "get_product": (get_product,"Retrieve a real product from this business.",{"product_id":"integer|null","name":"string|null"}),
 "get_order_status": (get_order_status,"Retrieve authorized order status and items.",{"order_id":"integer|null"}),
 "list_orders": (list_orders,"List real authorized orders, optionally filtered by date and status.",{"date_from":"YYYY-MM-DD|null","date_to":"YYYY-MM-DD|null","status":"string|null","limit":"integer"}),
 "calculate_order_total": (calculate_order_total,"Calculate an order using current database prices and stock.",{"items":"array"}),
 "create_order": (create_order,"Create a real order and decrement inventory.",{"items":"array","notes":"string|null"}),
 "get_supplier": (get_supplier,"Retrieve real suppliers for this business.",{"supplier_id":"integer|null","name":"string|null"}),
 "prepare_supplier_request": (prepare_supplier_request,"Prepare a supplier restock request; this never executes it and returns an approval requirement.",{"supplier_id":"integer","items":"array","reason":"string"}),
 "get_business_policy": (get_business_policy,"Retrieve stored business policies, hours and contact information.",{}),
 "search_business_knowledge": (search_business_knowledge,"Search the business's indexed documents with semantic retrieval.",{"query":"string","top_k":"integer"}),
 "generate_business_report": (generate_business_report,"Compute actual business analytics from database records.",{"metric":"string"}),
}

def tool_descriptions(names=None):
    names=names or list(TOOLS)
    return [{"name":n,"description":TOOLS[n][1],"arguments":TOOLS[n][2]} for n in names if n in TOOLS]

def execute_tool(ctx,name,args):
    if name not in TOOLS: return {"error":f"Unknown tool: {name}"}
    try:return TOOLS[name][0](ctx,**args)
    except Exception as exc:
        ctx.db.rollback(); return {"error":"Tool execution failed","type":type(exc).__name__}
