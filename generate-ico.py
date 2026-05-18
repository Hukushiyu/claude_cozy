#!/usr/bin/env python3
"""
Generate icon.ico from icon.png with multiple sizes for Windows
"""
from PIL import Image
import io
import sys

def generate_ico(png_path, ico_path):
    """Generate .ico file with multiple sizes from PNG"""
    img = Image.open(png_path)

    # Ensure RGBA mode for transparency
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # Generate multiple sizes for Windows icon
    # Windows needs these specific sizes
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]

    icon_images = []
    for size in sizes:
        resized = img.resize(size, Image.Resampling.LANCZOS)
        icon_images.append(resized)

    # Save as .ico with all sizes embedded
    # The first image becomes the main icon, but all are included
    with open(ico_path, 'wb') as f:
        # Use BytesIO to write ICO properly
        buf = io.BytesIO()
        icon_images[0].save(
            buf,
            format='ICO',
            append_images=icon_images[1:],
            bitmap_format='png'  # Keep PNG encoding for better quality
        )
        f.write(buf.getvalue())

    # Verify file size
    import os
    file_size = os.path.getsize(ico_path)

    print(f"Generated {ico_path}")
    print(f"  - Sizes: {sizes}")
    print(f"  - File size: {file_size:,} bytes")

    if file_size < 5000:
        print("  WARNING: File size seems small - may only contain one resolution")

if __name__ == "__main__":
    try:
        generate_ico("build/icon.png", "src-tauri/icons/icon.ico")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
