from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from database import get_db
from datetime import timedelta
import models, schemas, crud 
from email_utils import sendPasswordResetEmail
from token_utils import generateToken, verifyToken 
import os


recovery_router_jwt = APIRouter(prefix="/api")


@recovery_router_jwt.post("/users/request-password-reset")
async def request_password_reset(email: str = Body(..., embed=True), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=email) 
    if not user:
        print(f"Solicitud de reseteo para email no registrado: {email}")
        return {"message": "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña."}
    
    token_data = {"user_id": user.id, "email": user.email, "purpose": "password-reset"}
    reset_token = generateToken(token_data, expires_delta=timedelta(minutes=15))
 
  
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000") 
    reset_link = f"{frontend_url}/reset-password?token={reset_token}"
    
    try:
        await sendPasswordResetEmail(to=user.email, reset_link=reset_link)
        return {"message": "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña."}
    except Exception as e:
        print(f"Error al enviar email de reseteo a {email}: {e}")
        raise HTTPException(status_code=500, detail="Error al enviar el correo de recuperación.")

class ResetPasswordPayload(schemas.BaseModel):
    token: str
    new_password: str

@recovery_router_jwt.post("/users/reset-password-with-token")
async def reset_password_with_token(payload: ResetPasswordPayload = Body(...), db: Session = Depends(get_db)):
    # Verificar el token
    token_data = verifyToken(payload.token)
    
    if not token_data or token_data.get("purpose") != "password-reset":
        raise HTTPException(status_code=400, detail="Token inválido o expirado.")
    
    user_id = token_data.get("user_id")
    user = crud.get_user(db, user_id=user_id) 
    
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
   
    if len(payload.new_password) < 8:
         raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres.")

    try:
   
        
        new_salt = os.urandom(32)
        hashed_password = crud.get_password_hash(payload.new_password, new_salt)
        
        user.password = hashed_password
        user.salt = new_salt.hex()
        
        db.commit()
        return {"message": "Contraseña actualizada correctamente."}
    except Exception as e:
        db.rollback()
        print(f"Error actualizando contraseña para user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar la contraseña.")



