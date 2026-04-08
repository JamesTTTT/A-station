from uuid import UUID

from sqlalchemy.orm import Session

from app.models.job import Job, JobStatus
from app.schemas.job import JobCreate
from app.models.user import User


def create_job(db: Session, job_data: JobCreate, current_user: User) -> Job:
    job = Job(
        workspace_id=job_data.workspace_id,
        source_id=job_data.source_id,
        playbook_path=job_data.playbook_path,
        inventory_path=job_data.inventory_path,
        extra_vars=job_data.extra_vars,
        triggered_by_id=current_user.id,
        status=JobStatus.PENDING,
        ansible_version=job_data.ansible_version,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_job(db: Session, job_id: UUID) -> Job | None:
    return db.query(Job).filter(Job.id == job_id).first()
