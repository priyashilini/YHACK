import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import init_db, get_inspections, get_review_queue, get_machines_list, update_review
from backend.services.preprocessing import preprocessor
from backend.services.detector import detector
from backend.services.rca_engine import rca_engine
from backend.services.analytics import compute_analytics
from backend.samples.generator import generate_sample_images, SAMPLES_DIR

def run_tests():
    print("=== 1. Testing Sample Generation & OpenCV CLAHE ===")
    generate_sample_images()
    sample_files = os.listdir(SAMPLES_DIR)
    print(f"Generated {len(sample_files)} sample files in {SAMPLES_DIR}")
    assert len(sample_files) >= 10, "Should generate at least 10 sample images"

    print("\n=== 2. Testing Real OpenCV CLAHE Preprocessor ===")
    import cv2
    test_img = cv2.imread(os.path.join(SAMPLES_DIR, "sample_scratch_1.jpg"))
    enhanced, elapsed = preprocessor.process(test_img, clip_limit=3.0, tile_grid_size=(8, 8))
    print(f"CLAHE applied in {elapsed}ms, output shape: {enhanced.shape}")
    assert enhanced.shape == test_img.shape, "Shape mismatch after CLAHE"
    b64 = preprocessor.bgr_to_b64(enhanced)
    assert b64.startswith("data:image/jpeg;base64,"), "Invalid base64 encoding"

    print("\n=== 3. Testing Defect Detection Service ===")
    res_scratch = detector.detect(enhanced, metadata={"defect_type": "Scratch", "confidence": 0.94})
    print("Detection output:", res_scratch)
    assert res_scratch["defect_type"] == "Scratch"
    assert res_scratch["result"] == "FAIL"
    assert len(res_scratch["boxes"]) > 0

    res_clean = detector.detect(enhanced, metadata={"is_clean": True})
    print("Clean detection output:", res_clean)
    assert res_clean["result"] == "PASS"

    res_rev = detector.detect(enhanced, metadata={"defect_type": "Crack", "confidence": 0.68})
    print("Review queue detection output:", res_rev)
    assert res_rev["result"] == "REVIEW"

    print("\n=== 4. Testing Root Cause Analysis (RCA) Engine ===")
    rca = rca_engine.analyze(defect_type="Scratch", confidence=0.94, machine_id="Machine 04")
    print(f"Probable Component: {rca.probable_component}")
    print(f"Recommended Action: {rca.recommended_action}")
    print(f"Priority: {rca.priority}, Urgency: {rca.estimated_urgency}")
    assert "Roller" in rca.probable_component or "Conveyor" in rca.probable_component

    print("\n=== 5. Testing SQLite Database & Seeding ===")
    init_db()
    inspections = get_inspections(limit=50)
    print(f"Loaded {len(inspections)} historical inspections from database (Requirement: >= 20)")
    assert len(inspections) >= 20, f"Expected at least 20 records, got {len(inspections)}"

    review_q = get_review_queue()
    print(f"Review queue items: {len(review_q)}")
    assert len(review_q) > 0, "Review queue should have items"

    machines = get_machines_list()
    print(f"Machines configured: {[m['machine_id'] for m in machines]}")
    assert len(machines) == 4, "Expected 4 machines (01 to 04)"

    print("\n=== 6. Testing Review Action ===")
    item_to_review = review_q[0]
    updated = update_review(item_to_review["id"], "confirm", notes="Verified by test runner")
    assert updated is True, "Review update failed"
    print(f"Successfully confirmed review item {item_to_review['id']}")

    print("\n=== 7. Testing Analytics Engine ===")
    analytics = compute_analytics()
    print(f"Total: {analytics['total_inspections']}, Pass Rate: {analytics['pass_rate']}%")
    print(f"Defect distribution: {analytics['defect_distribution']}")
    print(f"Prototype targets: {analytics['targets']}")
    assert analytics["total_inspections"] >= 20

    print("\n ALL BACKEND TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
