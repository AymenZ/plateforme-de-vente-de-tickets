from fastapi import FastAPI
from app.database import Base, engine
from app.models import user, role
from app.routes.auth_routes import router as auth_router
from app.routes.user_routes import router as user_router

app = FastAPI(
    title="Event Ticket Platform API",
    description="Plateforme de vente de tickets d'événements",
    version="1.0.0",
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(user_router)


@app.get("/")
def root():
    return {"message": "API is running"}