# Orion Image Studio

A modern, full-featured **Single Studio & Bulk Batch Image Editor** that runs locally in any browser.

## Features

### 1. Single Studio & Bulk Batch Modes
- **Single Studio**: Interactive canvas with Before/After Split Compare slider, Hold Original toggle, Zoom/Fit controls, live Eyedropper background sampling, manual Erase/Restore brushes, and Privacy Redaction brushes.
- **Bulk Batch Processor**: Drag-and-drop multiple images, preview all processed results with live before/after dimensions and file sizes, and export all as a `.zip` archive, a **Merged Multi-Page `.pdf`**, or a **Catalog Contact Sheet Grid**.

### 2. Background Removal, Replacement & Subject Styling
- **AI Subject Cutout**: Automatic perimeter color clustering & edge-aware flood isolation with adjustable sensitivity and edge feathering.
- **Color / Chroma Key Removal**: Sample any color from the canvas with the Eyedropper tool and adjust tolerance, edge softness, and outer-border contiguous flood-fill.
- **Background Replacement**: Transparent alpha, Solid color, Linear gradient (`0°–360°`), Bokeh/Blurred original background, or custom uploaded background image.
- **Subject Styling**:
  - **Auto-Trim Transparent Pixels (Smart Autocrop)**
  - **Sticker Outline / Stroke** (`0–24 px`, custom color)
  - **Ground Contact Shadow** & **3D Mirror Floor Reflection**
  - **Canvas Padding (Margin %)**, **Drop Shadow**, and **Corner Radius**

### 3. Color Grading, Filters & Image Enhancement
- **Auto-Enhance**: One-click light, vibrance, shadow recovery, and clarity boost.
- **One-Click Studio LUTs**: *Normal*, *E-Commerce Crisp*, *Monochrome B&W*, *Warm Vintage*, *Cinematic Teal & Orange*, and *Soft Matte*.
- **9 Adjustment Sliders**: Brightness, Contrast, Exposure, Saturation, Vibrance, Highlights, Shadows, Warmth/Temp, and Sharpening (Unsharp Mask Clarity).

### 4. Watermarking, Text & Branding Overlay
- **Text Watermark**: Supports dynamic `{name}`, `{date}`, and `{dims}` tokens, custom color, font size, opacity, and rotation angle.
- **Logo Image Watermark**: Upload a transparent PNG logo with adjustable scale and opacity.
- **Placement**: **3×3 Position Anchor Grid** or **Tiled Diagonal Repeat**.
- **Corner Ribbon Badges & Border Frame**: Add `NEW`, `SALE`, `FEATURED`, `PRO`, or custom corner ribbons and solid border frames.

### 5. Interactive Cropping & Dimensions
- **Interactive On-Canvas Crop Box**: Rule-of-Thirds grid overlay with aspect ratio locks (`Free`, `1:1`, `4:5`, `4:3`, `16:9`, `9:16`).
- **Resize Modes**: Original, Exact Pixels (`Contain`, `Cover` with **9-Point Anchor Grid**, `Stretch`), Scale Percentage (`5%–200%`), or Fit Bounding Box.
- **Orientation**: Rotate `90° CW/CCW`, Flip `H/V`, and Fine Horizon Straighten (`-45°` to `+45°`).

### 6. Format Conversion, File Size Optimizer & Power Tools
- **Supported Formats**: `PNG`, `JPG/JPEG`, `WebP`, `AVIF`, `BMP`, `GIF` (GIF89a LZW), `ICO` (Single & Multi-Size), and `PDF` (Single & Multi-Page).
- **Strict Max File Size Limit**: Automatically optimizes quality, color quantization, and scaling to stay under your target KB budget (`≤ 50 KB`, `≤ 100 KB`, `≤ 250 KB`, etc.).
- **Privacy & EXIF**: Inspects native resolution/headers, strips EXIF/GPS metadata on export, and includes **Redact Mosaic (Pixelate)** and **Redact Blur** brushes.
- **Power Exports**: Preset Recipes, **Responsive + Favicon `.ICO` Pack (`.ZIP`)**, **Contact Sheet Generator**, and Clipboard Copy/Paste (`Ctrl+C` / `Ctrl+V`).

## Quick Start

1. Double-click `start_orion_studio.bat` or run:
   ```bash
   python server.py
   ```
2. Or open `index.html` directly in any modern browser.

