import os
import json
import joblib
import pandas as pd
import numpy as np
from typing import List, Dict, Any

class MolitPredictorService:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.models = {
            "sale": {},
            "rent": {}
        }
        self.feature_cols = []
        self.cat_cols = []
        self._load_configs_and_models()

    def _load_configs_and_models(self):
        # Load feature columns
        fc_path = os.path.join(self.base_dir, "config", "feature_columns.json")
        if os.path.exists(fc_path):
            with open(fc_path, "r", encoding="utf-8") as f:
                self.feature_cols = json.load(f)
                
        # Load categorical columns
        cc_path = os.path.join(self.base_dir, "config", "categorical_columns.json")
        if os.path.exists(cc_path):
            with open(cc_path, "r", encoding="utf-8") as f:
                self.cat_cols = json.load(f)

        # Load Sale Models
        sale_dir = os.path.join(self.base_dir, "models", "sale")
        if os.path.exists(sale_dir):
            for model_file in os.listdir(sale_dir):
                if model_file.endswith(".pkl"):
                    key = model_file.replace("sale_", "").replace(".pkl", "")
                    self.models["sale"][key] = joblib.load(os.path.join(sale_dir, model_file))

        # Load Rent Models
        rent_dir = os.path.join(self.base_dir, "models", "rent")
        if os.path.exists(rent_dir):
            for model_file in os.listdir(rent_dir):
                if model_file.endswith(".pkl"):
                    key = model_file.replace("rent_", "").replace(".pkl", "")
                    self.models["rent"][key] = joblib.load(os.path.join(rent_dir, model_file))

        print(f"Loaded predictor models - Sale: {list(self.models['sale'].keys())}, Rent: {list(self.models['rent'].keys())}")

    def predict(self, deal_type: str, target_month: str, features: List[Dict[str, Any]]):
        if deal_type not in ["sale", "rent"]:
            raise ValueError("deal_type must be 'sale' or 'rent'")
        
        if target_month not in self.models[deal_type]:
            raise ValueError(f"Model for target '{target_month}' not found in '{deal_type}'. Available: {list(self.models[deal_type].keys())}")

        model = self.models[deal_type][target_month]
        
        df = pd.DataFrame(features)
        
        # 1. Feature column alignment
        missing_cols = [col for col in self.feature_cols if col not in df.columns]
        for col in missing_cols:
            df[col] = 0.0
            
        df = df[self.feature_cols]

        # 2. Categorical Casting
        for c in self.cat_cols:
            if c in df.columns:
                df[c] = df[c].astype("category")

        # 3. Predict Response
        pred_log = model.predict(df)
        pred_actual = np.expm1(pred_log)
        
        return pred_actual.tolist()
