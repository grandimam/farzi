# Farzi Quick Start

Get started with Farzi in 5 minutes.

## Installation

```bash
cd /Users/grandimam/Workspace/taraqqi/farzi
npm install
npm run build
```

## Basic Usage

### Extract Design System

```typescript
import { Farzi } from 'farzi';

const farzi = new Farzi(process.env.ANTHROPIC_API_KEY);

// Extract design system from any URL
const result = await farzi.extractDesign('https://linear.app');

console.log('Colors:', result.tokens.colors);
console.log('Spacing:', result.tokens.spacing);
console.log('Typography:', result.tokens.typography);
```

### Replicate an App

```typescript
await farzi.replicate({
  url: 'https://example.com',
  output: './my-replica',
  framework: 'react',
  validate: true,
  similarityTarget: 99.5
});
```

### Extract a Component

```typescript
const { code, tokens } = await farzi.extractComponent(
  'https://stripe.com/pricing',
  '.pricing-card'
);

console.log(code); // Generated React component
```

## Next Implementation Steps

### 1. Pixel Color Extractor (Week 1)

```bash
# Create the analyzer
touch src/analysis/PixelColorExtractor.ts
```

Key features:
- Scan every pixel in screenshot
- Cluster similar colors (account for anti-aliasing)
- Categorize by usage (primary, neutral, semantic)
- Return exact hex values

### 2. Vision Analyzer (Week 1)

```bash
touch src/analysis/VisionAnalyzer.ts
```

Key features:
- Send screenshots to Claude Vision
- Extract semantic design information
- Identify component patterns
- Understand spacing systems

### 3. Spacing Detector (Week 2)

```bash
touch src/analysis/SpacingDetector.ts
```

Key features:
- Find element boundaries
- Measure gaps between elements
- Infer base spacing unit (4px, 8px)
- Generate spacing scale

### 4. Design Token Extractor (Week 2)

```bash
touch src/extraction/DesignTokenExtractor.ts
```

Key features:
- Combine pixel + vision analysis
- Extract complete design tokens
- Validate consistency
- Generate evidence trail

### 5. Component Generator (Week 3)

```bash
touch src/generation/ComponentGenerator.ts
```

Key features:
- Generate React components from tokens
- Support variants and states
- Include TypeScript types
- Production-ready code

### 6. Pixel Diff Validator (Week 4)

```bash
touch src/validation/PixelDiffValidator.ts
```

Key features:
- Pixel-by-pixel comparison
- Generate diff images
- Calculate similarity score
- Suggest corrections

## Example Workflow

```typescript
// 1. Capture at multiple zoom levels
const captures = await farzi.capture.captureUrl('https://linear.app');

// 2. Analyze pixels for exact colors
const colors = await farzi.pixelAnalyzer.extractColors(
  captures.retina.fullPage
);

// 3. Use AI vision for understanding
const visionTokens = await farzi.visionAnalyzer.analyzeDesignSystem(
  captures.standard.fullPage
);

// 4. Detect spacing from whitespace
const spacing = await farzi.spacingDetector.detectSpacing(
  captures.standard.fullPage
);

// 5. Generate components
await farzi.componentGenerator.generateProject(tokens, './output', 'react');

// 6. Validate with pixel diff
const validation = await farzi.validator.compare(
  originalScreenshot,
  replicaScreenshot
);

console.log(`Similarity: ${validation.similarity}%`);
```

## Testing the Capture

Quick test to verify Playwright works:

```typescript
import { MultiZoomCapture } from './src/capture/MultiZoomCapture';

async function test() {
  const capture = new MultiZoomCapture();

  const captures = await capture.captureUrl('https://example.com');

  // Save screenshots to verify
  const fs = require('fs');
  fs.writeFileSync('./test-100.png', captures.standard.fullPage);
  fs.writeFileSync('./test-200.png', captures.retina.fullPage);

  console.log('Captured elements:', captures.ultra.elements.length);

  await capture.close();
}

test();
```

## Development Checklist

- [ ] Week 1: Pixel color extraction
- [ ] Week 1: AI vision integration
- [ ] Week 2: Spacing detection
- [ ] Week 2: Design token extraction
- [ ] Week 3: Component generation
- [ ] Week 4: Pixel-diff validation
- [ ] Week 4: Iterative refinement

## Success Criteria

- ✅ 100% color accuracy (exact hex values)
- ✅ 100% spacing accuracy (exact px values)
- ✅ 99.5%+ visual similarity (pixel-diff)
- ✅ Production-ready code output
- ✅ Evidence-based extraction

## Resources

- [Architecture](./ARCHITECTURE.md) - Detailed system design
- [README](./README.md) - Project overview
- [Playwright Docs](https://playwright.dev/) - Browser automation
- [Claude Vision](https://docs.anthropic.com/claude/docs/vision) - AI analysis
- [Jimp Docs](https://github.com/jimp-dev/jimp) - Image processing

---

Ready to build exact replicas! 🎯
