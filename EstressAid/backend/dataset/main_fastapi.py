from datetime import date
from typing import Annotated, Optional
from fastapi import FastAPI, Depends, Form, HTTPException, Body , APIRouter
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
import crud, schemas, models
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from database import engine, get_db
from fastapi.templating import Jinja2Templates
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import uvicorn
from chat_api import chat_with_bot, validate_user_id 
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
from recovery_routes_jwt import recovery_router_jwt 

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
app.add_api_route("/bot/", chat_with_bot, methods=["POST"])
app.add_api_route("/bot/validate_id", validate_user_id, methods=["GET"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
templates = Jinja2Templates(directory="templates")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MethodOverrideMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if request.method == "POST":
            try:
                form = await request.form()
                if "_method" in form:
                    request.scope['method'] = form["_method"].upper()
                    print(f"Method overridden to: {request.scope['method']}")
            except Exception:
                
                pass
        response = await call_next(request)
        return response

api_router = APIRouter(prefix="/api")
web_router = APIRouter(prefix="/web") 
bot_router = APIRouter(prefix="/bot")


@api_router.post("/users/add", response_model=schemas.User)
async def create_user_api(
    user: schemas.UserCreate = Body(...),  
    db: Session = Depends(get_db)
):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = crud.create_user(db=db, user=user)
    return new_user

@api_router.get("/users/{user_id}/app", response_model=schemas.UserPublic)
async def get_user_details_json_api(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User not found for id: {user_id}")
    return user
    
@api_router.post("/users/login")
def login_user_api(user: schemas.UserLogin = Body(...), db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if not db_user:
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")
    if not db_user.verify_password(user.password):
        raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos.")
    return {
        "access_token": "tokentest123",
        "user_id": db_user.id,
        "user_name": db_user.user_name
    }

class DeleteUserRequest(BaseModel):
    password: str

@api_router.delete("/users/{user_id}/delete", response_model=dict)
async def delete_user_api(user_id: int, request_body: DeleteUserRequest = Body(...), db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if not hasattr(db_user, 'verify_password') or not db_user.verify_password(request_body.password):
        raise HTTPException(status_code=400, detail="La contraseña es incorrecta.")
    deleted_user = crud.delete_user(db, user_id=user_id)
    if not deleted_user:
        raise HTTPException(status_code=500, detail="Error al eliminar el usuario después de la verificación.")
    return {"message": "Usuario eliminado correctamente"}

@api_router.put("/users/{user_id}/edit")
async def update_user_api(user_id: int, user_update: schemas.UserUpdate = Body(...), db: Session = Depends(get_db)):
    try:
        updated_user = crud.update_user(db, user_id=user_id, user=user_update)
        if not updated_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        return updated_user 
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@api_router.post("/users/{user_id}/conversations", response_model=schemas.Conversation)
async def save_conversation_api(
    user_id: int,
    conversation: schemas.ConversationCreate,
    db: Session = Depends(get_db)
):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.create_conversation(db, conversation=conversation, user_id=user_id)

@api_router.get("/users/{user_id}/conversations", response_model=list[schemas.Conversation]) 
async def get_conversations_api(user_id: int, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    conversation = crud.get_conversation(db, user_id=user_id)
    if not conversation:
      
        return [] 
   
    return conversation 



@web_router.get("/users/", response_class=HTMLResponse)
async def read_users_web(request: Request, skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    users = crud.get_users(db, skip=skip, limit=limit)
    return templates.TemplateResponse("user_list.html", {"request": request, "users": users})

@web_router.post("/users/", response_model=schemas.User)
async def create_user_web(
    user: schemas.UserCreate = Body(...), 
    db: Session = Depends(get_db)
):

    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = crud.create_user(db=db, user=user)
    return new_user

@web_router.get("/create_user", response_class=HTMLResponse)
async def get_create_user_form_web(request: Request):
    return templates.TemplateResponse("user_create.html", {"request": request})

@web_router.get("/users/{user_id}", response_class=HTMLResponse)
async def get_user_web(user_id: int, request: Request, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User not found for id: {user_id}")
    return templates.TemplateResponse("user_detail.html", {"request": request, "user": user})

@web_router.get("/users/{user_id}/edit", response_class=HTMLResponse)
async def edit_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    redirect_url = request.headers.get("Referer") 
    return templates.TemplateResponse("user_edit.html", {"request": request, "user": user, "user_id": user_id, "redirect_url": redirect_url})


@web_router.put("/users/{user_id}/edit")
async def update_user_endpoint_web(
    user_id: int,
    user_update: schemas.UserUpdate = Body(...),
    db: Session = Depends(get_db)
):
    try:
        updated_user = crud.update_user(db, user_id=user_id, user=user_update)
        if not updated_user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado.")
        
        return {"message": "Perfil actualizado correctamente"}
    except Exception as e:
        print(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@web_router.delete("/users/{user_id}/delete", response_class=HTMLResponse)
async def delete_user_web(user_id: int, db: Session = Depends(get_db)):
    user = crud.delete_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return RedirectResponse(url="/web/users/", status_code=303)

@web_router.get("/users/{user_id}/conversation", response_class=HTMLResponse)
async def show_conversation_web(user_id: int, request: Request, db: Session = Depends(get_db)):
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    conversation = crud.get_conversation(db, user_id=user_id)
    return templates.TemplateResponse("conversation.html", {"request": request, "user": user, "conversation": conversation})



app.include_router(api_router)
app.include_router(web_router)
app.include_router(bot_router)
app.include_router(recovery_router_jwt)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=56956)

