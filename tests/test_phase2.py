import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./data/test_phase2.db")
os.environ.setdefault("SECRET_KEY", "phase2-test-secret-key")
os.environ.setdefault("COOKIE_SECURE", "false")

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models import Business, BusinessSettings, User
from app.auth.security import hash_password

Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
db=SessionLocal()
b=Business(name="Phase2 Test Business", currency="PKR")
b.settings=BusinessSettings(low_stock_threshold=3, policies="Returns within 7 days.")
db.add(b); db.flush()
u=User(business_id=b.id, full_name="Test Owner", email="phase2-owner@test.local", password_hash=hash_password("Password-123!"), role="owner")
c=User(business_id=b.id, full_name="Test Customer", email="phase2-customer@test.local", password_hash=hash_password("Password-123!"), role="customer")
db.add_all([u,c]); db.commit(); db.close()
client=TestClient(app)


def login(email):
    r=client.post('/api/auth/signin',json={"email":email,"password":"Password-123!"})
    assert r.status_code==200
    return client.cookies.get('csrf_token')


def test_phase2_routes_exist():
    paths={r.path for r in app.routes}
    assert '/api/ai/chat' in paths
    assert '/api/knowledge' in paths
    assert '/api/ai/approvals/{approval_id}/approve' in paths


def test_knowledge_is_admin_only():
    csrf=login('phase2-customer@test.local')
    r=client.get('/api/knowledge')
    assert r.status_code==403
    r=client.post('/api/knowledge',files={'file':('x.txt',b'private policy','text/plain')},headers={'X-CSRF-Token':csrf})
    assert r.status_code==403


def test_ai_requires_groq_key_but_route_is_protected():
    csrf=login('phase2-customer@test.local')
    r=client.post('/api/ai/chat',json={'message':'What products do you have?'},headers={'X-CSRF-Token':csrf})
    assert r.status_code in {503,200}
