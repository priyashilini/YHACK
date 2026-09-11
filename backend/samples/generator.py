import os
import cv2
import numpy as np
from ..services.preprocessing import preprocessor

SAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "samples")

def create_base_metal_texture(w: int = 600, h: int = 400, tone: int = 140, lighting_gradient: bool = True) -> np.ndarray:
    """Generates a realistic brushed metal surface with directional lighting shadow/glare."""
    np.random.seed(42)
    # Base gray texture
    base = np.full((h, w, 3), tone, dtype=np.uint8)

    # Add brushed metal horizontal striations
    noise = np.random.normal(0, 12, (h, w)).astype(np.float32)
    # Blur horizontally to mimic linear grain
    brushed = cv2.GaussianBlur(noise, (25, 1), 0)
    
    # Add subtle fine grain
    fine_grain = np.random.normal(0, 6, (h, w)).astype(np.float32)
    texture = base.astype(np.float32) + brushed[:, :, np.newaxis] + fine_grain[:, :, np.newaxis]

    if lighting_gradient:
        # Simulate uneven factory bay illumination (dark top-left shadow, bright specular hot-spot right)
        x_grad = np.linspace(-40, 50, w)
        y_grad = np.linspace(-30, 30, h)
        xx, yy = np.meshgrid(x_grad, y_grad)
        lighting = xx + yy
        texture += lighting[:, :, np.newaxis]

    # Add machine chamfer border
    cv2.rectangle(texture, (10, 10), (w - 10, h - 10), (tone - 35, tone - 35, tone - 35), 2)
    cv2.rectangle(texture, (12, 12), (w - 12, h - 12), (tone + 30, tone + 30, tone + 30), 1)

    # Add 4 mounting bolt holes at corners
    for cx, cy in [(40, 40), (w - 40, 40), (40, h - 40), (w - 40, h - 40)]:
        cv2.circle(texture, (cx, cy), 16, (tone - 60, tone - 60, tone - 60), -1)
        cv2.circle(texture, (cx, cy), 10, (tone - 80, tone - 80, tone - 80), -1)
        cv2.circle(texture, (cx, cy), 16, (tone + 40, tone + 40, tone + 40), 2)

    return np.clip(texture, 0, 255).astype(np.uint8)

def generate_sample_images():
    """Generates all reference industrial parts for live conveyor, analysis, and demo flows."""
    os.makedirs(SAMPLES_DIR, exist_ok=True)
    w, h = 640, 440

    # 1. Scratch (Conveyor Roller #2 - Classic Fail)
    img_scratch_1 = create_base_metal_texture(w, h, tone=150, lighting_gradient=True)
    # Deep continuous horizontal scratch with metallic burr highlight
    pts = np.array([[120, 200], [220, 205], [320, 198], [420, 204], [480, 202]], np.int32)
    cv2.polylines(img_scratch_1, [pts], False, (40, 40, 40), 3, cv2.LINE_AA)
    # Scratch highlight edge
    pts_hi = np.array([[120, 202], [220, 207], [320, 200], [420, 206], [480, 204]], np.int32)
    cv2.polylines(img_scratch_1, [pts_hi], False, (240, 240, 240), 1, cv2.LINE_AA)
    # Secondary minor parallel scratch
    pts_sec = np.array([[160, 220], [280, 223], [380, 219]], np.int32)
    cv2.polylines(img_scratch_1, [pts_sec], False, (55, 55, 55), 2, cv2.LINE_AA)
    _save_and_clahe("sample_scratch_1", img_scratch_1)

    # 2. Scratch Review (Faint score mark)
    img_scratch_rev = create_base_metal_texture(w, h, tone=160, lighting_gradient=True)
    pts_faint = np.array([[240, 230], [320, 234], [410, 232]], np.int32)
    cv2.polylines(img_scratch_rev, [pts_faint], False, (90, 90, 90), 2, cv2.LINE_AA)
    _save_and_clahe("sample_scratch_review", img_scratch_rev)

    # 3. Crack (Stamping Press #1 - Radial fracture)
    img_crack_1 = create_base_metal_texture(w, h, tone=135, lighting_gradient=True)
    # Branching jagged fracture
    crack_main = np.array([
        [280, 120], [295, 150], [288, 185], [310, 220], [305, 260], [325, 290]
    ], np.int32)
    cv2.polylines(img_crack_1, [crack_main], False, (25, 25, 25), 3, cv2.LINE_AA)
    # Branch
    crack_branch = np.array([[295, 150], [320, 165], [340, 175]], np.int32)
    cv2.polylines(img_crack_1, [crack_branch], False, (35, 35, 35), 2, cv2.LINE_AA)
    # Stress shadow around fracture
    cv2.circle(img_crack_1, (300, 200), 45, (60, 60, 60), -1)
    # Re-blend shadow
    img_crack_1 = cv2.addWeighted(img_crack_1, 0.85, create_base_metal_texture(w, h, tone=135, lighting_gradient=False), 0.15, 0)
    cv2.polylines(img_crack_1, [crack_main], False, (20, 20, 20), 3, cv2.LINE_AA)
    _save_and_clahe("sample_crack_1", img_crack_1)

    # 4. Crack Review (Subtle hairline)
    img_crack_rev = create_base_metal_texture(w, h, tone=145, lighting_gradient=True)
    hairline = np.array([[260, 160], [275, 195], [270, 230]], np.int32)
    cv2.polylines(img_crack_rev, [hairline], False, (80, 80, 80), 2, cv2.LINE_AA)
    _save_and_clahe("sample_crack_review", img_crack_rev)

    # 5. Dent (Pneumatic Gripper Impact)
    img_dent_1 = create_base_metal_texture(w, h, tone=145, lighting_gradient=True)
    # Shaded concave depression: dark inner shadow crescent, bright specular rim
    cx, cy, radius = 330, 220, 48
    # Inner shadow
    for r in range(radius, 0, -2):
        alpha = (radius - r) / radius
        val = int(70 + 70 * alpha)
        cv2.circle(img_dent_1, (cx - 4, cy - 4), r, (val, val, val), -1)
    # Specular opposite crescent
    cv2.ellipse(img_dent_1, (cx + 8, cy + 8), (radius - 5, radius - 15), 45, 0, 180, (235, 235, 235), 3, cv2.LINE_AA)
    _save_and_clahe("sample_dent_1", img_dent_1)

    # 6. Dent Review
    img_dent_rev = create_base_metal_texture(w, h, tone=155, lighting_gradient=True)
    cx, cy, radius = 250, 240, 28
    cv2.circle(img_dent_rev, (cx, cy), radius, (110, 110, 110), -1)
    cv2.ellipse(img_dent_rev, (cx + 4, cy + 4), (radius - 4, radius - 10), 45, 0, 180, (215, 215, 215), 2, cv2.LINE_AA)
    _save_and_clahe("sample_dent_review", img_dent_rev)

    # 7. Discoloration (Annealer Induction Thermal Gradient)
    img_discolor_1 = create_base_metal_texture(w, h, tone=150, lighting_gradient=True)
    # Add heat oxidation bloom (straw yellow -> magenta -> cyan/blue temper rings)
    overlay = img_discolor_1.copy().astype(np.float32)
    h_cen, w_cen = 220, 310
    Y, X = np.ogrid[:h, :w]
    dist = np.sqrt((X - w_cen)**2 + (Y - h_cen)**2)
    # Core heat (straw/amber tint)
    core_mask = np.clip(1.0 - dist / 90.0, 0, 1)[:, :, np.newaxis]
    overlay[:, :, 0] += core_mask[:, :, 0] * -50.0  # Blue down
    overlay[:, :, 1] += core_mask[:, :, 0] * 30.0   # Green up
    overlay[:, :, 2] += core_mask[:, :, 0] * 70.0   # Red up
    # Outer heat fringe (purple/blue temper oxide)
    fringe_mask = np.clip(1.0 - np.abs(dist - 80) / 40.0, 0, 1)[:, :, np.newaxis]
    overlay[:, :, 0] += fringe_mask[:, :, 0] * 75.0   # Blue up (cyan/blue oxide)
    overlay[:, :, 1] += fringe_mask[:, :, 0] * -20.0
    overlay[:, :, 2] += fringe_mask[:, :, 0] * 40.0   # Violet
    img_discolor_1 = np.clip(overlay, 0, 255).astype(np.uint8)
    _save_and_clahe("sample_discolor_1", img_discolor_1)

    # 8. Discoloration Review (Coolant sheen)
    img_discolor_rev = create_base_metal_texture(w, h, tone=155, lighting_gradient=True)
    overlay_rev = img_discolor_rev.copy().astype(np.float32)
    Y, X = np.ogrid[:h, :w]
    dist_rev = np.sqrt((X - 280)**2 + (Y - 210)**2)
    mask_rev = np.clip(1.0 - dist_rev / 70.0, 0, 1)[:, :, np.newaxis]
    overlay_rev[:, :, 0] += mask_rev[:, :, 0] * 35.0
    overlay_rev[:, :, 2] += mask_rev[:, :, 0] * 25.0
    img_discolor_rev = np.clip(overlay_rev, 0, 255).astype(np.uint8)
    _save_and_clahe("sample_discolor_review", img_discolor_rev)

    # 9. Clean 1 (Stainless Plate)
    img_clean_1 = create_base_metal_texture(w, h, tone=150, lighting_gradient=True)
    # Add subtle nominal laser etched part number
    cv2.putText(img_clean_1, "PRV-SPEC-A14", (w - 210, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (90, 90, 90), 1, cv2.LINE_AA)
    _save_and_clahe("sample_clean_1", img_clean_1)

    # 10. Clean 2 (Machined Circular Disc)
    img_clean_2 = create_base_metal_texture(w, h, tone=160, lighting_gradient=True)
    # Concentric lathe turning rings
    for r in range(40, 180, 15):
        cv2.circle(img_clean_2, (w // 2, h // 2), r, (145, 145, 145), 1, cv2.LINE_AA)
    cv2.putText(img_clean_2, "PRV-DISC-M02", (w - 210, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (90, 90, 90), 1, cv2.LINE_AA)
    _save_and_clahe("sample_clean_2", img_clean_2)

    # 11. Clean 3 (High Precision Flange)
    img_clean_3 = create_base_metal_texture(w, h, tone=140, lighting_gradient=True)
    cv2.putText(img_clean_3, "PRV-FLG-OK", (w - 180, h - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (90, 90, 90), 1, cv2.LINE_AA)
    _save_and_clahe("sample_clean_3", img_clean_3)

def _save_and_clahe(name: str, img_bgr: np.ndarray):
    orig_path = os.path.join(SAMPLES_DIR, f"{name}.jpg")
    cv2.imwrite(orig_path, img_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])
    # Apply real OpenCV CLAHE preprocessing
    clahe_bgr, _ = preprocessor.process(img_bgr, clip_limit=2.5, tile_grid_size=(8, 8))
    clahe_path = os.path.join(SAMPLES_DIR, f"{name}_clahe.jpg")
    cv2.imwrite(clahe_path, clahe_bgr, [cv2.IMWRITE_JPEG_QUALITY, 95])

if __name__ == "__main__":
    generate_sample_images()
