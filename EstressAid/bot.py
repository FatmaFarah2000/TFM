import os
from pathlib import Path
from openai import OpenAI
from typing import Tuple, List, Dict, Any, Optional
import re

try:
    from retriever import Retriever
    from utils import Message
except ImportError:
    print("Warning: Retriever or Message class not found. Using placeholders.")
    class Retriever:
        def __init__(self, input_dir, embed_model_path):
            print(f"Placeholder Retriever initialized with input_dir: {input_dir}")
            self.input_dir = input_dir
        def retrieve(self, query, max_chunks=5):
            print(f"Placeholder Retriever retrieving for query: {query}")
            class Chunk:
                def __init__(self, text):
                    self.text = text
            # Simulate finding advice based on keywords
            advice_map = {
                "ansiedad": "Para la ansiedad, prueba técnicas de respiración profunda.",
                "depresión": "Si te sientes deprimido, intenta dar un pequeño paseo al aire libre.",
                "estrés": "Para manejar el estrés, considera organizar tus tareas pendientes."
            }
            found_advice = []
            for concern in query.split(','):
                concern_key = concern.strip().lower()
                if concern_key in advice_map:
                    found_advice.append(Chunk(advice_map[concern_key]))
            if not found_advice:
                 found_advice.append(Chunk(f"Texto recuperado simulado para algo generalizado como 	'{query}' - parte 1"))
            return found_advice[:max_chunks]

    class Message:
        def __init__(self, role, content):
            self.role = role
            self.content = content

class BotModel:
    def __init__(self, chunk_size=256, top_k=5, temperature=0.4):
       
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY", "163d3b419fae16d393b64ff440ae1c10addcdf26964080bbfc10e6162bb872e04d6dbbc3d4e9c38dfdecc9b2fb41639869b5a883bfd5f3384e34ed409c2b8cf7"), 
            base_url=os.getenv("OPENAI_BASE_URL", "http://ada01.ujaen.es:8080/v1")
        )
        
        self.chunk_size = chunk_size
        self.top_k = top_k
        self.temperature = temperature
        
        try:
            base_dir = Path(__file__).parent.absolute()
        except NameError:
            base_dir = Path('.').absolute()
            print(f"Warning: __file__ not defined. Using current directory as base: {base_dir}")
            
        self.retriever = Retriever(
            input_dir=os.path.join(base_dir, "datos/translations"),
            embed_model_path="hiiamsid/sentence_similarity_spanish_es",
            chunk_size=self.chunk_size, 
            top_k=self.top_k            
        )
        
        self.user_states = {}
        self.model_name = "/mnt/beegfs/sinai-data/meta-llama/Llama-3.1-8B-Instruct"
        
        self.therapy_prompt = """
        Eres un terapeuta conversacional cálido y empático llamado Ana. Hablas de forma natural, humana y compasiva, 
        como lo haría un terapeuta profesional experimentado que realmente se preocupa por sus pacientes.

        ENFOQUE CONVERSACIONAL:
        - Usa un lenguaje cálido, personal y accesible. Nunca suenes robótico o artificial.
        - Haz preguntas exploratorias relevantes pero no excesivas (máximo 1-2 por respuesta).
        - Muestra comprensión real de las emociones expresadas.
        - Usa expresiones naturales como "hmm", "entiendo", "veo que...", "me parece que..."
        - Recuerda y haz referencia a información previa compartida por la persona (nombre, preocupaciones).
        - Evita frases genéricas o soluciones simplistas.
        
        PROCESO TERAPÉUTICO:
        1. Exploración inicial: Pregunta sobre sentimientos, pensamientos y situación actual de manera empática.
        2. Profundización: Indaga sobre factores contribuyentes, patrones de pensamiento y comportamiento.
        3. Conexión: Relaciona elementos compartidos para ayudar a identificar causas subyacentes.
        4. Recomendaciones: Ofrece estrategias prácticas y personalizadas basadas en la conversación y el conocimiento recuperado.
        
        FACTORES A EXPLORAR (sensiblemente y cuando sea oportuno):
        - Estado emocional específico ("¿Podrías describir cómo te sientes exactamente?")
        - Factores desencadenantes ("¿Recuerdas cuándo empezaste a sentirte así?") 
        - Hábitos de vida (sueño, alimentación, ejercicio, consumo de alcohol/tabaco/cafeína)
        - Relaciones personales y apoyo social
        - Pensamientos recurrentes o patrones mentales
        - Intentos previos de solución
        
        DIRECTRICES IMPORTANTES:
        - Sé paciente y no apresures la exploración.
        - No diagnostiques ni uses lenguaje clínico excesivo.
        - Adapta el tono a la severidad de la situación.
        - Normaliza los sentimientos sin minimizarlos.
        - Reconoce tus límites como asistente conversacional.
        - Para situaciones graves, recomienda ayuda profesional.
        - Integra sutilmente consejos o información relevante recuperada de la base de conocimientos cuando sea apropiado, especialmente si se relaciona con las preocupaciones de {user_name}.
        
        Responde con calidez humana genuina y empatía natural en todo momento.
        """

    def _get_user_state(self, user_id: str) -> Dict[str, Any]:
        if user_id not in self.user_states:
            self.user_states[user_id] = {
                'chat_history': [],
                'therapy_state': {
                    'session_stage': 'initial',
                    'first_interaction': True,
                    'user_data': {
                        'name': 'Usuario',
                        'concerns': [],
                        'symptoms': [],
                        'lifestyle_factors': {},
                        'coping_mechanisms': [],
                        'previous_attempts': []
                    },
                    'questions_asked': set(),
                    'exploration_depth': 0,
                    'current_focus_area': None
                }
            }
        return self.user_states[user_id]

    def track_session_progress(self, user_id: str, query: str) -> None:
        user_state = self._get_user_state(user_id)
        therapy_state = user_state['therapy_state']
        query_lower = query.lower()
        concern_keywords = {
            'ansiedad': ['ansiedad', 'nervios', 'nervioso','nerviosa', 'preocupado', 'preocupada', 'preocupación', 'angustia', 'intranquilidad'],
            'depresión': ['triste', 'deprimida', 'deprimido', 'depresión','sin ganas', 'vacío', 'desanimado','desanimada'],
            'estrés': ['estrés', 'agobio','estresado','estresada', 'presión', 'sobrecargad', 'abrumar'],
            'relaciones': ['pareja', 'amigo','amiga','amistad', 'familia', 'relación', 'conflict'],
            'trabajo': ['trabajo', 'laboral', 'empleo', 'jefe', 'compañeros'],
            'autoestima': ['valor', 'autoestima', 'inseguro','insegura','inseguridad', 'no me gusta', 'fea','feo']
        }
        
        lifestyle_patterns = {
            'alcohol': r'\b(beb[oe]|alcoho|cerve|vino|copas)\b',
            'tabaco': r'\b(fum[oa]|tabaco|cigarr)\b',
            'ejercicio': r'\b(ejercicio|deporte|corr[oe]|gimnasio|entrena)\b',
            'sueño': r'\b(dorm[io]|sueño|insomn|despierto|descan[sz])\b',
            'alimentación': r'\b(com[eo]|aliment|diet|nutrici|hambre)\b'
        }
        
        for concern, keywords in concern_keywords.items():
            if any(kw in query_lower for kw in keywords) and concern not in therapy_state['user_data']['concerns']:
                therapy_state['user_data']['concerns'].append(concern)
        
        for factor, pattern in lifestyle_patterns.items():
            if re.search(pattern, query_lower):
               
                negation_pattern = r'\b(no|nunca|jamás|ni|tampoco)\b.{0,20}' + pattern
                if re.search(negation_pattern, query_lower):
                    therapy_state['user_data']['lifestyle_factors'][factor] = False
                else:
                    therapy_state['user_data']['lifestyle_factors'][factor] = True
        
        if therapy_state['exploration_depth'] >= 5: 
            therapy_state['session_stage'] = 'recommendation'
        elif therapy_state['exploration_depth'] >= 2:
            therapy_state['session_stage'] = 'analysis'
        elif not therapy_state['first_interaction']:
            therapy_state['session_stage'] = 'exploration'
            
        therapy_state['exploration_depth'] += 1

    def generate_therapeutic_question(self, user_id: str) -> str:
        user_state = self._get_user_state(user_id)
        therapy_state = user_state['therapy_state']
        
        stage = therapy_state['session_stage']
        concerns = therapy_state['user_data']['concerns']
        lifestyle = therapy_state['user_data']['lifestyle_factors']
        asked = therapy_state['questions_asked']
        depth = therapy_state['exploration_depth']
        
        initial_questions = [
            "¿Podrías contarme un poco más sobre cómo te has estado sintiendo últimamente?",
            "¿Hay algo específico que te esté preocupando o causando malestar?",
            "¿Cómo describirías tu estado de ánimo en estos días?"
        ]
        
        exploration_questions = {
            'emocional': [
                "¿Podrías describir qué emociones predominan en tu día a día?",
                "Cuando dices que te sientes {}, ¿podrías describir cómo se manifiesta eso en tu cuerpo o en tus pensamientos?",
                "¿Recuerdas cuándo empezaste a sentirte así? ¿Hubo algún evento o cambio particular en ese momento?"
            ],
            'cognitivo': [
                "¿Has notado algún pensamiento recurrente que te genere malestar o te dé vueltas en la cabeza?",
                "¿Cómo sueles hablarte a ti mismo/a cuando las cosas no salen como esperas o cometes un error?",
                "¿Te encuentras a menudo anticipando problemas o preocupándote por cosas que podrían pasar?"
            ],
            'conductual': [
                "¿Has notado cambios en tus hábitos de sueño últimamente? ¿Duermes más, menos, o te cuesta descansar?",
                "¿Cómo describirías tus hábitos alimenticios en este momento? ¿Han cambiado recientemente?",
                "¿Sueles incluir algún tipo de actividad física en tu rutina? ¿Cómo te hace sentir?"
            ],
            'social': [
                "¿Cómo sientes que están tus relaciones personales importantes (familia, amigos, pareja) en este momento?",
                "¿Sientes que tienes personas con quienes puedas hablar abiertamente sobre cómo te sientes realmente?",
                "¿Has notado si tu estado de ánimo actual afecta tu forma de relacionarte con los demás?"
            ],
            'sustancias': [
                "A veces, cuando nos sentimos mal, recurrimos a ciertas cosas. ¿Consumes alcohol, tabaco u otras sustancias? ¿Notas si eso influye en cómo te sientes?",
                
            ]
        }
        
        analysis_questions = [
            "De las cosas que hemos hablado, ¿qué sientes que te afecta más en este momento?",
            "¿Has identificado qué situaciones o pensamientos suelen empeorar cómo te sientes?",
            "¿Qué estrategias o cosas has intentado hasta ahora para sentirte un poco mejor? ¿Alguna te ha funcionado, aunque sea un poco?",
            "¿Qué es lo que más te gustaría que cambiara de esta situación?",
            "¿Has experimentado algo parecido a esto en el pasado? Si es así, ¿qué te ayudó entonces?"
        ]
        
        question_to_ask = None
        if stage == 'initial' or therapy_state['first_interaction']:
            possible_questions = initial_questions
        elif stage == 'exploration':
            if not therapy_state['current_focus_area'] or depth % 3 == 0:
                areas = list(exploration_questions.keys())
                if 'ansiedad' in concerns or 'estrés' in concerns and 'cognitivo' not in therapy_state['questions_asked']:
                    therapy_state['current_focus_area'] = 'cognitivo'
                elif 'depresión' in concerns and 'emocional' not in therapy_state['questions_asked']:
                    therapy_state['current_focus_area'] = 'emocional'
                elif 'relaciones' in concerns and 'social' not in therapy_state['questions_asked']:
                    therapy_state['current_focus_area'] = 'social'
                elif not therapy_state['user_data']['lifestyle_factors'] and 'conductual' not in therapy_state['questions_asked']:
                     therapy_state['current_focus_area'] = 'conductual'
                else:
                    available_areas = [a for a in areas if a not in therapy_state.get('asked_areas', set())]
                    if not available_areas: available_areas = areas 
                    area_index = depth % len(available_areas)
                    therapy_state['current_focus_area'] = available_areas[area_index]
                    therapy_state.setdefault('asked_areas', set()).add(available_areas[area_index])
            
            focus = therapy_state['current_focus_area']
            possible_questions = exploration_questions.get(focus, exploration_questions['emocional'])
            
        elif stage == 'analysis':
            possible_questions = analysis_questions
        else:
             possible_questions = [] 

        
        for q_template in possible_questions:
            q = q_template
            if '{}' in q and concerns:
                try:
                    q = q.format(concerns[0])
                except IndexError:
                    q = q.replace('{}', 'eso')
            elif '{}' in q:
                 q = q.replace('{}', 'eso') 
                 
            if q not in asked:
                question_to_ask = q
                break
        
        if not question_to_ask and stage != 'recommendation':
            fallback_question = "Cuéntame un poco más sobre eso. ¿Hay algo más que te gustaría compartir?"
            if fallback_question not in asked:
                question_to_ask = fallback_question
            else:
                question_to_ask = "¿Cómo te sientes con lo que hemos hablado hasta ahora?"
                
        if question_to_ask:
            therapy_state['questions_asked'].add(question_to_ask)
            return question_to_ask
        else:
            return "" 

    def _build_session_context(self, user_id: str) -> str:
        user_state = self._get_user_state(user_id)
        therapy_state = user_state['therapy_state']
        user_data = therapy_state['user_data']
        
        context_parts = [f"Contexto de la sesión para {user_data['name']}:"]
        context_parts.append(f"- Etapa actual: {therapy_state['session_stage']}")
        if user_data['concerns']:
            context_parts.append(f"- Preocupaciones detectadas: {', '.join(user_data['concerns'])}")
        if user_data['lifestyle_factors']:
            lifestyle_summary = ', '.join([f"{factor}: {'Sí' if known else 'No'}" for factor, known in user_data['lifestyle_factors'].items()])
            context_parts.append(f"- Factores de estilo de vida mencionados: {lifestyle_summary}")
        context_parts.append(f"- Profundidad de exploración: {therapy_state['exploration_depth']}")
        return "\n".join(context_parts)

    def generate_response(self, query: str, user_id: str, user_name: Optional[str] = None) -> Tuple[str, str]:
        
        user_state = self._get_user_state(user_id)
        therapy_state = user_state['therapy_state']
        if user_name and therapy_state['user_data']['name'] == 'Usuario': 
            therapy_state['user_data']['name'] = user_name
        actual_user_name = therapy_state['user_data']['name'] 
        
        clean_query = query.strip()
        user_state['chat_history'].append(Message(role="user", content=clean_query))
        
        advice_context = ""
        
        try:
           
            self.track_session_progress(user_id, clean_query)
            
            
            detected_concerns = therapy_state['user_data']['concerns']
            if detected_concerns:
               
                advice_query = ", ".join(detected_concerns)
                print(f"Buscando consejos para: {advice_query}") 
                try:
                    retrieved_advice_chunks = self.retriever.retrieve(advice_query, max_chunks=self.top_k) 
                    if retrieved_advice_chunks:
                        advice_context = "\n".join([chunk.text for chunk in retrieved_advice_chunks])
                        print(f"Consejos recuperados: {advice_context}") 
                except Exception as e:
                    print(f"Error al recuperar consejos específicos: {e}")
           
            general_context = ""
            try:
                max_general_chunks = min(2, self.top_k)
                retrieved_general_chunks = self.retriever.retrieve(clean_query, max_chunks=max_general_chunks)
            
                if retrieved_general_chunks:
                    general_context = retrieved_general_chunks[0].text
            except Exception as e:
                 print(f"Error al recuperar contexto general: {e}")
            
            messages = [{"role": "system", "content": self.therapy_prompt}]
            
            session_context = self._build_session_context(user_id)
            messages.append({"role": "system", "content": session_context})
            knowledge_context = ""
            if advice_context:
                knowledge_context += f"\nConsejos potencialmente relevantes basados en preocupaciones detectadas (menciona sutilmente si aplica):\n{advice_context}"
            if general_context:
                 knowledge_context += f"\nInformación general relacionada con la conversación (considera si es útil):\n{general_context}"
                 
            if knowledge_context:
                 messages.append({"role": "system", "content": knowledge_context.strip()})
            
            history_limit = 10 
            for msg in user_state['chat_history'][-history_limit:]:
                messages.append({
                    "role": "user" if msg.role == "user" else "assistant", 
                    "content": msg.content
                })
            
            if therapy_state['first_interaction']:
                response = f"Hola {actual_user_name}, soy Ana. Me alegra que hayas decidido conversar conmigo hoy. Estoy aquí para escucharte con atención y ayudarte a explorar lo que sea que estés sintiendo o pensando. ¿Podrías contarme un poco sobre cómo te encuentras últimamente o qué te trae por aquí hoy?"
                therapy_state['first_interaction'] = False
                user_state['chat_history'].append(Message(role="assistant", content=response)) 
                return response, "" 
            
            completion = self.client.chat.completions.create(
            model=self.model_name,
            messages=messages,
            max_tokens=450,
            temperature=self.temperature,  
            stop=None
        )
            
            response = completion.choices[0].message.content.strip()
            
            if therapy_state['session_stage'] in ['initial', 'exploration', 'analysis']:
                therapeutic_question = self.generate_therapeutic_question(user_id)
                if therapeutic_question and not any(response.endswith(p) for p in ['?', '.', '!']):
                     response += f"\n\n{therapeutic_question}"
                elif therapeutic_question and not response.endswith('?'):
                     response += f" {therapeutic_question}"
                elif therapeutic_question:
                     if therapeutic_question not in response:
                         response += f"\n\n{therapeutic_question}"
                         
            user_state['chat_history'].append(Message(role="assistant", content=response))
            
            return response, knowledge_context 

        except Exception as e:
            print(f"Error in generate_response: {e}")
    
            return "Lo siento, estoy teniendo algunos problemas técnicos en este momento. ¿Podrías intentarlo de nuevo en unos momentos?", ""

if __name__ == '__main__':
    os.environ.setdefault('OPENAI_API_KEY', 'ejemplo')
    os.environ.setdefault('OPENAI_BASE_URL', 'http://localhost:8080/v1') 
    if not os.path.exists("datos/translations"):
        os.makedirs("datos/translations")
        with open("datos/translations/ejemplo.txt", "w") as f:
            f.write("Este es un archivo de traducción de ejemplo.")
            
    bot = BotModel()
    user_id = "user123"
    user_name_from_app = "Farah"

    print("--- First Interaction ---")
    response1, context1 = bot.generate_response("Hola", user_id, user_name=user_name_from_app)
    print(f"Bot: {response1}")
    print(f"Context Used: {context1}")

    print("\n--- Second Interaction (User expresses concern) ---")
    response2, context2 = bot.generate_response("Me siento muy ansioso últimamente por el trabajo.", user_id)
    print(f"Bot: {response2}")
    print(f"Context Used: {context2}")
    
    print("\n--- Third Interaction (User elaborates) ---")
    response3, context3 = bot.generate_response("Sí, no puedo dejar de pensar en los plazos.", user_id)
    print(f"Bot: {response3}")
    print(f"Context Used: {context3}")
    
    print("\n--- Checking User State ---")
    print(bot.user_states[user_id]['therapy_state'])

