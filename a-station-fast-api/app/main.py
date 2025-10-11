from fastapi import FastAPI
# from core.config import settings
from app.schemas.health import HealthResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints.auth import auth_router

app = FastAPI(
    title="A-Station",
)

origins = [
    "http://localhost",
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router=auth_router)

@app.get("/", response_model=HealthResponse)
async def health():
    return HealthResponse(status="Ok")