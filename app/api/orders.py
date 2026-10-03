from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Order, OrderItem, Product, User
from app.schemas.schemas import OrderIn, OrderStatusIn
from app.auth.dependencies import (
    get_current_user,
    require_roles,
    require_csrf,
)
from app.services.audit import log_action


router = APIRouter(
    prefix="/api/orders",
    tags=["orders"],
)


def _note_value(notes, label):
    if not notes:
        return None
    prefix = label.lower() + ":"
    for line in str(notes).splitlines():
        if line.strip().lower().startswith(prefix):
            return line.split(":", 1)[1].strip()
    return None


def serialize(o):
    customer = o.customer
    phone = _note_value(o.notes, "Phone")
    address = _note_value(o.notes, "Delivery address")

    return {
        "id": o.id,
        "status": o.status,
        "total_amount": float(o.total_amount),
        "notes": o.notes,
        "phone": phone,
        "address": address,
        "expected_delivery_date": o.expected_delivery_date.isoformat() if o.expected_delivery_date else None,
        "created_at": o.created_at.isoformat(),
        "customer": (
            {
                "id": customer.id,
                "name": customer.full_name,
                "email": customer.email,
                "phone": phone,
                "address": address,
            }
            if customer
            else None
        ),
        "items": [
            {
                "product_id": item.product_id,
                "product": item.product.name,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
            }
            for item in o.items
        ],
    }


@router.get("")
def list_orders(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Order)
        .options(
            joinedload(Order.items).joinedload(OrderItem.product),
            joinedload(Order.customer),
        )
        .filter(Order.business_id == user.business_id)
    )

    if user.role == "customer":
        query = query.filter(
            Order.customer_id == user.id
        )

    return [
        serialize(order)
        for order in query
        .order_by(Order.created_at.desc())
        .all()
    ]


@router.post(
    "",
    dependencies=[Depends(require_csrf)],
)
def create_order(
    payload: OrderIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if user.role == "customer":
        if not payload.phone:
            raise HTTPException(
                400,
                "Phone number is required.",
            )

        if not payload.address:
            raise HTTPException(
                400,
                "Delivery address is required.",
            )

    ids = [
        item.product_id
        for item in payload.items
    ]

    products = {
        product.id: product
        for product in (
            db.query(Product)
            .filter(
                Product.business_id == user.business_id,
                Product.id.in_(ids),
            )
            .all()
        )
    }

    if len(products) != len(set(ids)):
        raise HTTPException(
            400,
            "One or more products are invalid.",
        )

    delivery_details = None

    if user.role == "customer":
        delivery_details = (
            f"Customer: {user.full_name}\n"
            f"Email: {user.email}\n"
            f"Phone: {payload.phone}\n"
            f"Delivery address: {payload.address}"
        )

        if payload.notes:
            delivery_details += (
                f"\nOrder note: {payload.notes}"
            )

    else:
        delivery_details = payload.notes

    order = Order(
        business_id=user.business_id,
        customer_id=(
            user.id
            if user.role == "customer"
            else None
        ),
        status="pending",
        notes=delivery_details,
        total_amount=Decimal("0"),
    )

    db.add(order)
    db.flush()

    total = Decimal("0")

    for item in payload.items:
        product = products[item.product_id]

        if (
            not product.is_available
            or not product.inventory
            or product.inventory.quantity < item.quantity
        ):
            raise HTTPException(
                400,
                f"Product unavailable or insufficient stock: "
                f"{product.name}",
            )

        order_item = OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=item.quantity,
            unit_price=product.price,
        )

        db.add(order_item)

        total += (
            product.price * item.quantity
        )

        product.inventory.quantity -= (
            item.quantity
        )

    order.total_amount = total

    log_action(
        db,
        user,
        "create_order",
        "order",
        order.id,
    )

    db.commit()
    db.refresh(order)

    return serialize(order)


@router.patch(
    "/{order_id}/status",
    dependencies=[
        Depends(require_roles("owner", "admin", "staff")),
        Depends(require_csrf),
    ],
)
def update_status(
    order_id: int,
    payload: OrderStatusIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.business_id == user.business_id,
        )
        .first()
    )

    if not order:
        raise HTTPException(
            404,
            "Order not found",
        )

    order.status = payload.status
    order.expected_delivery_date = payload.expected_delivery_date

    log_action(
        db,
        user,
        "update_order_status",
        "order",
        order.id,
        details={
            "status": order.status,
            "expected_delivery_date": (
                order.expected_delivery_date.isoformat()
                if order.expected_delivery_date
                else None
            ),
        },
    )

    db.commit()

    return {
        "message": "Order status updated",
    }