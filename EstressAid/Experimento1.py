import os
import pandas as pd
import time
import numpy as np
import logging
from datasets import Dataset
from ragas.metrics import Faithfulness, ContextPrecision, AnswerRelevancy
from ragas import evaluate
from openai import OpenAI
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns
import pickle
import hashlib

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

os.environ["OPENAI_API_KEY"] = "163d3b419fae16d393b64ff440ae1c10addcdf26964080bbfc10e6162bb872e04d6dbbc3d4e9c38dfdecc9b2fb41639869b5a883bfd5f3384e34ed409c2b8cf7"
os.environ["OPENAI_BASE_URL"] = "http://ada01.ujaen.es:8080/v1"

CACHE_DIR = "cache_experimento1"
os.makedirs(CACHE_DIR, exist_ok=True)

RESULTS_DIR = "resultados_experimento"
os.makedirs(RESULTS_DIR, exist_ok=True)

class Retriever:
    def __init__(self, input_dir, embed_model_path="hiiamsid/sentence_similarity_spanish_es"):

        self.input_dir = input_dir
        self.embed_model_path = embed_model_path
        self.chunks = []
        
        self._load_files()
    
    def _load_files(self):
        logging.info("Cargando archivos de texto...")
        self.chunks = [
            type('Chunk', (), {'text': 'Técnicas de respiración para reducir el estrés', 'source': 'file1.txt'}),
            type('Chunk', (), {'text': 'La meditación mindfulness puede ayudar con la ansiedad', 'source': 'file1.txt'}),
            type('Chunk', (), {'text': 'El ejercicio regular es beneficioso para la salud mental', 'source': 'file2.txt'}),
            type('Chunk', (), {'text': 'Mantener un diario puede ayudar a procesar emociones', 'source': 'file2.txt'}),
            type('Chunk', (), {'text': 'Establecer límites saludables en relaciones', 'source': 'file3.txt'}),
            type('Chunk', (), {'text': 'Técnicas para manejar pensamientos negativos', 'source': 'file3.txt'}),
            type('Chunk', (), {'text': 'Estrategias para mejorar la calidad del sueño', 'source': 'file4.txt'}),
            type('Chunk', (), {'text': 'Cómo manejar la ansiedad social', 'source': 'file4.txt'}),
            type('Chunk', (), {'text': 'Técnicas para dejar de fumar', 'source': 'file5.txt'}),
            type('Chunk', (), {'text': 'Estrategias para reducir el consumo de alcohol', 'source': 'file5.txt'})
        ]
    
    def retrieve(self, query, max_chunks=3):

        query_words = set(query.lower().split())
        scored_chunks = []
        
        for chunk in self.chunks:
            chunk_words = set(chunk.text.lower().split())
            score = len(query_words.intersection(chunk_words))
            scored_chunks.append((chunk, score))
        
        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return [chunk for chunk, _ in scored_chunks[:max_chunks]]

def calcular_metricas_basicas_mejorado(questions, answers, contexts, references):

    n = len(questions)
    resultados = {
        'faithfulness': np.zeros(n),
        'context_precision': np.zeros(n),
        'answer_relevancy': np.zeros(n)
    }
    
    preguntas = []
    respuestas = []
    contextos_texto = []
    referencias = []
    
    for i in range(n):
        q = questions[i] if questions[i] and not pd.isna(questions[i]) else "pregunta_vacía"
        a = answers[i] if answers[i] and not pd.isna(answers[i]) else "respuesta_vacía"
        r = references[i] if references[i] and not pd.isna(references[i]) else "referencia-vacía"
        
        preguntas.append(q.lower())
        respuestas.append(a.lower())
        referencias.append(r.lower())
        
        if isinstance(contexts[i], list) and contexts[i]:
            contexto_valido = [c for c in contexts[i] if c and not pd.isna(c)]
            contextos_texto.append(' '.join(contexto_valido).lower() if contexto_valido else "contexto_vacío")
        else:
            ctx = str(contexts[i]) if contexts[i] and not pd.isna(contexts[i]) else "contexto_vacío"
            contextos_texto.append(ctx.lower())
    
    palabras_preguntas = [set(p.split()) for p in preguntas]
    palabras_respuestas = [set(r.split()) for r in respuestas]
    palabras_contextos = [set(c.split()) for c in contextos_texto]
    palabras_referencias = [set(r.split()) for r in referencias]
    
    for i in range(n):
        try:
            if len(palabras_contextos[i]) > 0 and "contexto_vacío" not in contextos_texto[i]:
                overlap = len(palabras_contextos[i].intersection(palabras_respuestas[i])) / len(palabras_contextos[i])
                resultados['faithfulness'][i] = min(1.0, overlap * 3)
            else:
                resultados['faithfulness'][i] = 0.5
            
            relevancia_pregunta = len(palabras_preguntas[i].intersection(palabras_respuestas[i])) / len(palabras_preguntas[i]) if len(palabras_preguntas[i]) > 0 else 0.0
            relevancia_referencia = len(palabras_referencias[i].intersection(palabras_respuestas[i])) / len(palabras_referencias[i]) if len(palabras_referencias[i]) > 0 else 0.0
            
            resultados['answer_relevancy'][i] = min(1.0, (0.7 * relevancia_pregunta + 0.3 * relevancia_referencia) * 2)
            
            if len(palabras_preguntas[i]) > 0 and "pregunta_vacía" not in preguntas[i]:
                resultados['context_precision'][i] = min(1.0, len(palabras_preguntas[i].intersection(palabras_contextos[i])) / len(palabras_preguntas[i]) * 2)
            else:
                resultados['context_precision'][i] = 0.5
        
        except Exception as e:
            logging.error(f"Error al calcular métricas para el índice {i}: {e}")
            resultados['faithfulness'][i] = 0.5
            resultados['answer_relevancy'][i] = 0.5
            resultados['context_precision'][i] = 0.5
    
    df_resultados = pd.DataFrame(resultados)
    
    logging.info("\nEstadísticas de métricas calculadas manualmente:")
    for columna in df_resultados.columns:
        logging.info(f"{columna}: media = {df_resultados[columna].mean():.4f}, min = {df_resultados[columna].min():.4f}, max = {df_resultados[columna].max():.4f}")
    
    return df_resultados

class BotModelExperimento:

    def __init__(self, chunk_size=256, top_k=3, temperature=0.1):
        self.client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"), 
            base_url=os.getenv("OPENAI_BASE_URL")
        )
        
        try:
            base_dir = Path(__file__).parent.absolute()
        except NameError:
            base_dir = Path('.').absolute()
            
        self.retriever = Retriever(
            input_dir=os.path.join(base_dir, "datos/translations"),
            embed_model_path="hiiamsid/sentence_similarity_spanish_es"
        )
        
        self.chunk_size = chunk_size
        self.top_k = top_k
        self.temperature = temperature
        
        self.user_states = {}
        self.model_name = "/mnt/beegfs/sinai-data/meta-llama/Llama-3.1-8B-Instruct"
        
        self.therapy_prompt = """
        Eres un terapeuta conversacional cálido y empático llamado Ana. Hablas de forma natural, humana y compasiva, 
        como lo haría un terapeuta profesional experimentado que realmente se preocupa por sus pacientes.
        """
    
    def get_cache_key(self, query):
        config_str = f"{self.chunk_size}_{self.top_k}_{self.temperature}"
        return f"{config_str}_{hashlib.md5(query.encode()).hexdigest()}"
    
    def generate_response(self, query, user_id="default_user", use_cache=True):

        if use_cache:
            cache_key = self.get_cache_key(query)
            cache_file = os.path.join(CACHE_DIR, f"{cache_key}.pkl")
            
            if os.path.exists(cache_file):
                try:
                    with open(cache_file, 'rb') as f:
                        logging.info(f"Usando respuesta en caché para: {query[:30]}...")
                        return pickle.load(f)
                except Exception as e:
                    logging.error(f"Error al cargar caché: {e}")
        
        retrieved_chunks = self.retriever.retrieve(query, max_chunks=self.top_k)
        context = "\n\n".join([chunk.text for chunk in retrieved_chunks])
        
        messages = [
            {"role": "system", "content": self.therapy_prompt},
            {"role": "user", "content": f"Consulta del usuario: {query}\n\nInformación relevante de la base de conocimiento:\n{context}"}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=self.temperature
            )
            
            result = (response.choices[0].message.content, retrieved_chunks)
            
            if use_cache:
                cache_key = self.get_cache_key(query)
                cache_file = os.path.join(CACHE_DIR, f"{cache_key}.pkl")
                try:
                    with open(cache_file, 'wb') as f:
                        pickle.dump(result, f)
                except Exception as e:
                    logging.error(f"Error al guardar caché: {e}")
            
            return result
        
        except Exception as e:
            logging.error(f"Error al generar respuesta: {e}")
            return ("Lo siento, no pude generar una respuesta adecuada en este momento.", retrieved_chunks)

def crear_ground_truth():
  
    ground_truth = {
        "Hoy me siento muy mal. ¿Podrías darme algunas técnicas que pueda aplicar?": 
            "Para sentirte mejor, puedes probar técnicas de respiración profunda, meditación mindfulness, ejercicio ligero, escribir en un diario, o hablar con alguien de confianza. Es importante identificar qué está causando estos sentimientos y buscar apoyo profesional si persiste.",
        
        "¿Cómo puedo reducir mi nivel de estrés?": 
            "Para reducir el estrés puedes implementar técnicas de relajación como respiración profunda, ejercicio regular, establecer límites claros, organizar tu tiempo, practicar mindfulness, mantener una rutina de sueño saludable y buscar apoyo social.",
        
        "Últimamente he estado fumando mucho debido al estrés. ¿Qué debería hacer?": 
            "Es importante abordar tanto el estrés como el hábito de fumar. Busca alternativas saludables para manejar el estrés como ejercicio, técnicas de relajación, o hablar con alguien. Considera estrategias de cesación tabáquica gradual y busca apoyo profesional si es necesario.",
        
        "Mi relación con mi pareja me está causando mucho estrés y he comenzado a beber de nuevo. ¿Qué piensas que sería mejor hacer?": 
            "Es crucial abordar tanto los problemas de pareja como el consumo de alcohol. Considera terapia de pareja para mejorar la comunicación, busca apoyo para el tema del alcohol, y desarrolla estrategias saludables de manejo del estrés. No dudes en buscar ayuda profesional.",
        
        "Siento mucha ansiedad. ¿Cómo puedo reducirla?": 
            "Para reducir la ansiedad, prueba técnicas de respiración profunda, ejercicios de relajación muscular progresiva, mindfulness, ejercicio regular, limitar la cafeína, mantener una rutina estable, y técnicas de reestructuración cognitiva. Si persiste, busca ayuda profesional.",
        
        "He tenido muchos pensamientos negativos últimamente. ¿Está relacionado con el estrés?": 
            "Sí, el estrés puede intensificar los pensamientos negativos. Es importante practicar técnicas de reestructuración cognitiva, mindfulness, mantener un diario de pensamientos, buscar actividades que te den bienestar, y considerar hablar con un profesional si estos pensamientos persisten o interfieren con tu vida diaria.",
        
        "Cuando estoy estresado, no puedo trabajar. ¿Qué puedo hacer?": 
            "Para manejar el estrés que afecta tu productividad, prueba técnicas de organización del tiempo, toma descansos regulares, practica técnicas de relajación antes del trabajo, crea un ambiente de trabajo calmado, y considera técnicas de mindfulness. Es importante abordar las fuentes del estrés.",
        
        "No puedo comer como antes debido al estrés. ¿Qué puedo hacer?": 
            "El estrés puede afectar significativamente el apetito. Intenta comer pequeñas porciones frecuentes, mantén horarios regulares de comida, elige alimentos nutritivos y fáciles de digerir, practica técnicas de relajación antes de comer, y busca ayuda profesional si la pérdida de apetito persiste."
    }
    
    return ground_truth

def evaluar_configuracion_mejorado(config, questions, ground_truth, output_dir):

    logging.info(f"\nEvaluando configuración: {config['nombre']}")
    logging.info(f"Parámetros: chunk_size={config['chunk_size']}, top_k={config['top_k']}, temperature={config['temperature']}")
    
    bot = BotModelExperimento(
        chunk_size=config['chunk_size'],
        top_k=config['top_k'],
        temperature=config['temperature']
    )
    
    data = {
        "question": [],
        "answer": [],
        "contexts": [],
        "reference": []
    }
    
    datos_originales = {
        "question": [],
        "answer": [],
        "contexts": [],
        "reference": []
    }
    
    tiempos_respuesta = []
    
    for question in questions:
        try:
            inicio = time.time()
            response, context_chunks = bot.generate_response(question)
            fin = time.time()
            tiempo_respuesta = fin - inicio
            tiempos_respuesta.append(tiempo_respuesta)
            
            if not response or pd.isna(response) or response.strip() == "":
                response = "No se pudo generar una respuesta válida"
            
            context_texts = [chunk.text for chunk in context_chunks]
            if not context_texts:
                context_texts = ["No se encontró contexto relevante"]
            
            data["question"].append(question)
            data["answer"].append(response)
            data["contexts"].append(context_texts)
            reference = ground_truth.get(question, "Respuesta de referencia no disponible")
            data["reference"].append(reference)
            
            datos_originales["question"].append(question)
            datos_originales["answer"].append(response)
            datos_originales["contexts"].append(context_texts)
            datos_originales["reference"].append(reference)
            
            logging.info(f"Pregunta: {question}")
            logging.info(f"Tiempo de respuesta: {tiempo_respuesta:.2f} segundos")
            
        except Exception as e:
            logging.error(f"Error al procesar la pregunta '{question}': {e}")
            data["question"].append(question)
            data["answer"].append("Error al obtener respuesta")
            data["contexts"].append(["No se pudo obtener contexto"])
            data["reference"].append(ground_truth.get(question, "Respuesta de referencia no disponible"))
            
            datos_originales["question"].append(question)
            datos_originales["answer"].append("Error al obtener respuesta")
            datos_originales["contexts"].append(["No se pudo obtener contexto"])
            datos_originales["reference"].append(ground_truth.get(question, "Respuesta de referencia no disponible"))
    
    df_respuestas = pd.DataFrame({
        "question": datos_originales["question"],
        "answer": datos_originales["answer"],
        "context": [" | ".join(ctx) for ctx in datos_originales["contexts"]],
        "reference": datos_originales["reference"],
        "tiempo_respuesta": tiempos_respuesta + [0] * (len(datos_originales["question"]) - len(tiempos_respuesta))
    })
    
    df_respuestas.to_csv(f"{output_dir}/respuestas_{config['nombre']}.csv", index=False)
    
    try:
        for key in data:
            if len(data[key]) == 0:
                raise ValueError(f"La lista {key} está vacía")
        
        ragas_dataset = Dataset.from_dict(data)
        
        metrics = [
            Faithfulness(),
            ContextPrecision(),
            AnswerRelevancy()
        ]
        
        logging.info(f"Evaluando {config['nombre']} con RAGAS...")
        results = evaluate(ragas_dataset, metrics)
        
        results_df = results.to_pandas()
        
        if results_df.isna().any().any():
            logging.warning("Se detectaron valores NaN en los resultados de RAGAS, usando cálculo manual...")
            manual_results = calcular_metricas_basicas_mejorado(
                data["question"],
                data["answer"],
                data["contexts"],
                data["reference"]
            )
            
            for col in manual_results.columns:
                if col in results_df.columns:
                    results_df[col] = results_df[col].fillna(manual_results[col])
    
    except Exception as e:
        logging.error(f"Error en evaluación RAGAS: {e}")
        logging.info("Calculando métricas manualmente...")
        
        results_df = calcular_metricas_basicas_mejorado(
            data["question"],
            data["answer"],
            data["contexts"],
            data["reference"]
        )
    
    results_df["configuracion"] = config["nombre"]
    results_df["chunk_size"] = config["chunk_size"]
    results_df["top_k"] = config["top_k"]
    results_df["temperature"] = config["temperature"]
    results_df["tiempo_promedio"] = sum(tiempos_respuesta) / len(tiempos_respuesta) if tiempos_respuesta else 0
    
    results_df.to_csv(f"{output_dir}/evaluacion_{config['nombre']}.csv", index=False)
    
    promedios = {
        "faithfulness": results_df["faithfulness"].mean(),
        "context_precision": results_df["context_precision"].mean(),
        "answer_relevancy": results_df["answer_relevancy"].mean(),
        "tiempo_promedio": results_df["tiempo_promedio"].mean() if "tiempo_promedio" in results_df.columns else 0
    }
    
    return promedios, results_df

def visualizar_resultados(resultados_configuraciones, output_dir):

    df_viz = pd.DataFrame(resultados_configuraciones).T.reset_index()
    df_viz.rename(columns={"index": "configuracion"}, inplace=True)
    
    plt.figure(figsize=(12, 8))
    
    sns.set_style("whitegrid")
    
    fig, axes = plt.subplots(2, 2, figsize=(15, 10))
    
    sns.barplot(x="configuracion", y="faithfulness", data=df_viz, ax=axes[0, 0])
    axes[0, 0].set_title("Faithfulness por Configuración")
    axes[0, 0].set_ylim(0, 1)
    
    sns.barplot(x="configuracion", y="context_precision", data=df_viz, ax=axes[0, 1])
    axes[0, 1].set_title("Context Precision por Configuración")
    axes[0, 1].set_ylim(0, 1)
    
    sns.barplot(x="configuracion", y="answer_relevancy", data=df_viz, ax=axes[1, 0])
    axes[1, 0].set_title("Answer Relevancy por Configuración")
    axes[1, 0].set_ylim(0, 1)
    sns.barplot(x="configuracion", y="tiempo_promedio", data=df_viz, ax=axes[1, 1])
    axes[1, 1].set_title("Tiempo Promedio por Configuración (segundos)")
    
    plt.tight_layout()
    
    plt.savefig(f"{output_dir}/comparativa_configuraciones.png", dpi=300)
    
    plt.close()
    
    tabla_resumen = df_viz.copy()
    tabla_resumen["promedio_metricas"] = tabla_resumen[["faithfulness", "context_precision", "answer_relevancy"]].mean(axis=1)
    tabla_resumen = tabla_resumen.sort_values("promedio_metricas", ascending=False)
    
    tabla_resumen.to_csv(f"{output_dir}/resumen_configuraciones.csv", index=False)
    
    return tabla_resumen

def ejecutar_experimento():
 
    logging.info("Iniciando experimento de evaluación de configuraciones...")
    
    configuraciones = [
        {
            "nombre": "config_baja_temperatura",
            "chunk_size": 256,
            "top_k": 3,
            "temperature": 0.1
        },
        {
            "nombre": "config_media_temperatura",
            "chunk_size": 256,
            "top_k": 3,
            "temperature": 0.4
        },
        {
            "nombre": "config_alta_temperatura",
            "chunk_size": 256,
            "top_k": 3,
            "temperature": 0.7
        },
        {
            "nombre": "config_chunks_pequeños",
            "chunk_size": 128,
            "top_k": 3,
            "temperature": 0.4
        },
        {
            "nombre": "config_chunks_grandes",
            "chunk_size": 512,
            "top_k": 3,
            "temperature": 0.4
        },
        {
            "nombre": "config_pocos_chunks",
            "chunk_size": 256,
            "top_k": 1,
            "temperature": 0.4
        },
        {
            "nombre": "config_muchos_chunks",
            "chunk_size": 256,
            "top_k": 5,
            "temperature": 0.4
        }
    ]
    
    preguntas = [
        "Hoy me siento muy mal. ¿Podrías darme algunas técnicas que pueda aplicar?",
        "¿Cómo puedo reducir mi nivel de estrés?",
        "Últimamente he estado fumando mucho debido al estrés. ¿Qué debería hacer?",
        "Mi relación con mi pareja me está causando mucho estrés y he comenzado a beber de nuevo. ¿Qué piensas que sería mejor hacer?",
        "Siento mucha ansiedad. ¿Cómo puedo reducirla?",
        "He tenido muchos pensamientos negativos últimamente. ¿Está relacionado con el estrés?",
        "Cuando estoy estresado, no puedo trabajar. ¿Qué puedo hacer?",
        "No puedo comer como antes debido al estrés. ¿Qué puedo hacer?"
    ]
    
    ground_truth = crear_ground_truth()
    resultados_configuraciones = {}
    
    for config in configuraciones:
        logging.info(f"\nEvaluando configuración: {config['nombre']}")
        promedios, _ = evaluar_configuracion_mejorado(config, preguntas, ground_truth, RESULTS_DIR)
        resultados_configuraciones[config["nombre"]] = promedios
        
        logging.info(f"\nResultados para {config['nombre']}:")
        logging.info(f"Faithfulness: {promedios['faithfulness']:.4f}")
        logging.info(f"Context Precision: {promedios['context_precision']:.4f}")
        logging.info(f"Answer Relevancy: {promedios['answer_relevancy']:.4f}")
        logging.info(f"Tiempo promedio: {promedios['tiempo_promedio']:.2f} segundos")
    
    tabla_resumen = visualizar_resultados(resultados_configuraciones, RESULTS_DIR)
    
    mejor_config = tabla_resumen.iloc[0]["configuracion"]
    logging.info(f"\nMejor configuración: {mejor_config}")
    logging.info(tabla_resumen.iloc[0][["faithfulness", "context_precision", "answer_relevancy", "tiempo_promedio", "promedio_metricas"]])
    
    return resultados_configuraciones, tabla_resumen

if __name__ == "__main__":
    ejecutar_experimento()
