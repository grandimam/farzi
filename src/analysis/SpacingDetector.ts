/**
 * Spacing detection from whitespace
 *
 * Measures actual gaps between elements in screenshots
 */

import Jimp from 'jimp';
import type { SpacingSystem } from '../types';

export class SpacingDetector {
  /**
   * Detect spacing system from screenshot
   */
  async detectSpacing(screenshot: Buffer): Promise<SpacingSystem> {
    const image = await Jimp.read(screenshot);

    // Find horizontal gaps
    const horizontalGaps = this.findHorizontalGaps(image);

    // Find vertical gaps
    const verticalGaps = this.findVerticalGaps(image);

    // Combine all gaps
    const allGaps = [...horizontalGaps, ...verticalGaps];

    // Infer base unit
    const baseUnit = this.inferBaseUnit(allGaps);

    // Generate scale
    const scale = this.generateScale(allGaps, baseUnit);

    return {
      baseUnit,
      scale,
      gaps: allGaps,
      confidence: this.calculateConfidence(allGaps, baseUnit)
    };
  }

  /**
   * Find horizontal gaps (whitespace)
   */
  private findHorizontalGaps(image: Jimp): number[] {
    const gaps: number[] = [];
    const threshold = 240; // Consider pixels above this as "white"

    for (let y = 0; y < image.bitmap.height; y += 10) { // Sample every 10 rows
      let inGap = false;
      let gapStart = 0;

      for (let x = 0; x < image.bitmap.width; x++) {
        const isWhite = this.isWhitespace(image, x, y, threshold);

        if (isWhite && !inGap) {
          gapStart = x;
          inGap = true;
        } else if (!isWhite && inGap) {
          const gapWidth = x - gapStart;
          if (gapWidth > 2 && gapWidth < 200) { // Filter noise and full-width gaps
            gaps.push(gapWidth);
          }
          inGap = false;
        }
      }
    }

    return gaps;
  }

  /**
   * Find vertical gaps
   */
  private findVerticalGaps(image: Jimp): number[] {
    const gaps: number[] = [];
    const threshold = 240;

    for (let x = 0; x < image.bitmap.width; x += 10) { // Sample every 10 columns
      let inGap = false;
      let gapStart = 0;

      for (let y = 0; y < image.bitmap.height; y++) {
        const isWhite = this.isWhitespace(image, x, y, threshold);

        if (isWhite && !inGap) {
          gapStart = y;
          inGap = true;
        } else if (!isWhite && inGap) {
          const gapHeight = y - gapStart;
          if (gapHeight > 2 && gapHeight < 200) {
            gaps.push(gapHeight);
          }
          inGap = false;
        }
      }
    }

    return gaps;
  }

  /**
   * Check if pixel is whitespace
   */
  private isWhitespace(image: Jimp, x: number, y: number, threshold: number): boolean {
    const idx = (y * image.bitmap.width + x) * 4;
    const r = image.bitmap.data[idx] || 0;
    const g = image.bitmap.data[idx + 1] || 0;
    const b = image.bitmap.data[idx + 2] || 0;
    const a = image.bitmap.data[idx + 3] || 255;

    // Transparent or very light color
    return a < 10 || (r > threshold && g > threshold && b > threshold);
  }

  /**
   * Infer base unit (4px, 8px, etc.)
   */
  private inferBaseUnit(gaps: number[]): number {
    if (gaps.length === 0) return 8;

    // Find GCD of all gaps
    const gcd = gaps.reduce((a, b) => this.gcd(a, b));

    // Common base units
    const candidates = [4, 8];

    // If GCD is one of them, use it
    if (candidates.includes(gcd)) return gcd;

    // Otherwise find best fit
    const scores = candidates.map(base => ({
      base,
      score: gaps.filter(g => g % base === 0).length
    }));

    return scores.sort((a, b) => b.score - a.score)[0].base;
  }

  /**
   * Calculate GCD
   */
  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }

  /**
   * Generate spacing scale
   */
  private generateScale(gaps: number[], baseUnit: number): number[] {
    // Round gaps to nearest base unit multiple
    const rounded = gaps.map(g => Math.round(g / baseUnit) * baseUnit);

    // Get unique values and sort
    const unique = Array.from(new Set(rounded)).sort((a, b) => a - b);

    // Filter to reasonable range
    return unique.filter(v => v >= baseUnit && v <= 128);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(gaps: number[], baseUnit: number): number {
    if (gaps.length === 0) return 0;

    // How many gaps are multiples of base unit?
    const matches = gaps.filter(g => g % baseUnit === 0).length;
    return matches / gaps.length;
  }
}
