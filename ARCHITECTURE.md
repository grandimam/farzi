# Farzi Architecture

**Vision-Based Application Replication**

---

## Core Principle

> **Analyze what's rendered, not what's declared.**

Traditional tools parse CSS/HTML. Farzi analyzes screenshots. This gives 100% accuracy on colors, spacing, and typography because we're measuring what actually appears on screen.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FARZI                               │
│                  Image-Based Replicator                     │
└─────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
    ┌──────────┐                   ┌──────────┐
    │ CAPTURE  │                   │ ANALYZE  │
    └──────────┘                   └──────────┘
          │                               │
          ├─ Multi-zoom screenshots       ├─ Pixel scanning
          ├─ State variations             ├─ AI vision
          ├─ Element-level captures       ├─ Pattern detection
          └─ Viewport matrix              └─ Color clustering

          ▼                               ▼
    ┌──────────┐                   ┌──────────┐
    │ EXTRACT  │                   │ GENERATE │
    └──────────┘                   └──────────┘
          │                               │
          ├─ Design tokens                ├─ Components
          ├─ Component library            ├─ Design system
          ├─ Layout patterns              ├─ Project scaffold
          └─ Interaction states           └─ Build config

          ▼                               ▼
    ┌──────────┐                   ┌──────────┐
    │ VALIDATE │                   │  REFINE  │
    └──────────┘                   └──────────┘
          │                               │
          ├─ Pixel-diff comparison        ├─ Auto-corrections
          ├─ Visual regression            ├─ Iterative improve
          ├─ Token verification           ├─ 99.5%+ target
          └─ Similarity scoring           └─ Final validation
```

---

## Phase 1: Capture

### Multi-Level Screenshot Strategy

The key insight: **Different zoom levels reveal different details.**

```typescript
interface CaptureStrategy {
  // 100% zoom - Overall layout
  standard: {
    purpose: 'Layout, positioning, relative sizes',
    resolution: 'Native viewport size',
    captures: ['full-page', 'sections', 'components']
  };

  // 200% zoom - Sub-pixel precision
  retina: {
    purpose: 'Exact pixel values, anti-aliasing',
    resolution: '2x viewport size',
    captures: ['components', 'text', 'icons']
  };

  // 400% zoom - Ultra-precise measurements
  ultra: {
    purpose: 'Shadow blur, border radius, font rendering',
    resolution: '4x viewport size',
    captures: ['individual elements', 'text samples']
  };
}
```

### State Capture Matrix

Capture every visual state to ensure complete replication:

```typescript
interface StateCaptureMatrix {
  viewports: ['mobile', 'tablet', 'desktop', 'wide'];
  zoom: [100, 200, 400];
  states: ['default', 'hover', 'active', 'focus', 'disabled'];
  themes: ['light', 'dark']; // If applicable

  // Total captures per element: 4 × 3 × 5 × 2 = 120 screenshots
  // But we only capture what we detect as distinct
}
```

### Implementation

```typescript
// src/capture/MultiZoomCapture.ts

export class MultiZoomCapture {
  async captureUrl(url: string): Promise<CaptureSet> {
    const browser = await playwright.chromium.launch();
    const captures: CaptureSet = {
      standard: {},
      retina: {},
      ultra: {}
    };

    // 100% zoom - Full page
    const page100 = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    await page100.goto(url);
    captures.standard.fullPage = await page100.screenshot({ fullPage: true });

    // 200% zoom - Component details
    const page200 = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2
    });
    await page200.goto(url);
    captures.retina.fullPage = await page200.screenshot({ fullPage: true });

    // 400% zoom - Individual elements
    const page400 = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 4
    });
    await page400.goto(url);

    // Capture individual elements at ultra zoom
    const elements = await page400.$$('[data-component], button, input, a, .card');
    for (const element of elements) {
      const screenshot = await element.screenshot();
      const boundingBox = await element.boundingBox();
      captures.ultra.elements.push({ screenshot, boundingBox });
    }

    return captures;
  }
}
```

---

## Phase 2: Analysis

### Pixel-Level Color Extraction

**No CSS parsing. Direct pixel scanning.**

```typescript
// src/analysis/PixelAnalyzer.ts

export class PixelColorExtractor {
  async extractColors(screenshot: Buffer): Promise<ColorPalette> {
    const image = await Jimp.read(screenshot);
    const colorMap = new Map<string, PixelInfo>();

    // Scan every pixel
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
      const r = image.bitmap.data[idx + 0];
      const g = image.bitmap.data[idx + 1];
      const b = image.bitmap.data[idx + 2];
      const a = image.bitmap.data[idx + 3];

      if (a < 10) return; // Skip transparent pixels

      const hex = this.rgbToHex(r, g, b);
      const info = colorMap.get(hex) || {
        hex,
        rgb: [r, g, b],
        count: 0,
        locations: []
      };

      info.count++;
      info.locations.push({ x, y });
      colorMap.set(hex, info);
    });

    // Cluster similar colors (account for anti-aliasing)
    const clustered = this.clusterColors(Array.from(colorMap.values()));

    // Categorize by usage
    return this.categorizeColors(clustered);
  }

  private clusterColors(colors: PixelInfo[]): ColorCluster[] {
    // Group colors within deltaE < 2 (imperceptible difference)
    const clusters: ColorCluster[] = [];

    for (const color of colors) {
      let addedToCluster = false;

      for (const cluster of clusters) {
        if (this.deltaE(color.rgb, cluster.primary.rgb) < 2) {
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

  private categorizeColors(clusters: ColorCluster[]): ColorPalette {
    // Use heuristics + vision AI to categorize
    const sorted = clusters.sort((a, b) => b.totalCount - a.totalCount);

    return {
      primary: this.findPrimaryColors(sorted),
      neutral: this.findNeutralColors(sorted),
      semantic: this.findSemanticColors(sorted),
      all: sorted
    };
  }
}
```

### AI Vision Analysis

**Use Claude Vision to understand semantic meaning.**

```typescript
// src/analysis/VisionAnalyzer.ts

export class VisionAnalyzer {
  async analyzeDesignSystem(screenshot: Buffer): Promise<DesignTokens> {
    const base64 = screenshot.toString('base64');

    const response = await this.claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: base64
            }
          },
          {
            type: "text",
            text: `Analyze this screenshot and extract the design system:

1. **Colors**: Identify primary, secondary, neutral, and semantic colors (success, error, warning).
2. **Spacing**: Measure gaps between elements. What's the base spacing unit (4px, 8px)?
3. **Typography**: Identify font families, sizes, weights.
4. **Components**: List all UI component types you see (buttons, inputs, cards, etc.).
5. **Patterns**: Identify any repeated design patterns.

Return as JSON.`
          }
        ]
      }]
    });

    return this.parseVisionResponse(response.content[0].text);
  }

  async analyzeSpacing(screenshot: Buffer): Promise<SpacingSystem> {
    const base64 = screenshot.toString('base64');

    const response = await this.claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: base64
            }
          },
          {
            type: "text",
            text: `Analyze the spacing in this screenshot:

1. Measure the gaps (white space) between elements
2. Identify the base spacing unit (likely 4px or 8px)
3. List the spacing scale (e.g., [4, 8, 12, 16, 24, 32, 48, 64])
4. Note any inconsistencies

Return measurements in pixels as JSON.`
          }
        ]
      }]
    });

    return this.parseSpacingResponse(response.content[0].text);
  }
}
```

### Spacing Detection from Whitespace

**Measure actual gaps between elements.**

```typescript
// src/analysis/SpacingDetector.ts

export class SpacingDetector {
  async detectSpacing(screenshot: Buffer): Promise<SpacingSystem> {
    const image = await Jimp.read(screenshot);

    // Find element boundaries (non-white pixels)
    const boundaries = this.findElementBoundaries(image);

    // Measure gaps
    const gaps = this.measureGaps(boundaries);

    // Infer base unit
    const baseUnit = this.inferBaseUnit(gaps);

    // Generate scale
    const scale = this.generateScale(gaps, baseUnit);

    return {
      baseUnit,
      scale,
      gaps,
      confidence: this.calculateConfidence(gaps, baseUnit)
    };
  }

  private findElementBoundaries(image: Jimp): Boundary[] {
    // Scan for transitions from white to content
    const boundaries: Boundary[] = [];

    // Horizontal scan
    for (let y = 0; y < image.bitmap.height; y++) {
      let inElement = false;
      let startX = 0;

      for (let x = 0; x < image.bitmap.width; x++) {
        const isContent = !this.isWhitespace(image, x, y);

        if (isContent && !inElement) {
          startX = x;
          inElement = true;
        } else if (!isContent && inElement) {
          boundaries.push({
            type: 'horizontal',
            start: startX,
            end: x,
            y
          });
          inElement = false;
        }
      }
    }

    return boundaries;
  }

  private measureGaps(boundaries: Boundary[]): number[] {
    const gaps: number[] = [];

    // Measure horizontal gaps
    for (let i = 0; i < boundaries.length - 1; i++) {
      const gap = boundaries[i + 1].start - boundaries[i].end;
      if (gap > 0) gaps.push(gap);
    }

    return gaps;
  }

  private inferBaseUnit(gaps: number[]): number {
    // Find GCD of all gaps
    const gcd = gaps.reduce((a, b) => this.gcd(a, b));

    // Likely 4px or 8px
    if (gcd === 4 || gcd === 8) return gcd;

    // Otherwise, find most common divisor
    const candidates = [4, 8];
    const scores = candidates.map(base => ({
      base,
      score: gaps.filter(g => g % base === 0).length
    }));

    return scores.sort((a, b) => b.score - a.score)[0].base;
  }
}
```

---

## Phase 3: Extraction

### Design Token Extraction

Combine pixel analysis + AI vision for complete tokens:

```typescript
// src/extraction/DesignTokenExtractor.ts

export class DesignTokenExtractor {
  async extract(captures: CaptureSet): Promise<DesignTokens> {
    // Pixel-level analysis
    const pixelColors = await this.pixelAnalyzer.extractColors(
      captures.retina.fullPage
    );

    const pixelSpacing = await this.spacingDetector.detectSpacing(
      captures.standard.fullPage
    );

    // AI vision analysis
    const visionTokens = await this.visionAnalyzer.analyzeDesignSystem(
      captures.standard.fullPage
    );

    // Merge and validate
    return {
      colors: this.mergeColors(pixelColors, visionTokens.colors),
      spacing: this.mergeSpacing(pixelSpacing, visionTokens.spacing),
      typography: visionTokens.typography, // Vision is better for fonts
      components: visionTokens.components,

      evidence: {
        pixel: { pixelColors, pixelSpacing },
        vision: visionTokens,
        screenshots: captures
      }
    };
  }
}
```

---

## Phase 4: Generation

### Component Generator

Generate React components from extracted tokens:

```typescript
// src/generation/ComponentGenerator.ts

export class ComponentGenerator {
  async generateButton(component: Component, tokens: DesignTokens): Promise<string> {
    const variants = component.variants.map(v => ({
      name: v.name,
      styles: this.extractStyles(v.screenshot, tokens)
    }));

    return `
import { cn } from '@/lib/utils';

interface ButtonProps {
  variant?: ${variants.map(v => `'${v.name}'`).join(' | ')};
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = '${variants[0].name}',
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        'transition-colors',
        ${this.generateVariantClasses(variants, tokens)}
      )}
      {...props}
    >
      {children}
    </button>
  );
};
    `.trim();
  }
}
```

---

## Phase 5: Validation

### Pixel-Diff Comparison

Compare original vs replica pixel-by-pixel:

```typescript
// src/validation/PixelDiff.ts

export class PixelDiffValidator {
  async compare(
    original: Buffer,
    replica: Buffer
  ): Promise<ComparisonResult> {
    const img1 = await Jimp.read(original);
    const img2 = await Jimp.read(replica);

    if (img1.bitmap.width !== img2.bitmap.width ||
        img1.bitmap.height !== img2.bitmap.height) {
      await img2.resize(img1.bitmap.width, img1.bitmap.height);
    }

    let differentPixels = 0;
    const diffImage = new Jimp(img1.bitmap.width, img1.bitmap.height);
    const differences: Difference[] = [];

    img1.scan(0, 0, img1.bitmap.width, img1.bitmap.height, (x, y, idx) => {
      const r1 = img1.bitmap.data[idx + 0];
      const g1 = img1.bitmap.data[idx + 1];
      const b1 = img1.bitmap.data[idx + 2];

      const r2 = img2.bitmap.data[idx + 0];
      const g2 = img2.bitmap.data[idx + 1];
      const b2 = img2.bitmap.data[idx + 2];

      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);

      if (diff > 10) { // Threshold for "different"
        differentPixels++;
        diffImage.bitmap.data[idx + 0] = 255; // Red
        diffImage.bitmap.data[idx + 1] = 0;
        diffImage.bitmap.data[idx + 2] = 0;
        diffImage.bitmap.data[idx + 3] = 255;

        differences.push({ x, y, diff });
      }
    });

    const totalPixels = img1.bitmap.width * img1.bitmap.height;
    const similarity = ((totalPixels - differentPixels) / totalPixels) * 100;

    return {
      similarity,
      differentPixels,
      totalPixels,
      diffImage: await diffImage.getBufferAsync(Jimp.MIME_PNG),
      differences: this.clusterDifferences(differences)
    };
  }
}
```

---

## Success Metrics

### Target: 99.5%+ Visual Similarity

```typescript
interface ValidationTargets {
  colorAccuracy: 100%;      // Exact hex match
  spacingAccuracy: 100%;    // Exact px match
  layoutSimilarity: 99.5%;  // Pixel-diff
  overallSimilarity: 99.5%; // Combined score
}
```

---

## Technology Stack

```typescript
const stack = {
  capture: {
    browser: 'Playwright',
    screenshots: 'Built-in CDP'
  },
  analysis: {
    pixels: 'Jimp',
    vision: 'Claude Vision API',
    colors: 'ColorThief, DeltaE'
  },
  generation: {
    templates: 'Handlebars',
    formatting: 'Prettier'
  },
  validation: {
    diff: 'Jimp + custom pixel-diff',
    regression: 'Playwright screenshots'
  }
};
```

---

## Next Steps

1. Implement multi-zoom capture
2. Build pixel-level color extractor
3. Integrate Claude Vision API
4. Create spacing detector
5. Build validation pipeline

**The foundation is image-based precision. Everything else follows.**
