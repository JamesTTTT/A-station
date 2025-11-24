from typing import Any

from app.models.job import Job, JobStatus
from sqlalchemy.orm import Session
from app.schemas.job import JobCreate, JobResponse
from app.models.user import User


def create_job(db: Session, job_data: JobCreate, current_user: User) -> Job:
    job = Job(
        playbook_id=job_data.playbook_id,
        status=JobStatus.PENDING,
        created_by=current_user,
        ansible_version=job_data.ansible_version or "2.15"  # Default
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job

def get_job_status(db: Session, job_id: str) -> type[Job] | None:
    job = db.query(Job).filter(Job.id == job_id).first()
    return job