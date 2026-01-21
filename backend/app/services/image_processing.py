import os
from PIL import Image
import io
from app.config import settings

# Ensure upload directories exist
os.makedirs(os.path.join(settings.UPLOAD_DIR, "originals"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "thumbnails"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "display"), exist_ok=True)

THUMBNAIL_SIZE = (300, 300)
DISPLAY_SIZE = (2048, 2048)

def process_image(image_data: bytes, filename: str) -> dict:
    """
    Process uploaded image: save original, generate thumbnail and display version.
    Returns dictionary with paths and metadata.
    """
    try:
        img = Image.open(io.BytesIO(image_data))
        
        # Metadata
        width, height = img.size
        format = img.format if img.format else "JPEG"
        
        # Filename handling
        base_name = os.path.splitext(filename)[0]
        ext = os.path.splitext(filename)[1].lower()
        if not ext:
            ext = ".jpg"
            
        # Unique identifier/timestamp could be added here to avoid collisions, 
        # but handled by DB ID usually. For file storage, let's keep it simple for now or use uuid.
        # But instructions say "Pixelated images are solved by design", implying we must be careful with compression.
        
        # Save Original
        path_original = os.path.join("originals", filename)
        full_path_original = os.path.join(settings.UPLOAD_DIR, path_original)
        with open(full_path_original, "wb") as f:
            f.write(image_data)
            
        # Generate Thumbnail
        img_thumb = img.copy()
        img_thumb.thumbnail(THUMBNAIL_SIZE)
        path_thumbnail = os.path.join("thumbnails", f"{base_name}_thumb{ext}")
        full_path_thumbnail = os.path.join(settings.UPLOAD_DIR, path_thumbnail)
        img_thumb.save(full_path_thumbnail, quality=85, optimize=True)
        
        # Generate Display Version (High Quality for Client View)
        # Only resize if larger than display size
        img_display = img.copy()
        if width > DISPLAY_SIZE[0] or height > DISPLAY_SIZE[1]:
            img_display.thumbnail(DISPLAY_SIZE)
        
        path_display = os.path.join("display", f"{base_name}_display{ext}")
        full_path_display = os.path.join(settings.UPLOAD_DIR, path_display)
        # High quality for display
        img_display.save(full_path_display, quality=90, optimize=True)
        
        return {
            "width": width,
            "height": height,
            "path_original": path_original,
            "path_thumbnail": path_thumbnail,
            "path_display": path_display
        }

    except Exception as e:
        print(f"Error processing image: {e}")
        raise e
