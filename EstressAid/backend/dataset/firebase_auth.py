import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException
from typing import Optional
import secrets
from datetime import datetime, timedelta, timezone
from jose import jwt

SECRET_KEY = secrets.token_hex(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

if not firebase_admin._apps:
    cred = credentials.Certificate("estressaid-firebase-adminsdk-fbsvc-a6f0b9e140.json")
    firebase_admin.initialize_app(cred)

async def verify_firebase_token(id_token: str):
    try:
        if not id_token:
            raise HTTPException(status_code=401, detail="No token provided")
                
        decoded_token = auth.verify_id_token(id_token)
        return {
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name", ""),
        }
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired")
    except auth.RevokedIdTokenError:
        raise HTTPException(status_code=401, detail="Token revoked")
    except auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication error: {str(e)}")

def create_access_token(data: dict):
    """Create JWT token for authenticated users"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt