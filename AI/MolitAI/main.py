import os
import httpx
import uvicorn
from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

from routers import predict, legal
from services.molit_predictor import MolitPredictorService
from services.rag_service import LegalRAGService

# Setup lifecycle manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Initialize Predictor Service
    print("Initializing MolitPredictorService...")
    app.state.predictor_service = MolitPredictorService(base_dir=base_dir)
    
    # Initialize RAG Service
    print("Initializing LegalRAGService...")
    app.state.rag_service = LegalRAGService(base_dir=base_dir)
    app.state.rag_service.initialize()
    
    # Ollama Health Check
    print("Checking Ollama availability...")
    try:
        ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{ollama_base_url}/api/tags")
            if resp.status_code == 200:
                print("✅ Ollama is running and available.")
            else:
                print(f"⚠️ Ollama returned unexpected status code: {resp.status_code}")
    except Exception as e:
        print(f"Failed to connect to Ollama API: {e}")
        # Not stopping the server, but warning heavily. 
        # In strict environments, we could raise an Exception here.

    yield
    
    # Cleanup on shutdown (if any)
    print("Shutting down AI Services...")

# FastAPI App
app = FastAPI(
    title="ZIPAI-Integrated-Service",
    description="Integrated AI Microservice for ZIPHYEONJEON (MolitAI + LegalAI)",
    lifespan=lifespan
)

# Mount Routers
app.include_router(predict.router, prefix="/predict", tags=["Prediction"])
app.include_router(legal.router, prefix="/api/v1/legal", tags=["LegalQA"])

# Health Check Route
@app.get("/health")
def health():
    return {"status": "up", "service": "ZIPAI-Integrated-Service"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
