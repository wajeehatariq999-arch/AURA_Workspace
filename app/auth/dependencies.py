from fastapi import Cookie, Header, HTTPException, Request, status
from jose import JWTError
from sqlalchemy.orm import Session
from app.auth.security import decode_token
from app.database import get_db
from app.models import User
from fastapi import Depends


def get_current_user(request: Request, db: Session = Depends(get_db), authorization: str | None = Header(default=None), auth_token: str | None = Cookie(default=None)) -> User:
    token = auth_token
    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        user_id = decode_token(token)
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired authentication token")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is unavailable")
    return user


def require_csrf(request: Request, x_csrf_token: str | None = Header(default=None), csrf_token: str | None = Cookie(default=None)):
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return
    if not x_csrf_token or not csrf_token or not secrets_compare(x_csrf_token, csrf_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF validation failed")

def secrets_compare(a: str, b: str) -> bool:
    import secrets
    return secrets.compare_digest(a, b)


def require_roles(*roles):
    def dependency(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized for this action")
        return user
    return dependency
