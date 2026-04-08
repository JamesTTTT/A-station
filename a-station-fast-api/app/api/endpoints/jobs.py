import os

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.celery_app.client import celery_app
from app.core.security import get_current_user
from app.crud.job_crud import create_job, get_job
from app.crud.project_source_crud import get_project_source
from app.db.base import get_db
from app.models.user import User
from app.schemas.job import JobCreate, JobRead, JobRunResponse

jobs_router = APIRouter(prefix="/jobs", tags=["Jobs"])


@jobs_router.post("/", response_model=JobRunResponse)
async def run_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create and execute a new Ansible job."""
    # Validate source exists and belongs to workspace
    source = get_project_source(db, job_data.source_id)
    if not source or source.workspace_id != job_data.workspace_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source not found in this workspace",
        )

    source_root = source.local_path

    # Validate playbook_path exists on disk
    playbook_full = os.path.join(source_root, job_data.playbook_path)
    if not os.path.isfile(playbook_full):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Playbook not found on disk: {job_data.playbook_path}",
        )

    # Validate inventory_path exists on disk
    inventory_full = os.path.join(source_root, job_data.inventory_path)
    if not os.path.exists(inventory_full):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Inventory not found on disk: {job_data.inventory_path}",
        )

    # Create job record
    job = create_job(db=db, job_data=job_data, current_user=current_user)

    queue_name = f"ansible_{job.ansible_version.replace('.', '_')}"

    # Dispatch to version-specific worker
    task = celery_app.send_task(
        "tasks.run_playbook",
        args=[
            str(job.id),
            source_root,
            job_data.playbook_path,
            job_data.inventory_path,
            job_data.extra_vars or {},
        ],
        queue=queue_name,
        task_id=str(job.id),
    )

    return JobRunResponse(
        id=job.id,
        status=job.status,
        task_id=task.task_id,
        queue=queue_name,
    )


@jobs_router.get("/{job_id}", response_model=JobRead)
async def fetch_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get job details."""
    job = get_job(db=db, job_id=job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    return job
