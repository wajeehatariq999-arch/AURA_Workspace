from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Business, BusinessSettings, User
from app.schemas.schemas import SignupIn, CustomerSignupIn, LoginIn, UserOut
from app.auth.security import (
    hash_password,
    verify_password,
    create_access_token,
    new_csrf_token,
)
from app.auth.dependencies import get_current_user
from app.services.audit import log_action
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["authentication"])


def set_auth_cookies(response: Response, token: str):
    csrf = new_csrf_token()

    response.set_cookie(
        "auth_token",
        token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )

    response.set_cookie(
        "csrf_token",
        csrf,
        httponly=False,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.access_token_expire_minutes * 60,
        path="/",
    )


@router.get("/businesses")
def public_businesses(db: Session = Depends(get_db)):
    businesses = (
        db.query(Business)
        .order_by(Business.name.asc())
        .all()
    )

    return [
        {
            "id": b.id,
            "name": b.name,
            "currency": b.currency,
        }
        for b in businesses
    ]


@router.post("/signup", response_model=UserOut)
def signup(
    payload: SignupIn,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    email = payload.email.lower()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "An account with this email already exists")

    business = Business(
        name=payload.business_name.strip(),
        currency="PKR",
    )

    db.add(business)
    db.flush()

    user = User(
        business_id=business.id,
        full_name=payload.full_name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role="owner",
    )

    business.settings = BusinessSettings()

    db.add(user)
    db.flush()

    log_action(
        db,
        user,
        "signup",
        "user",
        user.id,
        ip_address=request.client.host if request.client else None,
    )

    db.commit()

    token = create_access_token(user.id)
    set_auth_cookies(response, token)

    return user


@router.post("/customer-signup", response_model=UserOut)
def customer_signup(
    payload: CustomerSignupIn,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    email = payload.email.lower()

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "An account with this email already exists")

    business = db.get(Business, payload.business_id)

    if not business:
        raise HTTPException(404, "Store not found")

    user = User(
        business_id=business.id,
        full_name=payload.full_name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role="customer",
    )

    db.add(user)
    db.flush()

    log_action(
        db,
        user,
        "customer_signup",
        "user",
        user.id,
        ip_address=request.client.host if request.client else None,
    )

    db.commit()

    token = create_access_token(user.id)
    set_auth_cookies(response, token)

    return user


@router.post("/signin", response_model=UserOut)
def signin(
    payload: LoginIn,
    response: Response,
    request: Request,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == payload.email.lower())
        .first()
    )

    if not user or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(401, "Invalid email or password")

    if not user.is_active:
        raise HTTPException(403, "This account is inactive")

    log_action(
        db,
        user,
        "signin",
        "user",
        user.id,
        ip_address=request.client.host if request.client else None,
    )
    db.commit()

    set_auth_cookies(response, create_access_token(user.id))

    return user


@router.post("/signout")
def signout(
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log_action(db, user, "signout", "user", user.id)
    db.commit()

    response.delete_cookie("auth_token", path="/")
    response.delete_cookie("csrf_token", path="/")

    return {"message": "Signed out successfully"}


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
