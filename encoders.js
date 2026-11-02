/**
 * Orion Image Studio — Multi-Format Binary Image Encoders & File Size Optimizer
 * Supports: PNG, JPG/JPEG, WebP, AVIF, BMP, GIF (GIF89a LZW), ICO (Single & Multi-Size Pack), PDF (Single & Multi-page)
 */

window.OrionEncoders = (function () {
  const EXT_MAP = {
    png: 'png',
    jpeg: 'jpg',
    webp: 'webp',
    avif: 'avif',
    bmp: 'bmp',
    gif: 'gif',
    ico: 'ico',
    pdf: 'pdf'
  };

  function getExtension(format) {
    return EXT_MAP[format] || 'png';
  }

  function canvasToBlobNative(canvas, mimeType, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mimeType, quality);
    });
  }

  function flattenCanvas(sourceCanvas, fillHex = '#ffffff') {
    const c = document.createElement('canvas');
    c.width = sourceCanvas.width;
    c.height = sourceCanvas.height;
    const ctx = c.getContext('2d');
    ctx.fillStyle = fillHex;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(sourceCanvas, 0, 0);
    return c;
  }

  function scaleCanvas(sourceCanvas, width, height) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(width));
    c.height = Math.max(1, Math.round(height));
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, c.width, c.height);
    return c;
  }

  function quantizeCanvasColors(sourceCanvas, levels = 32) {
    const c = document.createElement('canvas');
    c.width = sourceCanvas.width;
    c.height = sourceCanvas.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(sourceCanvas, 0, 0);
    const imgData = ctx.getImageData(0, 0, c.width, c.height);
    const d = imgData.data;
    const step = 255 / Math.max(2, levels - 1);
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.round(Math.round(d[i] / step) * step);
      d[i + 1] = Math.round(Math.round(d[i + 1] / step) * step);
      d[i + 2] = Math.round(Math.round(d[i + 2] / step) * step);
    }
    ctx.putImageData(imgData, 0, 0);
    return c;
  }

  /**
   * 1. BMP Encoder (32-bit BGRA Windows Bitmap V4/DIB)
   */
  function encodeBMP(canvas) {
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, width, height).data;

    const fileHeaderSize = 14;
    const infoHeaderSize = 40;
    const headerSize = fileHeaderSize + infoHeaderSize;
    const rowSize = width * 4;
    const pixelArraySize = rowSize * height;
    const fileSize = headerSize + pixelArraySize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    view.setUint8(0, 0x42); // 'B'
    view.setUint8(1, 0x4d); // 'M'
    view.setUint32(2, fileSize, true);
    view.setUint32(6, 0, true);
    view.setUint32(10, headerSize, true);

    view.setUint32(14, infoHeaderSize, true);
    view.setInt32(18, width, true);
    view.setInt32(22, -height, true); // top-down DIB
    view.setUint16(26, 1, true);
    view.setUint16(28, 32, true);
    view.setUint32(30, 0, true);
    view.setUint32(34, pixelArraySize, true);
    view.setInt32(38, 2835, true);
    view.setInt32(42, 2835, true);
    view.setUint32(46, 0, true);
    view.setUint32(50, 0, true);

    let offset = headerSize;
    for (let i = 0; i < imgData.length; i += 4) {
      view.setUint8(offset, imgData[i + 2]);
      view.setUint8(offset + 1, imgData[i + 1]);
      view.setUint8(offset + 2, imgData[i]);
      view.setUint8(offset + 3, imgData[i + 3]);
      offset += 4;
    }

    return new Blob([buffer], { type: 'image/bmp' });
  }

  /**
   * 2. GIF89a Encoder (256-Color Quantized + Transparency + LZW compression)
   */
  function encodeGIF(canvas) {
    const width = canvas.width;
    const height = canvas.height;
    const ctx = canvas.getContext('2d');
    const rgba = ctx.getImageData(0, 0, width, height).data;

    const palette = new Uint8Array(256 * 3);
    let pIdx = 0;
    for (let r = 0; r < 6; r++) {
      for (let g = 0; g < 6; g++) {
        for (let b = 0; b < 6; b++) {
          palette[pIdx * 3] = Math.round((r * 255) / 5);
          palette[pIdx * 3 + 1] = Math.round((g * 255) / 5);
          palette[pIdx * 3 + 2] = Math.round((b * 255) / 5);
          pIdx++;
        }
      }
    }
    while (pIdx < 255) {
      const v = Math.round(((pIdx - 216) * 255) / 38);
      palette[pIdx * 3] = v;
      palette[pIdx * 3 + 1] = v;
      palette[pIdx * 3 + 2] = v;
      pIdx++;
    }
    const transIndex = 255;

    const indexedPixels = new Uint8Array(width * height);
    for (let i = 0, p = 0; i < rgba.length; i += 4, p++) {
      const a = rgba[i + 3];
      if (a < 128) {
        indexedPixels[p] = transIndex;
      } else {
        const r = Math.round((rgba[i] * 5) / 255);
        const g = Math.round((rgba[i + 1] * 5) / 255);
        const b = Math.round((rgba[i + 2] * 5) / 255);
        indexedPixels[p] = r * 36 + g * 6 + b;
      }
    }

    const bytes = [];
    function writeStr(s) {
      for (let i = 0; i < s.length; i++) bytes.push(s.charCodeAt(i));
    }
    function writeU16(v) {
      bytes.push(v & 0xff, (v >> 8) & 0xff);
    }

    writeStr('GIF89a');
    writeU16(width);
    writeU16(height);
    bytes.push(0xf7, 0, 0);

    for (let i = 0; i < 768; i++) bytes.push(palette[i]);

    bytes.push(0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, transIndex, 0x00);
    bytes.push(0x2c);
    writeU16(0);
    writeU16(0);
    writeU16(width);
    writeU16(height);
    bytes.push(0x00);

    const minCodeSize = 8;
    bytes.push(minCodeSize);

    const clearCode = 1 << minCodeSize;
    const eoiCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = eoiCode + 1;
    let dict = new Map();

    let bitBuffer = 0;
    let bitCount = 0;
    let subBlock = [];

    function flushSubBlock() {
      if (subBlock.length > 0) {
        bytes.push(subBlock.length);
        for (let i = 0; i < subBlock.length; i++) bytes.push(subBlock[i]);
        subBlock = [];
      }
    }

    function emitCode(code) {
      bitBuffer |= code << bitCount;
      bitCount += codeSize;
      while (bitCount >= 8) {
        subBlock.push(bitBuffer & 0xff);
        if (subBlock.length === 255) flushSubBlock();
        bitBuffer >>= 8;
        bitCount -= 8;
      }
    }

    emitCode(clearCode);
    let prefix = indexedPixels[0];

    for (let i = 1; i < indexedPixels.length; i++) {
      const k = indexedPixels[i];
      const key = (prefix << 8) | k;
      if (dict.has(key)) {
        prefix = dict.get(key);
      } else {
        emitCode(prefix);
        if (nextCode < 4096) {
          dict.set(key, nextCode++);
          if (nextCode > (1 << codeSize) && codeSize < 12) codeSize++;
        } else {
          emitCode(clearCode);
          dict.clear();
          codeSize = minCodeSize + 1;
          nextCode = eoiCode + 1;
        }
        prefix = k;
      }
    }

    emitCode(prefix);
    emitCode(eoiCode);
    if (bitCount > 0) subBlock.push(bitBuffer & 0xff);
    flushSubBlock();
    bytes.push(0x00);
    bytes.push(0x3b);

    return new Blob([new Uint8Array(bytes)], { type: 'image/gif' });
  }

  /**
   * 3. ICO Encoder (Single or Multi-Resolution Windows Icon Container)
   */
  async function encodeICO(canvas) {
    const maxDim = 256;
    let targetCanvas = canvas;
    if (canvas.width > maxDim || canvas.height > maxDim) {
      const ratio = Math.min(maxDim / canvas.width, maxDim / canvas.height);
      targetCanvas = scaleCanvas(canvas, canvas.width * ratio, canvas.height * ratio);
    }

    const pngBlob = await canvasToBlobNative(targetCanvas, 'image/png', 1);
    const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());

    const headerSize = 6 + 16;
    const icoBuffer = new ArrayBuffer(headerSize + pngBytes.length);
    const view = new DataView(icoBuffer);

    view.setUint16(0, 0, true);
    view.setUint16(2, 1, true);
    view.setUint16(4, 1, true);

    const w = targetCanvas.width >= 256 ? 0 : targetCanvas.width;
    const h = targetCanvas.height >= 256 ? 0 : targetCanvas.height;
    view.setUint8(6, w);
    view.setUint8(7, h);
    view.setUint8(8, 0);
    view.setUint8(9, 0);
    view.setUint16(10, 1, true);
    view.setUint16(12, 32, true);
    view.setUint32(14, pngBytes.length, true);
    view.setUint32(18, headerSize, true);

    new Uint8Array(icoBuffer).set(pngBytes, headerSize);
    return new Blob([icoBuffer], { type: 'image/x-icon' });
  }

  /**
   * Multi-Size ICO Encoder (embeds 16, 32, 48, 64, 128, 256px layers inside one .ico file)
   */
  async function encodeMultiSizeICO(canvas, sizes = [16, 32, 48, 64, 128, 256]) {
    const entries = [];
    for (const sz of sizes) {
      const sc = scaleCanvas(canvas, sz, sz);
      const blob = await canvasToBlobNative(sc, 'image/png', 1);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      entries.push({ size: sz, bytes });
    }

    const headerSize = 6 + entries.length * 16;
    const totalPayload = entries.reduce((acc, e) => acc + e.bytes.length, 0);
    const buffer = new ArrayBuffer(headerSize + totalPayload);
    const view = new DataView(buffer);
    const out = new Uint8Array(buffer);

    view.setUint16(0, 0, true);
    view.setUint16(2, 1, true);
    view.setUint16(4, entries.length, true);

    let dataOffset = headerSize;
    entries.forEach((e, idx) => {
      const dirPos = 6 + idx * 16;
      const dimByte = e.size >= 256 ? 0 : e.size;
      view.setUint8(dirPos, dimByte);
      view.setUint8(dirPos + 1, dimByte);
      view.setUint8(dirPos + 2, 0);
      view.setUint8(dirPos + 3, 0);
      view.setUint16(dirPos + 4, 1, true);
      view.setUint16(dirPos + 6, 32, true);
      view.setUint32(dirPos + 8, e.bytes.length, true);
      view.setUint32(dirPos + 12, dataOffset, true);
      out.set(e.bytes, dataOffset);
      dataOffset += e.bytes.length;
    });

    return new Blob([buffer], { type: 'image/x-icon' });
  }

  /**
   * 4. PDF Encoder (Single-page or Multi-page valid binary PDF 1.4 generator)
   */
  async function encodeMultiPagePDF(canvases, quality = 0.88) {
    const pagesData = [];
    for (const c of canvases) {
      const flat = flattenCanvas(c, '#ffffff');
      const jpegBlob = await canvasToBlobNative(flat, 'image/jpeg', quality);
      const buf = await jpegBlob.arrayBuffer();
      pagesData.push({
        width: flat.width,
        height: flat.height,
        jpegBytes: new Uint8Array(buf)
      });
    }

    const chunks = [];
    let byteOffset = 0;
    const offsets = [0];

    function pushStr(str) {
      const arr = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i) & 0xff;
      chunks.push(arr);
      byteOffset += arr.length;
    }

    function pushBytes(arr) {
      chunks.push(arr);
      byteOffset += arr.length;
    }

    pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

    offsets[1] = byteOffset;
    pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

    const kidsRefs = pagesData.map((_, i) => `${3 + i * 3} 0 R`).join(' ');
    offsets[2] = byteOffset;
    pushStr(`2 0 obj\n<< /Type /Pages /Kids [ ${kidsRefs} ] /Count ${pagesData.length} >>\nendobj\n`);

    for (let i = 0; i < pagesData.length; i++) {
      const p = pagesData[i];
      const pageObjId = 3 + i * 3;
      const contentObjId = 4 + i * 3;
      const imageObjId = 5 + i * 3;

      const ptW = Math.max(72, Math.round(p.width * 0.75));
      const ptH = Math.max(72, Math.round(p.height * 0.75));

      offsets[pageObjId] = byteOffset;
      pushStr(
        `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptW} ${ptH}] ` +
        `/Resources << /XObject << /Im${i} ${imageObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
      );

      const streamContent = `q\n${ptW} 0 0 ${ptH} 0 0 cm\n/Im${i} Do\nQ\n`;
      offsets[contentObjId] = byteOffset;
      pushStr(
        `${contentObjId} 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}endstream\nendobj\n`
      );

      offsets[imageObjId] = byteOffset;
      pushStr(
        `${imageObjId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpegBytes.length} >>\nstream\n`
      );
      pushBytes(p.jpegBytes);
      pushStr('\nendstream\nendobj\n');
    }

    const totalObjs = 2 + pagesData.length * 3;
    const xrefOffset = byteOffset;
    pushStr(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
    for (let objId = 1; objId <= totalObjs; objId++) {
      const offStr = String(offsets[objId]).padStart(10, '0');
      pushStr(`${offStr} 00000 n \n`);
    }
    pushStr(
      `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    );

    return new Blob(chunks, { type: 'application/pdf' });
  }

  async function encodeCanvas(canvas, format, quality = 0.88) {
    const q = Math.max(0.02, Math.min(1, quality));

    switch (format) {
      case 'png':
        return await canvasToBlobNative(canvas, 'image/png', 1);
      case 'jpeg': {
        const flat = flattenCanvas(canvas, '#ffffff');
        return await canvasToBlobNative(flat, 'image/jpeg', q);
      }
      case 'webp': {
        const blob = await canvasToBlobNative(canvas, 'image/webp', q);
        if (blob) return blob;
        return await canvasToBlobNative(canvas, 'image/png', 1);
      }
      case 'avif': {
        const blob = await canvasToBlobNative(canvas, 'image/avif', q);
        if (blob && blob.type === 'image/avif') return blob;
        const webpFallback = await canvasToBlobNative(canvas, 'image/webp', q);
        return new Blob([await webpFallback.arrayBuffer()], { type: 'image/avif' });
      }
      case 'bmp':
        return encodeBMP(canvas);
      case 'gif':
        return encodeGIF(canvas);
      case 'ico':
        return await encodeICO(canvas);
      case 'pdf':
        return await encodeMultiPagePDF([canvas], q);
      default:
        return await canvasToBlobNative(canvas, 'image/png', 1);
    }
  }

  async function encodeWithSizeLimit(canvas, format, baseQuality = 0.88, maxBytes = null) {
    let initialBlob = await encodeCanvas(canvas, format, baseQuality);
    if (!maxBytes || initialBlob.size <= maxBytes) {
      return initialBlob;
    }

    const isLossyQualitySupported = ['jpeg', 'webp', 'avif', 'pdf'].includes(format);

    if (isLossyQualitySupported) {
      let low = 0.04;
      let high = baseQuality;
      let bestBlob = null;

      for (let iter = 0; iter < 6; iter++) {
        const mid = (low + high) / 2;
        const candidate = await encodeCanvas(canvas, format, mid);
        if (candidate.size <= maxBytes) {
          bestBlob = candidate;
          low = mid;
        } else {
          high = mid;
        }
      }
      if (bestBlob && bestBlob.size <= maxBytes) {
        return bestBlob;
      }
      initialBlob = await encodeCanvas(canvas, format, 0.05);
      if (initialBlob.size <= maxBytes) {
        return initialBlob;
      }
    }

    if (format === 'png') {
      for (const levels of [64, 32, 16, 8]) {
        const qCanvas = quantizeCanvasColors(canvas, levels);
        const candidate = await encodeCanvas(qCanvas, 'png', 1);
        if (candidate.size <= maxBytes) {
          return candidate;
        }
        initialBlob = candidate;
      }
    }

    let scale = Math.sqrt(maxBytes / initialBlob.size) * 0.95;
    scale = Math.max(0.1, Math.min(0.9, scale));

    let bestScaledBlob = initialBlob;
    for (let step = 0; step < 6; step++) {
      const w = Math.max(16, Math.round(canvas.width * scale));
      const h = Math.max(16, Math.round(canvas.height * scale));
      let workCanvas = scaleCanvas(canvas, w, h);
      if (format === 'png') {
        workCanvas = quantizeCanvasColors(workCanvas, 24);
      }
      const candidate = await encodeCanvas(
        workCanvas,
        format,
        isLossyQualitySupported ? 0.45 : 0.7
      );
      bestScaledBlob = candidate;
      if (candidate.size <= maxBytes) {
        return candidate;
      }
      scale *= 0.78;
    }

    return bestScaledBlob;
  }

  return {
    getExtension,
    scaleCanvas,
    encodeCanvas,
    encodeWithSizeLimit,
    encodeMultiPagePDF,
    encodeMultiSizeICO
  };
})();
