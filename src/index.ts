/**
 * Farzi - Pixel-perfect application replication
 *
 * Main entry point for the library
 */

// Main API
export { Farzi } from './Farzi';

// Capture
export { MultiZoomCapture } from './capture/MultiZoomCapture';
export { DOMStyleCapture } from './capture/DOMStyleCapture';
export { BehaviorCapture } from './capture/BehaviorCapture';
export { NetworkCapture } from './capture/NetworkCapture';

// Analysis
export { JavaScriptAnalyzer } from './analysis/JavaScriptAnalyzer';
export { PixelColorExtractor } from './analysis/PixelColorExtractor';
export { VisionAnalyzer } from './analysis/VisionAnalyzer';
export { SpacingDetector } from './analysis/SpacingDetector';
export { StateDetector } from './analysis/StateDetector';

// Extraction
export { DesignTokenExtractor } from './extraction/DesignTokenExtractor';
export { CompleteExtractor } from './extraction/CompleteExtractor';

// Generation
export { ComponentGenerator } from './generation/ComponentGenerator';
export { StateGenerator } from './generation/StateGenerator';
export { APIGenerator } from './generation/APIGenerator';
export { ProjectGenerator } from './generation/ProjectGenerator';

// Validation
export { PixelDiffValidator } from './validation/PixelDiffValidator';
export { BehaviorValidator } from './validation/BehaviorValidator';

// Types
export * from './types';
