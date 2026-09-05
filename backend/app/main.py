from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends
from sqlalchemy import text

from app.database import Base, engine
from app.models.user import User
from app.models.lead import Lead
from app.models.note import Note
from app.models.customer import Customer
from app.models.task import Task
from app.models.notification import Notification
from app.dependencies import get_current_user

from app.routers.users import router as users_router
from app.routers.auth import router as auth_router
from app.routers.leads import router as leads_router
from app.routers.notes import router as notes_router
from app.routers.customers import router as customers_router
from app.routers.tasks import router as tasks_router
from app.routers.reports import router as reports_router
from app.routers.ai import router as ai_router
from app.routers.notifications import router as notifications_router
from app.routers.dashboard import router as dashboard_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Trishul CRM API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(leads_router)
app.include_router(notes_router)
app.include_router(customers_router)
app.include_router(tasks_router)
app.include_router(reports_router)
app.include_router(ai_router)
app.include_router(dashboard_router)
app.include_router(notifications_router)

@app.get("/")
def root():
    return {"message": "Welcome to Trishul CRM API 🚀"}


@app.get("/test-db")
def test_database():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        return {
            "database": "Connected Successfully!",
            "result": result.scalar()
        }


@app.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role
    }