# Informe Final de Experimentos RAG con Llama-3.1-8B

## Resumen de Resultados

### Experimento 1: Evaluación Base

- **Mejor configuración**: config_muchos_chunks
- **Parámetros óptimos**: chunk_size=256, top_k=5, temperature=0.4
- **Puntuación promedio**: 0.6919
- **Tiempo promedio de respuesta**: 32.56 segundos

| Métrica | Puntuación |
|---------|------------|
| faithfulness | 1.0000 |
| context_precision | 0.2286 |
| answer_relevancy | 0.8470 |

#### Comparación de todas las configuraciones:

| Configuracion | Faithfulness | Context Precision | Answer Relevancy | Tiempo (s) |
|---------------|--------------|-------------------|------------------|------------|
| config_alta_temperatura | 1.0000 | 0.2286 | 0.8404 | 33.55 |
| config_baja_temperatura | 1.0000 | 0.2286 | 0.7628 | 30.71 |
| config_chunks_grandes | 1.0000 | 0.2286 | 0.7934 | 27.70 |
| config_chunks_pequeños | 1.0000 | 0.2286 | 0.7806 | 32.16 |
| config_media_temperatura | 1.0000 | 0.2286 | 0.8075 | 31.81 |
| config_muchos_chunks | 1.0000 | 0.2286 | 0.8470 | 32.56 |
| config_pocos_chunks | 1.0000 | 0.1604 | 0.7437 | 31.35 |

### Experimento 3: Adecuación del Contexto

- **Mejor estrategia de recuperación**: hibrido
- **Puntuación promedio**: 0.8207
- **Tiempo promedio de respuesta**: 7.40 segundos

| Métrica | Puntuación |
|---------|------------|
| faithfulness | 0.8830 |
| context_precision | 0.7804 |
| answer_relevancy | 0.7986 |

#### Comparación de todas las estrategias de recuperación:

| Estrategia | Faithfulness | Context Precision | Answer Relevancy | Tiempo (s) |
|------------|--------------|-------------------|------------------|------------|
| bm25 | 0.7286 | 0.7772 | 0.6842 | 11.29 |
| embeddings | 0.7982 | 0.7492 | 0.8888 | 0.01 |
| hibrido | 0.8830 | 0.7804 | 0.7986 | 7.40 |

## Conclusiones

### Configuración óptima (Experimento 1)

Basado en el Experimento 1 realizado, la configuración óptima para el sistema RAG con Llama-3.1-8B es:

1. **Parámetros del modelo**: chunk_size=256, top_k=5, temperature=0.4
2. **Rendimiento**: Puntuación promedio de 0.6919 con tiempo de respuesta de 32.56 segundos

Esta configuración proporciona el mejor equilibrio entre precisión, relevancia y fidelidad en las respuestas generadas.

### Estrategia de recuperación óptima (Experimento 3)

El Experimento 3 demuestra que la estrategia de recuperación 'hibrido' es la más efectiva:

1. **Puntuación promedio**: 0.8207
2. **Tiempo de respuesta**: 7.40 segundos

La estrategia híbrida que combina embeddings y BM25 proporciona los mejores resultados, aprovechando tanto la semántica como la coincidencia léxica.

## Conclusión General

Basado en los experimentos realizados, la configuración óptima para el sistema RAG con Llama-3.1-8B es:

1. **Parámetros del modelo**: chunk_size=256, top_k=5, temperature=0.4
2. **Estrategia de recuperación**: hibrido

Esta configuración optimizada proporciona el mejor equilibrio entre precisión, relevancia y fidelidad en las respuestas generadas, con tiempos de respuesta razonables.

## Recomendaciones

1. **Implementar la configuración óptima**: Utilizar los parámetros y estrategias de recuperación identificados como óptimos.
2. **Evaluar con usuarios reales**: Realizar pruebas con usuarios reales para validar la calidad percibida de las respuestas.
3. **Monitoreo continuo**: Implementar un sistema de monitoreo para evaluar continuamente la calidad de las respuestas y detectar posibles degradaciones.
4. **Explorar mejoras adicionales**: Investigar técnicas avanzadas como reranking, expansión de consultas, o fine-tuning específico del dominio.
