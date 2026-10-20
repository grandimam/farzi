/**
 * Pixel-Diff Validator
 *
 * Compares screenshots pixel-by-pixel for visual validation
 */

import Jimp from 'jimp';

export interface ValidationResult {
  similarity: number;
  differentPixels: number;
  totalPixels: number;
  passed: boolean;
  differences: DifferenceRegion[];
  diffImage?: Buffer;
}

export interface DifferenceRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  severity: 'minor' | 'major' | 'critical';
}

export class PixelDiffValidator {
  /**
   * Compare two screenshots
   */
  async compare(
    original: Buffer,
    replica: Buffer,
    threshold: number = 10,
    targetSimilarity: number = 99.5
  ): Promise<ValidationResult> {
    const img1 = await Jimp.read(original);
    const img2 = await Jimp.read(replica);

    // Ensure same dimensions
    if (img1.bitmap.width !== img2.bitmap.width || img1.bitmap.height !== img2.bitmap.height) {
      // Resize replica to match original
      img2.resize(img1.bitmap.width, img1.bitmap.height);
    }

    let differentPixels = 0;
    const totalPixels = img1.bitmap.width * img1.bitmap.height;
    const diffImage = new Jimp(img1.bitmap.width, img1.bitmap.height, 0xFFFFFFFF);
    const differenceMap: boolean[][] = [];

    // Initialize difference map
    for (let y = 0; y < img1.bitmap.height; y++) {
      differenceMap[y] = [];
      for (let x = 0; x < img1.bitmap.width; x++) {
        differenceMap[y][x] = false;
      }
    }

    // Compare pixels
    img1.scan(0, 0, img1.bitmap.width, img1.bitmap.height, (x, y, idx) => {
      const r1 = img1.bitmap.data[idx + 0];
      const g1 = img1.bitmap.data[idx + 1];
      const b1 = img1.bitmap.data[idx + 2];
      const a1 = img1.bitmap.data[idx + 3];

      const r2 = img2.bitmap.data[idx + 0];
      const g2 = img2.bitmap.data[idx + 1];
      const b2 = img2.bitmap.data[idx + 2];
      const a2 = img2.bitmap.data[idx + 3];

      // Calculate color difference
      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) + Math.abs(a1 - a2);

      if (diff > threshold) {
        differentPixels++;
        differenceMap[y][x] = true;

        // Mark difference in red
        diffImage.bitmap.data[idx + 0] = 255; // R
        diffImage.bitmap.data[idx + 1] = 0;   // G
        diffImage.bitmap.data[idx + 2] = 0;   // B
        diffImage.bitmap.data[idx + 3] = 255; // A
      } else {
        // Keep original pixel (slightly faded)
        diffImage.bitmap.data[idx + 0] = r1;
        diffImage.bitmap.data[idx + 1] = g1;
        diffImage.bitmap.data[idx + 2] = b1;
        diffImage.bitmap.data[idx + 3] = 128;
      }
    });

    // Calculate similarity
    const similarity = ((totalPixels - differentPixels) / totalPixels) * 100;

    // Find difference regions
    const differences = this.findDifferenceRegions(differenceMap);

    // Generate diff image buffer
    const diffBuffer = await diffImage.getBufferAsync(Jimp.MIME_PNG);

    return {
      similarity,
      differentPixels,
      totalPixels,
      passed: similarity >= targetSimilarity,
      differences,
      diffImage: diffBuffer
    };
  }

  /**
   * Find contiguous regions of differences
   */
  private findDifferenceRegions(differenceMap: boolean[][]): DifferenceRegion[] {
    const regions: DifferenceRegion[] = [];
    const visited: boolean[][] = [];
    const height = differenceMap.length;
    const width = differenceMap[0]?.length || 0;

    // Initialize visited map
    for (let y = 0; y < height; y++) {
      visited[y] = new Array(width).fill(false);
    }

    // Flood fill to find regions
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (differenceMap[y][x] && !visited[y][x]) {
          const region = this.floodFill(differenceMap, visited, x, y);
          if (region.width * region.height > 10) { // Ignore tiny regions
            regions.push(region);
          }
        }
      }
    }

    return regions;
  }

  /**
   * Flood fill to find a difference region
   */
  private floodFill(
    differenceMap: boolean[][],
    visited: boolean[][],
    startX: number,
    startY: number
  ): DifferenceRegion {
    const queue: Array<[number, number]> = [[startX, startY]];
    let minX = startX, maxX = startX;
    let minY = startY, maxY = startY;
    let pixelCount = 0;

    const height = differenceMap.length;
    const width = differenceMap[0]?.length || 0;

    while (queue.length > 0) {
      const [x, y] = queue.shift()!;

      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[y][x] || !differenceMap[y][x]) continue;

      visited[y][x] = true;
      pixelCount++;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      // Add neighbors
      queue.push([x + 1, y]);
      queue.push([x - 1, y]);
      queue.push([x, y + 1]);
      queue.push([x, y - 1]);
    }

    const area = (maxX - minX + 1) * (maxY - minY + 1);
    const severity = this.calculateSeverity(area, pixelCount);

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      severity
    };
  }

  /**
   * Calculate severity of difference
   */
  private calculateSeverity(area: number, pixelCount: number): 'minor' | 'major' | 'critical' {
    const density = pixelCount / area;

    if (area > 10000 || density > 0.7) return 'critical';
    if (area > 1000 || density > 0.4) return 'major';
    return 'minor';
  }

  /**
   * Batch validate multiple comparisons
   */
  async validateBatch(
    comparisons: Array<{ original: Buffer; replica: Buffer; name: string }>,
    threshold: number = 10,
    targetSimilarity: number = 99.5
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    for (const { original, replica, name } of comparisons) {
      const result = await this.compare(original, replica, threshold, targetSimilarity);
      results.set(name, result);
    }

    return results;
  }
}
