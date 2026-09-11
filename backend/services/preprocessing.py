import cv2
import numpy as np
import time
import base64
import io
from PIL import Image
from typing import Tuple

class CLAHEPreprocessor:
    """
    Industrial illumination normalization using OpenCV CLAHE
    (Contrast Limited Adaptive Histogram Equalization).

    Transforms input industrial surface images into illumination-invariant
    representations to prevent false positives caused by conveyor glares,
    shadows, or low-light industrial bay conditions.
    """

    def __init__(self, default_clip_limit: float = 2.5, default_tile_grid_size: Tuple[int, int] = (8, 8)):
        self.default_clip_limit = default_clip_limit
        self.default_tile_grid_size = default_tile_grid_size

    def process(
        self,
        image_bgr: np.ndarray,
        clip_limit: float = None,
        tile_grid_size: Tuple[int, int] = None
    ) -> Tuple[np.ndarray, float]:
        """
        Applies OpenCV CLAHE in LAB color space (or directly on single-channel).
        Returns (enhanced_bgr_image, elapsed_time_ms).
        """
        start_time = time.perf_counter()
        
        c_limit = clip_limit if clip_limit is not None else self.default_clip_limit
        tg_size = tile_grid_size if tile_grid_size is not None else self.default_tile_grid_size

        clahe = cv2.createCLAHE(clipLimit=c_limit, tileGridSize=tg_size)

        if len(image_bgr.shape) == 2:
            # Grayscale input
            enhanced = clahe.apply(image_bgr)
            enhanced_bgr = cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)
        elif image_bgr.shape[2] == 4:
            # BGRA input
            bgr = cv2.cvtColor(image_bgr, cv2.COLOR_BGRA2BGR)
            lab = cv2.cvtColor(bgr, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            cl = clahe.apply(l)
            merged = cv2.merge((cl, a, b))
            enhanced_bgr = cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
        else:
            # Standard 3-channel BGR input
            lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            cl = clahe.apply(l)
            merged = cv2.merge((cl, a, b))
            enhanced_bgr = cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0
        return enhanced_bgr, round(elapsed_ms, 2)

    @staticmethod
    def b64_to_bgr(b64_string: str) -> np.ndarray:
        """Decodes base64 string (with or without data URI header) to BGR ndarray."""
        if "," in b64_string:
            b64_string = b64_string.split(",", 1)[1]
        img_bytes = base64.b64decode(b64_string)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            raise ValueError("Failed to decode image from base64 data.")
        return img_bgr

    @staticmethod
    def bgr_to_b64(image_bgr: np.ndarray, ext: str = ".jpg") -> str:
        """Encodes BGR image to base64 string with standard data URI prefix."""
        success, buffer = cv2.imencode(ext, image_bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
        if not success:
            raise ValueError("Failed to encode image to base64.")
        b64_str = base64.b64encode(buffer).decode("utf-8")
        mime = "image/jpeg" if ext in [".jpg", ".jpeg"] else "image/png"
        return f"data:{mime};base64,{b64_str}"

# Singleton preprocessor instance
preprocessor = CLAHEPreprocessor()
