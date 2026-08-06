from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate


def create_task(db: Session, task: TaskCreate):
    new_task = Task(
        title=task.title,
        description=task.description,
        due_date=task.due_date,
        priority=task.priority,
        assigned_to=task.assigned_to
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


def get_all_tasks(db: Session):
    return db.query(Task).all()


def get_task_by_id(db: Session, task_id: int):
    return db.query(Task).filter(Task.id == task_id).first()


def update_task(db: Session, task_id: int, task_data: TaskUpdate):
    task = get_task_by_id(db, task_id)

    if not task:
        return None

    task.title = task_data.title
    task.description = task_data.description
    task.due_date = task_data.due_date
    task.priority = task_data.priority
    task.status = task_data.status
    task.assigned_to = task_data.assigned_to

    db.commit()
    db.refresh(task)

    return task


def delete_task(db: Session, task_id: int):
    task = get_task_by_id(db, task_id)

    if not task:
        return False

    db.delete(task)
    db.commit()

    return True