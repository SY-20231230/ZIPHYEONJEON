import os
import json
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any

# FastAPI App
app = FastAPI(title="MolitAI Prediction Server")

# Global Variables to store loaded models and configs
models = {
    "sale": {},
    "rent": {}
}
feature_cols = []
cat_cols = []

# Load Configurations and Models on Startup
@app.on_event("startup")
def load_models_and_configs():
    global feature_cols, cat_cols
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Load feature columns
    fc_path = os.path.join(base_dir, "config", "feature_columns.json")
    if os.path.exists(fc_path):
        with open(fc_path, "r", encoding="utf-8") as f:
            feature_cols = json.load(f)
            
    # Load categorical columns
    cc_path = os.path.join(base_dir, "config", "categorical_columns.json")
    if os.path.exists(cc_path):
        with open(cc_path, "r", encoding="utf-8") as f:
            cat_cols = json.load(f)

    # Load Sale Models
    sale_dir = os.path.join(base_dir, "models", "sale")
    if os.path.exists(sale_dir):
        for model_file in os.listdir(sale_dir):
            if model_file.endswith(".pkl"):
                # e.g., sale_h1m.pkl -> h1m
                key = model_file.replace("sale_", "").replace(".pkl", "")
                models["sale"][key] = joblib.load(os.path.join(sale_dir, model_file))

    # Load Rent Models
    rent_dir = os.path.join(base_dir, "models", "rent")
    if os.path.exists(rent_dir):
        for model_file in os.listdir(rent_dir):
            if model_file.endswith(".pkl"):
                # e.g., rent_h1m.pkl -> h1m
                key = model_file.replace("rent_", "").replace(".pkl", "")
                models["rent"][key] = joblib.load(os.path.join(rent_dir, model_file))

    print(f"Loaded models - Sale: {list(models['sale'].keys())}, Rent: {list(models['rent'].keys())}")

# Pydantic Schema for Input
class PredictionRequest(BaseModel):
    targetMonth: str # "h1m", "h3m", "h6m"
    features: List[Dict[str, Any]] # The raw properties data corresponding to feature_cols

@app.post("/predict/{deal_type}")
def predict(deal_type: str, request: PredictionRequest):
    if deal_type not in ["sale", "rent"]:
        raise HTTPException(status_code=400, detail="deal_type must be 'sale' or 'rent'")
    
    target = request.targetMonth
    if target not in models[deal_type]:
        raise HTTPException(status_code=404, detail=f"Model for target '{target}' not found in '{deal_type}'. Available: {list(models[deal_type].keys())}")

    model = models[deal_type][target]
    
    try:
        # Convert Request to DataFrame
        df = pd.DataFrame(request.features)
        
        # NOTE: Ideally `preprocessing.py` logic should be applied here 
        # For simplicity, assuming the Spring Boot backend or frontend provides pre-aligned features
        
        # 1. Feature column alignment
        missing_cols = [col for col in feature_cols if col not in df.columns]
        for col in missing_cols:
            df[col] = 0.0 # Append missing columns safely
            
        df = df[feature_cols] # Enforce column order

        # 2. Categorical Casting
        for c in cat_cols:
            if c in df.columns:
                df[c] = df[c].astype("category")

        # 3. Predict Response
        pred_log = model.predict(df)
        pred_actual = np.expm1(pred_log) # Reverse of log1p
        
        return {
            "deal_type": deal_type,
            "target_month": target,
            "predictions": pred_actual.tolist()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction Failed: {str(e)}")

# Health Check Route
@app.get("/health")
def health():
    return {"status": "up"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
