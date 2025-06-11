from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, Settings
from llama_index.core.node_parser import SentenceSplitter


class Retriever:
    def __init__(self, input_dir, embed_model_path, chunk_size=256, top_k=3):

        self.input_dir = input_dir
        self.chunk_size = chunk_size
        self.top_k = top_k        
        self.embed_model = HuggingFaceEmbedding(model_name=embed_model_path)
        self.node_parser = SentenceSplitter(
            chunk_size=chunk_size,
            chunk_overlap=20  
        )
        
        Settings.embed_model = self.embed_model
        Settings.node_parser = self.node_parser
        
        documents = SimpleDirectoryReader(input_dir=input_dir).load_data()
        print(f"Loaded {len(documents)} translated documents for indexing.")
        
        self.index = VectorStoreIndex.from_documents(
            documents, 
            embed_model=self.embed_model,
            node_parser=self.node_parser
        )
        
        self.query_retriever = self.index.as_retriever(similarity_top_k=self.top_k)

    def retrieve(self, query: str, max_chunks: int = None):
        if max_chunks is None:
            max_chunks = self.top_k
            
        print(f"Executing query: {query}")
        print(f"Using top_k: {min(max_chunks, self.top_k)}")
        
        try:
            retrieved_chunks = self.query_retriever.retrieve(query)
            
            if max_chunks < len(retrieved_chunks):
                retrieved_chunks = retrieved_chunks[:max_chunks]
                
            print(f"Retrieved {len(retrieved_chunks)} chunks with chunk_size={self.chunk_size}")
            return retrieved_chunks
        except Exception as e:
            print(f"Retrieval error: {e}")
            return []