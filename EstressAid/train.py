import os
import PyPDF2
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

translation_model_name = "./modelos/opus-mt-en-es"
translation_tokenizer = AutoTokenizer.from_pretrained(translation_model_name)
translation_model = AutoModelForSeq2SeqLM.from_pretrained(
    translation_model_name,
    device_map="auto" )

def translate_text(chunks, batch_size=8): 
  
    translations = []
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        inputs = translation_tokenizer(
            batch, 
            return_tensors="pt", 
            padding=True, 
            truncation=True, 
            max_length=512
        ).to(translation_model.device)
        
        with torch.no_grad():
            outputs = translation_model.generate(
                **inputs,
                max_length=512,
                num_beams=2,  
                length_penalty=0.6
            )
        
        decoded = translation_tokenizer.batch_decode(outputs, skip_special_tokens=True)
        translations.extend(decoded)
    return translations

def extract_text_from_pdf(pdf_path):
   
    print(f"Processing PDF: {pdf_path}")
    output_dir = "./datos/translations"
    os.makedirs(output_dir, exist_ok=True)
    
    with open(pdf_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        text_chunks = []
        
        for page in reader.pages:
            page_text = page.extract_text()
            chunks = [page_text[i:i+400] for i in range(0, len(page_text), 400)]
            text_chunks.extend(chunks)
        
        translated_chunks = translate_text(text_chunks)
        translated_text = " ".join(translated_chunks)
        
        output_file = os.path.join(
            output_dir, 
            f"{os.path.splitext(os.path.basename(pdf_path))[0]}_translated.txt"
        )
        
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(translated_text)
        
        return translated_text

def clean_text(text):
    text = text.replace('\f', ' ').replace('\r', ' ')    
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    cleaned_lines = [
        line for line in lines
        if (len(line) > 20 
            and not line.strip().isdigit()
            and not any(header in line.lower() 
                       for header in ['índice', 'bibliografía', 'contenido', 'capítulo'])
            and not line.lower().startswith(('fig.', 'tabla')))
    ]
    
    text = ' '.join(cleaned_lines)
    paragraphs = []
    current_para = []
    
    for sentence in text.split('. '):
        current_para.append(sentence.strip())
        if len('. '.join(current_para)) > 200:
            paragraphs.append('. '.join(current_para) + '.')
            current_para = []
    
    if current_para:
        paragraphs.append('. '.join(current_para) + '.')
    
    return '\n\n'.join(paragraphs)

def process_pdf_directory(pdf_directory):
    for pdf_file in os.listdir(pdf_directory):
        if pdf_file.endswith(".pdf"):
            pdf_path = os.path.join(pdf_directory, pdf_file)
            raw_text = extract_text_from_pdf(pdf_path)
            cleaned_text = clean_text(raw_text)
            print(f"Processed {pdf_file} → {len(cleaned_text)} characters")

if __name__ == "__main__":
    process_pdf_directory("./datos")