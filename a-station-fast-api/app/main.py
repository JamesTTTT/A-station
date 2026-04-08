from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from scalar_fastapi import get_scalar_api_reference

from app.schemas.health import HealthResponse
from app.api.endpoints.auth import auth_router
from app.api.endpoints.workspaces import workspace_router
from app.api.endpoints.sources import sources_router
from app.api.endpoints.jobs import jobs_router
from app.websockets.websocket import router as websocket_router
from app.websockets.manager import manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize WebSocket manager's Redis connection
    await manager.initialize()
    yield
    # cleanup if needed


app = FastAPI(
    title="A-Station",
    lifespan=lifespan,
    docs_url=None,
    redoc_url=None,
)

origins = [
    "http://localhost:5173",  # Vite default port
    "http://localhost:3000",  # Common React port
    "http://localhost:8080",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(workspace_router)
api_v1_router.include_router(sources_router)
api_v1_router.include_router(jobs_router)
api_v1_router.include_router(websocket_router)

# v1 router
app.include_router(api_v1_router)

@app.get("/", response_model=HealthResponse)
async def health():
    return HealthResponse(status="Ok")

@app.get("/docs", include_in_schema=False)
async def scalar_docs():
    return get_scalar_api_reference(
        openapi_url=app.openapi_url,
        title=app.title,
    )