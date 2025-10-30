from fastapi import APIRouter
from pygments.lexer import default

from api.endpoints.workspaces import workspace_router

jobs_router = APIRouter(prefix="/jobs")


@workspace_router.post("/run")
async def run_job():
    pass


