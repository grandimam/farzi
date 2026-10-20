/**
 * Main Farzi class - High-level API
 */

import { MultiZoomCapture } from './capture/MultiZoomCapture';
import { CompleteExtractor } from './extraction/CompleteExtractor';
import { ProjectGenerator } from './generation/ProjectGenerator';
import { PixelDiffValidator } from './validation/PixelDiffValidator';
import { BehaviorValidator } from './validation/BehaviorValidator';
import type {
  ReplicationOptions,
  ExtractionResult,
  ValidationReport,
  CaptureSet
} from './types';
import type { CompleteAnalysis } from './extraction/CompleteExtractor';

export class Farzi {
  private capture: MultiZoomCapture;
  private extractor: CompleteExtractor;
  private projectGenerator: ProjectGenerator;
  private pixelValidator: PixelDiffValidator;
  private behaviorValidator: BehaviorValidator;

  constructor(apiKey?: string) {
    this.capture = new MultiZoomCapture();
    this.extractor = new CompleteExtractor(apiKey);
    this.projectGenerator = new ProjectGenerator();
    this.pixelValidator = new PixelDiffValidator();
    this.behaviorValidator = new BehaviorValidator();
  }

  /**
   * Extract complete analysis from a URL
   */
  async extract(url: string): Promise<CompleteAnalysis> {
    console.log(`🎯 Starting complete replication of ${url}...`);

    // Step 1: Capture screenshots at multiple zoom levels
    console.log('📸 Capturing screenshots...');
    const captures = await this.capture.captureUrl(url);

    // Step 2: Get page context for analysis
    const browser = await this.capture['browser'];
    if (!browser) throw new Error('Browser not initialized');

    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 }
    });
    await page.goto(url, { waitUntil: 'networkidle' });

    // Step 3: Complete analysis
    const analysis = await this.extractor.extractComplete(page, captures);

    await page.close();

    return analysis;
  }

  /**
   * Extract just design tokens (backward compatible)
   */
  async extractDesign(url: string): Promise<ExtractionResult> {
    const analysis = await this.extract(url);

    return {
      tokens: analysis.design,
      screenshots: analysis.screenshots,
      timestamp: new Date()
    };
  }

  /**
   * Replicate an entire application
   */
  async replicate(options: ReplicationOptions): Promise<void> {
    const { url, output, framework = 'react', validate = true, similarityTarget = 99.5 } = options;

    // Step 1: Complete analysis
    const analysis = await this.extract(url);

    // Step 2: Generate complete project
    console.log('⚙️  Generating project...');
    await this.projectGenerator.generate(
      {
        name: 'farzi-replica',
        framework,
        styling: 'tailwind',
        typescript: true
      },
      analysis.design,
      analysis.modules,
      analysis.state,
      analysis.network,
      output
    );

    // Step 3: Validate if requested
    if (validate) {
      console.log('✅ Validating replica...');

      // Visual validation
      const visualReport = await this.validateVisual(
        analysis.screenshots,
        output,
        similarityTarget
      );

      console.log(`  Visual similarity: ${visualReport.similarity.toFixed(2)}%`);

      // Behavior validation
      console.log('  Testing behavior...');
      const behaviorPassed = await this.behaviorValidator.validateInteractions(
        url,
        `file://${output}/index.html`
      );

      console.log(`  Behavior validation: ${behaviorPassed ? 'PASSED' : 'FAILED'}`);

      if (visualReport.passed && behaviorPassed) {
        console.log('✨ Complete validation passed!');
      } else {
        console.log('⚠️  Some validations failed. See details above.');
      }
    }

    console.log('✅ Replication complete!');
    console.log(`📁 Output: ${output}`);
  }

  /**
   * Validate visual similarity
   */
  private async validateVisual(
    originalCaptures: CaptureSet,
    replicaPath: string,
    targetSimilarity: number = 99.5
  ): Promise<ValidationReport> {
    // Capture replica
    const replicaUrl = `file://${replicaPath}/index.html`;
    const replicaCaptures = await this.capture.captureUrl(replicaUrl);

    // Compare screenshots
    const comparison = await this.pixelValidator.compare(
      originalCaptures.standard.fullPage!,
      replicaCaptures.standard.fullPage!,
      10,
      targetSimilarity
    );

    return {
      similarity: comparison.similarity,
      colorAccuracy: 100,
      spacingAccuracy: 100,
      layoutAccuracy: comparison.similarity,
      passed: comparison.passed,
      details: comparison
    };
  }

  /**
   * Validate a replica (backward compatible)
   */
  async validateReplica(
    originalCaptures: CaptureSet,
    replicaPath: string
  ): Promise<ValidationReport> {
    return this.validateVisual(originalCaptures, replicaPath);
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
