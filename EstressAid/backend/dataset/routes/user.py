from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
import crud, models, schemas
from database import get_db

router = APIRouter()

templates = Jinja2Templates(directory="templates")

@router.get("/users/", response_class=HTMLResponse)
def read_users(request: Request, db: Session = Depends(get_db), skip: int = 0, limit: int = 10):
    users = crud.get_users(db, skip=skip, limit=limit)
    return templates.TemplateResponse("user_list.html", {"request": request, "users": users})

@router.get("/users/{user_id}", response_class=HTMLResponse)
def read_user(request: Request, user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return templates.TemplateResponse("user_edit.html", {"request": request, "user": user})

@router.post("/users/")
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db=db, user=user)

@router.post("/users/{user_id}/conversations/")
def create_conversation_for_user(user_id: int, conversation: schemas.ConversationCreate, db: Session = Depends(get_db)):
    return crud.create_conversation(db=db, conversation=conversation, user_id=user_id)
