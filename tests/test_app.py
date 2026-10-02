import os
os.environ["DATABASE_URL"]="sqlite:///./data/test_aura.db"
os.environ["SECRET_KEY"]="test-secret-key-long-enough"
os.environ["COOKIE_SECURE"]="false"
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models import Business
from app.auth.security import hash_password
from app.models import User

Base.metadata.drop_all(engine); Base.metadata.create_all(engine)
db=SessionLocal(); b=Business(name="Test Biz",currency="PKR"); db.add(b); db.flush(); u=User(business_id=b.id,full_name="Owner",email="owner@test.local",password_hash=hash_password("Password-123!"),role="owner"); db.add(u); db.commit(); db.close()
client=TestClient(app)

def csrf(): return client.cookies.get("csrf_token")
def test_health_and_landing(): assert client.get('/').status_code==200

def test_auth_and_product_crud():
    client.cookies.set("csrf_token","testcsrf")
    r=client.post('/api/auth/signin',json={"email":"owner@test.local","password":"Password-123!"},headers={"X-CSRF-Token":"testcsrf"}); assert r.status_code==200
    token=client.cookies.get('csrf_token'); assert token
    r=client.post('/api/products',json={"name":"Test Product","description":"Demo","price":10,"stock":5,"reorder_level":2,"is_available":True},headers={"X-CSRF-Token":token}); assert r.status_code==200
    pid=r.json()['id']; assert client.get('/api/products').status_code==200
    r=client.patch(f'/api/products/{pid}',json={"price":12,"stock":1},headers={"X-CSRF-Token":token}); assert r.status_code==200
    assert r.json()['stock']==1
