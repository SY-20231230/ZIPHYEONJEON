from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from services.molit_predictor import MolitPredictorService

router = APIRouter()

# Pydantic Schema for Input
class PredictionRequest(BaseModel):
    target_type: str # "sale" or "rent" (from the new requirement interface)
    horizon: str # "1m", "3m", "6m" etc, though old was targetMonth
    data: List[Dict[str, Any]] # The raw properties data corresponding to feature_cols

# [NEW] Java Legacy Compatibility Schema
class LegacyPredictionRequest(BaseModel):
    targetMonth: str  # "h1m", "h3m", "h6m"
    features: List[Dict[str, Any]]

# We need a way to access the service instance. It will be attached to app state.
from starlette.requests import Request

def get_predictor_service(request: Request) -> MolitPredictorService:
    return request.app.state.predictor_service

@router.post("/price")
def predict_price(req_data: PredictionRequest, service: MolitPredictorService = Depends(get_predictor_service)):
    deal_type = req_data.target_type
    target = req_data.horizon
    
    # Map horizon to old format if necessary (e.g. "1m" -> "h1m")
    if not target.startswith("h"):
        target = f"h{target}"
        
    try:
        predictions = service.predict(deal_type, target, req_data.data)
        
        # Returning only the first prediction for simplicity or the whole list as per requirement
        pred_value = predictions[0] if predictions else 0.0
        
        return {
            "predicted_price": pred_value,
            "unit": "KRW",
            "details": predictions # Optional, returning all if multiple
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction Failed: {str(e)}")

# [NEW] Legacy Endpoint for Sale (Java Compatibility)
@router.post("/sale")
def predict_sale(req_data: LegacyPredictionRequest, service: MolitPredictorService = Depends(get_predictor_service)):
    try:
        predictions = service.predict("sale", req_data.targetMonth, req_data.features)
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Legacy Sale Prediction Failed: {str(e)}")

# [NEW] Legacy Endpoint for Rent (Java Compatibility)
@router.post("/rent")
def predict_rent(req_data: LegacyPredictionRequest, service: MolitPredictorService = Depends(get_predictor_service)):
    try:
        predictions = service.predict("rent", req_data.targetMonth, req_data.features)
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Legacy Rent Prediction Failed: {str(e)}")
