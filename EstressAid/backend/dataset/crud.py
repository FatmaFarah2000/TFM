from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
import models, schemas
from fastapi import HTTPException
import hashlib
import os
from datetime import date, datetime, timezone
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi import HTTPException
import secrets


def get_password_hash(password: str, salt: bytes) -> str:

    return hashlib.pbkdf2_hmac(
        'sha512', 
        password.encode('utf-8'), 
        salt, 
        100000
    ).hex()

def create_user(db: Session, user: schemas.UserCreate):
    if user.password != user.validate_password:
        raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")
    
    salt = os.urandom(32)  
    password = get_password_hash(user.password, salt)  

    db_user = models.User(
        name=user.name,
        last_name=user.last_name,
        user_name=user.user_name,
        email=user.email,
        password=password,  
        salt=salt.hex(),  
        date_of_birth=user.date_of_birth,
        gender=user.gender
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def verify_password(self, provided_password: str) -> bool:
    salt_bytes = bytes.fromhex(self.salt)
    
    hashed_provided_password = hashlib.pbkdf2_hmac(
        'sha512',
        provided_password.encode('utf-8'),
        salt_bytes, 
        100000
    ).hex()

    return self.password == hashed_provided_password

def get_users(db: Session, skip: int = 0, limit: int = 10):

    if skip < 0 or limit <= 0:
        raise HTTPException(status_code=400, detail="Invalid skip or limit parameters")
    return db.query(models.User).offset(skip).limit(limit).all()

def get_user(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, user_name: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.user_name == user_name).first()

def delete_user(db: Session, user_id: int):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()  
        return db_user 
    return None  


def update_user(db: Session, user_id: int, user: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        return None

    update_data = user.dict(exclude_unset=True)

    if "new_password" in update_data:

        if "password" not in update_data:
            raise HTTPException(status_code=400, detail="Se requiere la contraseña actual para cambiarla.")

        if not db_user.verify_password(update_data["password"]):
            raise HTTPException(status_code=401, detail="La contraseña actual es incorrecta.")

        new_salt = os.urandom(32)
        hashed_password = get_password_hash(update_data["new_password"], new_salt)
        db_user.password = hashed_password
        db_user.salt = new_salt.hex()


        del update_data["password"]
        del update_data["new_password"]

    for attr, value in update_data.items():
        setattr(db_user, attr, value)

    db.commit()
    db.refresh(db_user)
    return db_user



def create_conversation(db: Session, conversation: schemas.ConversationCreate, user_id: int):
    try:
        db_conversation = models.Conversation(
            message=conversation.message,
            role=conversation.role,
            timestamp=conversation.timestamp or datetime.now(timezone.utc),
            topic=conversation.topic or "General",
            recommendation=conversation.recommendation or "",
            user_id=user_id
        )
        db.add(db_conversation)
        db.commit()
        db.refresh(db_conversation)
        return db_conversation
    except Exception as e:
        db.rollback()
        print(f"Error creating conversation: {e}")
        raise

def get_conversation(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Conversation)\
             .filter(models.Conversation.user_id == user_id)\
             .order_by(models.Conversation.timestamp.desc())\
             .offset(skip)\
             .limit(limit)\
             .all()

def get_conversation_history_ascending(db: Session, user_id: int, skip: int = 0, limit: int = 1000) -> List[models.Conversation]:   
    return db.query(models.Conversation)\
             .filter(models.Conversation.user_id == user_id)\
             .order_by(models.Conversation.timestamp.asc())\
             .offset(skip)\
             .limit(limit)\
             .all()


def get_conversation_by_topic(db: Session, user_id: int, topic: str):
    return db.query(models.Conversation)\
             .filter(models.Conversation.user_id == user_id, 
                     models.Conversation.topic == topic)\
             .order_by(models.Conversation.timestamp.desc())\
             .all()

def get_recommendations(db: Session, user_id: int, limit: int = 10):
    return db.query(models.Conversation)\
             .filter(models.Conversation.user_id == user_id,
                     models.Conversation.recommendation != "")\
             .order_by(models.Conversation.timestamp.desc())\
             .limit(limit)\
             .all()

def delete_conversation(db: Session, conversation_id: int):
    conversation = db.query(models.Conversation).filter(models.Conversation.id == conversation_id).first()
    if conversation:
        db.delete(conversation)
        db.commit()
    return conversation


