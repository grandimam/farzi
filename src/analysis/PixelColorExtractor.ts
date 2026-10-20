/**
 * Pixel-level color extraction
 *
 * Scans actual rendered pixels to get exact colors
 */

import Jimp from 'jimp';
import type { ColorPalette, ColorCluster, PixelInfo } from '../types';

export class PixelColorExtractor {
  /**
   * Extract all colors from a screenshot
   */
  async extractColors(screenshot: Buffer): Promise<ColorPalette> {
    const image = await Jimp.read(screenshot);
    const colorMap = new Map<string, PixelInfo>();

    // Scan every pixel
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      const a = image.bitmap.data[idx + 3];

      // Skip transparent pixels
      if (a < 10) return;

      const hex = this.rgbToHex(r, g, b);
      const info = colorMap.get(hex) || {
        hex,
        rgb: [r, g, b],
        count: 0,
        locations: []
      };

      info.count++;
      // Only store some locations to save memory
      if (info.locations.length < 100) {
        info.locations.push({ x, y });
      }

      colorMap.set(hex, info);
    });

    const colors = Array.from(colorMap.values());

    // Cluster similar colors (anti-aliasing)
    const clustered = this.clusterColors(colors);

    // Categorize by usage
    return this.categorizeColors(clustered);
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }

  /**
   * Cluster similar colors to account for anti-aliasing
   */
  private clusterColors(colors: PixelInfo[]): ColorCluster[] {
    const clusters: ColorCluster[] = [];

    // Sort by frequency
    const sorted = colors.sort((a, b) => b.count - a.count);

    for (const color of sorted) {
      let addedToCluster = false;

      // Check if similar to any existing cluster
      for (const cluster of clusters) {
        if (this.colorDistance(color.rgb, cluster.primary.rgb) < 15) {
          cluster.colors.push(color);
          cluster.totalCount += color.count;
          addedToCluster = true;
          break;
        }
      }

      if (!addedToCluster) {
        clusters.push({
          primary: color,
          colors: [color],
          totalCount: color.count
        });
      }
    }

    return clusters.sort((a, b) => b.totalCount - a.totalCount);
  }

  /**
   * Calculate Euclidean distance between colors
   */
  private colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
    const [r1, g1, b1] = rgb1;
    const [r2, g2, b2] = rgb2;
    return Math.sqrt(
      Math.pow(r1 - r2, 2) +
      Math.pow(g1 - g2, 2) +
      Math.pow(b1 - b2, 2)
    );
  }

  /**
   * Categorize colors by usage
   */
  private categorizeColors(clusters: ColorCluster[]): ColorPalette {
    // Simple heuristic categorization
    const neutral = clusters.filter(c =>
      this.isGrayscale(c.primary.rgb)
    );

    const nonNeutral = clusters.filter(c =>
      !this.isGrayscale(c.primary.rgb)
    );

    // Most used non-neutral colors are likely primary
    const primary = nonNeutral.slice(0, 3);

    // Try to identify semantic colors
    const semantic = {
      success: clusters.filter(c => this.isGreenish(c.primary.rgb)),
      error: clusters.filter(c => this.isReddish(c.primary.rgb)),
      warning: clusters.filter(c => this.isYellowish(c.primary.rgb)),
      info: clusters.filter(c => this.isBluish(c.primary.rgb))
    };

    return {
      primary,
      neutral,
      semantic,
      all: clusters
    };
  }

  /**
   * Check if color is grayscale
   */
  private isGrayscale(rgb: [number, number, number]): boolean {
    const [r, g, b] = rgb;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return (max - min) < 20;
  }

  /**
   * Heuristics for semantic colors
   */
  private isGreenish(rgb: [number, number, number]): boolean {
    const [r, g, b] = rgb;
    return g > r && g > b && g > 100;
  }

  private isReddish(rgb: [number, number, number]): boolean {
    const [r, g, b] = rgb;
    return r > g && r > b && r > 100;
  }

  private isYellowish(rgb: [number, number, number]): boolean {
    const [r, g, b] = rgb;
    return r > 150 && g > 150 && b < 100;
  }

  private isBluish(rgb: [number, number, number]): boolean {
    const [r, g, b] = rgb;
    return b > r && b > g && b > 100;
  }
}
