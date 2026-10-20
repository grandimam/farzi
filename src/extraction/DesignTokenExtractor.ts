/**
 * Design Token Extraction
 *
 * Combines pixel analysis + DOM styles (no AI required)
 * Vision AI is OPTIONAL for semantic understanding
 */

import { PixelColorExtractor } from '../analysis/PixelColorExtractor';
import { SpacingDetector } from '../analysis/SpacingDetector';
import { VisionAnalyzer } from '../analysis/VisionAnalyzer';
import { DOMStyleCapture } from '../capture/DOMStyleCapture';
import type { DesignTokens, CaptureSet } from '../types';
import type { Page } from 'playwright';

export class DesignTokenExtractor {
  constructor(
    private pixelAnalyzer: PixelColorExtractor,
    private spacingDetector: SpacingDetector,
    private domCapture: DOMStyleCapture,
    private visionAnalyzer?: VisionAnalyzer  // OPTIONAL
  ) {}

  /**
   * Extract design tokens without AI vision
   * Uses only pixel analysis + DOM inspection
   */
  async extractWithoutVision(
    captures: CaptureSet,
    page: Page
  ): Promise<DesignTokens> {
    console.log('🔍 Extracting design tokens (no AI)...');

    // 1. Pixel-level color analysis
    console.log('  📊 Analyzing pixels for colors...');
    const pixelColors = await this.pixelAnalyzer.extractColors(
      captures.retina.fullPage!
    );

    // 2. DOM-based color extraction (as validation)
    console.log('  🌐 Extracting colors from DOM...');
    const domColors = await this.domCapture.extractColorsFromDOM(page);

    // 3. Whitespace-based spacing detection
    console.log('  📏 Detecting spacing from whitespace...');
    const spacingFromPixels = await this.spacingDetector.detectSpacing(
      captures.standard.fullPage!
    );

    // 4. DOM-based spacing extraction
    console.log('  📐 Extracting spacing from DOM...');
    const spacingFromDOM = await this.domCapture.extractSpacingFromDOM(page);

    // 5. Typography from DOM
    console.log('  🔤 Extracting typography from DOM...');
    const typography = await this.domCapture.extractTypographyFromDOM(page);

    // Merge results
    const tokens: DesignTokens = {
      colors: pixelColors,
      spacing: {
        baseUnit: spacingFromPixels.baseUnit,
        scale: this.mergeSpacingScales(spacingFromPixels.scale, spacingFromDOM),
        gaps: spacingFromPixels.gaps,
        confidence: spacingFromPixels.confidence
      },
      typography: {
        families: Array.from(typography.families),
        sizes: Array.from(typography.sizes),
        weights: Array.from(typography.weights),
        lineHeights: Array.from(typography.lineHeights),
        letterSpacing: []
      },
      components: [],
      evidence: {
        pixel: { pixelColors, spacingFromPixels },
        dom: { domColors, spacingFromDOM, typography },
        screenshots: captures
      }
    };

    console.log('✅ Token extraction complete (no AI used)');
    return tokens;
  }

  /**
   * Extract design tokens WITH AI vision (enhanced)
   * Uses pixel + DOM + AI for semantic understanding
   */
  async extractWithVision(
    captures: CaptureSet,
    page: Page
  ): Promise<DesignTokens> {
    if (!this.visionAnalyzer) {
      console.warn('⚠️  VisionAnalyzer not available, falling back to no-vision mode');
      return this.extractWithoutVision(captures, page);
    }

    console.log('🔍 Extracting design tokens (with AI vision)...');

    // Get base tokens without vision
    const baseTokens = await this.extractWithoutVision(captures, page);

    // Enhance with AI vision
    console.log('  🤖 Analyzing with AI vision...');
    const visionEnhancement = await this.visionAnalyzer.analyzeDesignSystem(
      captures.standard.fullPage!
    );

    // Merge vision insights with pixel-perfect data
    return {
      ...baseTokens,
      // Keep pixel-perfect colors but use vision for categorization
      colors: {
        ...baseTokens.colors,
        // If vision found better categorization, use it
        ...(visionEnhancement.colors || {})
      },
      // Use vision for component identification
      components: visionEnhancement.components || baseTokens.components,
      evidence: {
        ...baseTokens.evidence,
        vision: visionEnhancement
      }
    };

    console.log('✅ Token extraction complete (AI-enhanced)');
  }

  /**
   * Main extract method - auto-detects if vision is available
   */
  async extract(captures: CaptureSet, page: Page): Promise<DesignTokens> {
    if (this.visionAnalyzer) {
      return this.extractWithVision(captures, page);
    } else {
      return this.extractWithoutVision(captures, page);
    }
  }

  /**
   * Merge spacing scales from multiple sources
   */
  private mergeSpacingScales(pixelScale: number[], domScale: number[]): number[] {
    const combined = new Set([...pixelScale, ...domScale]);
    return Array.from(combined).sort((a, b) => a - b);
  }

  /**
   * Convert RGB color to hex
   */
  private rgbToHex(rgb: string): string {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return rgb;

    const [_, r, g, b] = match;
    return '#' + [r, g, b]
      .map(x => parseInt(x).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  }
}
