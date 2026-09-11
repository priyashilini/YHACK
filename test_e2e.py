import urllib.request
import urllib.parse
import json

def test_endpoints():
    base_url = "http://127.0.0.1:8000"
    print(f"Testing live API at {base_url}...")

    # 1. /api/health
    req = urllib.request.urlopen(f"{base_url}/api/health")
    health = json.loads(req.read().decode())
    print("Health check:", health)
    assert health["status"] == "healthy"

    # 2. /api/samples
    req = urllib.request.urlopen(f"{base_url}/api/samples")
    samples = json.loads(req.read().decode())
    print(f"Loaded {len(samples)} samples from catalog.")
    assert len(samples) >= 5

    # 3. /api/preprocess
    payload = json.dumps({"sample_id": "sample_scratch_1", "clip_limit": 2.5, "tile_grid_size": 8}).encode()
    pre_req = urllib.request.Request(f"{base_url}/api/preprocess", data=payload, headers={"Content-Type": "application/json"})
    res = urllib.request.urlopen(pre_req)
    pre_out = json.loads(res.read().decode())
    print("Preprocess time:", pre_out["processing_time_ms"], "ms")
    assert pre_out["processed_image_base64"].startswith("data:image/jpeg;base64,")

    # 4. /api/analyze
    data = urllib.parse.urlencode({
        "sample_id": "sample_scratch_1",
        "machine_id": "Machine 04",
        "apply_clahe": "true",
        "clip_limit": "2.5",
        "tile_grid_size": "8"
    }).encode()
    ana_req = urllib.request.Request(f"{base_url}/api/analyze", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    ana_res = urllib.request.urlopen(ana_req)
    ana_out = json.loads(ana_res.read().decode())
    print("Analysis result:", ana_out["defect_type"], ana_out["result"], ana_out["confidence"])
    print("Root Cause Probable Component:", ana_out["root_cause"]["probable_component"])
    assert ana_out["defect_type"] == "Scratch"
    assert ana_out["result"] == "FAIL"

    # 5. /api/inspect (Live simulation endpoint)
    insp_data = urllib.parse.urlencode({
        "sample_id": "sample_crack_1",
        "machine_id": "Machine 01",
        "apply_clahe": "true"
    }).encode()
    insp_req = urllib.request.Request(f"{base_url}/api/inspect", data=insp_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    insp_res = urllib.request.urlopen(insp_req)
    insp_out = json.loads(insp_res.read().decode())
    print("Live inspect saved ID:", insp_out.get("id"), "Result:", insp_out["result"])
    assert insp_out.get("id") is not None

    # 6. /api/root-cause
    rca_payload = json.dumps({
        "defect_type": "Dent",
        "confidence": 0.92,
        "machine_id": "Machine 03",
        "location_pattern": "Circular indentation near clamp"
    }).encode()
    rca_req = urllib.request.Request(f"{base_url}/api/root-cause", data=rca_payload, headers={"Content-Type": "application/json"})
    rca_res = urllib.request.urlopen(rca_req)
    rca_out = json.loads(rca_res.read().decode())
    print("RCA Advisory generated:", rca_out["advisory_id"], rca_out["probable_component"], rca_out["priority"])
    assert "Gripper" in rca_out["probable_component"] or "Clamp" in rca_out["probable_component"] or "Damper" in rca_out["probable_component"]

    # 7. /api/inspections
    req = urllib.request.urlopen(f"{base_url}/api/inspections?limit=10")
    inspections = json.loads(req.read().decode())
    print(f"Fetched {len(inspections)} inspections.")
    assert len(inspections) > 0

    # 8. /api/analytics
    req = urllib.request.urlopen(f"{base_url}/api/analytics")
    analytics = json.loads(req.read().decode())
    print("Analytics pass rate:", analytics["pass_rate"], "% | Prototype Targets:", analytics["targets"])
    assert "95%+" in analytics["targets"]["detection_accuracy"]
    assert "<50ms" in analytics["targets"]["target_latency"]
    assert "80%" in analytics["targets"]["downtime_reduction"]

    # 9. /api/review-queue & /api/review
    req = urllib.request.urlopen(f"{base_url}/api/review-queue")
    review_q = json.loads(req.read().decode())
    print(f"Review queue items: {len(review_q)}")
    assert len(review_q) > 0
    target_item = review_q[0]

    review_action_payload = json.dumps({
        "inspection_id": target_item["id"],
        "action": "confirm",
        "notes": "Verified by e2e test script"
    }).encode()
    rev_req = urllib.request.Request(f"{base_url}/api/review", data=review_action_payload, headers={"Content-Type": "application/json"})
    rev_res = urllib.request.urlopen(rev_req)
    rev_action_out = json.loads(rev_res.read().decode())
    print("Review action response:", rev_action_out)
    assert rev_action_out["status"] == "success"

    # 10. Frontend dev server check
    print("Testing Vite dev server at http://localhost:5173/ ...")
    front_req = urllib.request.urlopen("http://localhost:5173/")
    html = front_req.read().decode()
    assert "PRIVISA" in html
    print("Frontend HTML loaded successfully!")

    print("\n ALL LIVE ENDPOINTS & FRONTEND DEV SERVER VERIFIED 100%!")

if __name__ == "__main__":
    test_endpoints()
