import json

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import TodoItem
from schemas import TodoCreate, TodoResponse, TodoUpdate
from ws_manager import manager

router: APIRouter = APIRouter()


@router.get("", response_model=list[TodoResponse])
def list_todos(db: Session = Depends(get_db)) -> list[TodoItem]:
    return db.query(TodoItem).all()


@router.post("", status_code=201, response_model=TodoResponse)
def create_todo(
    payload: TodoCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> TodoItem:
    todo = TodoItem(
        name=payload.name,
        priority=payload.priority,
        due_date=payload.due_date,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    todo_data = TodoResponse.model_validate(todo).model_dump(mode="json")
    background_tasks.add_task(manager.broadcast, json.dumps({"type": "created", "todo": todo_data}))
    return todo


@router.patch("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int,
    payload: TodoUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> TodoItem:
    todo = db.query(TodoItem).filter(TodoItem.id == todo_id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(todo, field, value)
    db.commit()
    db.refresh(todo)
    todo_data = TodoResponse.model_validate(todo).model_dump(mode="json")
    background_tasks.add_task(manager.broadcast, json.dumps({"type": "updated", "todo": todo_data}))
    return todo


@router.delete("/{todo_id}", status_code=204)
def delete_todo(
    todo_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> None:
    todo = db.query(TodoItem).filter(TodoItem.id == todo_id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo)
    db.commit()
    background_tasks.add_task(manager.broadcast, json.dumps({"type": "deleted", "id": todo_id}))
