/**
 * Median Cut Color Quantization
 * Reduces an array of RGB pixels to N representative colors.
 */

/**
 * @param {Array<[number,number,number]>} pixels - Array of [r,g,b] values
 * @param {number} maxColors - Target palette size
 * @returns {Array<[number,number,number]>} Array of representative colors
 */
export function quantize(pixels, maxColors) {
  if (pixels.length === 0) return [];

  // Start with one bucket containing all pixels
  let buckets = [pixels];

  // Split buckets until we reach maxColors
  while (buckets.length < maxColors) {
    // Find the bucket with the largest range and split it
    let splitIndex = -1;
    let maxRange = -1;

    for (let i = 0; i < buckets.length; i++) {
      const range = colorRange(buckets[i]);
      if (range.max > maxRange) {
        maxRange = range.max;
        splitIndex = i;
      }
    }

    if (maxRange === 0) break; // All remaining buckets are uniform

    const [a, b] = splitBucket(buckets[splitIndex]);
    buckets.splice(splitIndex, 1, a, b);
  }

  // Return the average color of each bucket
  return buckets.map(averageColor);
}

/**
 * Find the channel with the greatest range in a bucket of pixels.
 * Returns { channel: 0|1|2, max: number }
 */
function colorRange(pixels) {
  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;

  for (const [r, g, b] of pixels) {
    if (r < minR) minR = r; if (r > maxR) maxR = r;
    if (g < minG) minG = g; if (g > maxG) maxG = g;
    if (b < minB) minB = b; if (b > maxB) maxB = b;
  }

  const rRange = maxR - minR;
  const gRange = maxG - minG;
  const bRange = maxB - minB;
  const max = Math.max(rRange, gRange, bRange);
  const channel = max === rRange ? 0 : max === gRange ? 1 : 2;

  return { channel, max };
}

/**
 * Split a bucket along its widest channel at the median.
 */
function splitBucket(pixels) {
  const { channel } = colorRange(pixels);
  const sorted = [...pixels].sort((a, b) => a[channel] - b[channel]);
  const mid = Math.floor(sorted.length / 2);
  return [sorted.slice(0, mid), sorted.slice(mid)];
}

/**
 * Average all pixels in a bucket to a single representative color.
 */
function averageColor(pixels) {
  if (pixels.length === 0) return [0, 0, 0];
  let r = 0, g = 0, b = 0;
  for (const [pr, pg, pb] of pixels) {
    r += pr; g += pg; b += pb;
  }
  const n = pixels.length;
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

/**
 * Find the index of the nearest palette color to a given [r,g,b] pixel.
 * Uses Euclidean distance in RGB space.
 */
export function nearestColorIndex(pixel, palette) {
  let bestIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const dr = pixel[0] - palette[i][0];
    const dg = pixel[1] - palette[i][1];
    const db = pixel[2] - palette[i][2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }
  return bestIndex;
}

/**
 * Convert [r, g, b] to a CSS hex string.
 */
export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}
