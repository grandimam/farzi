/**
 * Main Farzi class - High-level API
 */

import { MultiZoomCapture } from './capture/MultiZoomCapture';
import { PixelColorExtractor } from './analysis/PixelColorExtractor';
import { VisionAnalyzer } from './analysis/VisionAnalyzer';
import { SpacingDetector } from './analysis/SpacingDetector';
import { DesignTokenExtractor } from './extraction/DesignTokenExtractor';
import { ComponentGenerator } from './generation/ComponentGenerator';
import { PixelDiffValidator } from './validation/PixelDiffValidator';
import type {
  ReplicationOptions,
  ExtractionResult,
  ValidationReport,
  DesignTokens,
  CaptureSet
} from './types';

export class Farzi {
  private capture: MultiZoomCapture;
  private pixelAnalyzer: PixelColorExtractor;
  private visionAnalyzer: VisionAnalyzer;
  private spacingDetector: SpacingDetector;
  private tokenExtractor: DesignTokenExtractor;
  private componentGenerator: ComponentGenerator;
  private validator: PixelDiffValidator;

  constructor(apiKey?: string) {
    this.capture = new MultiZoomCapture();
    this.pixelAnalyzer = new PixelColorExtractor();
    this.visionAnalyzer = new VisionAnalyzer(apiKey);
    this.spacingDetector = new SpacingDetector();
    this.tokenExtractor = new DesignTokenExtractor(
      this.pixelAnalyzer,
      this.visionAnalyzer,
      this.spacingDetector
    );
    this.componentGenerator = new ComponentGenerator();
    this.validator = new PixelDiffValidator();
  }

  /**
   * Extract design system from a URL
   */
  async extractDesign(url: string): Promise<ExtractionResult> {
    // Step 1: Capture screenshots at multiple zoom levels
    const captures = await this.capture.captureUrl(url);

    // Step 2: Extract design tokens
    const tokens = await this.tokenExtractor.extract(captures);

    return {
      tokens,
      screenshots: captures,
      timestamp: new Date()
    };
  }

  /**
   * Replicate an entire application
   */
  async replicate(options: ReplicationOptions): Promise<void> {
    const { url, output, framework = 'react', validate = true } = options;

    // Step 1: Extract design system
    console.log('📸 Capturing screenshots...');
    const extraction = await this.extractDesign(url);

    // Step 2: Generate code
    console.log('⚙️  Generating components...');
    await this.componentGenerator.generateProject(
      extraction.tokens,
      output,
      framework
    );

    // Step 3: Validate if requested
    if (validate) {
      console.log('✅ Validating replica...');
      const report = await this.validateReplica(
        extraction.screenshots,
        output
      );

      console.log(`Similarity: ${report.similarity.toFixed(2)}%`);

      if (report.passed) {
        console.log('✨ Validation passed!');
      } else {
        console.log('⚠️  Validation failed. See report for details.');
      }
    }

    console.log('✅ Replication complete!');
  }

  /**
   * Validate a replica against original
   */
  async validateReplica(
    originalCaptures: CaptureSet,
    replicaPath: string
  ): Promise<ValidationReport> {
    // Capture replica
    const replicaUrl = `file://${replicaPath}/index.html`;
    const replicaCaptures = await this.capture.captureUrl(replicaUrl);

    // Compare screenshots
    const comparison = await this.validator.compare(
      originalCaptures.standard.fullPage!,
      replicaCaptures.standard.fullPage!
    );

    return {
      similarity: comparison.similarity,
      colorAccuracy: 100, // TODO: Calculate from tokens
      spacingAccuracy: 100, // TODO: Calculate from tokens
      layoutAccuracy: comparison.similarity,
      passed: comparison.similarity >= 99.5,
      details: comparison
    };
  }

  /**
   * Extract a single component
   */
  async extractComponent(
    url: string,
    selector: string
  ): Promise<{ code: string; tokens: DesignTokens }> {
    const captures = await this.capture.captureElement(url, selector);
    const tokens = await this.tokenExtractor.extract(captures);
    const code = await this.componentGenerator.generateComponent(
      tokens.components[0],
      tokens
    );

    return { code, tokens };
  }
}
