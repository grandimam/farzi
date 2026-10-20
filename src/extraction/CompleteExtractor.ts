/**
 * Complete Extractor
 *
 * Combines all analysis to extract everything
 */

import type { Page } from 'playwright';
import { JavaScriptAnalyzer } from '../analysis/JavaScriptAnalyzer';
import { PixelColorExtractor } from '../analysis/PixelColorExtractor';
import { SpacingDetector } from '../analysis/SpacingDetector';
import { VisionAnalyzer } from '../analysis/VisionAnalyzer';
import { StateDetector } from '../analysis/StateDetector';
import { DOMStyleCapture } from '../capture/DOMStyleCapture';
import { BehaviorCapture } from '../capture/BehaviorCapture';
import { NetworkCapture } from '../capture/NetworkCapture';
import { DesignTokenExtractor } from './DesignTokenExtractor';
import type { DesignTokens, CaptureSet } from '../types';
import type { ModuleGraph } from '../analysis/JavaScriptAnalyzer';
import type { StatePattern } from '../analysis/StateDetector';
import type { BehaviorMap } from '../capture/BehaviorCapture';
import type { NetworkMap } from '../capture/NetworkCapture';

export interface CompleteAnalysis {
  design: DesignTokens;
  behavior: BehaviorMap;
  network: NetworkMap;
  modules: ModuleGraph;
  state: StatePattern;
  screenshots: CaptureSet;
}

export class CompleteExtractor {
  private jsAnalyzer: JavaScriptAnalyzer;
  private pixelAnalyzer: PixelColorExtractor;
  private spacingDetector: SpacingDetector;
  private visionAnalyzer?: VisionAnalyzer;
  private stateDetector: StateDetector;
  private domCapture: DOMStyleCapture;
  private behaviorCapture: BehaviorCapture;
  private networkCapture: NetworkCapture;
  private designExtractor: DesignTokenExtractor;

  constructor(apiKey?: string) {
    this.jsAnalyzer = new JavaScriptAnalyzer();
    this.pixelAnalyzer = new PixelColorExtractor();
    this.spacingDetector = new SpacingDetector();
    this.visionAnalyzer = apiKey ? new VisionAnalyzer(apiKey) : undefined;
    this.stateDetector = new StateDetector();
    this.domCapture = new DOMStyleCapture();
    this.behaviorCapture = new BehaviorCapture();
    this.networkCapture = new NetworkCapture();
    this.designExtractor = new DesignTokenExtractor(
      this.pixelAnalyzer,
      this.spacingDetector,
      this.domCapture,
      this.visionAnalyzer
    );
  }

  /**
   * Extract everything from a page
   */
  async extractComplete(
    page: Page,
    captures: CaptureSet
  ): Promise<CompleteAnalysis> {
    console.log('🔍 Starting complete analysis...');

    // 1. JavaScript & Module Analysis
    console.log('  📦 Analyzing JavaScript modules...');
    const modules = await this.jsAnalyzer.analyzePage(page);

    // 2. Design Token Extraction
    console.log('  🎨 Extracting design tokens...');
    const design = await this.designExtractor.extract(captures, page);

    // 3. Behavior Capture
    console.log('  🎬 Capturing behavior...');
    const behavior = await this.behaviorCapture.capture(page);

    // 4. Network Capture
    console.log('  🌐 Capturing network activity...');
    const network = await this.networkCapture.capture(page);

    // 5. State Management Detection
    console.log('  🗃️  Detecting state management...');
    const state = await this.stateDetector.detect(modules);

    console.log('✅ Complete analysis finished!');
    console.log(`  - Modules: ${modules.modules.size}`);
    console.log(`  - Components: ${Array.from(modules.modules.values()).reduce((sum, m) => sum + m.components.length, 0)}`);
    console.log(`  - Framework: ${modules.framework}`);
    console.log(`  - State: ${state.type}`);
    console.log(`  - Colors: ${design.colors.all.length} clusters`);
    console.log(`  - Spacing: ${design.spacing.scale.length} values`);
    console.log(`  - Events: ${behavior.eventListeners.length} listeners`);
    console.log(`  - API Endpoints: ${network.endpoints.length}`);

    return {
      design,
      behavior,
      network,
      modules,
      state,
      screenshots: captures
    };
  }
}
