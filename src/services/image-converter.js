/**
 * Image Converter Service
 * Converts an uploaded image into a color-by-number puzzle JSON.
 *
 * Usage:
 *   import { convertImageToPuzzle } from './image-converter.js';
 *   const puzzle = await convertImageToPuzzle(file, { gridSize: 25, numColors: 10 });
 */

import { quantize, nearestColorIndex, rgbToHex } from './color-quantizer.js';

/**
 * Abstraction level presets
 */
export const ABSTRACTION_LEVELS = {
  low:    { label: 'Very Abstract',  gridSize: 15, numColors: 6  },
  medium: { label: 'Medium Detail',  gridSize: 25, numColors: 10 },
  high:   { label: 'Detailed',       gridSize: 40, numColors: 16 },
};

/**
 * Convert a File (or HTMLImageElement) into a puzzle data object.
 *
 * @param {File|HTMLImageElement} source
 * @param {{ gridSize?: number, numColors?: number, title?: string }} options
 * @returns {Promise<PuzzleData>}
 */
export async function convertImageToPuzzle(source, options = {}) {
  const { gridSize = 25, numColors = 10, title = 'My Puzzle' } = options;

  const img = source instanceof HTMLImageElement
    ? source
    : await loadImage(source);

  // Draw the image onto an offscreen canvas at the target grid size
  const canvas = document.createElement('canvas');
  canvas.width  = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext('2d');

  // Use crisp downsampling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Crop to square from center before downsampling
  const srcSize  = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const srcX     = Math.floor(((img.naturalWidth  || img.width)  - srcSize) / 2);
  const srcY     = Math.floor(((img.naturalHeight || img.height) - srcSize) / 2);
  ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, gridSize, gridSize);

  const imageData = ctx.getImageData(0, 0, gridSize, gridSize);
  const { data } = imageData;

  // Collect all pixel colors (ignore fully transparent pixels)
  const pixels = [];
  const pixelMap = []; // flat array, length = gridSize * gridSize, each entry [r,g,b] or null

  for (let i = 0; i < gridSize * gridSize; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];
    if (a < 128) {
      pixelMap.push(null); // transparent
    } else {
      const px = [r, g, b];
      pixels.push(px);
      pixelMap.push(px);
    }
  }

  // Quantize to N colors
  const palette = quantize(pixels, numColors);

  // Build color map: { "1": "#hex", "2": "#hex", ... }
  const colors = {};
  palette.forEach((color, i) => {
    colors[String(i + 1)] = rgbToHex(color);
  });

  // Add a background color for transparent pixels (if any)
  const hasTransparent = pixelMap.some(p => p === null);
  if (hasTransparent) {
    colors['0'] = '#FFFFFF';
  }

  // Build grid: 2D array of color numbers
  const grid = [];
  for (let row = 0; row < gridSize; row++) {
    const gridRow = [];
    for (let col = 0; col < gridSize; col++) {
      const px = pixelMap[row * gridSize + col];
      if (px === null) {
        gridRow.push(0); // transparent → background
      } else {
        gridRow.push(nearestColorIndex(px, palette) + 1);
      }
    }
    grid.push(gridRow);
  }

  return {
    id: `custom_${Date.now()}`,
    title,
    width:  gridSize,
    height: gridSize,
    colors,
    grid,
  };
}

/**
 * Load a File object as an HTMLImageElement.
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

/**
 * Download a puzzle JSON to disk.
 * @param {object} puzzle
 */
export function downloadPuzzleJSON(puzzle) {
  const json = JSON.stringify(puzzle, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${puzzle.title.replace(/\s+/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
