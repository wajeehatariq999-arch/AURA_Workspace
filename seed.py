from decimal import Decimal
from pathlib import Path
from app.database import Base, SessionLocal, engine
from app.models import Business, BusinessSettings, User, ProductCategory, Product, ProductImage, Inventory, Supplier, Order, OrderItem
from app.auth.security import hash_password

Base.metadata.create_all(bind=engine)
BASE = Path(__file__).resolve().parent
IMAGE_DIR = BASE / "data" / "product_images"
IMAGE_DIR.mkdir(parents=True, exist_ok=True)

def demo_svg(name, colors):
    c1, c2 = colors
    safe = name.replace("&", "and")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs><rect width="1200" height="900" fill="url(#g)"/><circle cx="950" cy="170" r="210" fill="#fff" opacity=".12"/><circle cx="180" cy="760" r="270" fill="#fff" opacity=".08"/><text x="90" y="170" fill="#fff" opacity=".8" font-family="Georgia,serif" font-size="34" letter-spacing="6">AURA DEMO</text><text x="90" y="720" fill="#fff" font-family="Georgia,serif" font-size="58">{safe}</text><text x="90" y="770" fill="#fff" opacity=".8" font-family="Arial,sans-serif" font-size="24">Business catalog image</text></svg>'''

def ensure_demo_images(db, business_id):
    colors=[("#6f4b36","#ead9b7"),("#2d5145","#e9dfc8"),("#8d7650","#f1e6d0"),("#31534a","#d9c59b"),("#6d7759","#eee2c8")]
    for idx,p in enumerate(db.query(Product).filter(Product.business_id==business_id).order_by(Product.id).all()):
        if p.images: continue
        storage=f"demo-{p.id}.svg"; content=demo_svg(p.name, colors[idx % len(colors)])
        (IMAGE_DIR/storage).write_text(content, encoding="utf-8")
        db.add(ProductImage(product_id=p.id,storage_name=storage,original_name=storage,mime_type="image/svg+xml",file_size=len(content.encode()),is_primary=True))
    db.commit()

db=SessionLocal()
try:
    existing=db.query(Business).filter(Business.name=="AURA Demo Commerce").first()
    if existing:
        ensure_demo_images(db, existing.id)
        print("Demo data already exists; demo imagery was backfilled where needed.")
    else:
        b=Business(name="AURA Demo Commerce",description="A demonstration retail business managed through AURA.",contact_email="hello@aurademo.local",contact_phone="+92 300 0000000",address="Faisalabad, Pakistan",currency="PKR")
        b.settings=BusinessSettings(policies="Returns accepted within 7 days for unused items. Delivery is subject to business hours and available stock.",business_hours="Mon-Sat: 10:00-19:00",low_stock_threshold=5)
        db.add(b); db.flush()
        owner=User(business_id=b.id,full_name="Demo Owner",email="owner@aurademo.local",password_hash=hash_password("ChangeMe-123!"),role="owner")
        staff=User(business_id=b.id,full_name="Demo Staff",email="staff@aurademo.local",password_hash=hash_password("ChangeMe-123!"),role="staff")
        customer=User(business_id=b.id,full_name="Demo Customer",email="customer@aurademo.local",password_hash=hash_password("ChangeMe-123!"),role="customer")
        db.add_all([owner,staff,customer])
        cats=[]
        for name,desc in [("Coffee","Beans and brewing essentials"),("Tea","Loose-leaf and specialty tea"),("Accessories","Cups and brewing accessories")]:
            c=ProductCategory(business_id=b.id,name=name,description=desc); db.add(c); cats.append(c)
        db.flush()
        products=[("Mountain Arabica Beans","Medium-roast 500g specialty arabica beans.",Decimal("2450.00"),cats[0],22,8),("Earl Grey Reserve","Classic bergamot black tea, 100g.",Decimal("1250.00"),cats[1],4,6),("Stoneware Mug","Hand-finished ceramic mug.",Decimal("1750.00"),cats[2],14,5),("Cold Brew Bottle","Reusable glass cold-brew bottle.",Decimal("3200.00"),cats[2],3,5),("Jasmine Green Tea","Fragrant green tea, 80g.",Decimal("1450.00"),cats[1],18,5)]
        colors=[("#6f4b36","#ead9b7"),("#2d5145","#e9dfc8"),("#8d7650","#f1e6d0"),("#31534a","#d9c59b"),("#6d7759","#eee2c8")]
        for idx,(name,desc,price,cat,stock,reorder) in enumerate(products):
            p=Product(business_id=b.id,name=name,description=desc,price=price,category_id=cat.id,is_available=True); p.inventory=Inventory(quantity=stock,reorder_level=reorder); db.add(p); db.flush()
            storage=f"demo-{p.id}.svg"; content=demo_svg(name,colors[idx])
            (IMAGE_DIR/storage).write_text(content,encoding="utf-8")
            db.add(ProductImage(product_id=p.id,storage_name=storage,original_name=storage,mime_type="image/svg+xml",file_size=len(content.encode()),is_primary=True))
        for s in [("Pak Harvest Supply","Adeel Khan","supplier1@aurademo.local","+92 301 1111111","Lahore"),("Crafted Goods Co.","Sara Ali","supplier2@aurademo.local","+92 302 2222222","Islamabad"),("Bean & Leaf Wholesale","Hassan Raza","supplier3@aurademo.local","+92 303 3333333","Karachi")]:
            db.add(Supplier(business_id=b.id,name=s[0],contact_name=s[1],email=s[2],phone=s[3],address=s[4]))
        db.flush(); ps=db.query(Product).filter(Product.business_id==b.id).all()
        for status,p,qty in [("completed",ps[0],2),("processing",ps[2],1),("pending",ps[1],1)]:
            o=Order(business_id=b.id,customer_id=customer.id,status=status,total_amount=p.price*qty); db.add(o); db.flush(); db.add(OrderItem(order_id=o.id,product_id=p.id,quantity=qty,unit_price=p.price))
        db.commit(); print("Demo data seeded successfully with product imagery.")
finally:
    db.close()
