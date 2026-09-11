import os
import io
import uuid
import base64
import random
from datetime import datetime
from typing import Optional, List, Dict, Any

import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from .models import (
    InspectionItem, PreprocessRequest, PreprocessResponse,
    AnalyzeRequest, RCARequest, RCAResponse, ReviewActionRequest,
    AnalyticsSummary, MachineHealth
)
from .database import (
    init_db, save_inspection, get_inspections,
    get_review_queue, update_review, get_machines_list,
    reset_and_seed_db
)
from .services.preprocessing import preprocessor
from .services.detector import detector
from .services.rca_engine import rca_engine
from .services.analytics import compute_analytics
from .samples.generator import generate_sample_images, SAMPLES_DIR

app = FastAPI(
    title="PRIVISA – EdgeDefect AI",
    description="Intelligent Industrial Surface Inspection and Automated Root-Cause Analysis API",
    version="1.0.0"
)

# Enable CORS for local Vite development and cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure sample images directory exists and generate default synthetic parts
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.on_event("startup")
def startup_event():
    init_db()
    try:
        generate_sample_images()
    except Exception as e:
        print(f"Warning: sample image generation error: {e}")

@app.get("/api/health")
def health_check():
    """System health check and edge inspection engine status."""
    return {
        "status": "healthy",
        "service": "PRIVISA – EdgeDefect AI",
        "version": "1.0.0",
        "engine": "OpenCV CLAHE + EdgeDefect Modular Detector",
        "simulation_mode": True,
        "database": "SQLite (Connected)",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/api/samples")
def get_sample_catalog():
    """Returns library of synthetic industrial parts ready for 1-click inspection."""
    samples = [
        {
            "id": "sample_scratch_1",
            "name": "Conveyor Defect – Roller Scratch",
            "defect_type": "Scratch",
            "material": "Brushed Structural Steel",
            "machine_id": "Machine 04",
            "lighting_condition": "Uneven Specular Glare",
            "expected_result": "FAIL",
            "image_url": "/static/samples/sample_scratch_1.jpg",
            "clahe_url": "/static/samples/sample_scratch_1_clahe.jpg",
            "description": "Continuous score mark caused by seized Conveyor Roller #2."
        },
        {
            "id": "sample_crack_1",
            "name": "Press Defect – Radial Stress Crack",
            "defect_type": "Crack",
            "material": "High-Tensile Stamped Alloy",
            "machine_id": "Machine 01",
            "lighting_condition": "Deep Shadow Vignette",
            "expected_result": "FAIL",
            "image_url": "/static/samples/sample_crack_1.jpg",
            "clahe_url": "/static/samples/sample_crack_1_clahe.jpg",
            "description": "Jagged stress fracture originating near mounting hole flange."
        },
        {
            "id": "sample_dent_1",
            "name": "Impact Defect – Clamp Indentation",
            "defect_type": "Dent",
            "material": "Anodized Aerospace 6061",
            "machine_id": "Machine 03",
            "lighting_condition": "Directional Side Lighting",
            "expected_result": "FAIL",
            "image_url": "/static/samples/sample_dent_1.jpg",
            "clahe_url": "/static/samples/sample_dent_1_clahe.jpg",
            "description": "Circular concave deformation from gripper over-pressurization."
        },
        {
            "id": "sample_discolor_1",
            "name": "Thermal Defect – Oxidation Burn",
            "defect_type": "Discoloration",
            "material": "Induction Annealed Plate",
            "machine_id": "Machine 02",
            "lighting_condition": "Harsh Overhead Beam",
            "expected_result": "FAIL",
            "image_url": "/static/samples/sample_discolor_1.jpg",
            "clahe_url": "/static/samples/sample_discolor_1_clahe.jpg",
            "description": "Thermal bloom temper gradient from heating coil thermocouple drift."
        },
        {
            "id": "sample_scratch_review",
            "name": "Borderline Scratch (Review Queue)",
            "defect_type": "Scratch",
            "material": "Extruded Aluminum Stock",
            "machine_id": "Machine 04",
            "lighting_condition": "Ambient Low Contrast",
            "expected_result": "REVIEW",
            "image_url": "/static/samples/sample_scratch_review.jpg",
            "clahe_url": "/static/samples/sample_scratch_review_clahe.jpg",
            "description": "Subtle surface abrasion near 68% confidence boundary."
        },
        {
            "id": "sample_clean_1",
            "name": "Nominal Part – Flawless Stainless",
            "defect_type": None,
            "material": "316L Stainless Steel",
            "machine_id": "Machine 01",
            "lighting_condition": "Low-Light Shadow Gradient",
            "expected_result": "PASS",
            "image_url": "/static/samples/sample_clean_1.jpg",
            "clahe_url": "/static/samples/sample_clean_1_clahe.jpg",
            "description": "Pristine machined surface conforming to ±0.02mm industrial tolerance."
        },
        {
            "id": "sample_clean_2",
            "name": "Nominal Part – Lathe Lathed Disc",
            "defect_type": None,
            "material": "Precision Turned 7075 Disc",
            "machine_id": "Machine 03",
            "lighting_condition": "High Contrast Ring Glare",
            "expected_result": "PASS",
            "image_url": "/static/samples/sample_clean_2.jpg",
            "clahe_url": "/static/samples/sample_clean_2_clahe.jpg",
            "description": "Concentric milling pattern with zero anomalous defects."
        }
    ]
    return samples

@app.post("/api/preprocess", response_model=PreprocessResponse)
def preprocess_image(req: PreprocessRequest):
    """
    Applies OpenCV CLAHE illumination normalization to an image.
    Supports base64 image or sample_id.
    """
    try:
        if req.sample_id:
            sample_path = os.path.join(SAMPLES_DIR, f"{req.sample_id}.jpg")
            if not os.path.exists(sample_path):
                raise HTTPException(status_code=404, detail="Sample part not found")
            img_bgr = cv2.imread(sample_path)
        elif req.image_base64:
            img_bgr = preprocessor.b64_to_bgr(req.image_base64)
        else:
            raise HTTPException(status_code=400, detail="Must provide image_base64 or sample_id")

        tile_size = (req.tile_grid_size, req.tile_grid_size)
        enhanced_bgr, elapsed_ms = preprocessor.process(
            img_bgr,
            clip_limit=req.clip_limit,
            tile_grid_size=tile_size
        )

        b64_out = preprocessor.bgr_to_b64(enhanced_bgr)
        return PreprocessResponse(
            processed_image_base64=b64_out,
            processing_time_ms=elapsed_ms,
            clip_limit=req.clip_limit,
            tile_grid_size=req.tile_grid_size
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(e)}")

@app.post("/api/analyze")
async def analyze_part(
    file: Optional[UploadFile] = File(None),
    sample_id: Optional[str] = Form(None),
    machine_id: str = Form("Machine 01"),
    apply_clahe: bool = Form(True),
    clip_limit: float = Form(2.5),
    tile_grid_size: int = Form(8)
):
    """
    Comprehensive pipeline:
    1. Ingest image (file upload or sample_id)
    2. OpenCV CLAHE lighting normalization
    3. Defect detection and classification (Scratch, Crack, Dent, Discoloration)
    4. Bounding box computation & confidence scoring
    5. PASS/FAIL/REVIEW decision logic
    6. Automated Root-Cause Analysis (RCA) and Maintenance Advisory generation
    """
    try:
        sample_meta = {}
        if file is not None and file.filename:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img_bgr is None:
                raise HTTPException(status_code=400, detail="Invalid image file format")
            part_id = f"PRV-UPL-{uuid.uuid4().hex[:6].upper()}"
            img_url = None
        elif sample_id:
            sample_path = os.path.join(SAMPLES_DIR, f"{sample_id}.jpg")
            if not os.path.exists(sample_path):
                # Fallback to general sample
                sample_path = os.path.join(SAMPLES_DIR, "sample_scratch_1.jpg")
            img_bgr = cv2.imread(sample_path)
            part_id = f"PRV-{sample_id.replace('sample_', '').upper()[:8]}"
            img_url = f"/static/samples/{sample_id}.jpg"
            
            # Extract expected metadata from sample name
            if "scratch" in sample_id:
                sample_meta["defect_type"] = "Scratch"
                if "review" in sample_id:
                    sample_meta["confidence"] = 0.685
                else:
                    sample_meta["confidence"] = 0.942
            elif "crack" in sample_id:
                sample_meta["defect_type"] = "Crack"
                if "review" in sample_id:
                    sample_meta["confidence"] = 0.715
                else:
                    sample_meta["confidence"] = 0.958
            elif "dent" in sample_id:
                sample_meta["defect_type"] = "Dent"
                if "review" in sample_id:
                    sample_meta["confidence"] = 0.735
                else:
                    sample_meta["confidence"] = 0.912
            elif "discolor" in sample_id:
                sample_meta["defect_type"] = "Discoloration"
                if "review" in sample_id:
                    sample_meta["confidence"] = 0.645
                else:
                    sample_meta["confidence"] = 0.895
            elif "clean" in sample_id:
                sample_meta["is_clean"] = True
        else:
            raise HTTPException(status_code=400, detail="Must provide an uploaded image file or a sample_id")

        # 1. CLAHE Normalization
        preproc_ms = 0.0
        if apply_clahe:
            enhanced_bgr, preproc_ms = preprocessor.process(
                img_bgr,
                clip_limit=clip_limit,
                tile_grid_size=(tile_grid_size, tile_grid_size)
            )
            inspect_target = enhanced_bgr
        else:
            enhanced_bgr = img_bgr
            inspect_target = img_bgr

        # 2. Defect Detection
        detection = detector.detect(inspect_target, metadata=sample_meta)

        # Total processing latency (CLAHE + Detector)
        total_time_ms = round(preproc_ms + detection["inference_time_ms"], 1)

        # 3. Root Cause Analysis (if defect detected or borderline)
        rca_res = None
        root_cause_info = None
        maintenance_advisory = None

        if detection["defect_type"] and detection["result"] in ["FAIL", "REVIEW"]:
            rca_res = rca_engine.analyze(
                defect_type=detection["defect_type"],
                confidence=detection["confidence"],
                machine_id=machine_id,
                location_pattern=detection.get("location_pattern")
            )
            root_cause_info = {
                "defect_type": rca_res.defect_type,
                "confidence": detection["confidence"],
                "location_pattern": detection.get("location_pattern", "Conveyor longitudinal axis"),
                "severity": rca_res.priority,
                "probable_component": rca_res.probable_component,
                "reasoning": rca_res.root_cause_reasoning
            }
            maintenance_advisory = {
                "advisory_id": rca_res.advisory_id,
                "machine_id": rca_res.machine_id,
                "probable_component": rca_res.probable_component,
                "root_cause_reasoning": rca_res.root_cause_reasoning,
                "recommended_action": rca_res.recommended_action,
                "priority": rca_res.priority,
                "estimated_urgency": rca_res.estimated_urgency,
                "created_at": rca_res.timestamp
            }

        # Encode both original and CLAHE images to base64 for direct side-by-side comparison
        orig_b64 = preprocessor.bgr_to_b64(img_bgr)
        clahe_b64 = preprocessor.bgr_to_b64(enhanced_bgr)

        response_payload = {
            "part_id": part_id,
            "timestamp": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "machine_id": machine_id,
            "defect_type": detection["defect_type"],
            "confidence": detection["confidence"],
            "result": detection["result"],
            "boxes": [b.dict() if hasattr(b, 'dict') else b for b in detection["boxes"]],
            "clahe_applied": apply_clahe,
            "preprocessing_time_ms": preproc_ms,
            "inference_time_ms": detection["inference_time_ms"],
            "total_processing_time_ms": total_time_ms,
            "original_image_base64": orig_b64,
            "processed_image_base64": clahe_b64,
            "image_url": img_url,
            "location_pattern": detection.get("location_pattern"),
            "root_cause": root_cause_info,
            "maintenance": maintenance_advisory
        }

        return response_payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inspection pipeline error: {str(e)}")

@app.post("/api/inspect")
async def inspect_and_record(
    sample_id: Optional[str] = Form(None),
    machine_id: str = Form("Machine 04"),
    apply_clahe: bool = Form(True),
    clip_limit: float = Form(2.5),
    tile_grid_size: int = Form(8)
):
    """
    Executes live inspection on conveyor part and automatically records it into the SQLite database.
    Used by the Live Inspection conveyor simulation screen.
    """
    try:
        # If no sample_id provided, pick from random conveyor simulation pool
        if not sample_id:
            choices = ["sample_scratch_1", "sample_clean_1", "sample_crack_1", "sample_clean_2", "sample_dent_1", "sample_discolor_1", "sample_scratch_review"]
            sample_id = random.choice(choices)

        # Run analysis
        analysis = await analyze_part(
            file=None,
            sample_id=sample_id,
            machine_id=machine_id,
            apply_clahe=apply_clahe,
            clip_limit=clip_limit,
            tile_grid_size=tile_grid_size
        )

        # Save to database
        inspection_record = {
            "part_id": analysis["part_id"],
            "timestamp": analysis["timestamp"],
            "machine_id": analysis["machine_id"],
            "defect_type": analysis["defect_type"],
            "confidence": analysis["confidence"],
            "result": analysis["result"],
            "boxes": analysis["boxes"],
            "clahe_applied": analysis["clahe_applied"],
            "processing_time_ms": analysis["total_processing_time_ms"],
            "root_cause": analysis["root_cause"],
            "maintenance": analysis["maintenance"],
            "image_url": f"/static/samples/{sample_id}.jpg",
            "processed_image_url": f"/static/samples/{sample_id}_clahe.jpg",
            "review_status": "PENDING" if analysis["result"] == "REVIEW" else None
        }

        saved_id = save_inspection(inspection_record)
        analysis["id"] = saved_id

        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Live inspection error: {str(e)}")

@app.post("/api/root-cause", response_model=RCAResponse)
def generate_root_cause(req: RCARequest):
    """Generates Root Cause Analysis and Maintenance Advisory."""
    try:
        return rca_engine.analyze(
            defect_type=req.defect_type,
            confidence=req.confidence,
            machine_id=req.machine_id,
            location_pattern=req.location_pattern,
            severity=req.severity
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RCA generation error: {str(e)}")

@app.get("/api/inspections")
def list_inspections(
    limit: int = Query(50, ge=1, le=200),
    machine_id: Optional[str] = None,
    result: Optional[str] = None
):
    """Retrieves recent inspection history from SQLite."""
    return get_inspections(limit=limit, machine_id=machine_id, result=result)

@app.get("/api/review-queue")
def list_review_queue():
    """
    Returns items requiring operator review (confidence between 50% and 80% or flagged REVIEW).
    """
    return get_review_queue()

@app.post("/api/review")
def process_review_action(req: ReviewActionRequest):
    """
    Records operator signoff action ('confirm', 'reject', 'escalate') on a borderline prediction.
    """
    success = update_review(
        inspection_id=req.inspection_id,
        action=req.action,
        notes=req.notes or ""
    )
    if not success:
        raise HTTPException(status_code=404, detail="Inspection record not found or update failed")
    return {
        "status": "success",
        "inspection_id": req.inspection_id,
        "action": req.action,
        "message": f"Inspection review status updated to {req.action.upper()}"
    }

@app.get("/api/machines")
def get_machines():
    """Returns factory floor machine statuses and maintenance metrics."""
    return get_machines_list()

@app.get("/api/analytics", response_model=AnalyticsSummary)
def get_analytics():
    """Returns aggregated KPIs, defect rates, machine health, and prototype targets."""
    return compute_analytics()

@app.post("/api/seed")
def reseed_database():
    """Resets and reseeds the SQLite database with 25+ realistic demo records."""
    reset_and_seed_db()
    return {"status": "success", "message": "Database reseeded with 25+ realistic inspection records"}
