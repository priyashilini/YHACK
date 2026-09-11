from typing import Dict, Any, List
from ..database import get_connection

def compute_analytics() -> Dict[str, Any]:
    """
    Aggregates inspection and telemetry metrics from SQLite.
    Returns structured stats for the Dashboard and Analytics view.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Total counts
    cursor.execute("SELECT COUNT(*) FROM inspections")
    total_inspections = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM inspections WHERE result = 'PASS'")
    pass_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM inspections WHERE result = 'FAIL'")
    fail_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM inspections WHERE result = 'REVIEW'")
    review_count = cursor.fetchone()[0]

    cursor.execute("SELECT AVG(processing_time_ms) FROM inspections")
    avg_latency = cursor.fetchone()[0] or 32.8

    # Pass Rate
    pass_rate = round((pass_count / total_inspections * 100.0), 1) if total_inspections > 0 else 0.0
    defects_detected = fail_count + review_count

    # Defect distribution
    cursor.execute("""
    SELECT defect_type, COUNT(*) as cnt
    FROM inspections
    WHERE defect_type IS NOT NULL AND defect_type != ''
    GROUP BY defect_type
    """)
    defect_rows = cursor.fetchall()
    
    classes = ["Scratch", "Crack", "Dent", "Discoloration"]
    dist = {c: 0 for c in classes}
    for row in defect_rows:
        dtype = row["defect_type"]
        if dtype in dist:
            dist[dtype] = row["cnt"]

    total_defects = sum(dist.values()) or 1
    percentages = {c: round((cnt / total_defects) * 100.0, 1) for c, cnt in dist.items()}

    # Defects by Machine
    cursor.execute("""
    SELECT machine_id, defect_type, COUNT(*) as cnt
    FROM inspections
    WHERE defect_type IS NOT NULL AND defect_type != ''
    GROUP BY machine_id, defect_type
    """)
    mach_rows = cursor.fetchall()

    defects_by_machine = {
        "Machine 01": {c: 0 for c in classes},
        "Machine 02": {c: 0 for c in classes},
        "Machine 03": {c: 0 for c in classes},
        "Machine 04": {c: 0 for c in classes}
    }
    for row in mach_rows:
        m_id = row["machine_id"]
        d_t = row["defect_type"]
        if m_id in defects_by_machine and d_t in classes:
            defects_by_machine[m_id][d_t] = row["cnt"]

    # Recent Inspection Trend (chronological reverse of last 15 items)
    cursor.execute("""
    SELECT timestamp, result, defect_type, confidence, processing_time_ms, machine_id
    FROM inspections
    ORDER BY timestamp DESC
    LIMIT 12
    """)
    recent_trend_rows = cursor.fetchall()
    recent_trend = []
    for r in reversed(recent_trend_rows):
        recent_trend.append({
            "timestamp": r["timestamp"].split(" ")[1][:5] if " " in r["timestamp"] else r["timestamp"],
            "result": r["result"],
            "defect_type": r["defect_type"] or "Nominal",
            "confidence": round(r["confidence"] * 100, 1),
            "latency": r["processing_time_ms"],
            "machine": r["machine_id"]
        })

    # Machine summary
    cursor.execute("SELECT COUNT(*) FROM machines WHERE status = 'OPERATIONAL'")
    operational_machines = cursor.fetchone()[0]

    conn.close()

    return {
        "total_inspections": total_inspections,
        "pass_count": pass_count,
        "fail_count": fail_count,
        "review_count": review_count,
        "pass_rate": pass_rate,
        "defects_detected": defects_detected,
        "avg_detection_time_ms": round(avg_latency, 1),
        "active_machines": operational_machines,
        "defect_distribution": dist,
        "defect_percentages": percentages,
        "defects_by_machine": defects_by_machine,
        "recent_trend": recent_trend,
        "targets": {
            "detection_accuracy": "95%+",
            "target_latency": "<50ms",
            "downtime_reduction": "80%",
            "label": "Prototype Target"
        }
    }
