const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createCrcTable() {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    crcTable[n] = c;
  }
  return crcTable;
}

const crcTable = createCrcTable();
function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function makePng(width, height, r, g, b) {
  // Row data: 1 filter byte (0) + width * 4 bytes (RGBA)
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;     // R
      rawData[pxOffset + 1] = g; // G
      rawData[pxOffset + 2] = b; // B
      rawData[pxOffset + 3] = 255; // A
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type 6: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcVal = crc32(buf.slice(4, 8 + len));
    buf.writeUInt32BE(crcVal, 8 + len);
    return buf;
  }

  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeIcoFromPng(pngBuffer) {
  const icoHeader = Buffer.alloc(6 + 16);
  icoHeader.writeUInt16LE(0, 0); // Reserved
  icoHeader.writeUInt16LE(1, 2); // Type 1 (ICO)
  icoHeader.writeUInt16LE(1, 4); // 1 Image

  // Directory entry
  icoHeader.writeUInt8(32, 6); // Width
  icoHeader.writeUInt8(32, 7); // Height
  icoHeader.writeUInt8(0, 8);  // Colors
  icoHeader.writeUInt8(0, 9);  // Reserved
  icoHeader.writeUInt16LE(1, 10); // Planes
  icoHeader.writeUInt16LE(32, 12); // BPP
  icoHeader.writeUInt32LE(pngBuffer.length, 14); // Size of image data
  icoHeader.writeUInt32LE(22, 18); // Offset (6 + 16 = 22)

  return Buffer.concat([icoHeader, pngBuffer]);
}

const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Beauty Cosmetics Pink/Rose Color #EC4899
const png32 = makePng(32, 32, 236, 72, 153);
const png128 = makePng(128, 128, 236, 72, 153);
const ico = makeIcoFromPng(png32);

fs.writeFileSync(path.join(iconsDir, '32x32.png'), png32);
fs.writeFileSync(path.join(iconsDir, '128x128.png'), png128);
fs.writeFileSync(path.join(iconsDir, '128x128@2x.png'), png128);
fs.writeFileSync(path.join(iconsDir, 'icon.png'), png128);
fs.writeFileSync(path.join(iconsDir, 'icon.ico'), ico);
fs.writeFileSync(path.join(iconsDir, 'icon.icns'), png128);

console.log('Successfully generated valid 32x32 and 128x128 PNG & ICO files.');
