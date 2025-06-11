from sqlalchemy.orm import relationship
from database import Base  
import hashlib
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, Date
from datetime import datetime, timezone

class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    last_name = Column(String, index=True)
    user_name = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    salt = Column(String)
    date_of_birth = Column(Date)
    gender = Column(String)


    conversation = relationship("Conversation", back_populates="user")

    def verify_password(self, provided_password: str) -> bool:
        hashed_provided_password = hashlib.pbkdf2_hmac(
            'sha512', 
            provided_password.encode('utf-8'), 
            bytes.fromhex(self.salt), 
            100000 
        )
        print(f"Hashed provided password: {hashed_provided_password.hex()}")
        print(f"Stored password: {self.password}")
        return self.password == hashed_provided_password.hex()


class Conversation(Base):
    __tablename__ = 'conversation'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)  
    message = Column(Text, nullable=False)  
    role = Column(String, nullable=False)  
    timestamp = Column(DateTime, default=datetime.now(timezone.utc)) 
    topic = Column(String, nullable=True) 
    recommendation = Column(Text, nullable=True) 

    user = relationship("User", back_populates="conversation")