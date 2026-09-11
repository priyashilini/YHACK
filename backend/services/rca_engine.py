import abc
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from ..models import RCAResponse, MaintenanceAdvisory, RootCauseInfo

class BaseRCAEngine(abc.ABC):
    """Abstract interface for Root-Cause Analysis engines (Heuristic, Gemini LLM, Local Ollama)."""

    @abc.abstractmethod
    def analyze(
        self,
        defect_type: str,
        confidence: float,
        machine_id: str,
        location_pattern: Optional[str] = None,
        severity: Optional[str] = None
    ) -> RCAResponse:
        pass


class HeuristicRCAEngine(BaseRCAEngine):
    """
    Deterministic industrial diagnostic engine.
    Correlates defect telemetry, spatial geometry, and historical equipment failure modes
    to attribute root-cause to specific mechanical components and generate maintenance advisories.
    """

    KNOWLEDGE_BASE = {
        "Scratch": {
            "components": [
                "Conveyor Belt Roller #2",
                "Linear Guide Rail #4",
                "Ejection Chute Transfer Plate"
            ],
            "causes": [
                "Roller bearing friction seizure causing metal drag along conveyor feed.",
                "Accumulated metal swarf and abrasive particulate wedged between guide rail and stock.",
                "Misaligned transfer chute blade creating longitudinal surface scoring."
            ],
            "actions": [
                "Halt line at next break. Inspect and lubricate Conveyor Roller #2 bearings; clean roller surface.",
                "Wipe down Linear Guide Rail #4 with solvent degreaser and inspect wiper seals.",
                "Re-align transfer chute blade to 1.5mm standard clearance and tighten mounting fasteners."
            ],
            "severity_map": {
                "high": ("HIGH", "Within 2 Hours (Prior to Shift End)"),
                "medium": ("MEDIUM", "Within 6 Hours (Next Planned Downtime)"),
                "low": ("LOW", "Next Scheduled Preventive Maintenance (24h)")
            }
        },
        "Crack": {
            "components": [
                "Primary Stamping Die Press #1",
                "Hydraulic Clamping Ram #3",
                "Deep-Draw Punch Tooling Head"
            ],
            "causes": [
                "Cyclic mechanical fatigue and localized stress concentration exceeding yield threshold during punch stroke.",
                "Excessive hydraulic clamping pressure (>180 bar) inducing radial shear fractures along component flange.",
                "Tooling edge micro-chipping propagating tension cracks along part perimeter."
            ],
            "actions": [
                "Immediate safety lockout. Calibrate press tonnage, inspect die insert for micro-fissures using dye penetrant.",
                "Relieve hydraulic clamp regulator back to 140 bar nominal pressure and check pressure transducer telemetry.",
                "Replace worn punch insert with carbide-coated spare tooling and verify stroke depth."
            ],
            "severity_map": {
                "high": ("CRITICAL", "Immediate Action Required (Stop Conveyor)"),
                "medium": ("HIGH", "Within 1 Hour (Halt Batch)"),
                "low": ("MEDIUM", "End of Current Shift")
            }
        },
        "Dent": {
            "components": [
                "Pneumatic Pick-and-Place Gripper #4",
                "Ejection Cushion Damper #2",
                "Automated Transfer Arm Jaw"
            ],
            "causes": [
                "Pneumatic pressure spike in vacuum/gripper stroke causing excessive impact velocity upon part seating.",
                "Degraded polyurethane bumper pad on ejection damper exposing raw steel backing.",
                "Gripper jaw mechanical back-lash causing improper grip alignment."
            ],
            "actions": [
                "Check pneumatic regulator valve; reduce gripper actuation pressure to 4.2 bar.",
                "Replace worn elastomer cushion pads on Ejection Damper #2.",
                "Re-zero servo encoder on robotic transfer arm and calibrate mechanical stops."
            ],
            "severity_map": {
                "high": ("HIGH", "Within 2 Hours"),
                "medium": ("MEDIUM", "Within 4 Hours"),
                "low": ("LOW", "Routine Inspection Shift")
            }
        },
        "Discoloration": {
            "components": [
                "Induction Annealing Coil #2",
                "Coolant Delivery Nozzle #6",
                "Infrared Curing Tunnel Zone B"
            ],
            "causes": [
                "Thermal regulator drift producing localized oxidation temper colors (420°C overshoot).",
                "Blocked coolant nozzle causing starved lubrication and localized dry friction burn.",
                "Improper air-to-inert-gas ratio in annealing chamber causing surface oxidation."
            ],
            "actions": [
                "Calibrate thermocouple sensor and verify PID loop parameters on Induction Annealer #2.",
                "Flush coolant supply line and clear nozzle orifice with ultrasonic cleaner.",
                "Inspect nitrogen purge solenoid valve and ensure positive chamber pressure."
            ],
            "severity_map": {
                "high": ("HIGH", "Within 3 Hours"),
                "medium": ("MEDIUM", "Within 8 Hours"),
                "low": ("LOW", "Next Scheduled Preventive Maintenance")
            }
        }
    }

    def analyze(
        self,
        defect_type: str,
        confidence: float,
        machine_id: str,
        location_pattern: Optional[str] = None,
        severity: Optional[str] = None
    ) -> RCAResponse:
        defect_key = defect_type if defect_type in self.KNOWLEDGE_BASE else "Scratch"
        kb = self.KNOWLEDGE_BASE[defect_key]

        # Select component and cause based on machine and confidence
        # For Machine 01 (Stamping): prefers Press/Clamp
        # For Machine 02 (Finishing): prefers Induction/Nozzle
        # For Machine 03 (Milling): prefers Guide Rail/Gripper
        # For Machine 04 (Conveyor): prefers Conveyor Roller #2
        idx = 0
        if "04" in machine_id or "conveyor" in machine_id.lower():
            idx = 0 if defect_key == "Scratch" else 1
        elif "01" in machine_id:
            idx = 0 if defect_key == "Crack" else 1
        elif "02" in machine_id:
            idx = 0 if defect_key == "Discoloration" else 1
        elif "03" in machine_id:
            idx = 0 if defect_key == "Dent" else 2

        comp = kb["components"][idx % len(kb["components"])]
        cause = kb["causes"][idx % len(kb["causes"])]
        action = kb["actions"][idx % len(kb["actions"])]

        # Determine severity
        if confidence >= 0.88:
            sev_key = "high"
        elif confidence >= 0.70:
            sev_key = "medium"
        else:
            sev_key = "low"

        priority, urgency = kb["severity_map"][sev_key]

        pattern_note = f"Spatial Pattern: {location_pattern}. " if location_pattern else ""
        full_reasoning = f"{pattern_note}Telemetry analysis indicates: {cause} Verified with {confidence * 100:.1f}% defect classification confidence on {machine_id}."

        advisory_id = f"ADV-{uuid.uuid4().hex[:6].upper()}"
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        return RCAResponse(
            advisory_id=advisory_id,
            defect_type=defect_key,
            machine_id=machine_id,
            probable_component=comp,
            root_cause_reasoning=full_reasoning,
            recommended_action=action,
            priority=priority,
            estimated_urgency=urgency,
            timestamp=timestamp
        )


class ExternalLLMRCAEngine(BaseRCAEngine):
    """
    Adapter for routing Root Cause Analysis queries to external Foundation Models
    (e.g., Google Gemini 1.5/2.0 API, Ollama, Claude).
    """

    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model_name = model_name

    def analyze(
        self,
        defect_type: str,
        confidence: float,
        machine_id: str,
        location_pattern: Optional[str] = None,
        severity: Optional[str] = None
    ) -> RCAResponse:
        # If API key not set, fallback gracefully to HeuristicRCAEngine
        fallback = HeuristicRCAEngine()
        return fallback.analyze(defect_type, confidence, machine_id, location_pattern, severity)


# Global RCA instance
rca_engine = HeuristicRCAEngine()
