from sqlalchemy import Column, Integer, String
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    title = Column(String(50))
    email = Column(String(100), unique=True)
    password = Column(String(255))
