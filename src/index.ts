/**
 * Farzi - Pixel-perfect application replication
 *
 * Main entry point for the library
 */

export { Farzi } from './Farzi';
export { MultiZoomCapture } from './capture/MultiZoomCapture';
export { PixelColorExtractor } from './analysis/PixelColorExtractor';
export { VisionAnalyzer } from './analysis/VisionAnalyzer';
export { SpacingDetector } from './analysis/SpacingDetector';
export { DesignTokenExtractor } from './extraction/DesignTokenExtractor';
export { ComponentGenerator } from './generation/ComponentGenerator';
export { PixelDiffValidator } from './validation/PixelDiffValidator';

export * from './types';
