/**
 * Core types for Farzi
 */

export interface CaptureSet {
  standard: {
    fullPage?: Buffer;
    sections?: Buffer[];
    components?: Buffer[];
  };
  retina: {
    fullPage?: Buffer;
    components?: Buffer[];
  };
  ultra: {
    elements?: Array<{
      screenshot: Buffer;
      boundingBox: BoundingBox | null;
      selector?: string;
    }>;
  };
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface PixelInfo {
  hex: string;
  rgb: [number, number, number];
  count: number;
  locations: Point[];
}

export interface ColorCluster {
  primary: PixelInfo;
  colors: PixelInfo[];
  totalCount: number;
}

export interface ColorPalette {
  primary: ColorCluster[];
  neutral: ColorCluster[];
  semantic: {
    success?: ColorCluster[];
    error?: ColorCluster[];
    warning?: ColorCluster[];
    info?: ColorCluster[];
  };
  all: ColorCluster[];
}

export interface SpacingSystem {
  baseUnit: number;
  scale: number[];
  gaps: number[];
  confidence: number;
}

export interface Typography {
  families: string[];
  sizes: number[];
  weights: number[];
  lineHeights: number[];
  letterSpacing: number[];
}

export interface Component {
  name: string;
  type: 'button' | 'input' | 'card' | 'nav' | 'modal' | 'custom';
  variants: ComponentVariant[];
  states: ComponentState[];
  boundingBox?: BoundingBox;
  screenshot?: Buffer;
}

export interface ComponentVariant {
  name: string;
  screenshot?: Buffer;
  styles: Record<string, any>;
}

export interface ComponentState {
  name: 'default' | 'hover' | 'active' | 'focus' | 'disabled';
  screenshot?: Buffer;
}

export interface DesignTokens {
  colors: ColorPalette;
  spacing: SpacingSystem;
  typography: Typography;
  components: Component[];
  evidence?: {
    pixel?: any;
    vision?: any;
    screenshots?: CaptureSet;
  };
}

export interface ComparisonResult {
  similarity: number;
  differentPixels: number;
  totalPixels: number;
  diffImage: Buffer;
  differences: DifferenceCluster[];
}

export interface Difference {
  x: number;
  y: number;
  diff: number;
}

export interface DifferenceCluster {
  area: BoundingBox;
  differences: Difference[];
  severity: 'minor' | 'major' | 'critical';
}

export interface ReplicationOptions {
  url: string;
  output: string;
  framework?: 'react' | 'vue' | 'svelte';
  zoom?: number[];
  viewports?: string[];
  validate?: boolean;
  similarityTarget?: number;
}

export interface ExtractionResult {
  tokens: DesignTokens;
  screenshots: CaptureSet;
  timestamp: Date;
}

export interface ValidationReport {
  similarity: number;
  colorAccuracy: number;
  spacingAccuracy: number;
  layoutAccuracy: number;
  passed: boolean;
  details: ComparisonResult;
}
