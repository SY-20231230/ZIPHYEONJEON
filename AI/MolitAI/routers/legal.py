from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from services.rag_service import LegalRAGService

router = APIRouter()

class AskRequest(BaseModel):
    query: str
    top_k: int = 3

from starlette.requests import Request

def get_rag_service(request: Request) -> LegalRAGService:
    return request.app.state.rag_service

@router.post("/ask")
async def ask_legal_question(req_data: AskRequest, service: LegalRAGService = Depends(get_rag_service)):
    if not req_data.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")
    
    try:
        result = await service.ask(req_data.query, top_k=req_data.top_k)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Legal AI Failed: {str(e)}")
