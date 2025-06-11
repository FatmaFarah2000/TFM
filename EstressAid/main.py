import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import glob
import sys
from pathlib import Path

def analizar_resultados_experimento1(directorio_resultados="resultados_experimento"):

    print("\n" + "="*80)
    print("ANALIZANDO RESULTADOS DEL EXPERIMENTO 1: EVALUACIÓN BASE")
    print("="*80)
    resultados_combinados_path = os.path.join(directorio_resultados, "resultados_combinados.csv")
    
    if os.path.exists(resultados_combinados_path):
        print(f"Cargando resultados combinados desde {resultados_combinados_path}")
        resultados_exp1 = pd.read_csv(resultados_combinados_path)
    else:
        archivos_evaluacion = glob.glob(os.path.join(directorio_resultados, "evaluacion_*.csv"))
        
        if not archivos_evaluacion:
            print(f"No se encontraron archivos de resultados en {directorio_resultados}")
            return None, None
        
        print(f"Combinando resultados de {len(archivos_evaluacion)} archivos de evaluación")
        resultados_exp1 = pd.concat([pd.read_csv(archivo) for archivo in archivos_evaluacion])
    
    if resultados_exp1 is None or resultados_exp1.empty:
        print("No se pudieron cargar resultados del Experimento 1")
        return None, None
    
    print("\nAnalizando resultados para identificar la mejor configuración...")
    metricas = ["faithfulness", "context_precision", "answer_relevancy"]
    
    metricas_existentes = [m for m in metricas if m in resultados_exp1.columns]
    
    if not metricas_existentes:
        print("No se encontraron métricas válidas en los resultados")
        return resultados_exp1, None
    
    resultados_exp1['promedio_metricas'] = resultados_exp1[metricas_existentes].mean(axis=1)
    
    if 'configuracion' in resultados_exp1.columns:
        group_col = 'configuracion'
    elif 'retriever' in resultados_exp1.columns:
        group_col = 'retriever'
    elif 'version' in resultados_exp1.columns:
        group_col = 'version'
    else:
        print("No se encontró una columna de agrupación válida (configuracion, retriever o version)")
        return resultados_exp1, None
    
    numeric_cols = ['chunk_size', 'top_k', 'temperature', 'tiempo_promedio']
    agg_cols = {metrica: 'mean' for metrica in metricas_existentes}
    agg_cols['promedio_metricas'] = 'mean'
    
    for col in numeric_cols:
        if col in resultados_exp1.columns:
            agg_cols[col] = 'first'
    
    df_por_config = resultados_exp1.groupby(group_col).agg(agg_cols).reset_index()
    
    if df_por_config['promedio_metricas'].isna().all():
        print("Todas las configuraciones tienen valores NaN en las métricas")
        mejor_config = df_por_config.iloc[0] 
    else:
        df_filtrado = df_por_config.dropna(subset=['promedio_metricas'])
        if df_filtrado.empty:
            print("No hay configuraciones válidas con métricas completas")
            mejor_config = df_por_config.iloc[0] 
        else:
            mejor_config = df_filtrado.loc[df_filtrado['promedio_metricas'].idxmax()]
    
    print(f"\nMejor configuración identificada: {mejor_config[group_col]}")
    
    params = []
    if 'chunk_size' in mejor_config:
        params.append(f"chunk_size={mejor_config['chunk_size']}")
    if 'top_k' in mejor_config:
        params.append(f"top_k={mejor_config['top_k']}")
    if 'temperature' in mejor_config:
        params.append(f"temperature={mejor_config['temperature']}")
    
    if params:
        print(f"Parámetros: {', '.join(params)}")
    
    print(f"Puntuación promedio: {mejor_config['promedio_metricas']:.4f}")
    
    for metrica in metricas_existentes:
        print(f"- {metrica}: {mejor_config[metrica]:.4f}")
    
    with open(os.path.join(directorio_resultados, "mejor_configuracion.txt"), 'w', encoding='utf-8') as f:
        f.write(f"Mejor configuración: {mejor_config[group_col]}\n")
        for param in params:
            f.write(f"{param}\n")
        f.write(f"Puntuación promedio: {mejor_config['promedio_metricas']:.4f}\n")
        if 'tiempo_promedio' in mejor_config:
            f.write(f"Tiempo promedio: {mejor_config['tiempo_promedio']:.2f} segundos\n")
        f.write("\nMétricas individuales:\n")
        for metrica in metricas_existentes:
            f.write(f"- {metrica}: {mejor_config[metrica]:.4f}\n")
    
    print("\nGenerando visualizaciones...")
    
    try:
        plt.figure(figsize=(12, 8))
        df_plot = df_por_config[[group_col] + metricas_existentes].melt(
            id_vars=[group_col],
            value_vars=metricas_existentes,
            var_name="Métrica",
            value_name="Puntuación"
        )
        sns.barplot(x=group_col, y="Puntuación", hue="Métrica", data=df_plot)
        plt.title(f"Comparación de Métricas por {group_col.capitalize()}")
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(os.path.join(directorio_resultados, "comparacion_metricas_analisis.png"))
        
        if 'tiempo_promedio' in df_por_config.columns:
            plt.figure(figsize=(10, 6))
            sns.barplot(x=group_col, y="tiempo_promedio", data=df_por_config)
            plt.title(f"Tiempo Promedio de Respuesta por {group_col.capitalize()}")
            plt.ylabel("Tiempo (segundos)")
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(os.path.join(directorio_resultados, "comparacion_tiempos_analisis.png"))
        
        print(f"Visualizaciones guardadas en {directorio_resultados}/")
    except Exception as e:
        print(f"Error al crear visualizaciones: {e}")
    
    return resultados_exp1, mejor_config

def analizar_resultados_experimento3(directorio_resultados="resultados_experimento3"):

    print("\n" + "="*80)
    print("ANALIZANDO RESULTADOS DEL EXPERIMENTO 3: ADECUACIÓN DEL CONTEXTO")
    print("="*80)
    
    resultados_combinados_path = os.path.join(directorio_resultados, "resultados_combinados.csv")
    
    if os.path.exists(resultados_combinados_path):
        print(f"Cargando resultados combinados desde {resultados_combinados_path}")
        resultados_exp3 = pd.read_csv(resultados_combinados_path)
    else:
        archivos_evaluacion = glob.glob(os.path.join(directorio_resultados, "evaluacion_*.csv"))
        
        if not archivos_evaluacion:
            print(f"No se encontraron archivos de resultados en {directorio_resultados}")
            return None, None
        
        print(f"Combinando resultados de {len(archivos_evaluacion)} archivos de evaluación")
        resultados_exp3 = pd.concat([pd.read_csv(archivo) for archivo in archivos_evaluacion])
    
    if resultados_exp3 is None or resultados_exp3.empty:
        print("No se pudieron cargar resultados del Experimento 3")
        return None, None
    
    print("\nAnalizando resultados para identificar la mejor estrategia de recuperación...")    
    metricas = ["faithfulness", "context_precision", "answer_relevancy"]    
    metricas_existentes = [m for m in metricas if m in resultados_exp3.columns]
    
    if not metricas_existentes:
        print("No se encontraron métricas válidas en los resultados")
        return resultados_exp3, None
    
    resultados_exp3['promedio_metricas'] = resultados_exp3[metricas_existentes].mean(axis=1)
    
    if 'retriever' in resultados_exp3.columns:
        group_col = 'retriever'
    else:
        print("No se encontró la columna 'retriever' en los resultados")
        return resultados_exp3, None
    
    df_por_retriever = resultados_exp3.groupby(group_col).agg({
        **{metrica: 'mean' for metrica in metricas_existentes},
        'promedio_metricas': 'mean',
        'tiempo_promedio': 'mean' if 'tiempo_promedio' in resultados_exp3.columns else 'count'
    }).reset_index()
    
    if df_por_retriever['promedio_metricas'].isna().all():
        print("Todas las estrategias tienen valores NaN en las métricas")
        mejor_estrategia = df_por_retriever.iloc[0] 
    else:
        df_filtrado = df_por_retriever.dropna(subset=['promedio_metricas'])
        if df_filtrado.empty:
            print("No hay estrategias válidas con métricas completas")
            mejor_estrategia = df_por_retriever.iloc[0] 
        else:
            mejor_estrategia = df_filtrado.loc[df_filtrado['promedio_metricas'].idxmax()]
    
    print(f"\nMejor estrategia de recuperación identificada: {mejor_estrategia['retriever']}")
    print(f"Puntuación promedio: {mejor_estrategia['promedio_metricas']:.4f}")
    
    for metrica in metricas_existentes:
        print(f"- {metrica}: {mejor_estrategia[metrica]:.4f}")    
    with open(os.path.join(directorio_resultados, "mejor_estrategia_recuperacion.txt"), 'w', encoding='utf-8') as f:
        f.write(f"Mejor estrategia de recuperación: {mejor_estrategia['retriever']}\n")
        f.write(f"Puntuación promedio: {mejor_estrategia['promedio_metricas']:.4f}\n")
        if 'tiempo_promedio' in mejor_estrategia:
            f.write(f"Tiempo promedio: {mejor_estrategia['tiempo_promedio']:.2f} segundos\n")
        f.write("\nMétricas individuales:\n")
        for metrica in metricas_existentes:
            f.write(f"- {metrica}: {mejor_estrategia[metrica]:.4f}\n")    
    print("\nGenerando visualizaciones...")
    
    try:
        plt.figure(figsize=(12, 8))
        df_plot = df_por_retriever[[group_col] + metricas_existentes].melt(
            id_vars=[group_col],
            value_vars=metricas_existentes,
            var_name="Métrica",
            value_name="Puntuación"
        )
        sns.barplot(x=group_col, y="Puntuación", hue="Métrica", data=df_plot)
        plt.title("Comparación de Métricas por Estrategia de Recuperación")
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.savefig(os.path.join(directorio_resultados, "comparacion_metricas_analisis_retriever.png"))
        
        if 'tiempo_promedio' in df_por_retriever.columns:
            plt.figure(figsize=(10, 6))
            sns.barplot(x=group_col, y="tiempo_promedio", data=df_por_retriever)
            plt.title("Tiempo Promedio de Respuesta por Estrategia de Recuperación")
            plt.ylabel("Tiempo (segundos)")
            plt.xticks(rotation=45)
            plt.tight_layout()
            plt.savefig(os.path.join(directorio_resultados, "comparacion_tiempos_analisis_retriever.png"))
        
        print(f"Visualizaciones guardadas en {directorio_resultados}/")
    except Exception as e:
        print(f"Error al crear visualizaciones: {e}")
    
    return resultados_exp3, mejor_estrategia

def generar_informe_final(
    resultados_exp1=None, mejor_config=None,
    resultados_exp3=None, mejor_estrategia=None,
    directorio_resultados="resultados_experimentos"
):
   
    print("\n" + "="*80)
    print("GENERANDO INFORME FINAL")
    print("="*80)
    
    os.makedirs(directorio_resultados, exist_ok=True)
    
    try:
        with open(os.path.join(directorio_resultados, "informe_final.md"), 'w', encoding='utf-8') as f:
            f.write("# Informe Final de Experimentos RAG con Llama-3.1-8B\n\n")
            
            f.write("## Resumen de Resultados\n\n")
            
            f.write("### Experimento 1: Evaluación Base\n\n")
            if resultados_exp1 is not None and not resultados_exp1.empty and mejor_config is not None:
                f.write(f"- **Mejor configuración**: {mejor_config.get('configuracion', 'N/A')}\n")
                
                params = []
                if 'chunk_size' in mejor_config:
                    params.append(f"chunk_size={mejor_config['chunk_size']}")
                if 'top_k' in mejor_config:
                    params.append(f"top_k={mejor_config['top_k']}")
                if 'temperature' in mejor_config:
                    params.append(f"temperature={mejor_config['temperature']}")
                
                if params:
                    f.write(f"- **Parámetros óptimos**: {', '.join(params)}\n")
                
                f.write(f"- **Puntuación promedio**: {mejor_config['promedio_metricas']:.4f}\n")
                
                if 'tiempo_promedio' in mejor_config:
                    f.write(f"- **Tiempo promedio de respuesta**: {mejor_config['tiempo_promedio']:.2f} segundos\n")
                
                f.write("\n")
                
                f.write("| Métrica | Puntuación |\n")
                f.write("|---------|------------|\n")
                metricas = ["faithfulness", "context_precision", "answer_relevancy"]
                for metrica in metricas:
                    if metrica in mejor_config:
                        f.write(f"| {metrica} | {mejor_config[metrica]:.4f} |\n")
                f.write("\n")
                
                f.write("#### Comparación de todas las configuraciones:\n\n")
                
                if 'configuracion' in resultados_exp1.columns:
                    group_col = 'configuracion'
                elif 'retriever' in resultados_exp1.columns:
                    group_col = 'retriever'
                elif 'version' in resultados_exp1.columns:
                    group_col = 'version'
                else:
                    group_col = None
                
                if group_col is not None:
                    metricas_existentes = [m for m in metricas if m in resultados_exp1.columns]
                    
                    df_por_config = resultados_exp1.groupby(group_col).agg({
                        **{metrica: 'mean' for metrica in metricas_existentes},
                        'tiempo_promedio': 'mean' if 'tiempo_promedio' in resultados_exp1.columns else 'count'
                    }).reset_index()
                    
                    f.write(f"| {group_col.capitalize()} | Faithfulness | Context Precision | Answer Relevancy | Tiempo (s) |\n")
                    f.write("|---------------|--------------|-------------------|------------------|------------|\n")
                    for _, row in df_por_config.iterrows():
                        f.write(f"| {row[group_col]} |")
                        for metrica in metricas:
                            if metrica in row:
                                f.write(f" {row[metrica]:.4f} |")
                            else:
                                f.write(" N/A |")
                        
                        if 'tiempo_promedio' in row:
                            f.write(f" {row['tiempo_promedio']:.2f} |\n")
                        else:
                            f.write(" N/A |\n")
                    f.write("\n")
            else:
                f.write("No se obtuvieron resultados válidos para este experimento.\n\n")
            
            f.write("### Experimento 3: Adecuación del Contexto\n\n")
            if resultados_exp3 is not None and not resultados_exp3.empty and mejor_estrategia is not None:
                f.write(f"- **Mejor estrategia de recuperación**: {mejor_estrategia.get('retriever', 'N/A')}\n")
                f.write(f"- **Puntuación promedio**: {mejor_estrategia['promedio_metricas']:.4f}\n")
                
                if 'tiempo_promedio' in mejor_estrategia:
                    f.write(f"- **Tiempo promedio de respuesta**: {mejor_estrategia['tiempo_promedio']:.2f} segundos\n")
                
                f.write("\n")
                
                f.write("| Métrica | Puntuación |\n")
                f.write("|---------|------------|\n")
                metricas = ["faithfulness", "context_precision", "answer_relevancy"]
                for metrica in metricas:
                    if metrica in mejor_estrategia:
                        f.write(f"| {metrica} | {mejor_estrategia[metrica]:.4f} |\n")
                f.write("\n")
                
                f.write("#### Comparación de todas las estrategias de recuperación:\n\n")
                
                if 'retriever' in resultados_exp3.columns:
                    metricas_existentes = [m for m in metricas if m in resultados_exp3.columns]
                    
                    df_por_retriever = resultados_exp3.groupby('retriever').agg({
                        **{metrica: 'mean' for metrica in metricas_existentes},
                        'tiempo_promedio': 'mean' if 'tiempo_promedio' in resultados_exp3.columns else 'count'
                    }).reset_index()
                    
                    f.write("| Estrategia | Faithfulness | Context Precision | Answer Relevancy | Tiempo (s) |\n")
                    f.write("|------------|--------------|-------------------|------------------|------------|\n")
                    for _, row in df_por_retriever.iterrows():
                        f.write(f"| {row['retriever']} |")
                        for metrica in metricas:
                            if metrica in row:
                                f.write(f" {row[metrica]:.4f} |")
                            else:
                                f.write(" N/A |")
                        
                        if 'tiempo_promedio' in row:
                            f.write(f" {row['tiempo_promedio']:.2f} |\n")
                        else:
                            f.write(" N/A |\n")
                    f.write("\n")
            else:
                f.write("No se obtuvieron resultados válidos para este experimento.\n\n")
            
            # Conclusiones
            f.write("## Conclusiones\n\n")
            
            if mejor_config is not None:
                f.write("### Configuración óptima (Experimento 1)\n\n")
                f.write("Basado en el Experimento 1 realizado, la configuración óptima para el sistema RAG con Llama-3.1-8B es:\n\n")
                
                # Parámetros
                params = []
                if 'chunk_size' in mejor_config:
                    params.append(f"chunk_size={mejor_config['chunk_size']}")
                if 'top_k' in mejor_config:
                    params.append(f"top_k={mejor_config['top_k']}")
                if 'temperature' in mejor_config:
                    params.append(f"temperature={mejor_config['temperature']}")
                
                if params:
                    f.write(f"1. **Parámetros del modelo**: {', '.join(params)}\n")
                
                if 'tiempo_promedio' in mejor_config:
                    f.write(f"2. **Rendimiento**: Puntuación promedio de {mejor_config['promedio_metricas']:.4f} con tiempo de respuesta de {mejor_config['tiempo_promedio']:.2f} segundos\n\n")
                else:
                    f.write(f"2. **Rendimiento**: Puntuación promedio de {mejor_config['promedio_metricas']:.4f}\n\n")
                
                f.write("Esta configuración proporciona el mejor equilibrio entre precisión, relevancia y fidelidad en las respuestas generadas.\n\n")
            
            if mejor_estrategia is not None:
                f.write("### Estrategia de recuperación óptima (Experimento 3)\n\n")
                f.write(f"El Experimento 3 demuestra que la estrategia de recuperación '{mejor_estrategia.get('retriever', 'N/A')}' es la más efectiva:\n\n")
                f.write(f"1. **Puntuación promedio**: {mejor_estrategia['promedio_metricas']:.4f}\n")
                
                if 'tiempo_promedio' in mejor_estrategia:
                    f.write(f"2. **Tiempo de respuesta**: {mejor_estrategia['tiempo_promedio']:.2f} segundos\n\n")
                
                estrategia = mejor_estrategia.get('retriever', '').lower()
                if 'embeddings' in estrategia:
                    f.write("La recuperación basada en embeddings proporciona el contexto más relevante para las consultas, capturando mejor la semántica de las preguntas.\n\n")
                elif 'bm25' in estrategia:
                    f.write("La recuperación basada en BM25 ofrece los mejores resultados, lo que sugiere que la coincidencia léxica es particularmente efectiva para este dominio.\n\n")
                elif 'hibrido' in estrategia:
                    f.write("La estrategia híbrida que combina embeddings y BM25 proporciona los mejores resultados, aprovechando tanto la semántica como la coincidencia léxica.\n\n")
            
            f.write("## Conclusión General\n\n")
            
            if mejor_config is not None or mejor_estrategia is not None:
                f.write("Basado en los experimentos realizados, la configuración óptima para el sistema RAG con Llama-3.1-8B es:\n\n")
                
                if mejor_config is not None:
                    params = []
                    if 'chunk_size' in mejor_config:
                        params.append(f"chunk_size={mejor_config['chunk_size']}")
                    if 'top_k' in mejor_config:
                        params.append(f"top_k={mejor_config['top_k']}")
                    if 'temperature' in mejor_config:
                        params.append(f"temperature={mejor_config['temperature']}")
                    
                    if params:
                        f.write(f"1. **Parámetros del modelo**: {', '.join(params)}\n")
                
                if mejor_estrategia is not None:
                    f.write(f"2. **Estrategia de recuperación**: {mejor_estrategia.get('retriever', 'N/A')}\n\n")
                
                f.write("Esta configuración optimizada proporciona el mejor equilibrio entre precisión, relevancia y fidelidad en las respuestas generadas, con tiempos de respuesta razonables.\n\n")
            else:
                f.write("No se pudieron determinar configuraciones óptimas debido a problemas en la evaluación de los experimentos.\n\n")
            
            f.write("## Recomendaciones\n\n")
            f.write("1. **Implementar la configuración óptima**: Utilizar los parámetros y estrategias de recuperación identificados como óptimos.\n")
            f.write("2. **Evaluar con usuarios reales**: Realizar pruebas con usuarios reales para validar la calidad percibida de las respuestas.\n")
            f.write("3. **Monitoreo continuo**: Implementar un sistema de monitoreo para evaluar continuamente la calidad de las respuestas y detectar posibles degradaciones.\n")
            f.write("4. **Explorar mejoras adicionales**: Investigar técnicas avanzadas como reranking, expansión de consultas, o fine-tuning específico del dominio.\n")

        print(f"Informe final generado en {os.path.join(directorio_resultados, 'informe_final.md')}")
    except Exception as e:
        print(f"Error al generar el informe final: {e}")
        import traceback
        traceback.print_exc()

    try:
        if mejor_config is not None and mejor_estrategia is not None:
            metricas = ["faithfulness", "context_precision", "answer_relevancy"]
            categorias = ['Experimento 1: Mejor Config', 'Experimento 3: Mejor Estrategia']
            data = {
                'Categoría': [],
                'Métrica': [],
                'Puntuación': []
            }
            for metrica in metricas:
                if metrica in mejor_config:
                    data['Categoría'].append(categorias[0])
                    data['Métrica'].append(metrica)
                    data['Puntuación'].append(mejor_config[metrica])
                if metrica in mejor_estrategia:
                    data['Categoría'].append(categorias[1])
                    data['Métrica'].append(metrica)
                    data['Puntuación'].append(mejor_estrategia[metrica])
            
            df_comparacion = pd.DataFrame(data)
            plt.figure(figsize=(10, 6))
            sns.barplot(data=df_comparacion, x='Métrica', y='Puntuación', hue='Categoría', palette='muted')
            plt.title("Comparación de Métricas entre Experimentos 1 y 3")
            plt.ylim(0, 1)
            plt.tight_layout()
            plt.savefig(os.path.join(directorio_resultados, "comparacion_metricas_exp1_exp3.png"))
            plt.close()
            print(f"Gráfico combinado de Experimentos 1 y 3 generado en {directorio_resultados}/comparacion_metricas_exp1_exp3.png")
    except Exception as e:
        print(f"Error al generar gráfico combinado de Experimentos 1 y 3: {e}")

def main():

    print("="*80)
    print("ANÁLISIS DE RESULTADOS DE EXPERIMENTOS RAG CON LLAMA-3.1-8B")
    print("="*80)
    
    if len(sys.argv) > 1:
        dir_exp1 = sys.argv[1]
        dir_exp3 = sys.argv[2] if len(sys.argv) > 2 else None
        dir_informe = sys.argv[3] if len(sys.argv) > 3 else "resultados_experimentos"
    else:
        print("\nPor favor, ingresa los directorios de resultados de los experimentos:")
        dir_exp1 = input("Directorio de resultados del Experimento 1 (dejar vacío para omitir): ").strip()
        dir_exp3 = input("Directorio de resultados del Experimento 3 (dejar vacío para omitir): ").strip()
        dir_informe = input("Directorio para el informe final (dejar vacío para usar 'resultados_experimentos'): ").strip()
        
        if not dir_informe:
            dir_informe = "resultados_experimentos"
    
    resultados_exp1, mejor_config = None, None
    resultados_exp3, mejor_estrategia = None, None
    
    if dir_exp1:
        resultados_exp1, mejor_config = analizar_resultados_experimento1(dir_exp1)
    
    if dir_exp3:
        resultados_exp3, mejor_estrategia = analizar_resultados_experimento3(dir_exp3)
    
    generar_informe_final(
        resultados_exp1, mejor_config,
        resultados_exp3, mejor_estrategia,
        dir_informe
    )
    
    print("\n" + "="*80)
    print("ANÁLISIS COMPLETADO")
    print("="*80)
    print(f"Informe final generado en {os.path.join(dir_informe, 'informe_final.md')}")

if __name__ == "__main__":
    main()

