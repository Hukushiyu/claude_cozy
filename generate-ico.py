#!/usr/bin/env python3
"""
Generate icon.ico from icon.png with multiple sizes for Windows
"""
from PIL import Image
import sys

def generate_ico(png_path, ico_path):
    """Generate .ico file with multiple sizes from PNG"""
    img = Image.open(png_path)

    # Generate multiple sizes for Windows icon
    sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]

    icon_images = []
    for size in sizes:
        resized = img.resize(size, Image.Resampling.LANCZOS)
        icon_images.append(resized)

    # Save as .ico with all sizes
    icon_images[0].save(
        ico_path,
        format='ICO',
        sizes=[(img.width, img.height) for img in icon_images]
    )

    print(f"Generated {ico_path} with sizes: {sizes}")

if __name__ == "__main__":
    try:
        generate_ico("build/icon.png", "src-tauri/icons/icon.ico")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
