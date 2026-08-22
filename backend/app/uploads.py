"""Storing the small images travellers upload: trip covers and profile photos."""

from pathlib import Path

from fastapi import HTTPException, UploadFile, status

MAX_BYTES = 2 * 1024 * 1024
UPLOAD_ROOT = Path(__file__).resolve().parent.parent / "uploads"
PUBLIC_PREFIX = "/uploads/"

# The browser's content type is a hint; the first bytes of the file decide.
SIGNATURES = {b"\xff\xd8\xff": ".jpg", b"\x89PNG\r\n\x1a\n": ".png"}
WRONG_TYPE = "Choose a JPG or PNG image."


def save_image(upload: UploadFile, stem: str, folder: str = "") -> str:
    if upload.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, WRONG_TYPE)

    data = upload.file.read(MAX_BYTES + 1)
    if not data:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "That file is empty.")
    if len(data) > MAX_BYTES:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "Images must be 2 MB or smaller.")

    suffix = next((ext for signature, ext in SIGNATURES.items() if data.startswith(signature)), None)
    if suffix is None:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, WRONG_TYPE)

    directory = UPLOAD_ROOT / folder if folder else UPLOAD_ROOT
    directory.mkdir(parents=True, exist_ok=True)
    # One image per owner, so whatever was there under either extension goes first.
    for previous in directory.glob(f"{stem}.*"):
        previous.unlink()
    (directory / f"{stem}{suffix}").write_bytes(data)

    return f"{PUBLIC_PREFIX}{folder}/{stem}{suffix}" if folder else f"{PUBLIC_PREFIX}{stem}{suffix}"


def remove_image(public_path: str | None):
    if not public_path or not public_path.startswith(PUBLIC_PREFIX):
        return
    target = (UPLOAD_ROOT / public_path[len(PUBLIC_PREFIX) :]).resolve()
    # Never follow a stored path back out of the uploads folder.
    if target.is_relative_to(UPLOAD_ROOT.resolve()):
        target.unlink(missing_ok=True)
