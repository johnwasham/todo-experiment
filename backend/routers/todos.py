from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import TodoItem
from schemas import TodoCreate, TodoResponse, TodoUpdate

router: APIRouter = APIRouter()


@router.get("", response_model=list[TodoResponse])
def list_todos(db: Session = Depends(get_db)) -> list[TodoItem]:
    return db.query(TodoItem).all()


@router.post("", status_code=201, response_model=TodoResponse)
def create_todo(payload: TodoCreate, db: Session = Depends(get_db)) -> TodoItem:
    todo = TodoItem(
        name=payload.name,
        priority=payload.priority,
        due_date=payload.due_date,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.patch("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: int, payload: TodoUpdate, db: Session = Depends(get_db)
) -> TodoItem:
    todo = db.query(TodoItem).filter(TodoItem.id == todo_id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(todo, field, value)
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: Session = Depends(get_db)) -> None:
    todo = db.query(TodoItem).filter(TodoItem.id == todo_id).first()
    if todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo)
    db.commit()
