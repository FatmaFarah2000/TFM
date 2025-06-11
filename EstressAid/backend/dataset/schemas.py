from pydantic import BaseModel, EmailStr, validator, Field 
from typing import List, Optional, Literal
from datetime import datetime, date

class UserCreate(BaseModel):
    name: str
    last_name: str
    user_name: str
    email: str
    password: str
    validate_password: str
    date_of_birth: date
    gender: str

class UserUpdate(BaseModel):

    name: Optional[str] = None
    last_name: Optional[str] = None
    user_name: Optional[str] = None
    email: Optional[EmailStr] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None 
    password: Optional[str] = None 
    new_password: Optional[str] = None 
    
    class Config:
        from_attributes = True
class UserPublic(BaseModel):
    id: int
    name: str
    last_name: str
    user_name: str
    email: str
    date_of_birth: date
    gender: str


    class Config:
        from_attributes = True 
class ConversationCreate(BaseModel):
    message: str 
    role: str 
    timestamp: datetime 
    topic: Optional[str] = None 
    recommendation: str 
    
    class Config:
        orm_mode = True

class Conversation(BaseModel):
    id: int
    message: str 
    role: str  
    topic: Optional[str]
    recommendation: str
    timestamp: datetime
    
    class Config:
        orm_mode = True

class User(BaseModel):
    id: int
    name: str
    last_name: str
    user_name: str
    email: str
    password:str
    date_of_birth: date
    gender: str
    conversation: List[Conversation] = []  
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: str
    password:str
    
    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    message: str = Field(..., description="Texto del mensaje")
    role: str = Field(..., description="Rol: 'user' o 'bot'")
    timestamp: Optional[datetime] = Field(default_factory=datetime.now, description="Fecha y hora del mensaje")
    topic: Optional[str] = Field(default="General", description="Tema de la conversación")
    recommendation: Optional[str] = Field(default="", description="Recomendación (si es un mensaje del bot)")

class ConversationCreate(ConversationBase):
    pass

class Conversation(ConversationBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True
        
    @validator('timestamp', pre=True)
    def parse_timestamp(cls, v):
        if isinstance(v, str):
            return datetime.fromisoformat(v)
        return v