import sqlite3
import json
import os
import uuid
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "privisa.db")

def get_connection():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inspections (
        id TEXT PRIMARY KEY,
        part_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        machine_id TEXT NOT NULL,
        defect_type TEXT,
        confidence REAL NOT NULL,
        result TEXT NOT NULL,
        boxes TEXT,
        clahe_applied INTEGER NOT NULL DEFAULT 1,
        processing_time_ms REAL NOT NULL,
        root_cause TEXT,
        maintenance TEXT,
        image_url TEXT,
        processed_image_url TEXT,
        review_status TEXT,
        reviewer_notes TEXT
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS machines (
        machine_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        health_score INTEGER NOT NULL,
        defect_frequency TEXT NOT NULL,
        last_detected_issue TEXT NOT NULL,
        recommended_maintenance TEXT NOT NULL,
        priority TEXT NOT NULL
    );
    """)

    conn.commit()

    # Check if machines need initialization
    cursor.execute("SELECT COUNT(*) FROM machines")
    if cursor.fetchone()[0] == 0:
        _seed_machines(conn)

    # Check if inspections need initialization (ensure at least 25 records)
    cursor.execute("SELECT COUNT(*) FROM inspections")
    if cursor.fetchone()[0] == 0:
        _seed_inspections(conn)

    conn.close()

def _seed_machines(conn):
    cursor = conn.cursor()
    machines = [
        ("Machine 01", "Primary Stamping & Forming Press", "OPERATIONAL", 94, "1.4% (Low)", "Slight hairline micro-fissure detected", "Calibrate press tonnage and verify hydraulic fluid level", "LOW"),
        ("Machine 02", "Precision Induction Annealing Line", "WARNING", 72, "6.8% (Elevated)", "Thermal oxidation discoloration patch", "Recalibrate thermocouple sensor and purge nitrogen nozzle", "HIGH"),
        ("Machine 03", "CNC High-Speed Profiling Cell", "OPERATIONAL", 88, "2.9% (Normal)", "Minor surface dent from gripper retraction", "Inspect pneumatic clamp pads and zero servo back-lash", "MEDIUM"),
        ("Machine 04", "Conveyor Transfer & Roller Sorter", "DEGRADED", 65, "8.9% (Critical)", "Conveyor Roller #2 friction score pattern", "Immediate lubrication and bearing alignment on Conveyor Roller #2", "CRITICAL")
    ]
    cursor.executemany("""
    INSERT INTO machines (machine_id, name, status, health_score, defect_frequency, last_detected_issue, recommended_maintenance, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, machines)
    conn.commit()

def _seed_inspections(conn):
    cursor = conn.cursor()
    now = datetime.utcnow()

    # Create 28 rich realistic industrial inspection records
    sample_records = [
        # 1. Scratch FAIL - Conveyor Roller #2 (Classic Demo flow!)
        {
            "part_id": "PRV-ST-8812",
            "machine_id": "Machine 04",
            "defect_type": "Scratch",
            "confidence": 0.942,
            "result": "FAIL",
            "boxes": json.dumps([{"x": 0.18, "y": 0.42, "width": 0.45, "height": 0.12, "label": "Scratch", "confidence": 0.942}]),
            "clahe_applied": 1,
            "processing_time_ms": 34.2,
            "root_cause": json.dumps({
                "defect_type": "Scratch",
                "confidence": 0.942,
                "location_pattern": "Linear horizontal score across middle conveyor track",
                "severity": "HIGH",
                "probable_component": "Conveyor Belt Roller #2",
                "reasoning": "Linear scratch pattern detected at regular intervals along transport feed. Roller bearing friction seizure causing metal drag."
            }),
            "maintenance": json.dumps({
                "advisory_id": "ADV-SCR-001",
                "machine_id": "Machine 04",
                "probable_component": "Conveyor Belt Roller #2",
                "root_cause_reasoning": "Conveyor Roller #2 stuck or misaligned; friction scoring stock.",
                "recommended_action": "Inspect and lubricate Conveyor Roller #2 bearings; clean roller surface.",
                "priority": "CRITICAL",
                "estimated_urgency": "Immediate (Next 2 Hours)",
                "created_at": (now - timedelta(minutes=12)).strftime("%Y-%m-%d %H:%M:%S UTC")
            }),
            "image_url": "/static/samples/sample_scratch_1.jpg",
            "processed_image_url": "/static/samples/sample_scratch_1_clahe.jpg",
            "review_status": None,
            "reviewer_notes": None,
            "offset_min": 12
        },
        # 2. Borderline Scratch for Review Queue (Confidence between 50% and 80%)
        {
            "part_id": "PRV-AL-8813",
            "machine_id": "Machine 04",
            "defect_type": "Scratch",
            "confidence": 0.684,
            "result": "REVIEW",
            "boxes": json.dumps([{"x": 0.32, "y": 0.51, "width": 0.28, "height": 0.09, "label": "Scratch", "confidence": 0.684}]),
            "clahe_applied": 1,
            "processing_time_ms": 38.6,
            "root_cause": json.dumps({
                "defect_type": "Scratch",
                "confidence": 0.684,
                "location_pattern": "Faint score mark near part edge",
                "severity": "MEDIUM",
                "probable_component": "Linear Guide Rail #4",
                "reasoning": "Subtle surface abrasion near tolerance limit. Operator confirmation required to separate true scratch from machining chatter."
            }),
            "maintenance": json.dumps({
                "advisory_id": "ADV-REV-002",
                "machine_id": "Machine 04",
                "probable_component": "Linear Guide Rail #4",
                "root_cause_reasoning": "Potential rail particulate rubbing edge.",
                "recommended_action": "Inspect guide rail wiper and verify part dimension.",
                "priority": "MEDIUM",
                "estimated_urgency": "Within 4 Hours",
                "created_at": (now - timedelta(minutes=24)).strftime("%Y-%m-%d %H:%M:%S UTC")
            }),
            "image_url": "/static/samples/sample_scratch_review.jpg",
            "processed_image_url": "/static/samples/sample_scratch_review_clahe.jpg",
            "review_status": "PENDING",
            "reviewer_notes": "Awaiting manual QA verification",
            "offset_min": 24
        },
        # 3. Clean Pass
        {
            "part_id": "PRV-ST-8814",
            "machine_id": "Machine 01",
            "defect_type": None,
            "confidence": 0.985,
            "result": "PASS",
            "boxes": json.dumps([]),
            "clahe_applied": 1,
            "processing_time_ms": 29.8,
            "root_cause": None,
            "maintenance": None,
            "image_url": "/static/samples/sample_clean_1.jpg",
            "processed_image_url": "/static/samples/sample_clean_1_clahe.jpg",
            "review_status": None,
            "reviewer_notes": None,
            "offset_min": 35
        },
        # 4. Crack FAIL - Machine 01 Press
        {
            "part_id": "PRV-ST-8815",
            "machine_id": "Machine 01",
            "defect_type": "Crack",
            "confidence": 0.961,
            "result": "FAIL",
            "boxes": json.dumps([{"x": 0.40, "y": 0.25, "width": 0.22, "height": 0.38, "label": "Crack", "confidence": 0.961}]),
            "clahe_applied": 1,
            "processing_time_ms": 36.1,
            "root_cause": json.dumps({
                "defect_type": "Crack",
                "confidence": 0.961,
                "location_pattern": "Perimeter radial fracture originating near mounting bore",
                "severity": "CRITICAL",
                "probable_component": "Primary Stamping Die Press #1",
                "reasoning": "Cyclic mechanical fatigue during punch stroke. Micro-fracture propagation across load-bearing flange."
            }),
            "maintenance": json.dumps({
                "advisory_id": "ADV-CRK-003",
                "machine_id": "Machine 01",
                "probable_component": "Primary Stamping Die Press #1",
                "root_cause_reasoning": "Excessive stamping punch tonnage or die misalignment.",
                "recommended_action": "Immediate safety lockout. Calibrate press tonnage and inspect die insert with dye penetrant.",
                "priority": "CRITICAL",
                "estimated_urgency": "Immediate Action Required",
                "created_at": (now - timedelta(minutes=48)).strftime("%Y-%m-%d %H:%M:%S UTC")
            }),
            "image_url": "/static/samples/sample_crack_1.jpg",
            "processed_image_url": "/static/samples/sample_crack_1_clahe.jpg",
            "review_status": None,
            "reviewer_notes": None,
            "offset_min": 48
        },
        # 5. Borderline Crack for Review Queue
        {
            "part_id": "PRV-ST-8816",
            "machine_id": "Machine 01",
            "defect_type": "Crack",
            "confidence": 0.718,
            "result": "REVIEW",
            "boxes": json.dumps([{"x": 0.35, "y": 0.30, "width": 0.18, "height": 0.25, "label": "Crack", "confidence": 0.718}]),
            "clahe_applied": 1,
            "processing_time_ms": 32.4,
            "root_cause": json.dumps({
                "defect_type": "Crack",
                "confidence": 0.718,
                "location_pattern": "Hairline shadow line near die shoulder",
                "severity": "HIGH",
                "probable_component": "Primary Stamping Die Press #1",
                "reasoning": "Possible hairline stress craze or shadow artifact. Operator review required."
            }),
            "maintenance": json.dumps({
                "advisory_id": "ADV-REV-004",
                "machine_id": "Machine 01",
                "probable_component": "Primary Stamping Die Press #1",
                "root_cause_reasoning": "Suspected micro-fissure under illumination gradient.",
                "recommended_action": "Perform high-magnification visual check on punch line.",
                "priority": "HIGH",
                "estimated_urgency": "Within 1 Hour",
                "created_at": (now - timedelta(hours=1, minutes=10)).strftime("%Y-%m-%d %H:%M:%S UTC")
            }),
            "image_url": "/static/samples/sample_crack_review.jpg",
            "processed_image_url": "/static/samples/sample_crack_review_clahe.jpg",
            "review_status": "PENDING",
            "reviewer_notes": "Awaiting metallurgist signoff",
            "offset_min": 70
        },
        # 6. Dent FAIL - Machine 03 Gripper
        {
            "part_id": "PRV-AL-8817",
            "machine_id": "Machine 03",
            "defect_type": "Dent",
            "confidence": 0.915,
            "result": "FAIL",
            "boxes": json.dumps([{"x": 0.38, "y": 0.40, "width": 0.24, "height": 0.22, "label": "Dent", "confidence": 0.915}]),
            "clahe_applied": 1,
            "processing_time_ms": 31.0,
            "root_cause": json.dumps({
                "defect_type": "Dent",
                "confidence": 0.915,
                "location_pattern": "Circular concave depression at pneumatic clamp zone",
                "severity": "HIGH",
                "probable_component": "Pneumatic Pick-and-Place Gripper #4",
                "reasoning": "Pneumatic pressure spike causing excessive impact velocity upon part seating. 4.8 bar recorded vs 4.2 bar limit."
            }),
            "maintenance": json.dumps({
                "advisory_id": "ADV-DNT-005",
                "machine_id": "Machine 03",
                "probable_component": "Pneumatic Pick-and-Place Gripper #4",
                "root_cause_reasoning": "Over-pressure impact during automated transfer.",
                "recommended_action": "Check pneumatic regulator valve; reduce gripper actuation pressure to 4.2 bar.",
                "priority": "HIGH",
                "estimated_urgency": "Within 2 Hours",
                "created_at": (now - timedelta(hours=1, minutes=35)).strftime("%Y-%m-%d %H:%M:%S UTC")
            }),
            "image_url": "/static/samples/sample_dent_1.jpg",
            "processed_image_url": "/static/samples/sample_dent_1_clahe.jpg",
            "review_status": None,
            "reviewer_notes": None,
            "offset_min": 95
        },
        # 7. Discoloration FAIL - Machine 02 Annealer
        {
            "part_id": "PRV-TI-8818",
            "machine_id": "Machine 02",
            "defect_type": "Discoloration",
            "confidence": 0.892,
            "result": "FAIL",
            "boxes": json.dumps([{"x": 0.22, "y": 0.25, "width": 0.42, "height": 0.36, "label": "Discoloration", "confidence": 0.892}]),
            "clahe_applied": 1,
            "processing_time_ms": 35.8,
            "root_cause": json.dumps({
                "defect_type": "Discoloration",
                "confidence": 0.892,
                "location_pattern": "Thermal oxidation gradient in heat-affected zone",
                "severity": "HIGH",
                "probable_component": "Induction Annealing Coil #2",
                "reasoning": "Thermal regulator drift producing localized oxidation temper colors (420°C overshoot). Surface layer metallurgical alteration."
            }),
            "maintenance": json.dumps({
                "advisory_id": "ADV-DIS-006",
                "machine_id": "Machine 02",
                "probable_component": "Induction Annealing Coil #2",
                "root_cause_reasoning": "Thermal drift in heating zone 2 thermocouple.",
                "recommended_action": "Calibrate thermocouple sensor and verify PID loop parameters on Induction Annealer #2.",
                "priority": "HIGH",
                "estimated_urgency": "Within 3 Hours",
                "created_at": (now - timedelta(hours=2, minutes=10)).strftime("%Y-%m-%d %H:%M:%S UTC")
            }),
            "image_url": "/static/samples/sample_discolor_1.jpg",
            "processed_image_url": "/static/samples/sample_discolor_1_clahe.jpg",
            "review_status": None,
            "reviewer_notes": None,
            "offset_min": 130
        },
        # 8. Borderline Discoloration in Review Queue
        {
            "part_id": "PRV-TI-8819",
            "machine_id": "Machine 02",
            "defect_type": "Discoloration",
            "confidence": 0.640,
            "result": "REVIEW",
            "boxes": json.dumps([{"x": 0.30, "y": 0.30, "width": 0.30, "height": 0.28, "label": "Discoloration", "confidence": 0.640}]),
            "clahe_applied": 1,
            "processing_time_ms": 33.1,
            "root_cause": json.dumps({
                "defect_type": "Discoloration",
                "confidence": 0.640,
                "location_pattern": "Faint iridescent sheen across surface",
                "severity": "MEDIUM",
                "probable_component": "Coolant Delivery Nozzle #6",
                "reasoning": "Potential light oil residue or minor oxidation. Review needed to determine cleanability."
            }),
            "maintenance": json.dumps({
                "advisory_id": "ADV-REV-007",
                "machine_id": "Machine 02",
                "probable_component": "Coolant Delivery Nozzle #6",
                "root_cause_reasoning": "Coolant emulsion residue.",
                "recommended_action": "Wipe test sample and check coolant concentration index.",
                "priority": "MEDIUM",
                "estimated_urgency": "Within 4 Hours",
                "created_at": (now - timedelta(hours=2, minutes=45)).strftime("%Y-%m-%d %H:%M:%S UTC")
            }),
            "image_url": "/static/samples/sample_discolor_review.jpg",
            "processed_image_url": "/static/samples/sample_discolor_review_clahe.jpg",
            "review_status": "PENDING",
            "reviewer_notes": "Pending chemical wipe test",
            "offset_min": 165
        },
        # 9. Clean Pass
        {
            "part_id": "PRV-ST-8820",
            "machine_id": "Machine 03",
            "defect_type": None,
            "confidence": 0.991,
            "result": "PASS",
            "boxes": json.dumps([]),
            "clahe_applied": 1,
            "processing_time_ms": 28.5,
            "root_cause": None,
            "maintenance": None,
            "image_url": "/static/samples/sample_clean_2.jpg",
            "processed_image_url": "/static/samples/sample_clean_2_clahe.jpg",
            "review_status": None,
            "reviewer_notes": None,
            "offset_min": 190
        },
        # 10. Clean Pass
        {
            "part_id": "PRV-AL-8821",
            "machine_id": "Machine 04",
            "defect_type": None,
            "confidence": 0.978,
            "result": "PASS",
            "boxes": json.dumps([]),
            "clahe_applied": 1,
            "processing_time_ms": 30.4,
            "root_cause": None,
            "maintenance": None,
            "image_url": "/static/samples/sample_clean_3.jpg",
            "processed_image_url": "/static/samples/sample_clean_3_clahe.jpg",
            "review_status": None,
            "reviewer_notes": None,
            "offset_min": 215
        },
        # 11. Dent Review item already confirmed
        {
            "part_id": "PRV-AL-8822",
            "machine_id": "Machine 03",
            "defect_type": "Dent",
            "confidence": 0.745,
            "result": "REVIEW",
            "boxes": json.dumps([{"x": 0.25, "y": 0.45, "width": 0.20, "height": 0.20, "label": "Dent", "confidence": 0.745}]),
            "clahe_applied": 1,
            "processing_time_ms": 34.0,
            "root_cause": json.dumps({
                "defect_type": "Dent",
                "confidence": 0.745,
                "location_pattern": "Shallow notch at edge radius",
                "severity": "MEDIUM",
                "probable_component": "Ejection Cushion Damper #2",
                "reasoning": "Damper cushion contact indentation confirmed by operator."
            }),
            "maintenance": json.dumps({
                "advisory_id": "ADV-REV-008",
                "machine_id": "Machine 03",
                "probable_component": "Ejection Cushion Damper #2",
                "root_cause_reasoning": "Damper wear.",
                "recommended_action": "Replace damper polyurethane pad.",
                "priority": "MEDIUM",
                "estimated_urgency": "Within 4 Hours",
                "created_at": (now - timedelta(hours=3, minutes=20)).strftime("%Y-%m-%d %H:%M:%S UTC")
            }),
            "image_url": "/static/samples/sample_dent_review.jpg",
            "processed_image_url": "/static/samples/sample_dent_review_clahe.jpg",
            "review_status": "CONFIRMED",
            "reviewer_notes": "Operator verified: Defect real. Scrap part.",
            "offset_min": 200
        }
    ]

    # Add additional 15 realistic historical records across last 24 hours to reach 26 total
    machines = ["Machine 01", "Machine 02", "Machine 03", "Machine 04"]
    defect_types = ["Scratch", "Crack", "Dent", "Discoloration"]
    
    for i in range(12, 28):
        offset_m = i * 45 + random.randint(5, 20)
        t_stamp = (now - timedelta(minutes=offset_m)).strftime("%Y-%m-%d %H:%M:%S UTC")
        mach = machines[i % len(machines)]
        p_id = f"PRV-QC-{8800 + i}"
        
        # 60% PASS, 25% FAIL, 15% REVIEW
        roll = random.random()
        if roll < 0.60:
            res = "PASS"
            dtype = None
            conf = round(random.uniform(0.95, 0.996), 4)
            boxes = []
            rc = None
            maint = None
            rev_stat = None
            img_u = "/static/samples/sample_clean_1.jpg"
        elif roll < 0.85:
            res = "FAIL"
            dtype = defect_types[i % len(defect_types)]
            conf = round(random.uniform(0.83, 0.97), 4)
            boxes = [{"x": 0.28, "y": 0.35, "width": 0.32, "height": 0.22, "label": dtype, "confidence": conf}]
            rc = {
                "defect_type": dtype,
                "confidence": conf,
                "location_pattern": f"Surface pattern corresponding to {mach} mechanical wear",
                "severity": "HIGH",
                "probable_component": f"Actuator assembly on {mach}",
                "reasoning": f"Automated inspection detected {dtype} with {conf*100:.1f}% confidence."
            }
            maint = {
                "advisory_id": f"ADV-{dtype[:3].upper()}-{8800+i}",
                "machine_id": mach,
                "probable_component": f"Subsystem {i % 4 + 1} on {mach}",
                "root_cause_reasoning": f"Tool wear detected by {dtype} visual fingerprint.",
                "recommended_action": f"Inspect tooling tolerances on {mach}.",
                "priority": "HIGH" if conf > 0.90 else "MEDIUM",
                "estimated_urgency": "Within 4 Hours",
                "created_at": t_stamp
            }
            rev_stat = None
            img_u = f"/static/samples/sample_{dtype.lower()}_1.jpg"
        else:
            res = "REVIEW"
            dtype = defect_types[i % len(defect_types)]
            conf = round(random.uniform(0.58, 0.77), 4)
            boxes = [{"x": 0.30, "y": 0.30, "width": 0.25, "height": 0.25, "label": dtype, "confidence": conf}]
            rc = {
                "defect_type": dtype,
                "confidence": conf,
                "location_pattern": "Borderline surface contrast variance",
                "severity": "MEDIUM",
                "probable_component": f"Optical sensor target {mach}",
                "reasoning": f"Borderline prediction ({conf*100:.1f}%) queued for manual signoff."
            }
            maint = {
                "advisory_id": f"ADV-REV-{8800+i}",
                "machine_id": mach,
                "probable_component": f"Guidance module on {mach}",
                "root_cause_reasoning": "Borderline detection awaiting QA resolution.",
                "recommended_action": "Check line calibration if confirmed.",
                "priority": "MEDIUM",
                "estimated_urgency": "Shift Review",
                "created_at": t_stamp
            }
            rev_stat = random.choice(["PENDING", "PENDING", "CONFIRMED", "REJECTED"])
            img_u = f"/static/samples/sample_{dtype.lower()}_review.jpg"

        sample_records.append({
            "part_id": p_id,
            "machine_id": mach,
            "defect_type": dtype,
            "confidence": conf,
            "result": res,
            "boxes": json.dumps(boxes),
            "clahe_applied": 1,
            "processing_time_ms": round(random.uniform(28.0, 42.5), 1),
            "root_cause": json.dumps(rc) if rc else None,
            "maintenance": json.dumps(maint) if maint else None,
            "image_url": img_u,
            "processed_image_url": img_u.replace(".jpg", "_clahe.jpg"),
            "review_status": rev_stat,
            "reviewer_notes": "Operator resolved" if rev_stat in ["CONFIRMED", "REJECTED"] else None,
            "offset_min": offset_m
        })

    # Sort chronologically (oldest to newest)
    sample_records.sort(key=lambda r: r["offset_min"], reverse=True)

    for r in sample_records:
        rec_id = f"INS-{uuid.uuid4().hex[:8].upper()}"
        ts = (now - timedelta(minutes=r["offset_min"])).strftime("%Y-%m-%d %H:%M:%S UTC")
        cursor.execute("""
        INSERT INTO inspections (
            id, part_id, timestamp, machine_id, defect_type, confidence,
            result, boxes, clahe_applied, processing_time_ms,
            root_cause, maintenance, image_url, processed_image_url,
            review_status, reviewer_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            rec_id, r["part_id"], ts, r["machine_id"], r["defect_type"], r["confidence"],
            r["result"], r["boxes"], r["clahe_applied"], r["processing_time_ms"],
            r["root_cause"], r["maintenance"], r["image_url"], r["processed_image_url"],
            r["review_status"], r["reviewer_notes"]
        ))

    conn.commit()

def save_inspection(data: Dict[str, Any]) -> str:
    conn = get_connection()
    cursor = conn.cursor()
    inspection_id = data.get("id") or f"INS-{uuid.uuid4().hex[:8].upper()}"
    timestamp = data.get("timestamp") or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    boxes_json = json.dumps(data.get("boxes", [])) if not isinstance(data.get("boxes"), str) else data.get("boxes")
    root_cause_json = json.dumps(data.get("root_cause")) if data.get("root_cause") and not isinstance(data.get("root_cause"), str) else data.get("root_cause")
    maintenance_json = json.dumps(data.get("maintenance")) if data.get("maintenance") and not isinstance(data.get("maintenance"), str) else data.get("maintenance")

    # If result is REVIEW, ensure default review_status is PENDING
    review_status = data.get("review_status")
    if data.get("result") == "REVIEW" and not review_status:
        review_status = "PENDING"

    cursor.execute("""
    INSERT INTO inspections (
        id, part_id, timestamp, machine_id, defect_type, confidence,
        result, boxes, clahe_applied, processing_time_ms,
        root_cause, maintenance, image_url, processed_image_url,
        review_status, reviewer_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        inspection_id,
        data.get("part_id", f"PRV-{uuid.uuid4().hex[:6].upper()}"),
        timestamp,
        data.get("machine_id", "Machine 01"),
        data.get("defect_type"),
        float(data.get("confidence", 0.0)),
        data.get("result", "PASS"),
        boxes_json,
        1 if data.get("clahe_applied", True) else 0,
        float(data.get("processing_time_ms", 32.5)),
        root_cause_json,
        maintenance_json,
        data.get("image_url"),
        data.get("processed_image_url"),
        review_status,
        data.get("reviewer_notes")
    ))
    conn.commit()
    conn.close()
    return inspection_id

def get_inspections(limit: int = 50, machine_id: Optional[str] = None, result: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM inspections WHERE 1=1"
    params = []
    if machine_id:
        query += " AND machine_id = ?"
        params.append(machine_id)
    if result:
        query += " AND result = ?"
        params.append(result)

    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    results = []
    for r in rows:
        results.append(_row_to_dict(r))
    conn.close()
    return results

def get_review_queue() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    # Filter items that need review:
    # 1. Result == 'REVIEW' or confidence between 0.50 and 0.80
    # 2. review_status in ('PENDING', 'CONFIRMED', 'REJECTED', 'ESCALATED') or NULL with 0.50 <= conf < 0.80
    cursor.execute("""
    SELECT * FROM inspections
    WHERE result = 'REVIEW'
       OR (confidence >= 0.50 AND confidence < 0.80 AND defect_type IS NOT NULL)
       OR review_status IS NOT NULL
    ORDER BY CASE WHEN review_status = 'PENDING' THEN 0 ELSE 1 END, timestamp DESC
    """)
    rows = cursor.fetchall()
    results = [_row_to_dict(r) for r in rows]
    conn.close()
    return results

def update_review(inspection_id: str, action: str, notes: str = "") -> bool:
    """Updates inspection review status: 'confirm' -> CONFIRMED (FAIL), 'reject' -> REJECTED (PASS), 'escalate' -> ESCALATED."""
    conn = get_connection()
    cursor = conn.cursor()
    status_map = {
        "confirm": "CONFIRMED",
        "reject": "REJECTED",
        "escalate": "ESCALATED"
    }
    status = status_map.get(action.lower(), "CONFIRMED")
    
    # If confirmed, mark result as FAIL; if rejected (false positive), mark result as PASS
    new_result = None
    if action.lower() == "confirm":
        new_result = "FAIL"
    elif action.lower() == "reject":
        new_result = "PASS"

    if new_result:
        cursor.execute("""
        UPDATE inspections
        SET review_status = ?, reviewer_notes = ?, result = ?
        WHERE id = ?
        """, (status, notes, new_result, inspection_id))
    else:
        cursor.execute("""
        UPDATE inspections
        SET review_status = ?, reviewer_notes = ?
        WHERE id = ?
        """, (status, notes, inspection_id))

    success = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return success

def get_machines_list() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM machines ORDER BY machine_id ASC")
    rows = cursor.fetchall()
    results = [dict(r) for r in rows]
    conn.close()
    return results

def reset_and_seed_db():
    if os.path.exists(DB_PATH):
        try:
            os.remove(DB_PATH)
        except Exception:
            pass
    init_db()

def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
    d = dict(row)
    if d.get("boxes"):
        try:
            d["boxes"] = json.loads(d["boxes"])
        except Exception:
            d["boxes"] = []
    else:
        d["boxes"] = []

    if d.get("root_cause"):
        try:
            d["root_cause"] = json.loads(d["root_cause"])
        except Exception:
            pass

    if d.get("maintenance"):
        try:
            d["maintenance"] = json.loads(d["maintenance"])
        except Exception:
            pass

    d["clahe_applied"] = bool(d.get("clahe_applied", 1))
    return d
