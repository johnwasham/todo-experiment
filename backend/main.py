from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers.todos import router as todos_router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Upstart Dev API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(todos_router, prefix="/todos", tags=["todos"])
