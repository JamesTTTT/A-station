from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.celery_app.client import celery_app
from app.schemas.job import JobCreate, JobResponse
from app.db.base import get_db
from app.core.security import get_current_user
from app.crud.job_crud import create_job, get_job_status
from app.models import User
from app.crud import playbook_crud


jobs_router = APIRouter(prefix="/jobs", tags=["jobs"])

@jobs_router.post("/", response_model=JobResponse)
async def run_job(
    job_data: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create and execute a new Ansible job.
    """
    job = create_job(db=db, job_data=job_data, current_user=current_user)

    queue_name = f"ansible_{job.ansible_version.replace('.', '_')}"

    pb = playbook_crud.get_playbook(db, job_data.playbook_id)

    if not pb:
        raise HTTPException(status_code=404, detail="Playbook not found")

    # Dispatch to version-specific worker
    task = celery_app.send_task(
        "tasks.run_playbook",
        args=[
            str(job.id),
            pb.yaml_content,  # YAML string
            job_data.inventory or "localhost",
            job_data.extra_vars or {}
        ],
        queue=queue_name,
        task_id=str(job.id)  # Use job_id as task_id for easy tracking
    )

    return JobResponse(
        id=job.id,
        workflow_id=job.playbook_id,
        status=job.status,
        task_id=task.task_id,
        queue=queue_name
    )

@jobs_router.get("/{job_id}", response_model=JobResponse)
async def fetch_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get job status and results."""
    job = get_job_status(db=db, job_id=job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    task = celery_app.AsyncResult(job_id)

    return JobResponse(
        id=job.id,
        workflow_id=job.playbook_id,
        status=job.status,
        celery_status=task.status,
        result=task.result if task.ready() else None,
        started_at=job.created_at,
        finished_at=job.finished_at
    )



