from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x: float = Field(..., description="Normalized or pixel X coordinate (top-left)")
    y: float = Field(..., description="Normalized or pixel Y coordinate (top-left)")
    width: float = Field(..., description="Box width")
    height: float = Field(..., description="Box height")
    label: str = Field(..., description="Defect class (Scratch, Crack, Dent, Discoloration)")
    confidence: float = Field(..., description="Detection confidence score 0.0 - 1.0")

class MaintenanceAdvisory(BaseModel):
    advisory_id: str
    machine_id: str
    probable_component: str
    root_cause_reasoning: str
    recommended_action: str
    priority: str  # "LOW", "MEDIUM", "HIGH", "CRITICAL"
    estimated_urgency: str
    created_at: str

class RootCauseInfo(BaseModel):
    defect_type: str
    confidence: float
    location_pattern: str
    severity: str
    probable_component: str
    reasoning: str

class InspectionItem(BaseModel):
    id: str
    part_id: str
    timestamp: str
    machine_id: str
    defect_type: Optional[str] = None
    confidence: float
    result: str  # "PASS", "FAIL", "REVIEW"
    boxes: List[BoundingBox] = []
    clahe_applied: bool = True
    processing_time_ms: float
    original_image_url: Optional[str] = None
    processed_image_url: Optional[str] = None
    root_cause: Optional[RootCauseInfo] = None
    maintenance: Optional[MaintenanceAdvisory] = None
    review_status: Optional[str] = None  # "PENDING", "CONFIRMED", "REJECTED", "ESCALATED"

class PreprocessRequest(BaseModel):
    image_base64: Optional[str] = None
    sample_id: Optional[str] = None
    clip_limit: float = 2.5
    tile_grid_size: int = 8

class PreprocessResponse(BaseModel):
    processed_image_base64: str
    processing_time_ms: float
    clip_limit: float
    tile_grid_size: int

class AnalyzeRequest(BaseModel):
    sample_id: Optional[str] = None
    image_base64: Optional[str] = None
    machine_id: str = "Machine 01"
    apply_clahe: bool = True
    clip_limit: float = 2.5
    tile_grid_size: int = 8

class RCARequest(BaseModel):
    defect_type: str
    confidence: float
    machine_id: str
    location_pattern: Optional[str] = None
    severity: Optional[str] = None

class RCAResponse(BaseModel):
    advisory_id: str
    defect_type: str
    machine_id: str
    probable_component: str
    root_cause_reasoning: str
    recommended_action: str
    priority: str
    estimated_urgency: str
    timestamp: str

class ReviewActionRequest(BaseModel):
    inspection_id: str
    action: str  # "confirm", "reject", "escalate"
    notes: Optional[str] = ""

class MachineHealth(BaseModel):
    machine_id: str
    name: str
    status: str  # "OPERATIONAL", "WARNING", "DEGRADED", "OFFLINE"
    health_score: int
    defect_frequency: str
    last_detected_issue: str
    recommended_maintenance: str
    priority: str

class AnalyticsSummary(BaseModel):
    total_inspections: int
    pass_count: int
    fail_count: int
    review_count: int
    pass_rate: float
    defects_detected: int
    avg_detection_time_ms: float
    active_machines: int
    defect_distribution: Dict[str, int]
    defect_percentages: Dict[str, float]
    defects_by_machine: Dict[str, Dict[str, int]]
    recent_trend: List[Dict[str, Any]]
    targets: Dict[str, str] = {
        "detection_accuracy": "95%+",
        "target_latency": "<50ms",
        "downtime_reduction": "80%",
        "label": "Prototype Target"
    }
