from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role_id: int
    role_name: str | None = None

    class Config:
        from_attributes = True
class UserLogin(BaseModel):
    email: EmailStr
    password: str