from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models import user, role, event
from app.routes.auth_routes import router as auth_router
from app.routes.user_routes import router as user_router
from app.routes.event_routes import router as event_router

app = FastAPI(
    title="Event Ticket Platform API",
    description="Plateforme de vente de tickets d'événements",
    version="1.0.0",
)

# CORS — autorise le frontend React (dev & docker)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost",          # Docker nginx on port 80
        "http://frontend",           # Docker internal network
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(event_router)


@app.get("/")
def root():
    return {"message": "API is running"}