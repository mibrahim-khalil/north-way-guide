from fastapi import FastAPI # type: ignore
from pydantic import BaseModel, Field
from joblib import load # type: ignore
import pandas as pd # type: ignore
import os


# Fast Api 
app = FastAPI(title="NWG Trip Planner ML Service V2")


# Loads ML Model
MODEL_PATH = os.environ.get("MODEL_PATH", "model.joblib")
pipe = load(MODEL_PATH)


class PredictIn(BaseModel):  # defines what dataa frontend send
    budget_total: int = Field(..., ge=0)  # numm field (budge>0)
    days: int = Field(..., ge=1, le=21)
    travelers: int = Field(..., ge=1, le=20)
    month: int = Field(..., ge=1, le=12)

    travel_mode: str          # ROAD | AIR
    road_option: str          # KKH | BABUSAR | NONE

    primary_circuit: str      # SKARDU_SIDE | HUNZA_SIDE
    transport_type: str       # PUBLIC | OWN
    scope: str                # SINGLE | LOOP

    bppd: float = Field(..., ge=0)
    tier: str                 # BUDGET | MID | LUX
    pace: str                 # FAST | NORMAL | RELAXED

class PredictOut(BaseModel):
    planId: str  # predict output

@app.get("/health")
def health():
    return {"ok": True, "modelPath": MODEL_PATH}

@app.post("/predict", response_model=PredictOut)
def predict(inp: PredictIn):
    df = pd.DataFrame([inp.model_dump()])
    pred = pipe.predict(df)[0]
    return {"planId": str(pred)}