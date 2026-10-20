# Farzi + REA Integration

**Farzi builds on REA's foundation, adding vision-based analysis and code generation.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                          FARZI                              │
│        Vision-Based Design System Extraction                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
    ┌──────────────────────────────────────────────┐
    │           REA (Foundation Layer)             │
    │  • Browser automation (Playwright/CDP)       │
    │  • Screenshot capture (CdpScreenshot)        │
    │  • PNG diff (PngVisualDiff)                  │
    │  • DOM capture (CdpCaptureDocuments)         │
    │  • Resource extraction                       │
    └──────────────────────────────────────────────┘
                          │
                          ▼
    ┌──────────────────────────────────────────────┐
    │        Farzi-Specific Additions              │
    │  • Vision-based color analysis               │
    │  • AI-powered component recognition          │
    │  • Design token extraction                   │
    │  • Code generation (React/Vue/Svelte)        │
    │  • Iterative validation & refinement         │
    └──────────────────────────────────────────────┘
```

---

## What We Use from REA

### 1. Screenshot Capture
**REA Provides:** `CdpScreenshot.ts`
- CDP-based screenshot capture
- PNG encoding
- Frame tree navigation
- Multi-frame support

**Farzi Uses:**
```typescript
import { captureCdpScreenshot } from 'rea/src/browser/CdpScreenshot';

// Use REA's screenshot capability
const screenshot = await captureCdpScreenshot(context);
```

### 2. Visual Comparison
**REA Provides:** `PngVisualDiff.ts`
- Pixel-by-pixel comparison
- RGBA channel analysis
- Change ratio calculation
- Dimension validation

**Farzi Uses:**
```typescript
import { comparePngScreenshots } from 'rea/src/browser/PngVisualDiff';

// Use REA's pixel diff
const diff = comparePngScreenshots({
  before: originalScreenshot,
  after: replicaScreenshot,
  channel_threshold: 10
});

console.log(`Similarity: ${(1 - diff.changed_ratio) * 100}%`);
```

### 3. DOM Capture
**REA Provides:** `CdpCaptureDocuments.ts`
- Frame tree capture
- Resource enumeration
- URL filtering
- Computed styles access

**Farzi Uses:**
```typescript
import { captureFrames, captureResources } from 'rea/src/browser/CdpCaptureDocuments';

// Capture DOM structure
const frames = captureFrames(frameTree, allowedOrigins);
const resources = captureResources(result, allowedOrigins);
```

### 4. Browser Automation
**REA Provides:** Browser session management
- Playwright integration
- CDP connection handling
- Target discovery
- Event observation

**Farzi Uses:**
```typescript
import { PlaywrightBrowserScenarioProvider } from 'rea/src/browser/PlaywrightBrowserScenarioProvider';

// Reuse REA's browser infrastructure
const browser = await provider.launch();
```

---

## What Farzi Adds

### 1. Vision-Based Color Analysis
```typescript
// src/analysis/VisionColorAnalyzer.ts

import { captureCdpScreenshot } from 'rea/src/browser/CdpScreenshot';
import { Claude } from '@anthropic-ai/sdk';

export class VisionColorAnalyzer {
  async analyzeColors(screenshot: Buffer): Promise<DesignColors> {
    // Use REA's screenshot
    // Add vision-based semantic analysis
    const colors = await this.claude.analyzeImage(screenshot, {
      task: 'Extract design system colors: primary, secondary, neutral, semantic'
    });

    return this.parseColorResponse(colors);
  }
}
```

### 2. Multi-DPI Capture Strategy
```typescript
// src/capture/MultiDPICapture.ts

import { captureCdpScreenshot } from 'rea/src/browser/CdpScreenshot';

export class MultiDPICapture {
  async capture(url: string): Promise<CaptureSet> {
    // Capture at 1x, 2x, 4x device scale
    const dpi1x = await captureCdpScreenshot({...context, deviceScaleFactor: 1});
    const dpi2x = await captureCdpScreenshot({...context, deviceScaleFactor: 2});
    const dpi4x = await captureCdpScreenshot({...context, deviceScaleFactor: 4});

    return { dpi1x, dpi2x, dpi4x };
  }
}
```

### 3. Design Token Extraction
```typescript
// src/extraction/TokenExtractor.ts

import { comparePngScreenshots } from 'rea/src/browser/PngVisualDiff';

export class TokenExtractor {
  async extract(captures: CaptureSet): Promise<DesignTokens> {
    // Use REA's pixel analysis
    // Add semantic understanding via vision
    const pixelColors = this.scanPixels(captures.dpi2x);
    const visionTokens = await this.visionAnalyzer.analyze(captures.dpi1x);

    return this.merge(pixelColors, visionTokens);
  }
}
```

### 4. Component Code Generation
```typescript
// src/generation/ComponentGenerator.ts

export class ComponentGenerator {
  async generateReact(component: Component, tokens: DesignTokens): Promise<string> {
    // Pure code generation - not in REA
    return this.renderTemplate({
      component,
      tokens,
      framework: 'react'
    });
  }
}
```

---

## File Structure

```
farzi/
├── package.json          # Depends on REA
├── src/
│   ├── adapters/         # REA integration adapters
│   │   ├── REABrowserAdapter.ts    # Wrap REA browser tools
│   │   ├── REAScreenshotAdapter.ts # Wrap REA screenshots
│   │   └── READiffAdapter.ts       # Wrap REA visual diff
│   │
│   ├── capture/          # Farzi-specific capture
│   │   └── MultiDPICapture.ts      # Multi-DPI strategy
│   │
│   ├── analysis/         # Vision-based analysis
│   │   ├── VisionColorAnalyzer.ts
│   │   ├── VisionSpacingAnalyzer.ts
│   │   └── VisionComponentRecognition.ts
│   │
│   ├── extraction/       # Design token extraction
│   │   └── TokenExtractor.ts
│   │
│   ├── generation/       # Code generation (NEW)
│   │   ├── ComponentGenerator.ts
│   │   ├── DesignSystemGenerator.ts
│   │   └── ProjectScaffolder.ts
│   │
│   └── validation/       # Enhanced validation
│       └── IterativeValidator.ts
```

---

## Setup

### 1. Install REA as Dependency

```json
// package.json
{
  "dependencies": {
    "rea-agents": "latest",
    "@anthropic-ai/sdk": "^0.32.1",
    "playwright": "^1.49.1"
  }
}
```

### 2. Import REA Modules

```typescript
// src/adapters/REABrowserAdapter.ts

import { captureCdpScreenshot } from 'rea-agents/src/browser/CdpScreenshot';
import { comparePngScreenshots } from 'rea-agents/src/browser/PngVisualDiff';
import { captureFrames } from 'rea-agents/src/browser/CdpCaptureDocuments';

export class REABrowserAdapter {
  // Wrap REA's browser tools for Farzi's use
}
```

---

## Benefits of This Approach

### ✅ Code Reuse
- Don't rebuild screenshot capture
- Don't rebuild pixel diff
- Don't rebuild browser automation
- Don't rebuild DOM capture

### ✅ Reliability
- REA's browser tools are battle-tested
- Proven CDP integration
- Handles edge cases

### ✅ Maintenance
- REA updates benefit Farzi automatically
- Bug fixes flow through
- Focus on vision + generation, not infrastructure

### ✅ Complementary Tools
- REA: "How does this work?"
- Farzi: "Build me a copy"
- Both use the same foundation

---

## Implementation Plan

### Week 1: REA Integration
- [ ] Add REA as dependency
- [ ] Create REA adapter layer
- [ ] Wrap screenshot capture
- [ ] Wrap visual diff
- [ ] Test integration

### Week 2: Vision Analysis
- [ ] Integrate Claude Vision API
- [ ] Build color analyzer
- [ ] Build spacing analyzer
- [ ] Build component recognizer

### Week 3: Token Extraction
- [ ] Combine pixel + vision data
- [ ] Extract design tokens
- [ ] Validate consistency
- [ ] Generate evidence

### Week 4: Code Generation
- [ ] React component generator
- [ ] Design system generator
- [ ] Project scaffolder
- [ ] Validation pipeline

---

## Example: Screenshot Comparison

### Before (Farzi-only)
```typescript
// Would need to rebuild everything
const screenshot = await customScreenshot(url);
const diff = await customPixelDiff(before, after);
```

### After (Farzi + REA)
```typescript
// Use REA's proven tools
import { captureCdpScreenshot } from 'rea-agents/src/browser/CdpScreenshot';
import { comparePngScreenshots } from 'rea-agents/src/browser/PngVisualDiff';

const screenshot = await captureCdpScreenshot(context);
const diff = comparePngScreenshots({ before, after, channel_threshold: 10 });

// Focus on what's unique to Farzi: vision analysis
const designTokens = await visionAnalyzer.analyze(screenshot);
```

---

## Relationship to REA

**REA = Analysis Foundation**
- Reverse engineering
- Understanding how apps work
- Evidence-based findings

**Farzi = Generation Layer**
- Vision-based design extraction
- Pixel-perfect replication
- Code generation
- Built on REA's foundation

```
User Question: "How does Linear's sidebar work?"
→ Use: REA (analyze, understand, document)

User Question: "Build me a Linear clone"
→ Use: Farzi (capture, extract, generate, validate)
```

---

This approach gives us the best of both worlds: REA's robust browser infrastructure + Farzi's vision-based design extraction and code generation.
