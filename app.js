/**
 * Orion Image Studio — Complete Pro Suite Application Controller
 * Implements all 6 Feature Categories across Single Studio & Bulk Batch modes:
 * 1. Color Grading, Studio LUT Filters, Sharpening & Auto-Enhance
 * 2. Text & Logo Watermarking (3x3 Anchor + Tiled Diagonal), Corner Badges & Frames
 * 3. Advanced Subject Styling: Sticker Outline Stroke, 3D Floor Reflection, Contact Shadow & Smart Auto-Trim
 * 4. Interactive On-Canvas Crop Box, 9-Point Cover Crop Anchor & Horizon Straighten
 * 5. EXIF Metadata Inspector/Stripper & Privacy Redaction Brushes (Mosaic Pixelate & Blur)
 * 6. Preset Recipes, Responsive + Multi-Size ICO Pack (.ZIP), Contact Sheet Generator & Clipboard Copy/Paste
 */

(function () {
  // ==================== STATE ====================
  const state = {
    mode: 'single', // 'single' | 'bulk'
    items: [],
    activeId: null,

    // Canvas Viewport state
    zoom: 1,
    splitCompare: false,
    splitPos: 0.5,
    holdOriginal: false,
    activeTool: null, // null | 'eyedropper' | 'erase' | 'restore' | 'pixelate' | 'blurRedact' | 'crop'
    brushSize: 38,

    // Interactive Crop Box state (normalized 0..1 coordinates on current image)
    cropBoxActive: false,
    cropRatio: 'free',
    cropRect: { x: 0.1, y: 0.1, w: 0.8, h: 0.8 },

    // Custom saved recipes
    customRecipes: JSON.parse(localStorage.getItem('orion_custom_recipes') || '{}'),

    // Shared Studio Settings
    settings: {
      // 1. Background Removal & Replacement
      bgRemovalMode: 'none', // 'none' | 'ai' | 'color'
      aiEngine: 'hybrid',    // 'hybrid' | 'neural' | 'fast'
      aiSensitivity: 50,
      aiFeather: 2,
      cleanupIslands: true,
      autoBgOnUpload: false,
      chromaColor: '#ffffff',
      chromaTolerance: 22,
      chromaFeather: 12,
      chromaContiguous: false,

      bgFillType: 'transparent', // 'transparent' | 'color' | 'gradient' | 'blur' | 'image'
      bgSolidColor: '#ffffff',
      bgGradColor1: '#6366f1',
      bgGradColor2: '#ec4899',
      bgGradAngle: 135,
      bgBlurAmount: 16,
      bgBlurBrightness: 100,
      bgCustomImage: null,

      // 3. Advanced Subject & Cutout Styling
      autoTrim: false,
      strokeWidth: 0,
      strokeColor: '#ffffff',
      contactShadow: false,
      floorReflection: false,
      reflectionOpacity: 35,
      bgPadding: 0,
      bgShadow: 0,
      bgRadius: 0,

      // 1. Color Grading, LUTs & Enhancement
      filterPreset: 'none', // 'none' | 'ecommerce' | 'bw' | 'vintage' | 'cinematic' | 'matte'
      brightness: 0,   // -100..100
      contrast: 0,     // -100..100
      exposure: 0,     // -100..100
      saturation: 0,   // -100..100
      vibrance: 0,     // -100..100
      highlights: 0,   // -100..100
      shadows: 0,      // -100..100
      warmth: 0,       // -100..100
      sharpen: 0,      // 0..100

      // 2. Watermarking, Badges & Border Frame
      wmTextEnabled: false,
      wmText: '© Orion Studio',
      wmTextColor: '#ffffff',
      wmTextSize: 36,
      wmOpacity: 75,
      wmAngle: 0,
      wmLogoImg: null,
      wmLogoScale: 18,
      wmTiled: false,
      wmAnchor: 'se', // 'nw'|'n'|'ne'|'w'|'c'|'e'|'sw'|'s'|'se'
      badgeText: '',
      badgeColor: '#ef4444',
      borderFrameWidth: 0,
      borderFrameColor: '#ffffff',

      // 4. Dimensions, Anchor Crop & Straighten
      resizeMode: 'original', // 'original' | 'pixels' | 'percent' | 'max'
      resizeWidth: 1080,
      resizeHeight: 1080,
      lockAspect: true,
      resizeFit: 'contain', // 'contain' | 'cover' | 'stretch'
      coverAnchor: 'c',     // 'nw'|'n'|'ne'|'w'|'c'|'e'|'sw'|'s'|'se'
      resizePercent: 100,
      resizeMaxSide: 1200,
      rotation: 0,
      straighten: 0, // -45..45 degrees
      flipH: false,
      flipV: false,

      // 5 & 6. Format, File Size & Privacy
      format: 'png',
      quality: 88,
      enableTargetSize: false,
      targetSizeKb: 150,
      stripExif: true,
      filenamePattern: '{name}-edited'
    }
  };

  // ==================== DOM ELEMENTS ====================
  const $ = (id) => document.getElementById(id);
  const el = {
    modeSingleBtn: $('modeSingleBtn'),
    modeBulkBtn: $('modeBulkBtn'),
    queueCountBadge: $('queueCountBadge'),
    fileInput: $('fileInput'),
    loadSampleBtn: $('loadSampleBtn'),
    emptySampleBtn: $('emptySampleBtn'),
    copyClipboardBtn: $('copyClipboardBtn'),
    resetAllBtn: $('resetAllBtn'),
    exportCurrentBtn: $('exportCurrentBtn'),
    exportBtnLabel: $('exportBtnLabel'),
    inspectorExportBtn: $('inspectorExportBtn'),

    filmstripCount: $('filmstripCount'),
    filmstripList: $('filmstripList'),
    clearQueueBtn: $('clearQueueBtn'),
    addMoreFilmstripBtn: $('addMoreFilmstripBtn'),

    dropZone: $('dropZone'),
    emptyState: $('emptyState'),
    singleView: $('singleView'),
    bulkView: $('bulkView'),

    // Canvas Toolbar
    compareToggleBtn: $('compareToggleBtn'),
    holdOriginalBtn: $('holdOriginalBtn'),
    quickAutoBgBtn: $('quickAutoBgBtn'),
    selectObjectToolBtn: $('selectObjectToolBtn'),
    eyedropperToolBtn: $('eyedropperToolBtn'),
    brushEraseBtn: $('brushEraseBtn'),
    brushRestoreBtn: $('brushRestoreBtn'),
    brushPixelateBtn: $('brushPixelateBtn'),
    brushBlurRedactBtn: $('brushBlurRedactBtn'),
    cropBoxToolBtn: $('cropBoxToolBtn'),
    brushSizeControl: $('brushSizeControl'),
    brushSizeSlider: $('brushSizeSlider'),
    clearBrushMaskBtn: $('clearBrushMaskBtn'),
    zoomOutBtn: $('zoomOutBtn'),
    zoomInBtn: $('zoomInBtn'),
    zoomFitBtn: $('zoomFitBtn'),
    zoomLevelText: $('zoomLevelText'),

    canvasViewport: $('canvasViewport'),
    canvasStageWrapper: $('canvasStageWrapper'),
    previewCanvas: $('previewCanvas'),
    originalCanvas: $('originalCanvas'),
    cropOverlay: $('cropOverlay'),
    cropSelectionBox: $('cropSelectionBox'),
    objectDetectBox: $('objectDetectBox'),
    objectDetectLabel: $('objectDetectLabel'),
    processingOverlay: $('processingOverlay'),
    processingText: $('processingText'),
    splitHandle: $('splitHandle'),
    brushCursor: $('brushCursor'),

    // Telemetry
    teleFileName: $('teleFileName'),
    teleDims: $('teleDims'),
    teleSize: $('teleSize'),
    teleSavingsBadge: $('teleSavingsBadge'),
    teleFormat: $('teleFormat'),
    teleExifBadge: $('teleExifBadge'),
    footerEstSize: $('footerEstSize'),
    footerEstDims: $('footerEstDims'),

    // Bulk View
    bulkAutoRemoveBgBtn: $('bulkAutoRemoveBgBtn'),
    processAllBulkBtn: $('processAllBulkBtn'),
    exportContactSheetBtn: $('exportContactSheetBtn'),
    downloadAllZipBtn: $('downloadAllZipBtn'),
    downloadMergedPdfBtn: $('downloadMergedPdfBtn'),
    bulkStatCount: $('bulkStatCount'),
    bulkStatOrigSize: $('bulkStatOrigSize'),
    bulkStatOutSize: $('bulkStatOutSize'),
    bulkStatSaved: $('bulkStatSaved'),
    bulkProgressContainer: $('bulkProgressContainer'),
    bulkProgressLabel: $('bulkProgressLabel'),
    bulkProgressPercent: $('bulkProgressPercent'),
    bulkProgressBar: $('bulkProgressBar'),
    bulkGrid: $('bulkGrid'),

    // Tab 1: Background & Subject Styling
    bgRemovalStatusChip: $('bgRemovalStatusChip'),
    bgRemovalModeGroup: $('bgRemovalModeGroup'),
    aiRemovalControls: $('aiRemovalControls'),
    colorRemovalControls: $('colorRemovalControls'),
    aiEngineSelect: $('aiEngineSelect'),
    aiSensitivitySlider: $('aiSensitivitySlider'),
    aiSensitivityVal: $('aiSensitivityVal'),
    aiFeatherSlider: $('aiFeatherSlider'),
    aiFeatherVal: $('aiFeatherVal'),
    cleanupIslandsCheck: $('cleanupIslandsCheck'),
    autoBgOnUploadCheck: $('autoBgOnUploadCheck'),
    detectedObjectInfo: $('detectedObjectInfo'),
    runAiCutoutBtn: $('runAiCutoutBtn'),

    chromaColorInput: $('chromaColorInput'),
    pickFromCanvasBtn: $('pickFromCanvasBtn'),
    chromaToleranceSlider: $('chromaToleranceSlider'),
    chromaToleranceVal: $('chromaToleranceVal'),
    chromaFeatherSlider: $('chromaFeatherSlider'),
    chromaFeatherVal: $('chromaFeatherVal'),
    chromaContiguousCheck: $('chromaContiguousCheck'),

    bgFillTypeGroup: $('bgFillTypeGroup'),
    fillColorControls: $('fillColorControls'),
    fillGradientControls: $('fillGradientControls'),
    fillBlurControls: $('fillBlurControls'),
    fillImageControls: $('fillImageControls'),
    bgSolidColorInput: $('bgSolidColorInput'),
    bgGradColor1: $('bgGradColor1'),
    bgGradColor2: $('bgGradColor2'),
    bgGradAngleSlider: $('bgGradAngleSlider'),
    bgGradAngleVal: $('bgGradAngleVal'),
    bgBlurAmountSlider: $('bgBlurAmountSlider'),
    bgBlurAmountVal: $('bgBlurAmountVal'),
    bgBlurBrightSlider: $('bgBlurBrightSlider'),
    bgBlurBrightVal: $('bgBlurBrightVal'),
    bgCustomImageInput: $('bgCustomImageInput'),
    bgCustomImageName: $('bgCustomImageName'),

    autoTrimCheck: $('autoTrimCheck'),
    strokeWidthSlider: $('strokeWidthSlider'),
    strokeWidthVal: $('strokeWidthVal'),
    strokeColorInput: $('strokeColorInput'),
    contactShadowCheck: $('contactShadowCheck'),
    floorReflectionCheck: $('floorReflectionCheck'),
    reflectionOpacityRow: $('reflectionOpacityRow'),
    reflectionOpacitySlider: $('reflectionOpacitySlider'),
    reflectionOpacityVal: $('reflectionOpacityVal'),

    bgPaddingSlider: $('bgPaddingSlider'),
    bgPaddingVal: $('bgPaddingVal'),
    bgShadowSlider: $('bgShadowSlider'),
    bgShadowVal: $('bgShadowVal'),
    bgRadiusSlider: $('bgRadiusSlider'),
    bgRadiusVal: $('bgRadiusVal'),

    // Tab 2: Enhance & Color Grading
    resetEnhanceBtn: $('resetEnhanceBtn'),
    autoEnhanceBtn: $('autoEnhanceBtn'),
    filterPresetGrid: $('filterPresetGrid'),
    adjBrightSlider: $('adjBrightSlider'),
    adjBrightVal: $('adjBrightVal'),
    adjContrastSlider: $('adjContrastSlider'),
    adjContrastVal: $('adjContrastVal'),
    adjExposureSlider: $('adjExposureSlider'),
    adjExposureVal: $('adjExposureVal'),
    adjSatSlider: $('adjSatSlider'),
    adjSatVal: $('adjSatVal'),
    adjVibSlider: $('adjVibSlider'),
    adjVibVal: $('adjVibVal'),
    adjHighSlider: $('adjHighSlider'),
    adjHighVal: $('adjHighVal'),
    adjShadSlider: $('adjShadSlider'),
    adjShadVal: $('adjShadVal'),
    adjWarmthSlider: $('adjWarmthSlider'),
    adjWarmthVal: $('adjWarmthVal'),
    adjSharpSlider: $('adjSharpSlider'),
    adjSharpVal: $('adjSharpVal'),

    // Tab 3: Watermark, Badges & Frames
    wmTextEnableCheck: $('wmTextEnableCheck'),
    wmTextInput: $('wmTextInput'),
    wmTextColorInput: $('wmTextColorInput'),
    wmTextSizeInput: $('wmTextSizeInput'),
    wmOpacitySlider: $('wmOpacitySlider'),
    wmOpacityVal: $('wmOpacityVal'),
    wmAngleSlider: $('wmAngleSlider'),
    wmAngleVal: $('wmAngleVal'),
    wmLogoFileInput: $('wmLogoFileInput'),
    clearWmLogoBtn: $('clearWmLogoBtn'),
    wmLogoScaleSlider: $('wmLogoScaleSlider'),
    wmLogoScaleVal: $('wmLogoScaleVal'),
    wmTileCheck: $('wmTileCheck'),
    wmAnchorGrid: $('wmAnchorGrid'),
    badgeTextInput: $('badgeTextInput'),
    badgeColorInput: $('badgeColorInput'),
    borderFrameSlider: $('borderFrameSlider'),
    borderFrameVal: $('borderFrameVal'),
    borderFrameColorInput: $('borderFrameColorInput'),

    // Tab 4: Crop & Dimensions
    toggleCropBoxBtn: $('toggleCropBoxBtn'),
    applyCropBtn: $('applyCropBtn'),
    resetCropBtn: $('resetCropBtn'),
    cropRatioChips: $('cropRatioChips'),
    resizeModeGroup: $('resizeModeGroup'),
    resizePixelsControls: $('resizePixelsControls'),
    resizePercentControls: $('resizePercentControls'),
    resizeMaxControls: $('resizeMaxControls'),
    resizeWidthInput: $('resizeWidthInput'),
    resizeHeightInput: $('resizeHeightInput'),
    lockAspectBtn: $('lockAspectBtn'),
    resizeFitSelect: $('resizeFitSelect'),
    coverAnchorGrid: $('coverAnchorGrid'),
    resizePercentSlider: $('resizePercentSlider'),
    resizePercentVal: $('resizePercentVal'),
    resizeMaxSideInput: $('resizeMaxSideInput'),
    rotLeftBtn: $('rotLeftBtn'),
    rotRightBtn: $('rotRightBtn'),
    flipHBtn: $('flipHBtn'),
    flipVBtn: $('flipVBtn'),
    straightenSlider: $('straightenSlider'),
    straightenVal: $('straightenVal'),

    // Tab 5: Format, Privacy & Recipes
    recipeSelect: $('recipeSelect'),
    saveRecipeBtn: $('saveRecipeBtn'),
    formatSelectorGrid: $('formatSelectorGrid'),
    qualitySlider: $('qualitySlider'),
    qualityVal: $('qualityVal'),
    enableTargetSizeCheck: $('enableTargetSizeCheck'),
    targetSizeControls: $('targetSizeControls'),
    targetSizeKbInput: $('targetSizeKbInput'),
    exifInfoBox: $('exifInfoBox'),
    stripExifCheck: $('stripExifCheck'),
    filenamePatternSelect: $('filenamePatternSelect'),
    exportResponsivePackBtn: $('exportResponsivePackBtn'),
    exportSheetFromSingleBtn: $('exportSheetFromSingleBtn'),

    toastContainer: $('toastContainer')
  };

  // ==================== UTILITIES ====================
  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(kb < 10 ? 2 : 1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    el.toastContainer.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.25s';
      setTimeout(() => t.remove(), 250);
    }, 2800);
  }

  function hexToRgb(hex) {
    const clean = (hex || '#ffffff').replace('#', '');
    const num = parseInt(clean, 16) || 0;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  }

  function rgbToHex(r, g, b) {
    return (
      '#' +
      [r, g, b]
        .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
        .join('')
    );
  }

  function getActiveItem() {
    return state.items.find((it) => it.id === state.activeId) || state.items[0] || null;
  }

  let renderTimer = null;
  function scheduleRender(immediate = false) {
    if (renderTimer) clearTimeout(renderTimer);
    if (immediate) {
      executeRender();
    } else {
      renderTimer = setTimeout(executeRender, 30);
    }
  }

  // ==================== IMAGE IMPORT & EXIF PARSER ====================
  async function parseExifSummary(file, img) {
    const mp = ((img.naturalWidth * img.naturalHeight) / 1e6).toFixed(2);
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const g = gcd(img.naturalWidth, img.naturalHeight);
    const ar = `${Math.round(img.naturalWidth / g)}:${Math.round(img.naturalHeight / g)}`;
    let exifStatus = 'None detected';
    try {
      const slice = await file.slice(0, 65536).arrayBuffer();
      const bytes = new Uint8Array(slice);
      // Check for JPEG Exif header 'Exif\0\0' (0x45 0x78 0x69 0x66)
      for (let i = 0; i < bytes.length - 6; i++) {
        if (bytes[i] === 0x45 && bytes[i + 1] === 0x78 && bytes[i + 2] === 0x69 && bytes[i + 3] === 0x66) {
          exifStatus = 'APP1 EXIF / Camera Metadata Present';
          break;
        }
      }
    } catch (_) {}

    return (
      `File: ${file.name}\n` +
      `MIME: ${file.type || 'image/unknown'} • Size: ${formatBytes(file.size)}\n` +
      `Native Resolution: ${img.naturalWidth} × ${img.naturalHeight} px (${mp} MP)\n` +
      `Aspect Ratio: ${ar}\n` +
      `Embedded Headers: ${exifStatus}`
    );
  }

  async function addFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    let addedCount = 0;

    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith('image/') && !/\.(bmp|ico|webp|avif|gif|png|jpe?g|svg)$/i.test(file.name)) {
        continue;
      }
      try {
        const img = await loadImageFromFile(file);
        const baseName = (file.name || 'clipboard-image').replace(/\.[^/.]+$/, '');
        const id = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const brushMask = new Uint8Array(w * h);
        brushMask.fill(128); // 128=neutral, 0=erased, 255=restored

        // Redaction mask: 0=none, 1=pixelate mosaic, 2=gaussian blur
        const redactMask = new Uint8Array(w * h);

        const exifSummary = await parseExifSummary(file, img);

        state.items.push({
          id,
          name: baseName,
          originalFileName: file.name || `${baseName}.png`,
          originalSize: file.size || Math.round(w * h * 0.65),
          width: w,
          height: h,
          imgElement: img,
          originalImgElement: img,
          thumbUrl: createThumbnailDataUrl(img, 96),
          brushMask,
          hasManualBrush: false,
          redactMask,
          hasRedaction: false,
          exifSummary,
          cachedAiAlpha: null,
          cachedAiKey: null,
          neuralAlphaMap: null,
          detectedBBox: null,
          lastOutputBlob: null,
          lastOutputWidth: w,
          lastOutputHeight: h
        });
        addedCount++;
      } catch (err) {
        console.error('Failed to load image:', file.name, err);
      }
    }

    if (addedCount > 0) {
      if (!state.activeId && state.items.length > 0) {
        state.activeId = state.items[0].id;
        syncDimensionInputsToActiveImage();
      }
      if (state.settings.autoBgOnUpload) {
        setBgRemovalMode('ai');
        const active = getActiveItem();
        if (active) runAutoDetectAndRemoveBg(active);
      } else {
        showToast(
          addedCount > 1
            ? `Added ${addedCount} images to queue.`
            : `Loaded "${state.items[state.items.length - 1].originalFileName}"`
        );
      }
      updateUIState();
      scheduleRender(true);
    }
  }

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  }

  function createThumbnailDataUrl(img, maxDim = 96) {
    const c = document.createElement('canvas');
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    const ratio = Math.min(maxDim / w, maxDim / h, 1);
    c.width = Math.max(1, Math.round(w * ratio));
    c.height = Math.max(1, Math.round(h * ratio));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  }

  // ==================== DEMO SAMPLES ====================
  async function loadDemoSamples() {
    const samples = [
      {
        name: 'studio-sneaker-product',
        width: 1200,
        height: 900,
        draw(ctx, w, h) {
          const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.48, 40, w * 0.5, h * 0.5, w * 0.65);
          bgGrad.addColorStop(0, '#ffffff');
          bgGrad.addColorStop(1, '#e2e8f0');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, w, h);

          // Soft radial floor shadow (smoothly blends into studio backdrop)
          ctx.save();
          ctx.translate(w * 0.5, h * 0.76);
          ctx.scale(1, 0.15);
          const shGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, w * 0.28);
          shGrad.addColorStop(0, 'rgba(15, 23, 42, 0.14)');
          shGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
          ctx.fillStyle = shGrad;
          ctx.beginPath();
          ctx.arc(0, 0, w * 0.28, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          ctx.save();
          ctx.translate(w * 0.5, h * 0.52);
          ctx.rotate(-0.12);

          // Upper shoe body with crisp outer contour
          const grad = ctx.createLinearGradient(-280, -140, 280, 100);
          grad.addColorStop(0, '#4f46e5');
          grad.addColorStop(0.55, '#7c3aed');
          grad.addColorStop(1, '#ec4899');
          ctx.fillStyle = grad;
          ctx.strokeStyle = '#312e81';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.moveTo(-290, 95);
          ctx.lineTo(-260, -110);
          ctx.quadraticCurveTo(-130, -140, -40, -30);
          ctx.quadraticCurveTo(90, 20, 275, 35);
          ctx.quadraticCurveTo(310, 65, 295, 95);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Midsole with distinct slate contour
          ctx.fillStyle = '#f1f5f9';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.roundRect(-310, 95, 620, 68, 28);
          ctx.fill();
          ctx.stroke();

          // Red midsole accent stripe
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-290, 118, 580, 16);

          // White side swoosh inside upper
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-140, 10);
          ctx.quadraticCurveTo(-40, 65, 140, 25);
          ctx.quadraticCurveTo(10, 85, -160, 45);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
      },
      {
        name: 'creator-portrait-greenscreen',
        width: 1000,
        height: 1000,
        draw(ctx, w, h) {
          ctx.fillStyle = '#00e640';
          ctx.fillRect(0, 0, w, h);

          const bodyGrad = ctx.createLinearGradient(w * 0.2, h * 0.6, w * 0.8, h);
          bodyGrad.addColorStop(0, '#1e293b');
          bodyGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = bodyGrad;
          ctx.beginPath();
          ctx.ellipse(w * 0.5, h * 0.92, w * 0.34, h * 0.28, 0, Math.PI, 0, false);
          ctx.fill();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(w * 0.4, h * 0.68);
          ctx.lineTo(w * 0.6, h * 0.68);
          ctx.lineTo(w * 0.5, h * 0.88);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#f1c27d';
          ctx.fillRect(w * 0.44, h * 0.52, w * 0.12, h * 0.18);

          ctx.fillStyle = '#ffdbac';
          ctx.beginPath();
          ctx.ellipse(w * 0.5, h * 0.42, w * 0.15, h * 0.19, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.arc(w * 0.5, h * 0.36, w * 0.16, Math.PI * 0.95, Math.PI * 2.05);
          ctx.fill();

          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 8;
          ctx.strokeRect(w * 0.39, h * 0.38, w * 0.09, h * 0.06);
          ctx.strokeRect(w * 0.52, h * 0.38, w * 0.09, h * 0.06);
          ctx.beginPath();
          ctx.moveTo(w * 0.48, h * 0.41);
          ctx.lineTo(w * 0.52, h * 0.41);
          ctx.stroke();

          ctx.strokeStyle = '#9a3412';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(w * 0.5, h * 0.47, w * 0.05, 0.15 * Math.PI, 0.85 * Math.PI);
          ctx.stroke();
        }
      },
      {
        name: 'smartwatch-catalog-shot',
        width: 1080,
        height: 1080,
        draw(ctx, w, h) {
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect(0, 0, w, h);

          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.roundRect(w * 0.38, h * 0.12, w * 0.24, h * 0.76, 36);
          ctx.fill();

          ctx.fillStyle = '#94a3b8';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.roundRect(w * 0.29, h * 0.27, w * 0.42, h * 0.46, 68);
          ctx.fill();
          ctx.stroke();

          const screenGrad = ctx.createRadialGradient(w * 0.5, h * 0.5, 20, w * 0.5, h * 0.5, 220);
          screenGrad.addColorStop(0, '#1e1b4b');
          screenGrad.addColorStop(1, '#090b10');
          ctx.fillStyle = screenGrad;
          ctx.beginPath();
          ctx.roundRect(w * 0.32, h * 0.3, w * 0.36, h * 0.4, 52);
          ctx.fill();

          const rings = [
            { r: 110, color: '#f43f5e', end: 1.65 * Math.PI },
            { r: 84, color: '#10b981', end: 1.45 * Math.PI },
            { r: 58, color: '#06b6d4', end: 1.8 * Math.PI }
          ];
          rings.forEach((ring) => {
            ctx.strokeStyle = ring.color;
            ctx.lineWidth = 18;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(w * 0.5, h * 0.5, ring.r, -Math.PI / 2, ring.end);
            ctx.stroke();
          });
        }
      },
      {
        name: 'alpine-sunset-landscape',
        width: 1600,
        height: 1000,
        draw(ctx, w, h) {
          // Multi-band sunset sky + horizon background
          const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
          sky.addColorStop(0, '#1e1b4b');
          sky.addColorStop(0.45, '#7e22ce');
          sky.addColorStop(0.8, '#f97316');
          sky.addColorStop(1, '#fde047');
          ctx.fillStyle = sky;
          ctx.fillRect(0, 0, w, h);

          // Distant mountain horizon band spanning left-to-right
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, h * 0.72, w, h * 0.28);

          // Main Foreground Subject: Vibrant Explorer Hot-Air Balloon in center
          const cx = w * 0.5;
          const cy = h * 0.42;
          const r = 195;

          // Gondola cables & basket (connected to balloon envelope)
          ctx.fillStyle = '#451a03';
          ctx.fillRect(cx - 42, cy + r - 12, 84, 55);
          ctx.fillStyle = '#b45309';
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.roundRect(cx - 52, cy + r + 28, 104, 76, 14);
          ctx.fill();
          ctx.stroke();

          // Balloon outer envelope
          const balGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
          balGrad.addColorStop(0, '#ef4444');
          balGrad.addColorStop(0.5, '#f59e0b');
          balGrad.addColorStop(1, '#ec4899');
          ctx.fillStyle = balGrad;
          ctx.strokeStyle = '#7f1d1d';
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Inner cyan/indigo stripe
          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.ellipse(cx, cy, r * 0.55, r * 0.96, 0, 0, Math.PI * 2);
          ctx.fill();

          // Center gold star/emblem
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(cx, cy, r * 0.24, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    ];

    const files = [];
    for (const s of samples) {
      const c = document.createElement('canvas');
      c.width = s.width;
      c.height = s.height;
      s.draw(c.getContext('2d'), s.width, s.height);
      const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
      files.push(new File([blob], `${s.name}.png`, { type: 'image/png' }));
    }
    await addFiles(files);
  }

  // ==================== 1. COLOR GRADING, LUTS & SHARPENING ====================
  function hasColorAdjustments() {
    const s = state.settings;
    return (
      s.filterPreset !== 'none' ||
      s.brightness !== 0 ||
      s.contrast !== 0 ||
      s.exposure !== 0 ||
      s.saturation !== 0 ||
      s.vibrance !== 0 ||
      s.highlights !== 0 ||
      s.shadows !== 0 ||
      s.warmth !== 0 ||
      s.sharpen > 0
    );
  }

  function applyColorGradingAndSharpen(ctx, w, h) {
    if (!hasColorAdjustments()) return;
    const s = state.settings;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    // Combine preset offsets with manual sliders
    let bright = s.brightness;
    let cont = s.contrast;
    let exp = s.exposure;
    let sat = s.saturation;
    let vib = s.vibrance;
    let high = s.highlights;
    let shad = s.shadows;
    let warm = s.warmth;
    let isBW = false;
    let isMatte = false;
    let isCinematic = false;

    if (s.filterPreset === 'ecommerce') {
      bright += 8;
      cont += 14;
      sat += 10;
      high += 10;
    } else if (s.filterPreset === 'bw') {
      isBW = true;
      cont += 18;
    } else if (s.filterPreset === 'vintage') {
      warm += 28;
      sat -= 15;
      cont += 8;
      isMatte = true;
    } else if (s.filterPreset === 'cinematic') {
      isCinematic = true;
      cont += 16;
      sat += 8;
    } else if (s.filterPreset === 'matte') {
      isMatte = true;
      cont -= 8;
      shad += 18;
    }

    const expMult = Math.pow(2, exp / 65);
    const brightOffset = (bright / 100) * 90;
    const cFactor = (259 * (cont * 1.8 + 255)) / (255 * (259 - cont * 1.8));
    const satMult = 1 + sat / 100;
    const vibStrength = vib / 100;
    const warmR = (warm / 100) * 35;
    const warmB = -(warm / 100) * 35;

    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      // Exposure & Brightness
      r = r * expMult + brightOffset;
      g = g * expMult + brightOffset;
      b = b * expMult + brightOffset;

      // Shadows & Highlights based on luminance
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (shad !== 0) {
        const sWeight = Math.pow(1 - Math.min(1, Math.max(0, lum)), 1.6);
        const sDelta = (shad / 100) * 75 * sWeight;
        r += sDelta;
        g += sDelta;
        b += sDelta;
      }
      if (high !== 0) {
        const hWeight = Math.pow(Math.min(1, Math.max(0, lum)), 1.6);
        const hDelta = (high / 100) * 75 * hWeight;
        r += hDelta;
        g += hDelta;
        b += hDelta;
      }

      // Contrast
      r = cFactor * (r - 128) + 128;
      g = cFactor * (g - 128) + 128;
      b = cFactor * (b - 128) + 128;

      // Warmth
      r += warmR;
      b += warmB;

      // Cinematic Teal & Orange split-tone
      if (isCinematic) {
        if (lum < 0.5) {
          b += 14 * (1 - lum * 2);
          g += 5 * (1 - lum * 2);
        } else {
          r += 16 * ((lum - 0.5) * 2);
          g += 6 * ((lum - 0.5) * 2);
        }
      }

      // Saturation & Vibrance
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      if (isBW) {
        r = g = b = gray;
      } else {
        let localSat = satMult;
        if (vibStrength !== 0) {
          const maxC = Math.max(r, g, b);
          const minC = Math.min(r, g, b);
          const curSat = (maxC - minC) / 255;
          localSat += vibStrength * (1 - curSat);
        }
        r = gray + (r - gray) * localSat;
        g = gray + (g - gray) * localSat;
        b = gray + (b - gray) * localSat;
      }

      // Matte lifted blacks
      if (isMatte) {
        r = 22 + r * 0.88;
        g = 22 + g * 0.88;
        b = 24 + b * 0.88;
      }

      d[i] = Math.max(0, Math.min(255, r));
      d[i + 1] = Math.max(0, Math.min(255, g));
      d[i + 2] = Math.max(0, Math.min(255, b));
    }

    // Optional Unsharp Mask / Clarity Convolution
    if (s.sharpen > 0) {
      const amount = (s.sharpen / 100) * 1.1;
      const srcCopy = new Uint8ClampedArray(d);
      const rowStride = w * 4;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * rowStride + x * 4;
          if (srcCopy[idx + 3] === 0) continue;
          for (let c = 0; c < 3; c++) {
            const center = srcCopy[idx + c];
            const neighbors =
              srcCopy[idx - 4 + c] +
              srcCopy[idx + 4 + c] +
              srcCopy[idx - rowStride + c] +
              srcCopy[idx + rowStride + c];
            const edge = center * 4 - neighbors;
            d[idx + c] = Math.max(0, Math.min(255, center + edge * amount * 0.25));
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }

  // ==================== 5. PRIVACY REDACTION (MOSAIC & BLUR) ====================
  function applyPrivacyRedaction(ctx, item) {
    if (!item.hasRedaction || !item.redactMask) return;
    const w = item.width;
    const h = item.height;
    const rm = item.redactMask;

    // Create pixelated mosaic version & blurred version of the source
    const blockSize = Math.max(10, Math.round(Math.max(w, h) / 48));
    const smallW = Math.max(1, Math.round(w / blockSize));
    const smallH = Math.max(1, Math.round(h / blockSize));

    const mosSmall = document.createElement('canvas');
    mosSmall.width = smallW;
    mosSmall.height = smallH;
    mosSmall.getContext('2d').drawImage(ctx.canvas, 0, 0, smallW, smallH);

    const mosFull = document.createElement('canvas');
    mosFull.width = w;
    mosFull.height = h;
    const mfCtx = mosFull.getContext('2d');
    mfCtx.imageSmoothingEnabled = false;
    mfCtx.drawImage(mosSmall, 0, 0, w, h);
    const mosData = mfCtx.getImageData(0, 0, w, h).data;

    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = w;
    blurCanvas.height = h;
    const bCtx = blurCanvas.getContext('2d');
    bCtx.filter = 'blur(18px)';
    bCtx.drawImage(ctx.canvas, 0, 0);
    const blurData = bCtx.getImageData(0, 0, w, h).data;

    const mainImgData = ctx.getImageData(0, 0, w, h);
    const d = mainImgData.data;

    for (let i = 0; i < rm.length; i++) {
      const p = i * 4;
      if (rm[i] === 1) {
        d[p] = mosData[p];
        d[p + 1] = mosData[p + 1];
        d[p + 2] = mosData[p + 2];
      } else if (rm[i] === 2) {
        d[p] = blurData[p];
        d[p + 1] = blurData[p + 1];
        d[p + 2] = blurData[p + 2];
      }
    }

    ctx.putImageData(mainImgData, 0, 0);
  }

  // ==================== AUTOMATIC OBJECT DETECTION & BACKGROUND REMOVAL ====================

  /**
   * Fast RGB -> Perceptual CIE L*a*b* conversion for lighting-invariant object/background separation
   */
  function rgbToLab(r, g, b) {
    let rn = r / 255, gn = g / 255, bn = b / 255;
    rn = rn > 0.04045 ? Math.pow((rn + 0.055) / 1.055, 2.4) : rn / 12.92;
    gn = gn > 0.04045 ? Math.pow((gn + 0.055) / 1.055, 2.4) : gn / 12.92;
    bn = bn > 0.04045 ? Math.pow((bn + 0.055) / 1.055, 2.4) : bn / 12.92;

    let x = (rn * 0.4124 + gn * 0.3576 + bn * 0.1805) / 0.95047;
    let y = (rn * 0.2126 + gn * 0.7152 + bn * 0.0722) / 1.00000;
    let z = (rn * 0.0193 + gn * 0.1192 + bn * 0.9505) / 1.08883;

    x = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 16 / 116;

    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  }

  /**
   * Connected-Component Foreground Object Island Cleanup & Interior Hole Filling
   * Also computes the tight Bounding Box of the detected foreground object(s).
   */
  function cleanupObjectMaskAndFindBBox(alpha, w, h, enableCleanup = true) {
    const total = w * h;
    if (enableCleanup) {
      // 1. Keep only significant connected foreground components (removes stray background noise islands)
      const labels = new Int32Array(total);
      const compSizes = [0];
      let nextLabel = 1;
      const queue = new Int32Array(total);

      for (let i = 0; i < total; i++) {
        if (alpha[i] > 110 && labels[i] === 0) {
          const lbl = nextLabel++;
          let head = 0, tail = 0;
          queue[tail++] = i;
          labels[i] = lbl;
          let count = 0;

          while (head < tail) {
            const idx = queue[head++];
            count++;
            const x = idx % w;
            const y = (idx - x) / w;
            if (x > 0 && alpha[idx - 1] > 110 && labels[idx - 1] === 0) { labels[idx - 1] = lbl; queue[tail++] = idx - 1; }
            if (x < w - 1 && alpha[idx + 1] > 110 && labels[idx + 1] === 0) { labels[idx + 1] = lbl; queue[tail++] = idx + 1; }
            if (y > 0 && alpha[idx - w] > 110 && labels[idx - w] === 0) { labels[idx - w] = lbl; queue[tail++] = idx - w; }
            if (y < h - 1 && alpha[idx + w] > 110 && labels[idx + w] === 0) { labels[idx + w] = lbl; queue[tail++] = idx + w; }
          }
          compSizes[lbl] = count;
        }
      }

      // Find largest foreground object component
      let maxCompSize = 0;
      for (let l = 1; l < compSizes.length; l++) {
        if (compSizes[l] > maxCompSize) maxCompSize = compSizes[l];
      }

      // Remove tiny disconnected background specks (< 1.5% of main object size)
      const minKeepSize = Math.max(24, Math.round(maxCompSize * 0.015));
      for (let i = 0; i < total; i++) {
        const lbl = labels[i];
        if (lbl > 0 && compSizes[lbl] < minKeepSize) {
          alpha[i] = 0;
        }
      }

      // 2. Fill small interior holes trapped inside the foreground object
      const extBg = new Uint8Array(total);
      let head = 0, tail = 0;
      function seedBg(idx) {
        if (alpha[idx] <= 110 && extBg[idx] === 0) {
          extBg[idx] = 1;
          queue[tail++] = idx;
        }
      }
      for (let x = 0; x < w; x++) { seedBg(x); seedBg((h - 1) * w + x); }
      for (let y = 0; y < h; y++) { seedBg(y * w); seedBg(y * w + (w - 1)); }

      while (head < tail) {
        const idx = queue[head++];
        const x = idx % w;
        const y = (idx - x) / w;
        if (x > 0) seedBg(idx - 1);
        if (x < w - 1) seedBg(idx + 1);
        if (y > 0) seedBg(idx - w);
        if (y < h - 1) seedBg(idx + w);
      }

      // Any unreached transparent pocket is an interior hole -> restore if small/enclosed
      for (let i = 0; i < total; i++) {
        if (alpha[i] <= 110 && extBg[i] === 0) {
          alpha[i] = 255;
        }
      }
    }

    // 3. Compute Detected Object Bounding Box
    let minX = w, minY = h, maxX = 0, maxY = 0, fgCount = 0;
    for (let y = 0; y < h; y++) {
      const rowOff = y * w;
      for (let x = 0; x < w; x++) {
        if (alpha[rowOff + x] > 128) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          fgCount++;
        }
      }
    }

    if (fgCount === 0) {
      return { minX: 0, minY: 0, maxX: w - 1, maxY: h - 1, width: w, height: h, coveragePct: 100 };
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      coveragePct: Math.round((fgCount / total) * 100)
    };
  }

  /**
   * Displays the animated green Object Detection Bounding Box on the Single Studio canvas
   */
  let detectBoxTimer = null;
  function flashDetectedObjectBox(item) {
    if (!item || !item.detectedBBox || state.mode !== 'single') return;
    const b = item.detectedBBox;
    const leftPct = (b.minX / item.width) * 100;
    const topPct = (b.minY / item.height) * 100;
    const widthPct = (b.width / item.width) * 100;
    const heightPct = (b.height / item.height) * 100;

    el.objectDetectBox.style.left = `${leftPct}%`;
    el.objectDetectBox.style.top = `${topPct}%`;
    el.objectDetectBox.style.width = `${widthPct}%`;
    el.objectDetectBox.style.height = `${heightPct}%`;
    el.objectDetectLabel.textContent = `🎯 Object Detected (${b.width}×${b.height} px • ${b.coveragePct}% area)`;
    el.objectDetectBox.classList.remove('hidden');
    el.objectDetectBox.style.opacity = '1';

    el.detectedObjectInfo.textContent = `🎯 Isolated Object: ${b.width}×${b.height} px (${b.coveragePct}% fg)`;
    el.detectedObjectInfo.classList.remove('hidden');

    if (detectBoxTimer) clearTimeout(detectBoxTimer);
    detectBoxTimer = setTimeout(() => {
      el.objectDetectBox.style.opacity = '0';
      setTimeout(() => el.objectDetectBox.classList.add('hidden'), 350);
    }, 2100);
  }

  /**
   * Deep Neural AI Object Segmentation (RMBG-1.4 via @huggingface/transformers ONNX in browser)
   */
  let neuralModelPromise = null;
  async function runNeuralObjectDetection(item) {
    if (item.neuralAlphaMap) return item.neuralAlphaMap;

    try {
      el.processingOverlay.classList.remove('hidden');
      el.processingText.textContent = 'Loading Neural Object Detector (RMBG-1.4)...';

      if (!neuralModelPromise) {
        neuralModelPromise = (async () => {
          const { AutoModel, AutoProcessor, RawImage } = await import(
            'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.1.2'
          );
          const model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
            config: { model_type: 'custom' }
          });
          const processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4', {
            config: {
              do_normalize: true,
              do_pad: false,
              do_rescale: true,
              do_resize: true,
              image_mean: [0.5, 0.5, 0.5],
              feature_extractor_type: 'ImageFeatureExtractor',
              image_std: [1, 1, 1],
              resample: 2,
              rescale_factor: 0.00392156862745098,
              size: { width: 1024, height: 1024 }
            }
          });
          return { model, processor, RawImage };
        })();
      }

      const { model, processor, RawImage } = await neuralModelPromise;
      el.processingText.textContent = `Detecting foreground object in "${item.originalFileName}"...`;

      // Convert item image to dataURL for RawImage
      const c = document.createElement('canvas');
      c.width = item.width;
      c.height = item.height;
      c.getContext('2d').drawImage(item.imgElement, 0, 0);
      const rawImg = await RawImage.fromURL(c.toDataURL('image/png'));

      const { pixel_values } = await processor(rawImg);
      const { output } = await model({ input: pixel_values });

      // Safely extract 2D mask from 3D [1, H, W] or 4D [1, 1, H, W] tensor
      const tensor = output[0];
      const floatData = tensor.data;
      const dims = tensor.dims || [1, 1, 1024, 1024];
      const mh = dims[dims.length - 2] || 1024;
      const mw = dims[dims.length - 1] || 1024;
      const maskLen = mw * mh;

      let minV = Infinity;
      let maxV = -Infinity;
      for (let i = 0; i < maskLen; i++) {
        const v = floatData[i];
        if (v < minV) minV = v;
        if (v > maxV) maxV = v;
      }
      const range = maxV - minV || 1;

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = mw;
      maskCanvas.height = mh;
      const mCtx = maskCanvas.getContext('2d');
      const mImgData = mCtx.createImageData(mw, mh);
      const md = mImgData.data;
      for (let i = 0; i < maskLen; i++) {
        const norm = Math.max(0, Math.min(255, Math.round(((floatData[i] - minV) / range) * 255)));
        const p = i * 4;
        md[p] = norm;
        md[p + 1] = norm;
        md[p + 2] = norm;
        md[p + 3] = 255;
      }
      mCtx.putImageData(mImgData, 0, 0);

      // Resize mask to exact image dimensions
      const resizedCanvas = document.createElement('canvas');
      resizedCanvas.width = item.width;
      resizedCanvas.height = item.height;
      const rCtx = resizedCanvas.getContext('2d');
      rCtx.imageSmoothingEnabled = true;
      rCtx.imageSmoothingQuality = 'high';
      rCtx.drawImage(maskCanvas, 0, 0, item.width, item.height);
      const resizedData = rCtx.getImageData(0, 0, item.width, item.height).data;

      const neuralAlpha = new Uint8ClampedArray(item.width * item.height);
      for (let i = 0; i < neuralAlpha.length; i++) {
        neuralAlpha[i] = resizedData[i * 4];
      }

      // Sanity check: verify central main object was NOT erased
      let centerFg = 0;
      let centerTotal = 0;
      const x0 = Math.floor(item.width * 0.25), x1 = Math.ceil(item.width * 0.75);
      const y0 = Math.floor(item.height * 0.25), y1 = Math.ceil(item.height * 0.75);
      for (let y = y0; y < y1; y++) {
        const ro = y * item.width;
        for (let x = x0; x < x1; x++) {
          centerTotal++;
          if (neuralAlpha[ro + x] > 120) centerFg++;
        }
      }
      if (centerTotal > 0 && centerFg / centerTotal < 0.08) {
        console.warn('Neural mask had <8% central foreground; using edge-barrier salient detector.');
        el.processingOverlay.classList.add('hidden');
        return null;
      }

      item.neuralAlphaMap = neuralAlpha;
      item.cachedAiKey = null;
      el.processingOverlay.classList.add('hidden');
      return neuralAlpha;
    } catch (err) {
      console.warn('Neural ONNX fallback to Edge-Barrier Salient Object Detector:', err);
      el.processingOverlay.classList.add('hidden');
      return null;
    }
  }

  /**
   * 3-Stage Main Object Detection & Background Removal Engine
   * - Stage A: Perceptual CIE-LAB Multi-Side Corner Consensus + Direct-Step & Smooth-Gradient/Shadow Flood-Fill
   * - Stage B: Horizontal/Vertical Horizon-Band Flood-Fill (for multi-stop sky/horizon/wall scenes)
   * - Stage C: Center-Surround Saliency Contrast Isolation (when scene has non-uniform textured borders)
   */
  function detectSalientObjectFast(item, d, w, h) {
    const totalPixels = w * h;

    // 1. Precompute Perceptual CIE-LAB values for all pixels
    const labL = new Float32Array(totalPixels);
    const labA = new Float32Array(totalPixels);
    const labB = new Float32Array(totalPixels);
    for (let i = 0; i < totalPixels; i++) {
      const p = i * 4;
      const lab = rgbToLab(d[p], d[p + 1], d[p + 2]);
      labL[i] = lab[0];
      labA[i] = lab[1];
      labB[i] = lab[2];
    }

    // 2. Sample 4 corners + top/left/right borders + outer 18% of bottom border
    // (Excludes bottom-center 18..82% where standing subjects/portraits touch the bottom edge)
    const samples = [];
    const stepX = Math.max(1, Math.floor(w / 48));
    const stepY = Math.max(1, Math.floor(h / 48));
    const marginX = Math.max(1, Math.min(5, Math.floor(w * 0.012)));
    const marginY = Math.max(1, Math.min(5, Math.floor(h * 0.012)));

    for (let x = 0; x < w; x += stepX) {
      const idxTop = marginY * w + x;
      samples.push({ l: labL[idxTop], a: labA[idxTop], b: labB[idxTop], side: 0 });
      if (x < w * 0.18 || x > w * 0.82) {
        const idxBot = (h - 1 - marginY) * w + x;
        samples.push({ l: labL[idxBot], a: labA[idxBot], b: labB[idxBot], side: 1 });
      }
    }
    for (let y = 0; y < h; y += stepY) {
      const idxLeft = y * w + marginX;
      const idxRight = y * w + (w - 1 - marginX);
      samples.push({ l: labL[idxLeft], a: labA[idxLeft], b: labB[idxLeft], side: 2 });
      samples.push({ l: labL[idxRight], a: labA[idxRight], b: labB[idxRight], side: 3 });
    }

    const clusters = [];
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      let matched = false;
      for (let j = 0; j < clusters.length; j++) {
        const c = clusters[j];
        const dist = Math.hypot((s.l - c.l) * 0.85, s.a - c.a, s.b - c.b);
        if (dist < 14.0) {
          c.l = (c.l * c.count + s.l) / (c.count + 1);
          c.a = (c.a * c.count + s.a) / (c.count + 1);
          c.b = (c.b * c.count + s.b) / (c.count + 1);
          c.count++;
          c.sides.add(s.side);
          matched = true;
          break;
        }
      }
      if (!matched) {
        clusters.push({ l: s.l, a: s.a, b: s.b, count: 1, sides: new Set([s.side]) });
      }
    }

    clusters.sort((a, b) => b.count - a.count);
    let bgCentroids = clusters
      .filter((c) => c.sides.size >= 2 || c.count >= samples.length * 0.16)
      .slice(0, 6);
    if (bgCentroids.length === 0 && clusters.length > 0) {
      bgCentroids = clusters.slice(0, Math.min(3, clusters.length));
    }

    // Precompute minimum perceptual LAB distance and Chromaticity (a,b) distance to verified background clusters
    const minD = new Float32Array(totalPixels);
    const minChromaD = new Float32Array(totalPixels);
    for (let i = 0; i < totalPixels; i++) {
      let bestD = 1e9;
      let bestCD = 1e9;
      const l = labL[i], a = labA[i], b = labB[i];
      for (let k = 0; k < bgCentroids.length; k++) {
        const c = bgCentroids[k];
        const dl = (l - c.l) * 0.85;
        const da = a - c.a;
        const db = b - c.b;
        const cd = Math.hypot(da, db);
        const dist = Math.hypot(dl, cd);
        if (dist < bestD) bestD = dist;
        if (cd < bestCD) bestCD = cd;
      }
      minD[i] = bestD;
      minChromaD[i] = bestCD;
    }

    const sens = state.settings.aiSensitivity; // 10..95
    const stepLimit = 12.0 + (sens / 100) * 14.0;   // 19.0 at sens=50
    const colorTol = 16.0 + (sens / 100) * 16.0;    // 24.0 at sens=50
    const smoothTol = colorTol * 1.48;              // 35.5 for smooth gradients & soft floor shadows

    const bgMask = new Uint8Array(totalPixels);
    const queue = new Int32Array(totalPixels);
    let head = 0, tail = 0;
    let bgCount = 0;

    function trySeed(x, y, strictBottomCenter) {
      const idx = y * w + x;
      if (!bgMask[idx]) {
        const tol = strictBottomCenter ? colorTol * 0.85 : colorTol * 1.25;
        if (minD[idx] <= tol) {
          bgMask[idx] = 1;
          bgCount++;
          queue[tail++] = idx;
        }
      }
    }

    for (let x = 0; x < w; x++) {
      trySeed(x, 0, false);
      const isBottomCenter = x > w * 0.18 && x < w * 0.82;
      trySeed(x, h - 1, isBottomCenter);
    }
    for (let y = 0; y < h; y++) {
      trySeed(0, y, false);
      trySeed(w - 1, y, false);
    }

    // Stage A: Flood-fill using direct neighbor step |RGB(nIdx) - RGB(idx)|
    // Smooth gradients and soft floor shadows pass seamlessly while crisp object outlines stop cold!
    while (head < tail) {
      const idx = queue[head++];
      const p = idx * 4;
      const r0 = d[p], g0 = d[p + 1], b0 = d[p + 2];
      const x = idx % w;
      const y = (idx - x) / w;

      const n0 = x > 0 ? idx - 1 : -1;
      const n1 = x < w - 1 ? idx + 1 : -1;
      const n2 = y > 0 ? idx - w : -1;
      const n3 = y < h - 1 ? idx + w : -1;
      const nbs = [n0, n1, n2, n3];

      for (let k = 0; k < 4; k++) {
        const nIdx = nbs[k];
        if (nIdx >= 0 && !bgMask[nIdx]) {
          const np = nIdx * 4;
          const step = Math.hypot(r0 - d[np], g0 - d[np + 1], b0 - d[np + 2]);
          if (step <= stepLimit) {
            const dv = minD[nIdx];
            if (
              dv <= colorTol ||
              (step <= 7.5 && dv <= smoothTol && minChromaD[nIdx] <= 18.0)
            ) {
              bgMask[nIdx] = 1;
              bgCount++;
              queue[tail++] = nIdx;
            }
          }
        }
      }
    }

    // Stage B: Multi-Band Horizon / Gradient Background Flood-Fill
    // Triggers when Stage A removed < 45% of the frame (e.g., sunset sky + mountains, wall + floor)
    if (bgCount / totalPixels < 0.45) {
      const rowTol = 22.0 + (sens / 100) * 24.0;
      const rowLrDiff = new Float32Array(h);
      const rowLeftR = new Float32Array(h), rowLeftG = new Float32Array(h), rowLeftB = new Float32Array(h);
      const rowRightR = new Float32Array(h), rowRightG = new Float32Array(h), rowRightB = new Float32Array(h);

      const lx = Math.min(2, w - 1);
      const rx = Math.max(0, w - 3);
      for (let y = 0; y < h; y++) {
        const pl = (y * w + lx) * 4;
        const pr = (y * w + rx) * 4;
        rowLeftR[y] = d[pl]; rowLeftG[y] = d[pl + 1]; rowLeftB[y] = d[pl + 2];
        rowRightR[y] = d[pr]; rowRightG[y] = d[pr + 1]; rowRightB[y] = d[pr + 2];
        rowLrDiff[y] = Math.hypot(d[pl] - d[pr], d[pl + 1] - d[pr + 1], d[pl + 2] - d[pr + 2]);
      }

      head = 0;
      tail = 0;
      for (let y = 0; y < h; y++) {
        if (rowLrDiff[y] <= 55.0) {
          const iL = y * w;
          const iR = y * w + (w - 1);
          if (!bgMask[iL]) { bgMask[iL] = 1; bgCount++; }
          if (!bgMask[iR]) { bgMask[iR] = 1; bgCount++; }
          queue[tail++] = iL;
          queue[tail++] = iR;
        }
      }

      const bandStepLimit = stepLimit * 1.15;
      while (head < tail) {
        const idx = queue[head++];
        const p = idx * 4;
        const r0 = d[p], g0 = d[p + 1], b0 = d[p + 2];
        const x = idx % w;
        const y = (idx - x) / w;

        const n0 = x > 0 ? idx - 1 : -1;
        const n1 = x < w - 1 ? idx + 1 : -1;
        const n2 = y > 0 ? idx - w : -1;
        const n3 = y < h - 1 ? idx + w : -1;
        const nbs = [n0, n1, n2, n3];

        for (let k = 0; k < 4; k++) {
          const nIdx = nbs[k];
          if (nIdx >= 0 && !bgMask[nIdx]) {
            const nx = nIdx % w;
            const ny = (nIdx - nx) / w;
            if (rowLrDiff[ny] <= 55.0) {
              const np = nIdx * 4;
              const nr = d[np], ng = d[np + 1], nb = d[np + 2];
              const step = Math.hypot(r0 - nr, g0 - ng, b0 - nb);
              if (step <= bandStepLimit) {
                const dl = Math.hypot(nr - rowLeftR[ny], ng - rowLeftG[ny], nb - rowLeftB[ny]);
                const dr = Math.hypot(nr - rowRightR[ny], ng - rowRightG[ny], nb - rowRightB[ny]);
                if (Math.min(dl, dr) <= rowTol) {
                  bgMask[nIdx] = 1;
                  bgCount++;
                  queue[tail++] = nIdx;
                }
              }
            }
          }
        }
      }
    }

    // Build output alpha and apply 1px anti-aliased halo feathering along the exterior object contour
    const alpha = new Uint8ClampedArray(totalPixels);
    for (let i = 0; i < totalPixels; i++) {
      if (bgMask[i]) {
        alpha[i] = 0;
      } else {
        let aVal = d[i * 4 + 3];
        const x = i % w;
        const y = (i - x) / w;
        if (x > 0 && x < w - 1 && y > 0 && y < h - 1) {
          const adjBg = bgMask[i - 1] + bgMask[i + 1] + bgMask[i - w] + bgMask[i + w];
          if (adjBg > 0 && minD[i] < colorTol * 1.15) {
            const factor = Math.max(0.3, Math.min(1, (minD[i] - colorTol * 0.4) / (colorTol * 0.75)));
            aVal = Math.round(aVal * factor);
          }
        }
        alpha[i] = aVal;
      }
    }

    return alpha;
  }

  /**
   * Main Subject Alpha Mask Computer (combines Neural AI, 3-Stage Salient Object Detector, Chroma Key, Island Cleanup & Manual Brush)
   */
  function computeSubjectAlphaMask(item, srcData) {
    const w = item.width;
    const h = item.height;
    const d = srcData.data;
    const totalPixels = w * h;
    const alpha = new Uint8ClampedArray(totalPixels);

    for (let i = 0; i < totalPixels; i++) {
      alpha[i] = d[i * 4 + 3];
    }

    const mode = state.settings.bgRemovalMode;

    if (mode === 'color') {
      const target = hexToRgb(state.settings.chromaColor);
      const tol = (state.settings.chromaTolerance / 100) * 441.67;
      const feather = (state.settings.chromaFeather / 100) * 180 + 1;

      if (state.settings.chromaContiguous) {
        const visited = new Uint8Array(totalPixels);
        const bgMask = new Uint8Array(totalPixels);
        const queue = new Int32Array(totalPixels);
        let head = 0, tail = 0;

        function pushBorder(x, y) {
          const idx = y * w + x;
          if (!visited[idx]) {
            visited[idx] = 1;
            queue[tail++] = idx;
          }
        }
        for (let x = 0; x < w; x++) { pushBorder(x, 0); pushBorder(x, h - 1); }
        for (let y = 0; y < h; y++) { pushBorder(0, y); pushBorder(w - 1, y); }

        const hardLimit = tol + feather * 0.5;
        while (head < tail) {
          const idx = queue[head++];
          const p = idx * 4;
          const dist = Math.hypot(d[p] - target.r, d[p + 1] - target.g, d[p + 2] - target.b);
          if (dist <= hardLimit) {
            bgMask[idx] = 1;
            const x = idx % w;
            const y = (idx - x) / w;
            if (x > 0 && !visited[idx - 1]) { visited[idx - 1] = 1; queue[tail++] = idx - 1; }
            if (x < w - 1 && !visited[idx + 1]) { visited[idx + 1] = 1; queue[tail++] = idx + 1; }
            if (y > 0 && !visited[idx - w]) { visited[idx - w] = 1; queue[tail++] = idx - w; }
            if (y < h - 1 && !visited[idx + w]) { visited[idx + w] = 1; queue[tail++] = idx + w; }
          }
        }

        for (let i = 0; i < totalPixels; i++) {
          if (bgMask[i]) {
            const p = i * 4;
            const dist = Math.hypot(d[p] - target.r, d[p + 1] - target.g, d[p + 2] - target.b);
            if (dist <= tol) alpha[i] = 0;
            else alpha[i] = Math.round(alpha[i] * Math.min(1, (dist - tol) / feather));
          }
        }
      } else {
        for (let i = 0; i < totalPixels; i++) {
          const p = i * 4;
          const dist = Math.hypot(d[p] - target.r, d[p + 1] - target.g, d[p + 2] - target.b);
          if (dist <= tol) alpha[i] = 0;
          else if (dist < tol + feather) alpha[i] = Math.round(alpha[i] * ((dist - tol) / feather));
        }
      }
      item.detectedBBox = cleanupObjectMaskAndFindBBox(alpha, w, h, false);
    } else if (mode === 'ai') {
      const cacheKey = `${state.settings.aiEngine}_${state.settings.aiSensitivity}_${state.settings.aiFeather}_${state.settings.cleanupIslands}_${Boolean(item.neuralAlphaMap)}`;
      if (item.cachedAiAlpha && item.cachedAiKey === cacheKey) {
        alpha.set(item.cachedAiAlpha);
      } else {
        // Compute 3-Stage Salient Object Mask
        const fastAlpha = detectSalientObjectFast(item, d, w, h);

        if (item.neuralAlphaMap && state.settings.aiEngine !== 'fast') {
          const threshOffset = ((50 - state.settings.aiSensitivity) / 50) * 65;
          // Use the Deep Neural AI alpha map directly so complex backgrounds are cleanly removed
          for (let i = 0; i < totalPixels; i++) {
            const nv = Math.max(0, Math.min(255, Math.round(item.neuralAlphaMap[i] - threshOffset)));
            alpha[i] = nv;
          }
        } else {
          alpha.set(fastAlpha);
        }

        // Connected-Component Island Cleanup & Interior Hole Filling + Bounding Box
        item.detectedBBox = cleanupObjectMaskAndFindBBox(
          alpha,
          w,
          h,
          state.settings.cleanupIslands
        );

        // Edge Feather / Smoothness
        if (state.settings.aiFeather > 0) {
          boxBlurAlpha(alpha, w, h, state.settings.aiFeather);
        }

        item.cachedAiAlpha = new Uint8ClampedArray(alpha);
        item.cachedAiKey = cacheKey;
      }
    }

    if (item.hasManualBrush && item.brushMask) {
      const bm = item.brushMask;
      for (let i = 0; i < totalPixels; i++) {
        if (bm[i] === 0) alpha[i] = 0;
        else if (bm[i] === 255) alpha[i] = 255;
      }
    }

    return alpha;
  }

  /**
   * 1-Click Automatic Object Detection & Background Removal Runner (Single & Bulk)
   */
  async function runAutoDetectAndRemoveBg(targetItem) {
    const item = targetItem || getActiveItem();
    if (!item) {
      showToast('Please add an image first.');
      return;
    }

    // Clear any manual brush override so auto-detection has a clean slate
    if (item.hasManualBrush && item.brushMask) {
      item.brushMask.fill(128);
      item.hasManualBrush = false;
    }

    setBgRemovalMode('ai');
    item.cachedAiKey = null;

    // 1. Run 3-Stage CIE-LAB + Horizon-Band Salient Object Detector immediately
    await renderSinglePreview(true);
    flashDetectedObjectBox(item);

    // 2. If engine is 'neural', OR if 'hybrid' and the scene has a complex natural background (coverage > 68%),
    // automatically run Deep Neural RMBG-1.4 segmentation to remove the complex background!
    const needsNeuralForComplexScene =
      state.settings.aiEngine === 'neural' ||
      (state.settings.aiEngine === 'hybrid' &&
        item.detectedBBox &&
        item.detectedBBox.coveragePct > 68);

    if (needsNeuralForComplexScene) {
      const neuralAlpha = await runNeuralObjectDetection(item);
      if (neuralAlpha) {
        item.cachedAiKey = null;
        await renderSinglePreview(true);
        flashDetectedObjectBox(item);
        showToast(
          `Neural AI isolated main object (${item.detectedBBox ? item.detectedBBox.width + '×' + item.detectedBBox.height + ' px • ' + item.detectedBBox.coveragePct + '% area' : 'complete'})!`
        );
        return;
      }
    }

    showToast(
      `Main object isolated & background removed (${item.detectedBBox ? item.detectedBBox.width + '×' + item.detectedBBox.height + ' px • ' + item.detectedBBox.coveragePct + '% area' : 'complete'})!`
    );
  }

  async function runBulkAutoRemoveBg() {
    if (state.items.length === 0) {
      showToast('Add images to the batch first.');
      return;
    }
    setBgRemovalMode('ai');
    el.bulkProgressContainer.classList.remove('hidden');

    for (let i = 0; i < state.items.length; i++) {
      const it = state.items[i];
      const pct = Math.round(((i + 1) / state.items.length) * 100);
      el.bulkProgressLabel.textContent = `Auto-detecting object ${i + 1} of ${state.items.length}: ${it.originalFileName}...`;
      el.bulkProgressPercent.textContent = `${pct}%`;
      el.bulkProgressBar.style.width = `${pct}%`;

      if (it.hasManualBrush && it.brushMask) {
        it.brushMask.fill(128);
        it.hasManualBrush = false;
      }
      it.cachedAiKey = null;
      if (state.settings.aiEngine === 'neural') {
        await runNeuralObjectDetection(it);
      }
    }

    await renderBulkGrid();
    setTimeout(() => el.bulkProgressContainer.classList.add('hidden'), 800);
    showToast(`Automatically isolated objects & removed backgrounds across ${state.items.length} images!`);
  }

  /**
   * Interactive "🎯 Click Object" Smart Object Isolator
   * Click any specific object on the canvas to segment & keep that entire contiguous object and remove everything else!
   */
  function isolateClickedObjectAtEvent(e) {
    const item = getActiveItem();
    if (!item) return;

    const rect = el.previewCanvas.getBoundingClientRect();
    const u = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const seedX = Math.min(item.width - 1, Math.floor(u * item.width));
    const seedY = Math.min(item.height - 1, Math.floor(v * item.height));

    const temp = document.createElement('canvas');
    temp.width = item.width;
    temp.height = item.height;
    const tCtx = temp.getContext('2d');
    tCtx.drawImage(item.imgElement, 0, 0);
    const d = tCtx.getImageData(0, 0, item.width, item.height).data;

    const w = item.width, h = item.height;
    const total = w * h;
    const seedIdx = seedY * w + seedX;

    // First run Edge-Barrier Salient Object Detector to see if user clicked inside a multi-color foreground object
    const salientMask = detectSalientObjectFast(item, d, w, h);
    cleanupObjectMaskAndFindBBox(salientMask, w, h, false);

    const visited = new Uint8Array(total);
    const objMask = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0, tail = 0;

    if (salientMask[seedIdx] > 80) {
      // Flood-fill the entire connected foreground object component containing (seedX, seedY)
      visited[seedIdx] = 1;
      queue[tail++] = seedIdx;
      while (head < tail) {
        const idx = queue[head++];
        objMask[idx] = 1;
        const x = idx % w;
        const y = (idx - x) / w;
        if (x > 0 && !visited[idx - 1] && salientMask[idx - 1] > 80) { visited[idx - 1] = 1; queue[tail++] = idx - 1; }
        if (x < w - 1 && !visited[idx + 1] && salientMask[idx + 1] > 80) { visited[idx + 1] = 1; queue[tail++] = idx + 1; }
        if (y > 0 && !visited[idx - w] && salientMask[idx - w] > 80) { visited[idx - w] = 1; queue[tail++] = idx - w; }
        if (y < h - 1 && !visited[idx + w] && salientMask[idx + w] > 80) { visited[idx + w] = 1; queue[tail++] = idx + w; }
      }
    } else {
      // Fallback: Region-growing from clicked seed point with adaptive LAB + local step threshold
      const seedLab = rgbToLab(d[seedIdx * 4], d[seedIdx * 4 + 1], d[seedIdx * 4 + 2]);
      visited[seedIdx] = 1;
      queue[tail++] = seedIdx;

      const maxSeedDeltaE = 36 + (state.settings.aiSensitivity / 100) * 55;
      const maxStepRGB = 28 + (state.settings.aiSensitivity / 100) * 32;

      while (head < tail) {
        const idx = queue[head++];
        objMask[idx] = 1;
        const p = idx * 4;
        const r = d[p], g = d[p + 1], b = d[p + 2];

        const x = idx % w;
        const y = (idx - x) / w;
        const neighbors = [];
        if (x > 0) neighbors.push(idx - 1);
        if (x < w - 1) neighbors.push(idx + 1);
        if (y > 0) neighbors.push(idx - w);
        if (y < h - 1) neighbors.push(idx + w);

        for (const nIdx of neighbors) {
          if (!visited[nIdx]) {
            const np = nIdx * 4;
            const stepDiff = Math.hypot(r - d[np], g - d[np + 1], b - d[np + 2]);
            if (stepDiff <= maxStepRGB) {
              const nLab = rgbToLab(d[np], d[np + 1], d[np + 2]);
              const seedDiff = Math.hypot(nLab[0] - seedLab[0], nLab[1] - seedLab[1], nLab[2] - seedLab[2]);
              if (seedDiff <= maxSeedDeltaE) {
                visited[nIdx] = 1;
                queue[tail++] = nIdx;
              }
            }
          }
        }
      }
    }

    // Write isolated object into item.brushMask so it combines with manual brush tools
    for (let i = 0; i < total; i++) {
      item.brushMask[i] = objMask[i] ? 255 : 0;
    }
    item.hasManualBrush = true;
    setBgRemovalMode('ai');

    const alphaPreview = new Uint8ClampedArray(total);
    for (let i = 0; i < total; i++) alphaPreview[i] = objMask[i] ? 255 : 0;
    item.detectedBBox = cleanupObjectMaskAndFindBBox(alphaPreview, w, h, true);
    for (let i = 0; i < total; i++) {
      item.brushMask[i] = alphaPreview[i] > 128 ? 255 : 0;
    }

    setActiveTool(null);
    scheduleRender(true);
    flashDetectedObjectBox(item);
    showToast(`Isolated clicked object (${item.detectedBBox.width}×${item.detectedBBox.height} px)!`);
  }

  function boxBlurAlpha(alpha, w, h, radius) {
    const r = Math.max(1, Math.min(15, Math.round(radius)));
    const temp = new Uint8ClampedArray(alpha.length);
    const diam = r * 2 + 1;
    for (let y = 0; y < h; y++) {
      let sum = 0;
      const rowOffset = y * w;
      for (let i = -r; i <= r; i++) sum += alpha[rowOffset + Math.max(0, Math.min(w - 1, i))];
      for (let x = 0; x < w; x++) {
        temp[rowOffset + x] = Math.round(sum / diam);
        sum += alpha[rowOffset + Math.min(w - 1, x + r + 1)] - alpha[rowOffset + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let i = -r; i <= r; i++) sum += temp[Math.max(0, Math.min(h - 1, i)) * w + x];
      for (let y = 0; y < h; y++) {
        alpha[y * w + x] = Math.round(sum / diam);
        sum += temp[Math.min(h - 1, y + r + 1) * w + x] - temp[Math.max(0, y - r) * w + x];
      }
    }
  }

  /**
   * 3. Auto-Trim Transparent Pixels (Smart Autocrop)
   */
  function autoTrimTransparentCanvas(canvas) {
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, w, h).data;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    let found = false;
    for (let y = 0; y < h; y++) {
      const rowOff = y * w * 4;
      for (let x = 0; x < w; x++) {
        if (data[rowOff + x * 4 + 3] > 15) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          found = true;
        }
      }
    }
    if (!found) return canvas;
    const trimW = Math.max(1, maxX - minX + 1);
    const trimH = Math.max(1, maxY - minY + 1);
    const out = document.createElement('canvas');
    out.width = trimW;
    out.height = trimH;
    out.getContext('2d').drawImage(canvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
    return out;
  }

  /**
   * 3. Sticker Outline / Stroke around isolated cutout
   */
  function applyStickerOutline(subjectCanvas, strokeWidth, strokeColor) {
    if (!strokeWidth || strokeWidth <= 0) return subjectCanvas;
    const pad = Math.ceil(strokeWidth);
    const w = subjectCanvas.width + pad * 2;
    const h = subjectCanvas.height + pad * 2;

    const sil = document.createElement('canvas');
    sil.width = subjectCanvas.width;
    sil.height = subjectCanvas.height;
    const sCtx = sil.getContext('2d');
    sCtx.drawImage(subjectCanvas, 0, 0);
    sCtx.globalCompositeOperation = 'source-in';
    sCtx.fillStyle = strokeColor;
    sCtx.fillRect(0, 0, sil.width, sil.height);

    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    const ctx = out.getContext('2d');

    // Draw radial multi-angle silhouette offsets for smooth sticker border
    const steps = Math.max(16, Math.min(36, strokeWidth * 2));
    for (let i = 0; i < steps; i++) {
      const ang = (i * 2 * Math.PI) / steps;
      const ox = pad + Math.cos(ang) * strokeWidth;
      const oy = pad + Math.sin(ang) * strokeWidth;
      ctx.drawImage(sil, ox, oy);
    }
    ctx.drawImage(subjectCanvas, pad, pad);
    return out;
  }

  // ==================== FULL RENDER PIPELINE ====================
  function calculateTargetDimensions(item) {
    const isRotated90 = state.settings.rotation === 90 || state.settings.rotation === 270;
    const baseW = isRotated90 ? item.height : item.width;
    const baseH = isRotated90 ? item.width : item.height;

    const mode = state.settings.resizeMode;
    if (mode === 'original') return { width: baseW, height: baseH };
    if (mode === 'percent') {
      const scale = Math.max(1, state.settings.resizePercent) / 100;
      return {
        width: Math.max(1, Math.round(baseW * scale)),
        height: Math.max(1, Math.round(baseH * scale))
      };
    }
    if (mode === 'max') {
      const maxSide = Math.max(16, state.settings.resizeMaxSide || 1200);
      const longest = Math.max(baseW, baseH);
      if (longest <= maxSide) return { width: baseW, height: baseH };
      const ratio = maxSide / longest;
      return {
        width: Math.max(1, Math.round(baseW * ratio)),
        height: Math.max(1, Math.round(baseH * ratio))
      };
    }
    if (mode === 'pixels') {
      return {
        width: Math.max(1, parseInt(state.settings.resizeWidth, 10) || baseW),
        height: Math.max(1, parseInt(state.settings.resizeHeight, 10) || baseH)
      };
    }
    return { width: baseW, height: baseH };
  }

  function renderItemToCanvas(item, targetCanvas) {
    const srcW = item.width;
    const srcH = item.height;

    // 1. Draw raw image & apply Privacy Redaction + Color Grading + Background Cutout
    let subjectCanvas = document.createElement('canvas');
    subjectCanvas.width = srcW;
    subjectCanvas.height = srcH;
    const subCtx = subjectCanvas.getContext('2d');
    subCtx.drawImage(item.imgElement, 0, 0);

    // Apply Privacy Redaction (Mosaic / Blur) before cutout/grading
    applyPrivacyRedaction(subCtx, item);

    // Apply Color Grading, LUTs & Sharpening
    applyColorGradingAndSharpen(subCtx, srcW, srcH);

    // Apply Background Removal Mask if active
    const needsAlphaMask = state.settings.bgRemovalMode !== 'none' || item.hasManualBrush;
    if (needsAlphaMask) {
      const srcData = subCtx.getImageData(0, 0, srcW, srcH);
      const alphaMask = computeSubjectAlphaMask(item, srcData);
      const d = srcData.data;
      for (let i = 0; i < alphaMask.length; i++) {
        d[i * 4 + 3] = alphaMask[i];
      }
      subCtx.putImageData(srcData, 0, 0);
    }

    // Auto-Trim Transparent Margins if enabled
    if (state.settings.autoTrim && needsAlphaMask) {
      subjectCanvas = autoTrimTransparentCanvas(subjectCanvas);
    }

    // Apply Sticker Outline Stroke if > 0
    if (state.settings.strokeWidth > 0) {
      subjectCanvas = applyStickerOutline(
        subjectCanvas,
        state.settings.strokeWidth,
        state.settings.strokeColor
      );
    }

    // 2. Apply Rotation, Flip & Horizon Straighten
    const orientedSubject = applyOrientationAndStraighten(
      subjectCanvas,
      state.settings.rotation,
      state.settings.flipH,
      state.settings.flipV,
      state.settings.straighten
    );
    const orientedOriginal = applyOrientationAndStraighten(
      item.imgElement,
      state.settings.rotation,
      state.settings.flipH,
      state.settings.flipV,
      state.settings.straighten
    );

    // 3. Final Output Canvas Setup
    const { width: outW, height: outH } = calculateTargetDimensions(item);
    targetCanvas.width = outW;
    targetCanvas.height = outH;
    const ctx = targetCanvas.getContext('2d');
    ctx.clearRect(0, 0, outW, outH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 4. Draw Background Fill Layer
    const fillType = state.settings.bgFillType;
    if (fillType === 'color') {
      ctx.fillStyle = state.settings.bgSolidColor;
      ctx.fillRect(0, 0, outW, outH);
    } else if (fillType === 'gradient') {
      const angleRad = ((state.settings.bgGradAngle - 90) * Math.PI) / 180;
      const cx = outW / 2, cy = outH / 2;
      const r = Math.hypot(outW, outH) / 2;
      const grad = ctx.createLinearGradient(
        cx - Math.cos(angleRad) * r,
        cy - Math.sin(angleRad) * r,
        cx + Math.cos(angleRad) * r,
        cy + Math.sin(angleRad) * r
      );
      grad.addColorStop(0, state.settings.bgGradColor1);
      grad.addColorStop(1, state.settings.bgGradColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, outW, outH);
    } else if (fillType === 'blur') {
      ctx.save();
      const blurPx = state.settings.bgBlurAmount;
      const bright = state.settings.bgBlurBrightness;
      ctx.filter = `blur(${blurPx}px) brightness(${bright}%)`;
      const bleed = blurPx * 2;
      drawFittedImage(ctx, orientedOriginal, -bleed, -bleed, outW + bleed * 2, outH + bleed * 2, 'cover', 'c');
      ctx.restore();
    } else if (fillType === 'image' && state.settings.bgCustomImage) {
      drawFittedImage(ctx, state.settings.bgCustomImage, 0, 0, outW, outH, 'cover', 'c');
    }

    // 5. Foreground Placement Box
    const padRatio = (state.settings.bgPadding || 0) / 100;
    const padX = Math.round(outW * padRatio);
    const padY = Math.round(outH * padRatio);
    const availW = Math.max(1, outW - padX * 2);
    const availH = Math.max(1, outH - padY * 2);

    const fitMethod =
      state.settings.resizeMode === 'pixels' && !state.settings.lockAspect
        ? state.settings.resizeFit
        : 'contain';
    const rect = computeDrawRect(
      orientedSubject.width,
      orientedSubject.height,
      padX,
      padY,
      availW,
      availH,
      fitMethod,
      state.settings.coverAnchor
    );

    // 3D Ground Contact Shadow (under product feet)
    if (state.settings.contactShadow) {
      ctx.save();
      const shadowY = rect.dy + rect.dh - Math.max(4, Math.round(rect.dh * 0.03));
      const rx = Math.round(rect.dw * 0.38);
      const ry = Math.max(4, Math.round(rect.dh * 0.035));
      const radGrad = ctx.createRadialGradient(
        rect.dx + rect.dw / 2, shadowY, 2,
        rect.dx + rect.dw / 2, shadowY, rx
      );
      radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.52)');
      radGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.22)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.ellipse(rect.dx + rect.dw / 2, shadowY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3D Mirror Floor Reflection
    if (state.settings.floorReflection) {
      const refCanvas = document.createElement('canvas');
      refCanvas.width = rect.dw;
      refCanvas.height = Math.max(1, Math.round(rect.dh * 0.45));
      const rCtx = refCanvas.getContext('2d');
      rCtx.save();
      rCtx.translate(0, refCanvas.height);
      rCtx.scale(1, -1);
      rCtx.drawImage(
        orientedSubject,
        rect.sx,
        rect.sy + rect.sh * 0.55,
        rect.sw,
        rect.sh * 0.45,
        0,
        0,
        rect.dw,
        refCanvas.height
      );
      rCtx.restore();

      rCtx.globalCompositeOperation = 'destination-in';
      const fadeGrad = rCtx.createLinearGradient(0, 0, 0, refCanvas.height);
      fadeGrad.addColorStop(0, `rgba(0,0,0,${(state.settings.reflectionOpacity || 35) / 100})`);
      fadeGrad.addColorStop(1, 'rgba(0,0,0,0)');
      rCtx.fillStyle = fadeGrad;
      rCtx.fillRect(0, 0, refCanvas.width, refCanvas.height);

      ctx.drawImage(refCanvas, rect.dx, rect.dy + rect.dh - 2);
    }

    // Draw Main Subject with optional Rounded Corners & Drop Shadow
    ctx.save();
    if (state.settings.bgRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(rect.dx, rect.dy, rect.dw, rect.dh, state.settings.bgRadius);
      ctx.clip();
    }
    if (state.settings.bgShadow > 0) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = state.settings.bgShadow;
      ctx.shadowOffsetY = Math.round(state.settings.bgShadow * 0.35);
    }
    ctx.drawImage(orientedSubject, rect.sx, rect.sy, rect.sw, rect.sh, rect.dx, rect.dy, rect.dw, rect.dh);
    ctx.restore();

    // 6. Draw Watermark (Text & Logo), Corner Ribbon Badge, and Outer Border Frame
    drawWatermarksAndBranding(ctx, item, outW, outH);
  }

  function applyOrientationAndStraighten(source, rotation, flipH, flipV, straightenDeg = 0) {
    const sw = source.naturalWidth || source.width;
    const sh = source.naturalHeight || source.height;
    const isRot90 = rotation === 90 || rotation === 270;
    const c = document.createElement('canvas');
    c.width = isRot90 ? sh : sw;
    c.height = isRot90 ? sw : sh;
    const ctx = c.getContext('2d');
    ctx.translate(c.width / 2, c.height / 2);
    const totalDeg = (rotation || 0) + (straightenDeg || 0);
    if (totalDeg !== 0) {
      ctx.rotate((totalDeg * Math.PI) / 180);
    }
    // Slight auto-zoom when straightening horizon so corners stay filled
    const zoomComp = straightenDeg !== 0 ? 1 + Math.abs(straightenDeg) * 0.008 : 1;
    ctx.scale((flipH ? -1 : 1) * zoomComp, (flipV ? -1 : 1) * zoomComp);
    ctx.drawImage(source, -sw / 2, -sh / 2);
    return c;
  }

  function computeDrawRect(srcW, srcH, boxX, boxY, boxW, boxH, fitMethod, anchor = 'c') {
    if (fitMethod === 'stretch') {
      return { sx: 0, sy: 0, sw: srcW, sh: srcH, dx: boxX, dy: boxY, dw: boxW, dh: boxH };
    }
    if (fitMethod === 'cover') {
      const scale = Math.max(boxW / srcW, boxH / srcH);
      const sw = Math.round(boxW / scale);
      const sh = Math.round(boxH / scale);
      let sx = Math.round((srcW - sw) / 2);
      let sy = Math.round((srcH - sh) / 2);
      if (anchor.includes('w')) sx = 0;
      if (anchor.includes('e')) sx = srcW - sw;
      if (anchor.includes('n')) sy = 0;
      if (anchor.includes('s')) sy = srcH - sh;
      return { sx, sy, sw, sh, dx: boxX, dy: boxY, dw: boxW, dh: boxH };
    }
    const scale = Math.min(boxW / srcW, boxH / srcH);
    const dw = Math.round(srcW * scale);
    const dh = Math.round(srcH * scale);
    const dx = boxX + Math.round((boxW - dw) / 2);
    const dy = boxY + Math.round((boxH - dh) / 2);
    return { sx: 0, sy: 0, sw: srcW, sh: srcH, dx, dy, dw, dh };
  }

  function drawFittedImage(ctx, source, boxX, boxY, boxW, boxH, fitMethod, anchor = 'c') {
    const sw = source.naturalWidth || source.width;
    const sh = source.naturalHeight || source.height;
    const r = computeDrawRect(sw, sh, boxX, boxY, boxW, boxH, fitMethod, anchor);
    ctx.drawImage(source, r.sx, r.sy, r.sw, r.sh, r.dx, r.dy, r.dw, r.dh);
  }

  // ==================== 2. WATERMARKING, BADGES & BORDER FRAME ====================
  function drawWatermarksAndBranding(ctx, item, outW, outH) {
    const s = state.settings;
    const alpha = Math.max(0.05, Math.min(1, (s.wmOpacity || 75) / 100));

    // Resolve dynamic watermark text tokens
    const dateStr = new Date().toISOString().slice(0, 10);
    const resolvedText = (s.wmText || '')
      .replace(/\{name\}/g, item.name)
      .replace(/\{date\}/g, dateStr)
      .replace(/\{dims\}/g, `${outW}x${outH}`);

    // 1. Logo Watermark
    if (s.wmLogoImg) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const logoW = Math.max(24, Math.round(outW * ((s.wmLogoScale || 18) / 100)));
      const logoH = Math.round(logoW * (s.wmLogoImg.naturalHeight / s.wmLogoImg.naturalWidth));

      if (s.wmTiled) {
        const stepX = logoW * 2.1;
        const stepY = logoH * 2.4;
        for (let y = -outH * 0.2; y < outH * 1.2; y += stepY) {
          for (let x = -outW * 0.2; x < outW * 1.2; x += stepX) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(((s.wmAngle || -25) * Math.PI) / 180);
            ctx.drawImage(s.wmLogoImg, -logoW / 2, -logoH / 2, logoW, logoH);
            ctx.restore();
          }
        }
      } else {
        const pos = computeAnchorCoords(outW, outH, logoW, logoH, s.wmAnchor, Math.round(outW * 0.03));
        ctx.translate(pos.x + logoW / 2, pos.y + logoH / 2);
        if (s.wmAngle) ctx.rotate((s.wmAngle * Math.PI) / 180);
        ctx.drawImage(s.wmLogoImg, -logoW / 2, -logoH / 2, logoW, logoH);
      }
      ctx.restore();
    }

    // 2. Text Watermark
    if (s.wmTextEnabled && resolvedText.trim()) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const fontSize = Math.max(10, Math.round((s.wmTextSize || 36) * (outW / 1080)));
      ctx.font = `700 ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = s.wmTextColor || '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = Math.max(3, Math.round(fontSize * 0.15));

      const metrics = ctx.measureText(resolvedText);
      const tw = metrics.width;
      const th = fontSize * 1.2;

      if (s.wmTiled) {
        const stepX = Math.max(160, tw * 1.65);
        const stepY = Math.max(110, th * 3.2);
        const angleRad = (((s.wmAngle || -30) * Math.PI) / 180);
        for (let y = -outH * 0.25; y < outH * 1.25; y += stepY) {
          for (let x = -outW * 0.25; x < outW * 1.25; x += stepX) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angleRad);
            ctx.fillText(resolvedText, 0, 0);
            ctx.restore();
          }
        }
      } else {
        const pos = computeAnchorCoords(outW, outH, tw, th, s.wmAnchor, Math.round(outW * 0.035));
        ctx.translate(pos.x + tw / 2, pos.y + th / 2);
        if (s.wmAngle) ctx.rotate((s.wmAngle * Math.PI) / 180);
        ctx.fillText(resolvedText, 0, 0);
      }
      ctx.restore();
    }

    // 3. Corner Ribbon Badge (e.g. SALE, NEW, PRO)
    if (s.badgeText && s.badgeText.trim()) {
      ctx.save();
      const ribbonSize = Math.round(Math.min(outW, outH) * 0.24);
      ctx.translate(outW, 0);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = s.badgeColor || '#ef4444';
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 10;
      const bandW = ribbonSize * 2;
      const bandH = Math.max(22, Math.round(ribbonSize * 0.34));
      ctx.fillRect(-bandW / 2, ribbonSize * 0.48, bandW, bandH);

      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${Math.round(bandH * 0.56)}px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.badgeText.trim().toUpperCase(), 0, ribbonSize * 0.48 + bandH / 2);
      ctx.restore();
    }

    // 4. Solid Border Frame
    if (s.borderFrameWidth > 0) {
      ctx.save();
      const bw = Math.round((s.borderFrameWidth / 1080) * Math.min(outW, outH));
      if (bw > 0) {
        ctx.strokeStyle = s.borderFrameColor || '#ffffff';
        ctx.lineWidth = bw * 2;
        ctx.strokeRect(0, 0, outW, outH);
      }
      ctx.restore();
    }
  }

  function computeAnchorCoords(canvasW, canvasH, itemW, itemH, anchor, margin) {
    let x = (canvasW - itemW) / 2;
    let y = (canvasH - itemH) / 2;
    if (anchor.includes('w')) x = margin;
    if (anchor.includes('e')) x = canvasW - itemW - margin;
    if (anchor.includes('n')) y = margin;
    if (anchor.includes('s')) y = canvasH - itemH - margin;
    return { x, y };
  }

  // ==================== RENDER & TELEMETRY LOOP ====================
  let telemetryTaskId = 0;

  async function executeRender() {
    const activeItem = getActiveItem();
    if (!activeItem) return;

    renderItemToCanvas(activeItem, el.previewCanvas);

    const outW = el.previewCanvas.width;
    const outH = el.previewCanvas.height;
    el.originalCanvas.width = outW;
    el.originalCanvas.height = outH;
    const origCtx = el.originalCanvas.getContext('2d');
    origCtx.clearRect(0, 0, outW, outH);
    drawFittedImage(origCtx, activeItem.originalImgElement, 0, 0, outW, outH, 'contain', 'c');

    updateSplitViewClip();
    applyViewportDisplaySize();
    updateCropOverlayPosition();
    updateExifInspector(activeItem);

    const currentTask = ++telemetryTaskId;
    const maxBytes = state.settings.enableTargetSize
      ? Math.max(1024, (parseFloat(state.settings.targetSizeKb) || 150) * 1024)
      : null;

    const blob = await window.OrionEncoders.encodeWithSizeLimit(
      el.previewCanvas,
      state.settings.format,
      state.settings.quality / 100,
      maxBytes
    );

    if (currentTask !== telemetryTaskId) return;

    activeItem.lastOutputBlob = blob;
    activeItem.lastOutputWidth = outW;
    activeItem.lastOutputHeight = outH;

    updateTelemetryBar(activeItem, blob);

    if (state.mode === 'bulk') {
      renderBulkGrid();
    }
  }

  function updateExifInspector(item) {
    if (!item) return;
    el.exifInfoBox.textContent = item.exifSummary || 'No metadata available.';
    el.teleExifBadge.textContent = state.settings.stripExif ? 'EXIF Stripped' : 'EXIF Kept';
    el.teleExifBadge.classList.toggle('active', state.settings.stripExif);
  }

  function updateTelemetryBar(item, outputBlob) {
    const ext = window.OrionEncoders.getExtension(state.settings.format).toUpperCase();
    const outName = buildOutputFilename(item, 1);

    el.teleFileName.textContent = outName;
    el.teleDims.textContent = `${item.width}×${item.height} → ${item.lastOutputWidth}×${item.lastOutputHeight} px`;
    el.teleSize.textContent = `${formatBytes(item.originalSize)} → ${formatBytes(outputBlob.size)}`;
    el.teleFormat.textContent = ext;

    el.footerEstSize.textContent = `${formatBytes(outputBlob.size)} (${ext})`;
    el.footerEstDims.textContent = `${item.lastOutputWidth} × ${item.lastOutputHeight} px`;

    const diffRatio = ((outputBlob.size - item.originalSize) / item.originalSize) * 100;
    el.teleSavingsBadge.classList.remove('hidden', 'larger');
    if (diffRatio <= 0) {
      el.teleSavingsBadge.textContent = `${Math.round(diffRatio)}%`;
    } else {
      el.teleSavingsBadge.textContent = `+${Math.round(diffRatio)}%`;
      el.teleSavingsBadge.classList.add('larger');
    }
  }

  function applyViewportDisplaySize() {
    const cw = el.previewCanvas.width;
    const ch = el.previewCanvas.height;
    if (!cw || !ch) return;

    const vw = Math.max(240, el.canvasViewport.clientWidth - 64);
    const vh = Math.max(240, el.canvasViewport.clientHeight - 64);
    const fitScale = Math.min(vw / cw, vh / ch, 1);
    const displayW = Math.round(cw * fitScale * state.zoom);
    const displayH = Math.round(ch * fitScale * state.zoom);

    el.previewCanvas.style.width = `${displayW}px`;
    el.previewCanvas.style.height = `${displayH}px`;
    el.originalCanvas.style.width = `${displayW}px`;
    el.originalCanvas.style.height = `${displayH}px`;
    el.zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function updateSplitViewClip() {
    if (state.holdOriginal) {
      el.originalCanvas.classList.remove('hidden');
      el.originalCanvas.style.clipPath = 'none';
      el.splitHandle.classList.add('hidden');
      return;
    }
    if (state.splitCompare) {
      el.originalCanvas.classList.remove('hidden');
      const pct = Math.max(0, Math.min(100, state.splitPos * 100));
      el.originalCanvas.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
      el.splitHandle.classList.remove('hidden');
      el.splitHandle.style.left = `${pct}%`;
    } else {
      el.originalCanvas.classList.add('hidden');
      el.splitHandle.classList.add('hidden');
    }
  }

  // ==================== 4. INTERACTIVE ON-CANVAS CROP BOX ====================
  function toggleCropBox(forceState) {
    state.cropBoxActive = typeof forceState === 'boolean' ? forceState : !state.cropBoxActive;
    el.cropOverlay.classList.toggle('hidden', !state.cropBoxActive);
    el.applyCropBtn.classList.toggle('hidden', !state.cropBoxActive);
    el.cropBoxToolBtn.classList.toggle('active', state.cropBoxActive);
    el.toggleCropBoxBtn.classList.toggle('active', state.cropBoxActive);
    if (state.cropBoxActive) {
      enforceCropAspectRatio();
      updateCropOverlayPosition();
    }
  }

  function enforceCropAspectRatio() {
    if (state.cropRatio === 'free') return;
    const item = getActiveItem();
    if (!item) return;
    const [rw, rh] = state.cropRatio.split(':').map(Number);
    const targetAspect = rw / rh;
    const imgAspect = item.width / item.height;
    const normRatio = targetAspect / imgAspect;

    let w = 0.75;
    let h = w / normRatio;
    if (h > 0.8) {
      h = 0.8;
      w = h * normRatio;
    }
    state.cropRect = {
      x: (1 - w) / 2,
      y: (1 - h) / 2,
      w,
      h
    };
  }

  function updateCropOverlayPosition() {
    if (!state.cropBoxActive) return;
    const r = state.cropRect;
    el.cropSelectionBox.style.left = `${r.x * 100}%`;
    el.cropSelectionBox.style.top = `${r.y * 100}%`;
    el.cropSelectionBox.style.width = `${r.w * 100}%`;
    el.cropSelectionBox.style.height = `${r.h * 100}%`;
  }

  async function applyInteractiveCrop() {
    const item = getActiveItem();
    if (!item) return;
    const r = state.cropRect;
    const sx = Math.max(0, Math.round(r.x * item.width));
    const sy = Math.max(0, Math.round(r.y * item.height));
    const sw = Math.max(16, Math.min(item.width - sx, Math.round(r.w * item.width)));
    const sh = Math.max(16, Math.min(item.height - sy, Math.round(r.h * item.height)));

    const c = document.createElement('canvas');
    c.width = sw;
    c.height = sh;
    c.getContext('2d').drawImage(item.imgElement, sx, sy, sw, sh, 0, 0, sw, sh);

    const dataUrl = c.toDataURL('image/png');
    const croppedImg = new Image();
    await new Promise((res) => {
      croppedImg.onload = res;
      croppedImg.src = dataUrl;
    });

    item.imgElement = croppedImg;
    item.width = sw;
    item.height = sh;
    item.brushMask = new Uint8Array(sw * sh).fill(128);
    item.redactMask = new Uint8Array(sw * sh);
    item.hasManualBrush = false;
    item.hasRedaction = false;
    item.cachedAiAlpha = null;
    item.thumbUrl = createThumbnailDataUrl(croppedImg, 96);

    toggleCropBox(false);
    syncDimensionInputsToActiveImage();
    renderFilmstrip();
    scheduleRender(true);
    showToast(`Cropped to ${sw} × ${sh} px`);
  }

  function resetInteractiveCrop() {
    const item = getActiveItem();
    if (!item || !item.originalImgElement) return;
    item.imgElement = item.originalImgElement;
    item.width = item.originalImgElement.naturalWidth;
    item.height = item.originalImgElement.naturalHeight;
    item.brushMask = new Uint8Array(item.width * item.height).fill(128);
    item.redactMask = new Uint8Array(item.width * item.height);
    item.hasManualBrush = false;
    item.hasRedaction = false;
    item.cachedAiAlpha = null;
    item.thumbUrl = createThumbnailDataUrl(item.imgElement, 96);
    toggleCropBox(false);
    syncDimensionInputsToActiveImage();
    renderFilmstrip();
    scheduleRender(true);
    showToast('Restored original uncropped dimensions');
  }

  // ==================== BULK BATCH PROCESSING ====================
  let bulkRenderGeneration = 0;

  async function renderBulkGrid() {
    const gen = ++bulkRenderGeneration;
    el.bulkGrid.innerHTML = '';
    if (state.items.length === 0) return;

    let totalOrigBytes = 0;
    let totalOutBytes = 0;
    const ext = window.OrionEncoders.getExtension(state.settings.format).toUpperCase();
    const maxBytes = state.settings.enableTargetSize
      ? Math.max(1024, (parseFloat(state.settings.targetSizeKb) || 150) * 1024)
      : null;

    for (let i = 0; i < state.items.length; i++) {
      if (gen !== bulkRenderGeneration) return;
      const item = state.items[i];
      totalOrigBytes += item.originalSize;

      const cardCanvas = document.createElement('canvas');
      renderItemToCanvas(item, cardCanvas);

      const blob = await window.OrionEncoders.encodeWithSizeLimit(
        cardCanvas,
        state.settings.format,
        state.settings.quality / 100,
        maxBytes
      );

      item.lastOutputBlob = blob;
      item.lastOutputWidth = cardCanvas.width;
      item.lastOutputHeight = cardCanvas.height;
      totalOutBytes += blob.size;

      const card = document.createElement('div');
      card.className = 'bulk-card';
      const outFilename = buildOutputFilename(item, i + 1);
      const savingsPct = Math.round(((blob.size - item.originalSize) / item.originalSize) * 100);
      const savingsStr = savingsPct <= 0 ? `${savingsPct}%` : `+${savingsPct}%`;

      card.innerHTML = `
        <div class="bulk-card-preview checkerboard">
          <span class="bulk-card-badge">${ext}</span>
        </div>
        <div class="bulk-card-body">
          <div class="bulk-card-title" title="${outFilename}">${outFilename}</div>
          <div class="bulk-card-meta">
            <span>${item.width}×${item.height} → ${cardCanvas.width}×${cardCanvas.height}</span>
          </div>
          <div class="bulk-card-meta">
            <span>${formatBytes(item.originalSize)} → <strong>${formatBytes(blob.size)}</strong></span>
            <span class="${savingsPct <= 0 ? 'text-emerald' : ''}">${savingsStr}</span>
          </div>
          <div class="bulk-card-actions">
            <button class="btn btn-xs btn-secondary bulk-inspect-btn" style="flex:1">Single Edit</button>
            <button class="btn btn-xs btn-primary bulk-dl-btn" style="flex:1">Download</button>
          </div>
        </div>
      `;

      card.querySelector('.bulk-card-preview').prepend(cardCanvas);
      card.querySelector('.bulk-inspect-btn').addEventListener('click', () => {
        state.activeId = item.id;
        switchMode('single');
      });
      card.querySelector('.bulk-dl-btn').addEventListener('click', () => {
        triggerDownload(blob, outFilename);
      });

      el.bulkGrid.appendChild(card);
    }

    el.bulkStatCount.textContent = String(state.items.length);
    el.bulkStatOrigSize.textContent = formatBytes(totalOrigBytes);
    el.bulkStatOutSize.textContent = formatBytes(totalOutBytes);
    const totalSavedRatio = totalOrigBytes > 0
      ? Math.round(((totalOutBytes - totalOrigBytes) / totalOrigBytes) * 100)
      : 0;
    el.bulkStatSaved.textContent = totalSavedRatio <= 0 ? `${totalSavedRatio}%` : `+${totalSavedRatio}%`;
  }

  // ==================== 6. POWER EXPORT TOOLS & CLIPBOARD ====================
  function buildOutputFilename(item, index = 1) {
    const ext = window.OrionEncoders.getExtension(state.settings.format);
    const pattern = state.settings.filenamePattern || '{name}-edited';
    const w = item.lastOutputWidth || item.width;
    const h = item.lastOutputHeight || item.height;
    const base = pattern
      .replace('{name}', item.name)
      .replace('{width}', w)
      .replace('{height}', h)
      .replace('{index}', String(index).padStart(2, '0'));
    return `${base}.${ext}`;
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function exportCurrentOrBulk() {
    if (state.items.length === 0) {
      showToast('Please add at least one image first.');
      return;
    }
    if (state.mode === 'bulk') {
      await downloadAllAsZip();
    } else {
      const item = getActiveItem();
      if (!item) return;
      renderItemToCanvas(item, el.previewCanvas);
      const maxBytes = state.settings.enableTargetSize
        ? Math.max(1024, (parseFloat(state.settings.targetSizeKb) || 150) * 1024)
        : null;
      const blob = await window.OrionEncoders.encodeWithSizeLimit(
        el.previewCanvas,
        state.settings.format,
        state.settings.quality / 100,
        maxBytes
      );
      const filename = buildOutputFilename(item, 1);
      triggerDownload(blob, filename);
      showToast(`Exported ${filename} (${formatBytes(blob.size)})`);
    }
  }

  async function downloadAllAsZip() {
    if (state.items.length === 0) return;
    el.bulkProgressContainer.classList.remove('hidden');
    const maxBytes = state.settings.enableTargetSize
      ? Math.max(1024, (parseFloat(state.settings.targetSizeKb) || 150) * 1024)
      : null;

    const hasJSZip = typeof window.JSZip !== 'undefined';
    const zip = hasJSZip ? new window.JSZip() : null;

    for (let i = 0; i < state.items.length; i++) {
      const item = state.items[i];
      const pct = Math.round(((i + 1) / state.items.length) * 100);
      el.bulkProgressLabel.textContent = `Processing ${i + 1} of ${state.items.length}: ${item.originalFileName}...`;
      el.bulkProgressPercent.textContent = `${pct}%`;
      el.bulkProgressBar.style.width = `${pct}%`;

      const workCanvas = document.createElement('canvas');
      renderItemToCanvas(item, workCanvas);
      const blob = await window.OrionEncoders.encodeWithSizeLimit(
        workCanvas,
        state.settings.format,
        state.settings.quality / 100,
        maxBytes
      );
      const filename = buildOutputFilename(item, i + 1);
      if (zip) zip.file(filename, blob);
      else triggerDownload(blob, filename);
    }

    if (zip) {
      el.bulkProgressLabel.textContent = 'Packaging ZIP archive...';
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerDownload(zipBlob, `orion-batch-${state.items.length}-images.zip`);
      showToast(`Exported ${state.items.length} images as ZIP (${formatBytes(zipBlob.size)})`);
    }
    setTimeout(() => el.bulkProgressContainer.classList.add('hidden'), 1000);
  }

  /**
   * 6. Multi-Size Responsive & Favicon Pack (.ZIP)
   * Generates @2x, @1x, 400px Thumbnail, 180px Apple Touch Icon, 32px/16px PNGs, and Multi-Resolution .ICO
   */
  async function exportResponsivePack() {
    const item = getActiveItem();
    if (!item) {
      showToast('Add an image first to generate a Responsive + Favicon Pack.');
      return;
    }
    if (typeof window.JSZip === 'undefined') {
      showToast('JSZip is required for ZIP pack generation.');
      return;
    }

    showToast('Building Responsive & Multi-Size Favicon Pack...');
    const baseCanvas = document.createElement('canvas');
    renderItemToCanvas(item, baseCanvas);

    const zip = new window.JSZip();
    const ext = window.OrionEncoders.getExtension(state.settings.format);
    const q = state.settings.quality / 100;

    // 1. @2x (100% rendered size)
    const blob2x = await window.OrionEncoders.encodeCanvas(baseCanvas, state.settings.format, q);
    zip.file(`${item.name}@2x.${ext}`, blob2x);

    // 2. @1x (50% rendered size)
    const c1x = window.OrionEncoders.scaleCanvas(baseCanvas, baseCanvas.width * 0.5, baseCanvas.height * 0.5);
    const blob1x = await window.OrionEncoders.encodeCanvas(c1x, state.settings.format, q);
    zip.file(`${item.name}@1x.${ext}`, blob1x);

    // 3. Thumbnail (max 400px)
    const thumbRatio = Math.min(400 / baseCanvas.width, 400 / baseCanvas.height, 1);
    const cThumb = window.OrionEncoders.scaleCanvas(
      baseCanvas,
      baseCanvas.width * thumbRatio,
      baseCanvas.height * thumbRatio
    );
    const blobThumb = await window.OrionEncoders.encodeCanvas(cThumb, 'webp', 0.85);
    zip.file(`${item.name}-thumb-400w.webp`, blobThumb);

    // 4. Multi-Resolution Windows .ICO (16, 32, 48, 64, 128, 256)
    const icoBlob = await window.OrionEncoders.encodeMultiSizeICO(baseCanvas, [16, 32, 48, 64, 128, 256]);
    zip.file('favicon-multisize.ico', icoBlob);

    // 5. Standard Web App Icon PNGs
    for (const sz of [16, 32, 180, 512]) {
      const sc = window.OrionEncoders.scaleCanvas(baseCanvas, sz, sz);
      const pngBlob = await window.OrionEncoders.encodeCanvas(sc, 'png', 1);
      zip.file(`icons/icon-${sz}x${sz}.png`, pngBlob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    triggerDownload(zipBlob, `${item.name}-responsive-icon-pack.zip`);
    showToast(`Exported Responsive & Favicon Pack (${formatBytes(zipBlob.size)})`);
  }

  /**
   * 6. Contact Sheet / Collage Grid Generator
   */
  async function exportContactSheet() {
    if (state.items.length === 0) {
      showToast('Add images to the queue first.');
      return;
    }
    showToast('Generating high-res Contact Sheet Grid...');
    const count = state.items.length;
    const cols = count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
    const rows = Math.ceil(count / cols);

    const cellW = 520;
    const cellH = 440;
    const pad = 28;
    const captionH = 46;

    const sheet = document.createElement('canvas');
    sheet.width = pad + cols * (cellW + pad);
    sheet.height = pad + 64 + rows * (cellH + captionH + pad);
    const ctx = sheet.getContext('2d');

    // Dark Studio Contact Sheet Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, sheet.width, sheet.height);

    // Header Title
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 26px Inter, sans-serif';
    ctx.fillText(`Orion Studio Contact Sheet — ${count} Images`, pad, pad + 32);

    for (let i = 0; i < count; i++) {
      const item = state.items[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = pad + col * (cellW + pad);
      const y = pad + 64 + row * (cellH + captionH + pad);

      // Card slot backdrop
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(x, y, cellW, cellH + captionH, 12);
      ctx.fill();

      // Render edited item
      const itemCanvas = document.createElement('canvas');
      renderItemToCanvas(item, itemCanvas);
      drawFittedImage(ctx, itemCanvas, x + 14, y + 14, cellW - 28, cellH - 28, 'contain', 'c');

      // Filename & dimensions caption
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '600 15px Inter, sans-serif';
      ctx.fillText(
        `${i + 1}. ${item.name} (${itemCanvas.width}×${itemCanvas.height})`,
        x + 16,
        y + cellH + 24
      );
    }

    const blob = await window.OrionEncoders.encodeCanvas(sheet, 'png', 1);
    triggerDownload(blob, `orion-contact-sheet-${count}-images.png`);
    showToast(`Exported Contact Sheet (${sheet.width}×${sheet.height} px)`);
  }

  /**
   * 6. Copy Edited Image to System Clipboard & Paste from Clipboard
   */
  async function copyEditedToClipboard() {
    const item = getActiveItem();
    if (!item) {
      showToast('No image to copy.');
      return;
    }
    try {
      renderItemToCanvas(item, el.previewCanvas);
      const pngBlob = await new Promise((r) => el.previewCanvas.toBlob(r, 'image/png'));
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
      showToast('Copied edited image to clipboard!');
    } catch (err) {
      showToast('Clipboard copy failed in this browser context.');
    }
  }

  async function downloadBatchMergedPdf() {
    if (state.items.length === 0) return;
    showToast('Building multi-page PDF from batch...');
    const canvases = [];
    for (const item of state.items) {
      const c = document.createElement('canvas');
      renderItemToCanvas(item, c);
      canvases.push(c);
    }
    const pdfBlob = await window.OrionEncoders.encodeMultiPagePDF(canvases, state.settings.quality / 100);
    triggerDownload(pdfBlob, `orion-merged-${state.items.length}-pages.pdf`);
    showToast(`Exported merged PDF (${formatBytes(pdfBlob.size)})`);
  }

  // ==================== 6. PRESET RECIPES ====================
  function applyPresetRecipe(key) {
    if (!key) return;
    if (key === 'shopify') {
      setBgRemovalMode('ai');
      setBgFillType('color');
      state.settings.bgSolidColor = '#ffffff';
      el.bgSolidColorInput.value = '#ffffff';
      state.settings.autoTrim = true;
      el.autoTrimCheck.checked = true;
      state.settings.bgPadding = 8;
      el.bgPaddingSlider.value = 8;
      el.bgPaddingVal.textContent = '8%';
      state.settings.contactShadow = true;
      el.contactShadowCheck.checked = true;
      setResizeMode('pixels');
      state.settings.resizeWidth = 2000;
      state.settings.resizeHeight = 2000;
      el.resizeWidthInput.value = 2000;
      el.resizeHeightInput.value = 2000;
      selectFormatOption('webp');
      state.settings.enableTargetSize = true;
      state.settings.targetSizeKb = 150;
      el.enableTargetSizeCheck.checked = true;
      el.targetSizeControls.classList.remove('hidden');
      el.targetSizeKbInput.value = 150;
      showToast('Applied Recipe: Shopify 2000×2000 WebP ≤150KB');
    } else if (key === 'sticker') {
      setBgRemovalMode('ai');
      setBgFillType('transparent');
      state.settings.autoTrim = true;
      el.autoTrimCheck.checked = true;
      state.settings.strokeWidth = 12;
      state.settings.strokeColor = '#ffffff';
      el.strokeWidthSlider.value = 12;
      el.strokeWidthVal.textContent = '12 px';
      el.strokeColorInput.value = '#ffffff';
      state.settings.bgShadow = 18;
      el.bgShadowSlider.value = 18;
      el.bgShadowVal.textContent = '18 px';
      state.settings.bgPadding = 6;
      el.bgPaddingSlider.value = 6;
      el.bgPaddingVal.textContent = '6%';
      selectFormatOption('png');
      showToast('Applied Recipe: YouTube Sticker Cutout + White Outline');
    } else if (key === 'avatar') {
      setBgRemovalMode('ai');
      setBgFillType('blur');
      state.settings.bgBlurAmount = 22;
      el.bgBlurAmountSlider.value = 22;
      el.bgBlurAmountVal.textContent = '22 px';
      setResizeMode('pixels');
      state.settings.resizeWidth = 512;
      state.settings.resizeHeight = 512;
      el.resizeWidthInput.value = 512;
      el.resizeHeightInput.value = 512;
      state.settings.bgRadius = 64;
      el.bgRadiusSlider.value = 64;
      el.bgRadiusVal.textContent = '64 px';
      selectFormatOption('png');
      showToast('Applied Recipe: Bokeh Portrait 512×512 PNG');
    } else if (key === 'watermarked') {
      state.settings.wmTextEnabled = true;
      el.wmTextEnableCheck.checked = true;
      state.settings.wmTiled = true;
      el.wmTileCheck.checked = true;
      state.settings.wmOpacity = 45;
      el.wmOpacitySlider.value = 45;
      el.wmOpacityVal.textContent = '45%';
      selectFormatOption('jpeg');
      showToast('Applied Recipe: Protected Proof JPG + Tiled Watermark');
    } else if (state.customRecipes[key]) {
      Object.assign(state.settings, JSON.parse(JSON.stringify(state.customRecipes[key])));
      showToast(`Loaded custom recipe "${key}"`);
    }
    scheduleRender(true);
  }

  function selectFormatOption(fmt) {
    state.settings.format = fmt;
    el.formatSelectorGrid.querySelectorAll('.format-option').forEach((o) => {
      o.classList.toggle('active', o.dataset.format === fmt);
    });
  }

  // ==================== UI STATE & FILMSTRIP SYNC ====================
  function updateUIState() {
    const count = state.items.length;
    el.queueCountBadge.textContent = String(count);
    el.filmstripCount.textContent = String(count);

    if (count === 0) {
      el.emptyState.classList.remove('hidden');
      el.singleView.classList.add('hidden');
      el.bulkView.classList.add('hidden');
    } else {
      el.emptyState.classList.add('hidden');
      if (state.mode === 'single') {
        el.singleView.classList.remove('hidden');
        el.bulkView.classList.add('hidden');
        el.exportBtnLabel.textContent = 'Export Image';
        el.inspectorExportBtn.textContent = 'Export Current Image';
      } else {
        el.singleView.classList.add('hidden');
        el.bulkView.classList.remove('hidden');
        el.exportBtnLabel.textContent = `Export All (${count})`;
        el.inspectorExportBtn.textContent = `Download All (${count}) as .ZIP`;
      }
    }
    renderFilmstrip();
  }

  function renderFilmstrip() {
    el.filmstripList.innerHTML = '';
    state.items.forEach((item) => {
      const div = document.createElement('div');
      div.className = `filmstrip-item ${item.id === state.activeId ? 'active' : ''}`;
      div.innerHTML = `
        <img class="filmstrip-thumb" src="${item.thumbUrl}" alt="${item.name}" />
        <div class="filmstrip-meta">
          <div class="filmstrip-name">${item.originalFileName}</div>
          <div class="filmstrip-sub">${item.width}×${item.height} • ${formatBytes(item.originalSize)}</div>
        </div>
        <button class="filmstrip-remove" title="Remove from queue">✕</button>
      `;

      div.addEventListener('click', (e) => {
        if (e.target.closest('.filmstrip-remove')) return;
        state.activeId = item.id;
        if (state.settings.resizeMode === 'original') syncDimensionInputsToActiveImage();
        renderFilmstrip();
        scheduleRender(true);
      });

      div.querySelector('.filmstrip-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        state.items = state.items.filter((x) => x.id !== item.id);
        if (state.activeId === item.id) {
          state.activeId = state.items[0] ? state.items[0].id : null;
        }
        updateUIState();
        scheduleRender(true);
      });

      el.filmstripList.appendChild(div);
    });
  }

  function syncDimensionInputsToActiveImage() {
    const active = getActiveItem();
    if (!active) return;
    state.settings.resizeWidth = active.width;
    state.settings.resizeHeight = active.height;
    el.resizeWidthInput.value = active.width;
    el.resizeHeightInput.value = active.height;
  }

  function switchMode(newMode) {
    state.mode = newMode;
    el.modeSingleBtn.classList.toggle('active', newMode === 'single');
    el.modeBulkBtn.classList.toggle('active', newMode === 'bulk');
    updateUIState();
    scheduleRender(true);
  }

  // ==================== INTERACTIVE CANVAS TOOLS ====================
  function setActiveTool(tool) {
    state.activeTool = state.activeTool === tool ? null : tool;
    el.selectObjectToolBtn.classList.toggle('active', state.activeTool === 'selectObject');
    el.eyedropperToolBtn.classList.toggle('active', state.activeTool === 'eyedropper');
    el.brushEraseBtn.classList.toggle('active', state.activeTool === 'erase');
    el.brushRestoreBtn.classList.toggle('active', state.activeTool === 'restore');
    el.brushPixelateBtn.classList.toggle('active', state.activeTool === 'pixelate');
    el.brushBlurRedactBtn.classList.toggle('active', state.activeTool === 'blurRedact');

    const isBrush = ['erase', 'restore', 'pixelate', 'blurRedact'].includes(state.activeTool);
    el.brushSizeControl.classList.toggle('hidden', !isBrush);
    el.brushCursor.classList.toggle('hidden', !isBrush);
    el.previewCanvas.style.cursor =
      state.activeTool === 'eyedropper' || state.activeTool === 'selectObject'
        ? 'crosshair'
        : isBrush
          ? 'none'
          : 'default';
  }

  function sampleColorFromCanvasEvent(e) {
    const item = getActiveItem();
    if (!item) return;
    const rect = el.previewCanvas.getBoundingClientRect();
    const u = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const temp = document.createElement('canvas');
    temp.width = item.width;
    temp.height = item.height;
    const tCtx = temp.getContext('2d');
    tCtx.drawImage(item.imgElement, 0, 0);
    const px = Math.min(item.width - 1, Math.floor(u * item.width));
    const py = Math.min(item.height - 1, Math.floor(v * item.height));
    const data = tCtx.getImageData(px, py, 1, 1).data;
    const sampledHex = rgbToHex(data[0], data[1], data[2]);

    state.settings.chromaColor = sampledHex;
    el.chromaColorInput.value = sampledHex;
    setBgRemovalMode('color');
    setActiveTool(null);
    showToast(`Sampled background color ${sampledHex.toUpperCase()}`);
    scheduleRender(true);
  }

  function applyBrushStrokeAtEvent(e) {
    const item = getActiveItem();
    if (!item || !['erase', 'restore', 'pixelate', 'blurRedact'].includes(state.activeTool)) return;

    const rect = el.previewCanvas.getBoundingClientRect();
    const u = (e.clientX - rect.left) / rect.width;
    const v = (e.clientY - rect.top) / rect.height;
    if (u < 0 || u > 1 || v < 0 || v > 1) return;

    const cx = Math.round(u * item.width);
    const cy = Math.round(v * item.height);
    const scaleRatio = item.width / Math.max(1, rect.width);
    const r = Math.max(2, Math.round((state.brushSize / 2) * scaleRatio));
    const rSq = r * r;

    const minY = Math.max(0, cy - r);
    const maxY = Math.min(item.height - 1, cy + r);
    const minX = Math.max(0, cx - r);
    const maxX = Math.min(item.width - 1, cx + r);

    if (state.activeTool === 'erase' || state.activeTool === 'restore') {
      const targetVal = state.activeTool === 'erase' ? 0 : 255;
      const bm = item.brushMask;
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cy;
        const rowOff = y * item.width;
        for (let x = minX; x <= maxX; x++) {
          const dx = x - cx;
          if (dx * dx + dy * dy <= rSq) bm[rowOff + x] = targetVal;
        }
      }
      item.hasManualBrush = true;
    } else {
      const redactType = state.activeTool === 'pixelate' ? 1 : 2;
      const rm = item.redactMask;
      for (let y = minY; y <= maxY; y++) {
        const dy = y - cy;
        const rowOff = y * item.width;
        for (let x = minX; x <= maxX; x++) {
          const dx = x - cx;
          if (dx * dx + dy * dy <= rSq) rm[rowOff + x] = redactType;
        }
      }
      item.hasRedaction = true;
    }

    scheduleRender(true);
  }

  // ==================== INSPECTOR UI HELPERS ====================
  function setBgRemovalMode(mode) {
    state.settings.bgRemovalMode = mode;
    el.bgRemovalModeGroup.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.bgMode === mode);
    });
    el.aiRemovalControls.classList.toggle('hidden', mode !== 'ai');
    el.colorRemovalControls.classList.toggle('hidden', mode !== 'color');

    if (mode === 'none') {
      el.bgRemovalStatusChip.textContent = 'Off';
      el.bgRemovalStatusChip.classList.remove('active');
    } else if (mode === 'ai') {
      el.bgRemovalStatusChip.textContent = 'AI Active';
      el.bgRemovalStatusChip.classList.add('active');
    } else {
      el.bgRemovalStatusChip.textContent = 'Chroma Key';
      el.bgRemovalStatusChip.classList.add('active');
    }
  }

  function setBgFillType(fillType) {
    state.settings.bgFillType = fillType;
    el.bgFillTypeGroup.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.fillType === fillType);
    });
    el.fillColorControls.classList.toggle('hidden', fillType !== 'color');
    el.fillGradientControls.classList.toggle('hidden', fillType !== 'gradient');
    el.fillBlurControls.classList.toggle('hidden', fillType !== 'blur');
    el.fillImageControls.classList.toggle('hidden', fillType !== 'image');
  }

  function setResizeMode(mode) {
    state.settings.resizeMode = mode;
    el.resizeModeGroup.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.resizeMode === mode);
    });
    el.resizePixelsControls.classList.toggle('hidden', mode !== 'pixels');
    el.resizePercentControls.classList.toggle('hidden', mode !== 'percent');
    el.resizeMaxControls.classList.toggle('hidden', mode !== 'max');
  }

  function resetColorEnhancements() {
    const s = state.settings;
    s.filterPreset = 'none';
    s.brightness = s.contrast = s.exposure = s.saturation = s.vibrance = s.highlights = s.shadows = s.warmth = s.sharpen = 0;
    el.filterPresetGrid.querySelectorAll('.preset-card').forEach((c) => {
      c.classList.toggle('active', c.dataset.filter === 'none');
    });
    const map = [
      [el.adjBrightSlider, el.adjBrightVal, '0'],
      [el.adjContrastSlider, el.adjContrastVal, '0'],
      [el.adjExposureSlider, el.adjExposureVal, '0'],
      [el.adjSatSlider, el.adjSatVal, '0'],
      [el.adjVibSlider, el.adjVibVal, '0'],
      [el.adjHighSlider, el.adjHighVal, '0'],
      [el.adjShadSlider, el.adjShadVal, '0'],
      [el.adjWarmthSlider, el.adjWarmthVal, '0'],
      [el.adjSharpSlider, el.adjSharpVal, '0%']
    ];
    map.forEach(([slider, label, txt]) => {
      slider.value = 0;
      label.textContent = txt;
    });
  }

  // ==================== EVENT BINDINGS ====================
  function bindEvents() {
    el.modeSingleBtn.addEventListener('click', () => switchMode('single'));
    el.modeBulkBtn.addEventListener('click', () => switchMode('bulk'));

    el.fileInput.addEventListener('change', (e) => {
      addFiles(e.target.files);
      e.target.value = '';
    });
    el.addMoreFilmstripBtn.addEventListener('click', () => el.fileInput.click());
    el.loadSampleBtn.addEventListener('click', loadDemoSamples);
    el.emptySampleBtn.addEventListener('click', loadDemoSamples);
    el.copyClipboardBtn.addEventListener('click', copyEditedToClipboard);

    // Global Clipboard Paste (Ctrl+V) & Copy (Ctrl+C)
    window.addEventListener('paste', (e) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
        addFiles(e.clipboardData.files);
      }
    });

    el.clearQueueBtn.addEventListener('click', () => {
      state.items = [];
      state.activeId = null;
      updateUIState();
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      el.dropZone.classList.add('drag-over');
    });
    window.addEventListener('dragleave', (e) => {
      if (e.target === document.body || e.clientX <= 0 || e.clientY <= 0) {
        el.dropZone.classList.remove('drag-over');
      }
    });
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      el.dropZone.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
    });

    // Inspector Tabs
    document.querySelectorAll('.insp-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.insp-tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach((p) => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
      });
    });

    // Tab 1: Background & Cutout
    el.bgRemovalModeGroup.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        setBgRemovalMode(btn.dataset.bgMode);
        if (btn.dataset.bgMode === 'ai') {
          runAutoDetectAndRemoveBg();
        } else {
          scheduleRender(true);
        }
      });
    });

    el.aiEngineSelect.addEventListener('change', (e) => {
      state.settings.aiEngine = e.target.value;
      const item = getActiveItem();
      if (item) item.cachedAiKey = null;
      runAutoDetectAndRemoveBg();
    });

    el.aiSensitivitySlider.addEventListener('input', (e) => {
      state.settings.aiSensitivity = parseInt(e.target.value, 10);
      el.aiSensitivityVal.textContent = `${state.settings.aiSensitivity}%`;
      scheduleRender();
    });
    el.aiFeatherSlider.addEventListener('input', (e) => {
      state.settings.aiFeather = parseInt(e.target.value, 10);
      el.aiFeatherVal.textContent = `${state.settings.aiFeather} px`;
      scheduleRender();
    });
    el.cleanupIslandsCheck.addEventListener('change', (e) => {
      state.settings.cleanupIslands = e.target.checked;
      scheduleRender(true);
    });
    el.autoBgOnUploadCheck.addEventListener('change', (e) => {
      state.settings.autoBgOnUpload = e.target.checked;
      if (e.target.checked) {
        showToast('Auto-Remove Background on Upload enabled!');
      }
    });
    el.runAiCutoutBtn.addEventListener('click', () => {
      runAutoDetectAndRemoveBg();
    });
    el.quickAutoBgBtn.addEventListener('click', () => {
      runAutoDetectAndRemoveBg();
    });
    el.bulkAutoRemoveBgBtn.addEventListener('click', () => {
      runBulkAutoRemoveBg();
    });

    el.chromaColorInput.addEventListener('input', (e) => {
      state.settings.chromaColor = e.target.value;
      scheduleRender();
    });
    document.querySelectorAll('[data-chroma]').forEach((sw) => {
      sw.addEventListener('click', () => {
        state.settings.chromaColor = sw.dataset.chroma;
        el.chromaColorInput.value = sw.dataset.chroma;
        scheduleRender(true);
      });
    });
    el.pickFromCanvasBtn.addEventListener('click', () => {
      if (state.mode !== 'single') switchMode('single');
      setActiveTool('eyedropper');
      showToast('Click any background pixel on the canvas to sample its color');
    });
    el.chromaToleranceSlider.addEventListener('input', (e) => {
      state.settings.chromaTolerance = parseInt(e.target.value, 10);
      el.chromaToleranceVal.textContent = `${state.settings.chromaTolerance}%`;
      scheduleRender();
    });
    el.chromaFeatherSlider.addEventListener('input', (e) => {
      state.settings.chromaFeather = parseInt(e.target.value, 10);
      el.chromaFeatherVal.textContent = `${state.settings.chromaFeather}%`;
      scheduleRender();
    });
    el.chromaContiguousCheck.addEventListener('change', (e) => {
      state.settings.chromaContiguous = e.target.checked;
      scheduleRender(true);
    });

    el.bgFillTypeGroup.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        setBgFillType(btn.dataset.fillType);
        scheduleRender(true);
      });
    });
    el.bgSolidColorInput.addEventListener('input', (e) => {
      state.settings.bgSolidColor = e.target.value;
      scheduleRender();
    });
    document.querySelectorAll('[data-bg-solid]').forEach((sw) => {
      sw.addEventListener('click', () => {
        state.settings.bgSolidColor = sw.dataset.bgSolid;
        el.bgSolidColorInput.value = sw.dataset.bgSolid;
        setBgFillType('color');
        scheduleRender(true);
      });
    });
    el.bgGradColor1.addEventListener('input', (e) => {
      state.settings.bgGradColor1 = e.target.value;
      scheduleRender();
    });
    el.bgGradColor2.addEventListener('input', (e) => {
      state.settings.bgGradColor2 = e.target.value;
      scheduleRender();
    });
    el.bgGradAngleSlider.addEventListener('input', (e) => {
      state.settings.bgGradAngle = parseInt(e.target.value, 10);
      el.bgGradAngleVal.textContent = `${state.settings.bgGradAngle}°`;
      scheduleRender();
    });
    document.querySelectorAll('[data-grad1]').forEach((sw) => {
      sw.addEventListener('click', () => {
        state.settings.bgGradColor1 = sw.dataset.grad1;
        state.settings.bgGradColor2 = sw.dataset.grad2;
        el.bgGradColor1.value = sw.dataset.grad1;
        el.bgGradColor2.value = sw.dataset.grad2;
        setBgFillType('gradient');
        scheduleRender(true);
      });
    });
    el.bgBlurAmountSlider.addEventListener('input', (e) => {
      state.settings.bgBlurAmount = parseInt(e.target.value, 10);
      el.bgBlurAmountVal.textContent = `${state.settings.bgBlurAmount} px`;
      scheduleRender();
    });
    el.bgBlurBrightSlider.addEventListener('input', (e) => {
      state.settings.bgBlurBrightness = parseInt(e.target.value, 10);
      el.bgBlurBrightVal.textContent = `${state.settings.bgBlurBrightness}%`;
      scheduleRender();
    });
    el.bgCustomImageInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      state.settings.bgCustomImage = await loadImageFromFile(file);
      el.bgCustomImageName.textContent = `Loaded: ${file.name}`;
      setBgFillType('image');
      scheduleRender(true);
    });

    // Category 3: Advanced Subject Styling
    el.autoTrimCheck.addEventListener('change', (e) => {
      state.settings.autoTrim = e.target.checked;
      scheduleRender(true);
    });
    el.strokeWidthSlider.addEventListener('input', (e) => {
      state.settings.strokeWidth = parseInt(e.target.value, 10);
      el.strokeWidthVal.textContent = `${state.settings.strokeWidth} px`;
      scheduleRender();
    });
    el.strokeColorInput.addEventListener('input', (e) => {
      state.settings.strokeColor = e.target.value;
      scheduleRender();
    });
    el.contactShadowCheck.addEventListener('change', (e) => {
      state.settings.contactShadow = e.target.checked;
      scheduleRender(true);
    });
    el.floorReflectionCheck.addEventListener('change', (e) => {
      state.settings.floorReflection = e.target.checked;
      el.reflectionOpacityRow.classList.toggle('hidden', !e.target.checked);
      scheduleRender(true);
    });
    el.reflectionOpacitySlider.addEventListener('input', (e) => {
      state.settings.reflectionOpacity = parseInt(e.target.value, 10);
      el.reflectionOpacityVal.textContent = `${state.settings.reflectionOpacity}%`;
      scheduleRender();
    });

    el.bgPaddingSlider.addEventListener('input', (e) => {
      state.settings.bgPadding = parseInt(e.target.value, 10);
      el.bgPaddingVal.textContent = `${state.settings.bgPadding}%`;
      scheduleRender();
    });
    el.bgShadowSlider.addEventListener('input', (e) => {
      state.settings.bgShadow = parseInt(e.target.value, 10);
      el.bgShadowVal.textContent = `${state.settings.bgShadow} px`;
      scheduleRender();
    });
    el.bgRadiusSlider.addEventListener('input', (e) => {
      state.settings.bgRadius = parseInt(e.target.value, 10);
      el.bgRadiusVal.textContent = `${state.settings.bgRadius} px`;
      scheduleRender();
    });

    // Category 1: Tab 2 Color Grading, Filters & Sharpening
    el.resetEnhanceBtn.addEventListener('click', () => {
      resetColorEnhancements();
      scheduleRender(true);
    });
    el.autoEnhanceBtn.addEventListener('click', () => {
      const s = state.settings;
      s.brightness = 6;
      s.contrast = 16;
      s.vibrance = 22;
      s.shadows = 14;
      s.sharpen = 24;
      el.adjBrightSlider.value = 6; el.adjBrightVal.textContent = '6';
      el.adjContrastSlider.value = 16; el.adjContrastVal.textContent = '16';
      el.adjVibSlider.value = 22; el.adjVibVal.textContent = '22';
      el.adjShadSlider.value = 14; el.adjShadVal.textContent = '14';
      el.adjSharpSlider.value = 24; el.adjSharpVal.textContent = '24%';
      scheduleRender(true);
      showToast('Applied Auto-Enhance Light & Clarity!');
    });

    el.filterPresetGrid.querySelectorAll('.preset-card').forEach((card) => {
      card.addEventListener('click', () => {
        el.filterPresetGrid.querySelectorAll('.preset-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        state.settings.filterPreset = card.dataset.filter;
        scheduleRender(true);
      });
    });

    const colorSliders = [
      [el.adjBrightSlider, el.adjBrightVal, 'brightness', ''],
      [el.adjContrastSlider, el.adjContrastVal, 'contrast', ''],
      [el.adjExposureSlider, el.adjExposureVal, 'exposure', ''],
      [el.adjSatSlider, el.adjSatVal, 'saturation', ''],
      [el.adjVibSlider, el.adjVibVal, 'vibrance', ''],
      [el.adjHighSlider, el.adjHighVal, 'highlights', ''],
      [el.adjShadSlider, el.adjShadVal, 'shadows', ''],
      [el.adjWarmthSlider, el.adjWarmthVal, 'warmth', ''],
      [el.adjSharpSlider, el.adjSharpVal, 'sharpen', '%']
    ];
    colorSliders.forEach(([slider, valEl, key, suffix]) => {
      slider.addEventListener('input', (e) => {
        state.settings[key] = parseInt(e.target.value, 10);
        valEl.textContent = `${state.settings[key]}${suffix}`;
        scheduleRender();
      });
    });

    // Category 2: Tab 3 Watermark, Badges & Frames
    el.wmTextEnableCheck.addEventListener('change', (e) => {
      state.settings.wmTextEnabled = e.target.checked;
      scheduleRender(true);
    });
    el.wmTextInput.addEventListener('input', (e) => {
      state.settings.wmText = e.target.value;
      if (!state.settings.wmTextEnabled) {
        state.settings.wmTextEnabled = true;
        el.wmTextEnableCheck.checked = true;
      }
      scheduleRender();
    });
    el.wmTextColorInput.addEventListener('input', (e) => {
      state.settings.wmTextColor = e.target.value;
      scheduleRender();
    });
    el.wmTextSizeInput.addEventListener('input', (e) => {
      state.settings.wmTextSize = parseInt(e.target.value, 10) || 36;
      scheduleRender();
    });
    el.wmOpacitySlider.addEventListener('input', (e) => {
      state.settings.wmOpacity = parseInt(e.target.value, 10);
      el.wmOpacityVal.textContent = `${state.settings.wmOpacity}%`;
      scheduleRender();
    });
    el.wmAngleSlider.addEventListener('input', (e) => {
      state.settings.wmAngle = parseInt(e.target.value, 10);
      el.wmAngleVal.textContent = `${state.settings.wmAngle}°`;
      scheduleRender();
    });
    el.wmLogoFileInput.addEventListener('change', async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      state.settings.wmLogoImg = await loadImageFromFile(f);
      scheduleRender(true);
      showToast(`Loaded watermark logo: ${f.name}`);
    });
    el.clearWmLogoBtn.addEventListener('click', () => {
      state.settings.wmLogoImg = null;
      scheduleRender(true);
    });
    el.wmLogoScaleSlider.addEventListener('input', (e) => {
      state.settings.wmLogoScale = parseInt(e.target.value, 10);
      el.wmLogoScaleVal.textContent = `${state.settings.wmLogoScale}%`;
      scheduleRender();
    });
    el.wmTileCheck.addEventListener('change', (e) => {
      state.settings.wmTiled = e.target.checked;
      scheduleRender(true);
    });
    el.wmAnchorGrid.querySelectorAll('.anchor-cell').forEach((cell) => {
      cell.addEventListener('click', () => {
        el.wmAnchorGrid.querySelectorAll('.anchor-cell').forEach((c) => c.classList.remove('active'));
        cell.classList.add('active');
        state.settings.wmAnchor = cell.dataset.anchor;
        scheduleRender(true);
      });
    });

    el.badgeTextInput.addEventListener('input', (e) => {
      state.settings.badgeText = e.target.value;
      scheduleRender();
    });
    el.badgeColorInput.addEventListener('input', (e) => {
      state.settings.badgeColor = e.target.value;
      scheduleRender();
    });
    document.querySelectorAll('[data-badge]').forEach((chip) => {
      chip.addEventListener('click', () => {
        state.settings.badgeText = chip.dataset.badge;
        el.badgeTextInput.value = chip.dataset.badge;
        scheduleRender(true);
      });
    });
    el.borderFrameSlider.addEventListener('input', (e) => {
      state.settings.borderFrameWidth = parseInt(e.target.value, 10);
      el.borderFrameVal.textContent = `${state.settings.borderFrameWidth} px`;
      scheduleRender();
    });
    el.borderFrameColorInput.addEventListener('input', (e) => {
      state.settings.borderFrameColor = e.target.value;
      scheduleRender();
    });

    // Category 4: Tab 4 Interactive Crop & Dimensions
    el.cropBoxToolBtn.addEventListener('click', () => toggleCropBox());
    el.toggleCropBoxBtn.addEventListener('click', () => toggleCropBox());
    el.applyCropBtn.addEventListener('click', applyInteractiveCrop);
    el.resetCropBtn.addEventListener('click', resetInteractiveCrop);

    el.cropRatioChips.querySelectorAll('.chip-btn').forEach((chip) => {
      chip.addEventListener('click', () => {
        el.cropRatioChips.querySelectorAll('.chip-btn').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        state.cropRatio = chip.dataset.cropRatio;
        toggleCropBox(true);
      });
    });

    // Interactive Crop Box Dragging & Corner Resizing
    let cropDragMode = null;
    let cropStartMouse = { x: 0, y: 0 };
    let cropStartRect = null;

    el.cropSelectionBox.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      const handle = e.target.dataset.handle;
      cropDragMode = handle || 'move';
      cropStartMouse = { x: e.clientX, y: e.clientY };
      cropStartRect = { ...state.cropRect };
    });

    window.addEventListener('mousemove', (e) => {
      if (!cropDragMode || !state.cropBoxActive) return;
      const stageRect = el.previewCanvas.getBoundingClientRect();
      const dx = (e.clientX - cropStartMouse.x) / Math.max(1, stageRect.width);
      const dy = (e.clientY - cropStartMouse.y) / Math.max(1, stageRect.height);

      const r = { ...cropStartRect };
      if (cropDragMode === 'move') {
        r.x = Math.max(0, Math.min(1 - r.w, r.x + dx));
        r.y = Math.max(0, Math.min(1 - r.h, r.y + dy));
      } else {
        if (cropDragMode.includes('e')) r.w = Math.max(0.1, Math.min(1 - r.x, r.w + dx));
        if (cropDragMode.includes('s')) r.h = Math.max(0.1, Math.min(1 - r.y, r.h + dy));
        if (cropDragMode.includes('w')) {
          const nw = Math.max(0.1, r.w - dx);
          r.x = Math.max(0, r.x + (r.w - nw));
          r.w = nw;
        }
        if (cropDragMode.includes('n')) {
          const nh = Math.max(0.1, r.h - dy);
          r.y = Math.max(0, r.y + (r.h - nh));
          r.h = nh;
        }
      }
      state.cropRect = r;
      updateCropOverlayPosition();
    });

    window.addEventListener('mouseup', () => {
      cropDragMode = null;
    });

    // Resize & Cover Anchor Controls
    el.resizeModeGroup.querySelectorAll('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        setResizeMode(btn.dataset.resizeMode);
        scheduleRender(true);
      });
    });
    el.lockAspectBtn.addEventListener('click', () => {
      state.settings.lockAspect = !state.settings.lockAspect;
      el.lockAspectBtn.classList.toggle('active', state.settings.lockAspect);
    });
    el.resizeWidthInput.addEventListener('input', (e) => {
      const w = Math.max(1, parseInt(e.target.value, 10) || 1);
      state.settings.resizeWidth = w;
      if (state.settings.lockAspect) {
        const active = getActiveItem();
        const ratio = active ? active.height / active.width : 1;
        state.settings.resizeHeight = Math.max(1, Math.round(w * ratio));
        el.resizeHeightInput.value = state.settings.resizeHeight;
      }
      scheduleRender();
    });
    el.resizeHeightInput.addEventListener('input', (e) => {
      const h = Math.max(1, parseInt(e.target.value, 10) || 1);
      state.settings.resizeHeight = h;
      if (state.settings.lockAspect) {
        const active = getActiveItem();
        const ratio = active ? active.width / active.height : 1;
        state.settings.resizeWidth = Math.max(1, Math.round(h * ratio));
        el.resizeWidthInput.value = state.settings.resizeWidth;
      }
      scheduleRender();
    });
    el.resizeFitSelect.addEventListener('change', (e) => {
      state.settings.resizeFit = e.target.value;
      scheduleRender(true);
    });
    el.coverAnchorGrid.querySelectorAll('.anchor-cell').forEach((cell) => {
      cell.addEventListener('click', () => {
        el.coverAnchorGrid.querySelectorAll('.anchor-cell').forEach((c) => c.classList.remove('active'));
        cell.classList.add('active');
        state.settings.coverAnchor = cell.dataset.coverAnchor;
        state.settings.resizeFit = 'cover';
        el.resizeFitSelect.value = 'cover';
        scheduleRender(true);
      });
    });
    el.resizePercentSlider.addEventListener('input', (e) => {
      state.settings.resizePercent = parseInt(e.target.value, 10);
      el.resizePercentVal.textContent = `${state.settings.resizePercent}%`;
      scheduleRender();
    });
    document.querySelectorAll('[data-scale-preset]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const val = parseInt(chip.dataset.scalePreset, 10);
        state.settings.resizePercent = val;
        el.resizePercentSlider.value = val;
        el.resizePercentVal.textContent = `${val}%`;
        setResizeMode('percent');
        scheduleRender(true);
      });
    });
    el.resizeMaxSideInput.addEventListener('input', (e) => {
      state.settings.resizeMaxSide = Math.max(16, parseInt(e.target.value, 10) || 1200);
      scheduleRender();
    });
    document.querySelectorAll('#tab-dimensions .preset-card').forEach((card) => {
      card.addEventListener('click', () => {
        const w = parseInt(card.dataset.w, 10);
        const h = parseInt(card.dataset.h, 10);
        state.settings.lockAspect = false;
        el.lockAspectBtn.classList.remove('active');
        state.settings.resizeWidth = w;
        state.settings.resizeHeight = h;
        el.resizeWidthInput.value = w;
        el.resizeHeightInput.value = h;
        setResizeMode('pixels');
        scheduleRender(true);
      });
    });

    el.rotLeftBtn.addEventListener('click', () => {
      state.settings.rotation = (state.settings.rotation + 270) % 360;
      scheduleRender(true);
    });
    el.rotRightBtn.addEventListener('click', () => {
      state.settings.rotation = (state.settings.rotation + 90) % 360;
      scheduleRender(true);
    });
    el.flipHBtn.addEventListener('click', () => {
      state.settings.flipH = !state.settings.flipH;
      scheduleRender(true);
    });
    el.flipVBtn.addEventListener('click', () => {
      state.settings.flipV = !state.settings.flipV;
      scheduleRender(true);
    });
    el.straightenSlider.addEventListener('input', (e) => {
      state.settings.straighten = parseFloat(e.target.value) || 0;
      el.straightenVal.textContent = `${state.settings.straighten}°`;
      scheduleRender();
    });

    // Category 5 & 6: Tab 5 Format, Recipes, EXIF & Power Packs
    el.recipeSelect.addEventListener('change', (e) => {
      applyPresetRecipe(e.target.value);
    });
    el.saveRecipeBtn.addEventListener('click', () => {
      const name = prompt('Enter a name for this custom preset recipe:');
      if (!name || !name.trim()) return;
      const key = name.trim();
      const copy = { ...state.settings, bgCustomImage: null, wmLogoImg: null };
      state.customRecipes[key] = copy;
      localStorage.setItem('orion_custom_recipes', JSON.stringify(state.customRecipes));
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `★ ${key}`;
      el.recipeSelect.appendChild(opt);
      el.recipeSelect.value = key;
      showToast(`Saved custom recipe "${key}"`);
    });

    el.formatSelectorGrid.querySelectorAll('.format-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        selectFormatOption(opt.dataset.format);
        scheduleRender(true);
      });
    });
    el.qualitySlider.addEventListener('input', (e) => {
      state.settings.quality = parseInt(e.target.value, 10);
      el.qualityVal.textContent = `${state.settings.quality}%`;
      scheduleRender();
    });
    el.enableTargetSizeCheck.addEventListener('change', (e) => {
      state.settings.enableTargetSize = e.target.checked;
      el.targetSizeControls.classList.toggle('hidden', !e.target.checked);
      scheduleRender(true);
    });
    el.targetSizeKbInput.addEventListener('input', (e) => {
      state.settings.targetSizeKb = Math.max(5, parseFloat(e.target.value) || 100);
      scheduleRender();
    });
    document.querySelectorAll('[data-kb-preset]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const kb = parseInt(chip.dataset.kbPreset, 10);
        state.settings.enableTargetSize = true;
        state.settings.targetSizeKb = kb;
        el.enableTargetSizeCheck.checked = true;
        el.targetSizeControls.classList.remove('hidden');
        el.targetSizeKbInput.value = kb;
        scheduleRender(true);
      });
    });
    el.stripExifCheck.addEventListener('change', (e) => {
      state.settings.stripExif = e.target.checked;
      scheduleRender(true);
    });
    el.filenamePatternSelect.addEventListener('change', (e) => {
      state.settings.filenamePattern = e.target.value;
      scheduleRender(true);
    });
    el.exportResponsivePackBtn.addEventListener('click', exportResponsivePack);
    el.exportSheetFromSingleBtn.addEventListener('click', exportContactSheet);
    el.exportContactSheetBtn.addEventListener('click', exportContactSheet);

    // Canvas Toolbar Interactive Tools
    el.compareToggleBtn.addEventListener('click', () => {
      state.splitCompare = !state.splitCompare;
      el.compareToggleBtn.classList.toggle('active', state.splitCompare);
      updateSplitViewClip();
    });
    el.holdOriginalBtn.addEventListener('mousedown', () => {
      state.holdOriginal = true;
      updateSplitViewClip();
    });
    window.addEventListener('mouseup', () => {
      if (state.holdOriginal) {
        state.holdOriginal = false;
        updateSplitViewClip();
      }
    });

    let draggingSplit = false;
    el.splitHandle.addEventListener('mousedown', (e) => {
      draggingSplit = true;
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => {
      if (draggingSplit) {
        const rect = el.canvasStageWrapper.getBoundingClientRect();
        state.splitPos = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
        updateSplitViewClip();
      }
      if (['erase', 'restore', 'pixelate', 'blurRedact'].includes(state.activeTool)) {
        el.brushCursor.style.left = `${e.clientX}px`;
        el.brushCursor.style.top = `${e.clientY}px`;
        el.brushCursor.style.width = `${state.brushSize}px`;
        el.brushCursor.style.height = `${state.brushSize}px`;
      }
    });
    window.addEventListener('mouseup', () => {
      draggingSplit = false;
    });

    el.selectObjectToolBtn.addEventListener('click', () => {
      setActiveTool('selectObject');
      if (state.activeTool === 'selectObject') {
        showToast('🎯 Click directly on any object in the image to detect & isolate it');
      }
    });
    el.eyedropperToolBtn.addEventListener('click', () => setActiveTool('eyedropper'));
    el.brushEraseBtn.addEventListener('click', () => setActiveTool('erase'));
    el.brushRestoreBtn.addEventListener('click', () => setActiveTool('restore'));
    el.brushPixelateBtn.addEventListener('click', () => setActiveTool('pixelate'));
    el.brushBlurRedactBtn.addEventListener('click', () => setActiveTool('blurRedact'));

    el.brushSizeSlider.addEventListener('input', (e) => {
      state.brushSize = parseInt(e.target.value, 10);
    });
    el.clearBrushMaskBtn.addEventListener('click', () => {
      const item = getActiveItem();
      if (item) {
        if (item.brushMask) item.brushMask.fill(128);
        if (item.redactMask) item.redactMask.fill(0);
        item.hasManualBrush = false;
        item.hasRedaction = false;
        scheduleRender(true);
        showToast('Cleared manual brush & privacy redaction strokes');
      }
    });

    let painting = false;
    el.previewCanvas.addEventListener('mousedown', (e) => {
      if (state.activeTool === 'selectObject') {
        isolateClickedObjectAtEvent(e);
        return;
      }
      if (state.activeTool === 'eyedropper') {
        sampleColorFromCanvasEvent(e);
        return;
      }
      if (['erase', 'restore', 'pixelate', 'blurRedact'].includes(state.activeTool)) {
        painting = true;
        applyBrushStrokeAtEvent(e);
      }
    });
    window.addEventListener('mousemove', (e) => {
      if (painting) applyBrushStrokeAtEvent(e);
    });
    window.addEventListener('mouseup', () => {
      painting = false;
    });

    // Zoom
    el.zoomInBtn.addEventListener('click', () => {
      state.zoom = Math.min(4, +(state.zoom + 0.2).toFixed(2));
      applyViewportDisplaySize();
    });
    el.zoomOutBtn.addEventListener('click', () => {
      state.zoom = Math.max(0.2, +(state.zoom - 0.2).toFixed(2));
      applyViewportDisplaySize();
    });
    el.zoomFitBtn.addEventListener('click', () => {
      state.zoom = 1;
      applyViewportDisplaySize();
    });
    window.addEventListener('resize', applyViewportDisplaySize);

    // Global Reset
    el.resetAllBtn.addEventListener('click', () => {
      setBgRemovalMode('none');
      setBgFillType('transparent');
      setResizeMode('original');
      resetColorEnhancements();
      state.settings.autoTrim = false;
      state.settings.strokeWidth = 0;
      state.settings.contactShadow = false;
      state.settings.floorReflection = false;
      state.settings.bgPadding = 0;
      state.settings.bgShadow = 0;
      state.settings.bgRadius = 0;
      state.settings.wmTextEnabled = false;
      state.settings.wmLogoImg = null;
      state.settings.badgeText = '';
      state.settings.borderFrameWidth = 0;
      state.settings.rotation = 0;
      state.settings.straighten = 0;
      state.settings.flipH = false;
      state.settings.flipV = false;
      state.settings.enableTargetSize = false;

      el.autoTrimCheck.checked = false;
      el.strokeWidthSlider.value = 0;
      el.strokeWidthVal.textContent = '0 px';
      el.contactShadowCheck.checked = false;
      el.floorReflectionCheck.checked = false;
      el.reflectionOpacityRow.classList.add('hidden');
      el.bgPaddingSlider.value = 0; el.bgPaddingVal.textContent = '0%';
      el.bgShadowSlider.value = 0; el.bgShadowVal.textContent = '0 px';
      el.bgRadiusSlider.value = 0; el.bgRadiusVal.textContent = '0 px';
      el.wmTextEnableCheck.checked = false;
      el.badgeTextInput.value = '';
      el.borderFrameSlider.value = 0; el.borderFrameVal.textContent = '0 px';
      el.straightenSlider.value = 0; el.straightenVal.textContent = '0°';
      el.enableTargetSizeCheck.checked = false;
      el.targetSizeControls.classList.add('hidden');

      state.items.forEach((it) => {
        if (it.brushMask) it.brushMask.fill(128);
        if (it.redactMask) it.redactMask.fill(0);
        it.hasManualBrush = false;
        it.hasRedaction = false;
      });

      scheduleRender(true);
      showToast('All studio settings reset to defaults');
    });

    // Export Buttons
    el.exportCurrentBtn.addEventListener('click', exportCurrentOrBulk);
    el.inspectorExportBtn.addEventListener('click', exportCurrentOrBulk);
    el.processAllBulkBtn.addEventListener('click', renderBulkGrid);
    el.downloadAllZipBtn.addEventListener('click', downloadAllAsZip);
    el.downloadMergedPdfBtn.addEventListener('click', downloadBatchMergedPdf);

    // Populate any saved custom recipes from localStorage
    Object.keys(state.customRecipes).forEach((key) => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = `★ ${key}`;
      el.recipeSelect.appendChild(opt);
    });
  }

  bindEvents();
  updateUIState();
})();
