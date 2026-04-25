from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..models.schemas import AnalyzeFoodRequest, ScanRequest
from ..services.ml_bridge import run_ml_bridge


router = APIRouter(tags=["ml"])


def _map_bridge_error_status(error_type: str, message: str) -> int:
    t = error_type.lower()
    m = message.lower()

    if t == "product_not_found" or "product not found" in m:
        return 404

    if (
        "timed out" in m
        or "timeout" in m
        or "temporarily unavailable" in m
        or "connection" in m
        or "name resolution" in m
    ):
        return 503

    return 500


@router.post("/scan-product")
def scan_product(payload: ScanRequest):
    barcode = payload.barcode.strip()
    if not barcode:
        raise HTTPException(status_code=400, detail="Missing barcode.")
    if not barcode.isdigit() or not (8 <= len(barcode) <= 14):
        raise HTTPException(status_code=422, detail="Invalid barcode format. Expected 8 to 14 digits.")

    try:
        result = run_ml_bridge(["scan", "--barcode", barcode])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Scan failed: {exc}") from exc

    if isinstance(result, dict) and "error" in result:
        message = str(result.get("error") or "Scan failed")
        error_type = str(result.get("error_type") or "bridge_error")
        raise HTTPException(status_code=_map_bridge_error_status(error_type, message), detail=message)

    return result


@router.post("/analyze-food")
def analyze_food(payload: AnalyzeFoodRequest):
    barcode = (payload.barcode or "").strip()
    product_name = (payload.product_name or "").strip()

    if not barcode and not product_name:
        raise HTTPException(status_code=422, detail="Provide either 'barcode' or 'product_name'.")

    if barcode and (not barcode.isdigit() or not (8 <= len(barcode) <= 14)):
        raise HTTPException(status_code=422, detail="Barcode must be 8 to 14 digits.")

    if product_name and not (2 <= len(product_name) <= 120):
        raise HTTPException(status_code=422, detail="Product name must be between 2 and 120 characters.")

    args = ["analyze"]
    if barcode:
        args.extend(["--barcode", barcode])
    if product_name:
        args.extend(["--product-name", product_name])

    try:
        result = run_ml_bridge(args)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analyze failed: {exc}") from exc

    if isinstance(result, dict) and "error" in result:
        message = str(result.get("error") or "Analysis failed")
        error_type = str(result.get("error_type") or "bridge_error")
        raise HTTPException(status_code=_map_bridge_error_status(error_type, message), detail=message)

    return result


@router.get("/recommendations")
def recommendations(barcode: str = ""):
    barcode = barcode.strip()
    if not barcode:
        return []
    if not barcode.isdigit() or not (8 <= len(barcode) <= 14):
        raise HTTPException(status_code=422, detail="Invalid barcode format. Expected 8 to 14 digits.")

    try:
        result = run_ml_bridge(["recommend", "--barcode", barcode, "--limit", "4"])
    except Exception:
        return []

    if not isinstance(result, list):
        return []
    return result


@router.post("/analyze-image")
async def analyze_image(image: UploadFile = File(...)):
    max_bytes = 8 * 1024 * 1024
    content_type = (image.content_type or "").lower()
    mime_to_ext = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/bmp": ".bmp",
    }

    ext = mime_to_ext.get(content_type)
    if not ext:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported image format ({content_type or 'unknown'}). Use JPEG, PNG, WEBP, or BMP.",
        )

    data = await image.read()
    if len(data) <= 0 or len(data) > max_bytes:
        raise HTTPException(status_code=413, detail="Image size must be between 1 byte and 8 MB.")

    temp_path: Path | None = None
    try:
        with NamedTemporaryFile(prefix="nutriscan-", suffix=ext, delete=False) as temp_file:
            temp_file.write(data)
            temp_path = Path(temp_file.name)

        result = run_ml_bridge(["analyze-image", "--image", str(temp_path)])
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {exc}") from exc
    finally:
        if temp_path and temp_path.exists():
            try:
                temp_path.unlink()
            except Exception:
                pass

    if isinstance(result, dict) and "error" in result:
        message = str(result.get("error") or "Image analysis failed")
        raise HTTPException(status_code=422, detail=message)

    return result