from fastapi import FastAPI, Depends , APIRouter
from pydantic import BaseModel
from typing import Dict, List, Optional
import schemas, crud
from sqlalchemy.orm import Session
from database import get_db
import sys
from datetime import datetime, timezone
import re
sys.path.append("../../../EstressAid")
from bot import BotModel 
from utils import Role, Message

app = FastAPI()
bot = BotModel() 
bot_router = APIRouter(prefix="/bot")
class ChatRequest(BaseModel):
    user_id: str
    message: str

class ChatResponse(BaseModel):
    response: str
    topic: str
    needs_followup: bool
    timestamp: str

user_conversations: Dict[str, List[Message]] = {}

def detectar_tema(mensaje: str) -> str:
    
    temas = {
        "Ansiedad": [
            r'\bansi[oe][sd]ad\b', r'\bnervios[oa]?\b', r'\bpreocu[p]?[a-z]+\b', 
            r'\bintranquil[a-z]+\b', r'\bagobia[a-z]+\b', r'\bestr[eé]s\b', 
            r'\bten[s]?i[oó]n\b', r'\bpánico\b', r'\bmiedo\b'
        ],
        "Alcoholismo": [
            r'\balcohol\b', r'\bbeb[eo][r]?\b', r'\bborracho\b', r'\bresaca\b', 
            r'\bcerveza\b', r'\bvino\b', r'\bbebida[s]?\b', r'\bcopas\b', 
            r'\bembriag[a-z]+\b', r'\bbotellas?\b'
        ],
        "Depresión": [
            r'\btriste[za]?\b', r'\bdeprimi[a-z]+\b', r'\bdesesperan[a-z]+\b', 
            r'\bsin ganas\b', r'\bvací[oa]\b', r'\bdesanim[a-z]+\b',
            r'\bdolor emocional\b', r'\bno quiero vivir\b', r'\bno vale la pena\b'
        ],
        "Relaciones": [
            r'\bpareja\b', r'\bamig[oa]s?\b', r'\bfamilia[r]?\b', r'\brelaci[oó]n\b', 
            r'\bconflic[a-z]+\b', r'\brupt[a-z]+\b', r'\bdivorci[a-z]+\b',
            r'\bpelea[s]?\b', r'\bseparaci[oó]n\b', r'\bex[- ]?pareja\b'
        ],
        "Trabajo": [
            r'\btrabajo\b', r'\bempleo\b', r'\bjefe[s]?\b', r'\bcompa[ñn]er[oa]s?\b', 
            r'\bdespid[a-z]+\b', r'\bpresión laboral\b',
            r'\boficina\b', r'\bsalario\b', r'\bcarrera\b', r'\bempresa\b'
        ],
        "Autoestima": [
            r'\bvaler\b', r'\bvalo[r]?\b', r'\bautoestima\b', r'\binsegur[a-z]+\b', 
            r'\bconf[a-z]+\b', r'\bfea[o]?\b', r'\bin[úu]til\b',
            r'\bno sirvo\b', r'\bno me gusto\b', r'\bodio mi\b', r'\bfracaso\b'
        ]
    }
    
    mensaje_lower = mensaje.lower()
    
    for tema, patrones in temas.items():
        for patron in patrones:
            if re.search(patron, mensaje_lower):
                return tema
    
    temas_palabras = {
        "Ansiedad": ["ansiedad", "nervios", "preocupación", "intranquil", "agobio", "estres", "estrés"],
        "Alcoholismo": ["alcohol", "bebida", "beber", "borracho", "resaca", "cerveza", "vino"],
        "Depresión": ["tristeza", "deprimido", "desesperanza", "sin ganas", "vacío", "desanimado"],
        "Relaciones": ["pareja", "amigos", "familia", "relación", "conflicto", "ruptura", "divorcio"],
        "Trabajo": ["trabajo", "empleo", "jefe", "compañeros", "despido", "presión laboral"],
        "Autoestima": ["valor", "autoestima", "inseguridad", "confianza", "feo", "inútil"]
    }
    
    for tema, palabras in temas_palabras.items():
        if any(palabra in mensaje_lower for palabra in palabras):
            return tema
            
    return "General"

@bot_router.get("/validate_id")
async def validate_user_id(user_id: str, db: Session = Depends(get_db)):
    try:
        user_id_int = int(user_id) if user_id.isdigit() else None
        user = None
        
        if user_id_int:
            user = crud.get_user(db, user_id=user_id_int)
        
        return {"is_valid": bool(user), "user_id": user_id}
    except Exception as e:
        print(f"Error validando usuario: {e}")
        return {"is_valid": False, "error": str(e)}

@bot_router.post("/")
async def chat_with_bot(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        user_id = request.user_id
        user_message = request.message
        user_id_int = int(user_id) if user_id.isdigit() else None
        if not user_id_int:
            return {"error": "ID de usuario inválido"}
        user = crud.get_user(db, user_id=user_id_int)
        if not user:
            return {"error": "Usuario no encontrado"}
        user_name = user.user_name if hasattr(user, "user_name") else "Usuario"
 
        if user_id not in user_conversations:
            user_conversations[user_id] = []
            
        tema = detectar_tema(user_message)
        
        user_conversation = schemas.ConversationCreate(
            message=user_message,
            role=Role.USER.value,
            timestamp=datetime.now(timezone.utc),
            topic=tema,
            recommendation=""  
        )
        
        crud.create_conversation(db=db, conversation=user_conversation, user_id=user_id_int)
        personalized_input = f"{user_name}: {user_message}"
        bot_response, context_used = bot.generate_response(personalized_input, user_id)
        is_recommendation = (
            tema != "General" or
            "recomendar" in bot_response.lower() or
            "suger" in bot_response.lower() or
            "podría" in bot_response.lower() and "intentar" in bot_response.lower()
        )
  
        bot_conversation = schemas.ConversationCreate(
            message=bot_response,
            role=Role.BOT.value,
            timestamp=datetime.now(timezone.utc),
            topic=tema,
            recommendation=bot_response if is_recommendation else ""
        )
        
        print(f"Bot context used: {context_used}")
        print(f"Topic detected: {tema}")
        crud.create_conversation(db=db, conversation=bot_conversation, user_id=user_id_int)
  
        if user_id in user_conversations:
            user_conversations[user_id].append(Message(role=Role.BOT.value, content=bot_response))
            user_conversations[user_id].append(Message(role=Role.USER.value, content=user_message))
            

        current_time = datetime.now(timezone.utc).strftime("%d/%m/%Y %H:%M:%S")
        
        return {
            "response": bot_response,
            "topic": tema,
            "needs_followup": "¿" in bot_response or "?" in bot_response,
            "timestamp": current_time
        }
        
    except Exception as e:
        print(f"Error en chat_with_bot: {e}")
        return {"error": str(e), "response": "Lo siento, ocurrió un error al procesar tu mensaje."}