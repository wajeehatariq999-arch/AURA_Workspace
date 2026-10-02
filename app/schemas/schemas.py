from decimal import Decimal
from pydantic import BaseModel, ConfigDict, EmailStr, Field

class SignupIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    business_name: str = Field(min_length=2, max_length=150)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

class BusinessUpdate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    description: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = Field(default=None, max_length=50)
    address: str | None = None
    currency: str = Field(min_length=3, max_length=10)

class SettingsUpdate(BaseModel):
    policies: str | None = None
    business_hours: str | None = None
    low_stock_threshold: int = Field(ge=0, le=100000)

class CategoryIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None

class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=180)
    description: str | None = None
    price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    category_id: int | None = None
    is_available: bool = True
    stock: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=5, ge=0)

class ProductPatch(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = None
    price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    category_id: int | None = None
    is_available: bool | None = None
    stock: int | None = Field(default=None, ge=0)
    reorder_level: int | None = Field(default=None, ge=0)

class SupplierIn(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    contact_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None

class StaffIn(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = Field(pattern="^(staff|customer)$")

class OrderStatusIn(BaseModel):
    status: str = Field(pattern="^(pending|confirmed|processing|shipped|completed|cancelled)$")

class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=10000)

class OrderIn(BaseModel):
    items: list[OrderItemIn] = Field(min_length=1)
    notes: str | None = None


class AIChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    conversation_id: int | None = None
