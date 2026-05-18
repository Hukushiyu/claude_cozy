# Icon Generation Instructions

The app icon is located at `build/icon.svg`. To generate the required formats:

## Option 1: Online Tool (Easiest)
1. Go to https://www.electronjs.org/apps/electron-icon-maker or https://cloudconvert.com/
2. Upload `build/icon.svg`
3. Generate PNG at 512x512 or 1024x1024
4. Save as `build/icon.png`
5. electron-builder will auto-generate .ico and .icns from this

## Option 2: Using ImageMagick (If installed)
```bash
# Convert SVG to PNG at 512x512
magick build/icon.svg -resize 512x512 build/icon.png

# Or 1024x1024 for better quality
magick build/icon.svg -resize 1024x1024 build/icon.png
```

## Option 3: Using Inkscape (If installed)
```bash
inkscape build/icon.svg --export-filename=build/icon.png --export-width=512 --export-height=512
```

## Option 4: Manual (Photoshop, GIMP, etc.)
1. Open `build/icon.svg` in your image editor
2. Export as PNG at 512x512 or 1024x1024
3. Save as `build/icon.png`

## What electron-builder needs:
- **build/icon.png** (512x512 or 1024x1024) - electron-builder will auto-generate:
  - Windows: icon.ico (multiple sizes embedded)
  - Mac: icon.icns (multiple sizes embedded)
  - Linux: Various PNG sizes

## Current Status:
- ✅ SVG icon created: `build/icon.svg`
- ⏳ Need to generate: `build/icon.png` (512x512 minimum)

Once `build/icon.png` exists, electron-builder will handle the rest automatically during build!
