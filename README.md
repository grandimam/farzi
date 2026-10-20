# Farzi

**Replicate any application with pixel-perfect accuracy using vision-based analysis.**

Farzi uses screenshots and AI vision to extract exact design systems and rebuild applications without guessing. No CSS parsing approximations—just what's actually rendered.

---

## What is Farzi?

**Farzi** means "fake" or "replica" in Urdu/Hindi. It's a tool that creates pixel-perfect replicas of web applications by analyzing what's actually rendered, not what the code says should be rendered.

### The Problem with Traditional Approaches

Most UI cloning tools:
- ❌ Parse CSS and guess at the design system
- ❌ Miss computed styles and dynamic values
- ❌ Can't detect visual patterns reliably
- ❌ Approximate spacing and colors

### Farzi's Image-Based Approach

Farzi:
- ✅ Captures screenshots at multiple zoom levels (100%, 200%, 400%)
- ✅ Analyzes actual rendered pixels for exact colors
- ✅ Uses AI vision to understand layout and patterns
- ✅ Measures spacing from whitespace in images
- ✅ Validates replicas with pixel-diff comparison
- ✅ Iterates until 99.5%+ visual similarity

---

## Quick Start

```bash
# Install
npm install -g farzi

# Replicate a website
farzi replicate https://linear.app --output ./linear-clone

# Extract just the design system
farzi extract-design https://example.com --output ./design-system.json

# Replicate a specific component
farzi component https://stripe.com/pricing --selector ".pricing-card"
```

---

## How It Works

### 1. Multi-Level Capture
```typescript
// Capture at different zoom levels for precision
const captures = await farzi.capture('https://app.com', {
  zoom: [100, 200, 400],
  viewports: ['mobile', 'tablet', 'desktop'],
  states: ['default', 'hover', 'active', 'focus']
});
```

### 2. Pixel-Level Analysis
```typescript
// Analyze actual rendered pixels
const colors = await farzi.analyzeColors(screenshot);
// Returns: [
//   { hex: '#5E6AD2', count: 12847, usage: 'primary' },
//   { hex: '#F2F5F7', count: 45123, usage: 'background' }
// ]
```

### 3. AI Vision Understanding
```typescript
// Use Claude Vision to understand semantics
const designSystem = await farzi.analyzeWithVision(screenshot, {
  extract: ['colors', 'spacing', 'typography', 'components']
});
```

### 4. Visual Validation
```typescript
// Build replica and compare pixel-by-pixel
const diff = await farzi.compare(originalScreenshot, replicaScreenshot);
// Returns: { similarity: 98.7%, differences: [...] }
```

### 5. Iterative Refinement
```typescript
// Auto-correct until pixel-perfect
while (diff.similarity < 99.5) {
  const fixes = await farzi.suggestFixes(diff);
  await farzi.apply(fixes);
  diff = await farzi.compare(original, replica);
}
```

---

## Architecture

```
farzi/
├── src/
│   ├── capture/           # Screenshot capture at multiple levels
│   │   ├── MultiZoom.ts          # Capture at 100%, 200%, 400%
│   │   ├── StateCapture.ts       # Hover, active, focus states
│   │   └── ElementCapture.ts     # Individual element screenshots
│   │
│   ├── analysis/          # Image-based analysis
│   │   ├── PixelAnalyzer.ts      # Direct pixel scanning
│   │   ├── ColorExtractor.ts     # Exact color extraction
│   │   ├── SpacingDetector.ts    # Whitespace measurement
│   │   └── VisionAnalyzer.ts     # AI vision understanding
│   │
│   ├── extraction/        # Design system extraction
│   │   ├── DesignTokens.ts       # Token extraction
│   │   ├── ComponentRecognition.ts
│   │   └── PatternDetection.ts
│   │
│   ├── generation/        # Code generation
│   │   ├── ComponentGenerator.ts
│   │   ├── DesignSystemGenerator.ts
│   │   └── ProjectScaffold.ts
│   │
│   └── validation/        # Visual validation
│       ├── PixelDiff.ts          # Pixel-by-pixel comparison
│       ├── VisualRegression.ts
│       └── IterativeRefine.ts
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── VISION_APPROACH.md
│   └── API.md
│
└── examples/
    ├── linear-replica/
    └── stripe-pricing/
```

---

## Features

### Pixel-Perfect Color Extraction

```typescript
// Traditional CSS parsing
const cssColor = '#5e6ad2';  // Might be wrong

// Farzi's pixel analysis
const actualColors = farzi.scanPixels(screenshot);
// Returns EXACT rendered colors:
// [
//   { hex: '#5E6AD2', rgb: [94, 106, 210], count: 12847 },
//   { hex: '#5D6AD1', rgb: [93, 106, 209], count: 89 }  // Anti-aliasing
// ]
```

### Spacing Detection from Images

```typescript
// Measure actual whitespace
const spacing = farzi.detectSpacing(screenshot);
// Returns:
// {
//   baseUnit: 4,
//   scale: [4, 8, 12, 16, 24, 32, 48, 64],
//   gaps: [
//     { between: ['button', 'input'], value: 16 },
//     { between: ['section', 'section'], value: 48 }
//   ]
// }
```

### Component Recognition via Vision

```typescript
// AI understands visual patterns
const components = await farzi.recognizeComponents(screenshot);
// Returns:
// [
//   {
//     type: 'button',
//     variants: ['primary', 'secondary', 'ghost'],
//     states: ['default', 'hover', 'active'],
//     boundingBoxes: [...]
//   }
// ]
```

### Visual Validation

```typescript
// Pixel-by-pixel diff
const result = farzi.validate(original, replica);
// Returns:
// {
//   similarity: 99.2%,
//   colorAccuracy: 100%,
//   spacingAccuracy: 100%,
//   layoutAccuracy: 98.7%,
//   differences: [
//     { type: 'shadow', location: {x: 100, y: 200}, off_by: '1px' }
//   ]
// }
```

---

## Why "Image-Based"?

### The Problem with CSS Parsing

CSS tells you what _should_ be rendered. Images show you what _actually_ is rendered.

```css
/* CSS says */
.button {
  color: var(--primary-500);  /* What does this resolve to? */
  padding: calc(var(--spacing-base) * 3);  /* What's the actual px? */
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);  /* Anti-aliasing? */
}
```

```typescript
// Farzi measures
const button = farzi.analyze(buttonScreenshot);
// Returns EXACT values:
// {
//   color: '#5E6AD2',
//   padding: { top: 12, right: 24, bottom: 12, left: 24 },
//   shadow: { colors: ['#00000019', '#00000015'], blur: 8 }
// }
```

---

## Roadmap

### Phase 1: Foundation (Week 1-2)
- [x] Multi-zoom screenshot capture
- [ ] Pixel-level color extraction
- [ ] AI vision integration
- [ ] Basic design token extraction

### Phase 2: Analysis (Week 3-4)
- [ ] Spacing detection from images
- [ ] Typography analysis
- [ ] Component recognition
- [ ] Pattern detection

### Phase 3: Generation (Week 5-6)
- [ ] React component generation
- [ ] Design system package generation
- [ ] Project scaffolding

### Phase 4: Validation (Week 7-8)
- [ ] Pixel-diff comparison
- [ ] Visual regression testing
- [ ] Iterative refinement
- [ ] 99.5%+ similarity target

### Phase 5: Scale (Week 9-12)
- [ ] Multi-framework support (Vue, Svelte)
- [ ] Animation extraction
- [ ] Responsive breakpoint handling
- [ ] Performance optimization

---

## Comparison: Farzi vs Traditional Tools

| Aspect | Traditional CSS Tools | Farzi (Image-Based) |
|--------|----------------------|---------------------|
| **Color Detection** | Parse CSS variables | Scan actual pixels |
| **Accuracy** | ~85-90% | 99.5%+ target |
| **Spacing** | Guess from CSS | Measure from whitespace |
| **Validation** | Manual check | Automated pixel-diff |
| **Anti-aliasing** | Missed | Detected |
| **Computed Styles** | Approximate | Exact |
| **Dynamic Values** | Hard to detect | Captured as-is |

---

## Examples

### Extract Linear's Design System

```bash
farzi extract-design https://linear.app

# Output:
{
  "colors": {
    "primary": {
      "500": "#5E6AD2",  // Exact from pixels
      "600": "#4C5FD5"   // Exact from pixels
    }
  },
  "spacing": {
    "baseUnit": 4,
    "scale": [4, 8, 12, 16, 24, 32, 48, 64, 96]
  },
  "typography": {
    "family": ["Inter", "sans-serif"],
    "sizes": [12, 14, 16, 18, 20, 24, 32, 48]
  },
  "evidence": {
    "screenshots": ["./linear-100.png", "./linear-200.png"],
    "pixelCounts": {...},
    "visionAnalysis": {...}
  }
}
```

### Replicate Stripe Pricing

```bash
farzi replicate https://stripe.com/pricing --output ./stripe-clone

# Generated:
stripe-clone/
├── design-system/
│   ├── tokens/
│   │   ├── colors.ts        # Exact pixel colors
│   │   ├── spacing.ts       # Measured gaps
│   │   └── typography.ts    # Detected fonts
│   └── components/
│       ├── PricingCard.tsx
│       └── CTAButton.tsx
├── validation/
│   ├── original.png         # Original screenshot
│   ├── replica.png          # Generated screenshot
│   └── diff.png             # Visual diff
└── report.json              # 98.7% similarity
```

---

## Contributing

We're building Farzi in public. Contributions welcome!

### Areas to Help

1. **Vision Analysis**: Improve AI prompts for better design token extraction
2. **Pixel Algorithms**: Better color clustering, spacing detection
3. **Component Recognition**: Pattern detection for UI components
4. **Validation**: More robust visual comparison algorithms

---

## License

MIT

---

## Credits

Built with:
- [Playwright](https://playwright.dev/) - Browser automation
- [Claude Vision](https://anthropic.com) - AI-powered visual analysis
- [Jimp](https://github.com/jimp-dev/jimp) - Image processing
- [Sharp](https://sharp.pixelplumbing.com/) - High-performance image processing

---

**Farzi: Because exact replication beats close approximation.** 🎯
