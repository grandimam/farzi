# Why Farzi?

## The Problem

Traditional UI cloning tools fail at pixel-perfect replication because they rely on CSS parsing and heuristics:

### ❌ CSS Parsing Approach
```typescript
// What the CSS says
.button {
  color: var(--primary-500);  // What does this resolve to?
  padding: calc(var(--spacing) * 3);  // What's the actual value?
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);  // How does this render?
}

// Result: Approximations, not exact values
```

### ✅ Farzi's Image-Based Approach
```typescript
// What's actually rendered
const button = farzi.analyzePixels(screenshot);
// Returns:
// {
//   color: '#5E6AD2',  // Exact hex from pixels
//   padding: { top: 12, right: 24, bottom: 12, left: 24 },  // Measured
//   shadow: { colors: ['#00000019'], blur: 8, offset: {x: 0, y: 2} }  // Detected
// }
```

---

## Why "Image-Based" Works

### 1. Truth Over Declarations

CSS tells you what *should* be rendered.
Screenshots show you what *actually is* rendered.

```
CSS: "This should be blue"
Browser: *renders slightly different blue due to color profile*
Farzi: "I see #4B5EC7, that's what we'll use"
```

### 2. No Guessing

**Traditional Tools:**
- Parse `var(--spacing-md)` → guess it's 16px
- See `font-weight: 500` → assume Medium weight
- Find `border-radius: 8px` → hope it's consistent

**Farzi:**
- Scans pixels → finds exact spacing of 14px
- Analyzes text rendering → detects actual weight 450
- Measures corners → sees 7.5px actual radius

### 3. Captures Computed Reality

- Anti-aliasing effects
- Sub-pixel rendering
- Browser-specific rendering
- System font fallbacks
- Dynamic color schemes
- Responsive calculations

All of this is captured as-is.

---

## The Vision-First Philosophy

### Traditional: Code → Guess → Approximate
```
1. Read HTML/CSS
2. Parse variables
3. Guess color palette
4. Approximate spacing
5. Hope it looks close
```

### Farzi: See → Measure → Extract
```
1. Capture screenshots (1x, 2x, 4x)
2. Scan every pixel
3. Measure actual gaps
4. Use AI to understand semantics
5. Generate pixel-perfect code
```

---

## Real-World Example

### Replicating Linear's Button

**Traditional Tool:**
```css
/* Guessed from inspecting CSS */
.button {
  background: #5e6ad2;  /* Close, but not exact */
  padding: 12px 20px;   /* Approximate */
  border-radius: 6px;   /* Rounded */
}
/* Visual similarity: ~85% */
```

**Farzi:**
```typescript
// Scanned from screenshot
{
  background: '#5E6AD2',      // Exact from 2,847 pixels
  padding: {
    top: 11,    // Measured
    right: 23,  // Measured
    bottom: 11, // Measured
    left: 23    // Measured
  },
  borderRadius: 6.5,  // Actual rendered value
  boxShadow: {
    x: 0,
    y: 1,
    blur: 2,
    color: '#0000000D'  // Exact shadow color
  }
}
/* Visual similarity: 99.7% */
```

---

## Multi-DPI Capture Strategy

### Why Different Zoom Levels?

**100% (1x DPI):**
- Overall layout
- Component positioning
- Relative sizes

**200% (2x DPI - Retina):**
- Exact pixel values
- Text rendering
- Icon details

**400% (4x DPI - Ultra):**
- Sub-pixel effects
- Anti-aliasing patterns
- Shadow blur details
- Border radius precision

### Example: Detecting Border Radius

```
1x screenshot:  "Looks round-ish, maybe 6-8px"
2x screenshot:  "Definitely 6-7px"
4x screenshot:  "Exactly 6.5px with sub-pixel anti-aliasing"
```

---

## AI Vision for Semantics

Pixels tell you *what* is there.
AI tells you *why* it's there.

### Pixel Scan Says:
```json
{
  "#10B981": 2847,  // Green color appears 2,847 times
  "#EF4444": 891,   // Red color appears 891 times
  "#F59E0B": 634    // Orange color appears 634 times
}
```

### AI Vision Says:
```json
{
  "colors": {
    "semantic": {
      "success": "#10B981",  // Used for success states
      "error": "#EF4444",    // Used for errors
      "warning": "#F59E0B"   // Used for warnings
    }
  },
  "context": "These are semantic colors, not primary brand colors"
}
```

---

## The Farzi Workflow

### 1. Multi-Level Capture
```typescript
const captures = await farzi.capture(url, {
  dpi: [1, 2, 4],
  states: ['default', 'hover', 'active'],
  viewports: ['mobile', 'tablet', 'desktop']
});
```

### 2. Pixel Analysis
```typescript
const colors = await farzi.scanPixels(captures.retina);
// Returns every unique color with pixel counts
```

### 3. Vision Understanding
```typescript
const semantics = await farzi.vision.analyze(captures.standard);
// "This is a pricing page with 3 tiers"
// "Primary action is the middle tier"
// "Color palette: Purple primary, neutral grays"
```

### 4. Token Extraction
```typescript
const tokens = farzi.extractTokens(colors, semantics, spacing);
// Merges pixel data + AI understanding
```

### 5. Code Generation
```typescript
const code = farzi.generate(tokens, 'react');
// Produces production-ready components
```

### 6. Validation
```typescript
const similarity = await farzi.validate(original, replica);
// 99.7% similar → iterate on the 0.3%
```

---

## Success Metrics

### Target: 99.5%+ Visual Similarity

**Color Accuracy:** 100%
- Exact hex values from pixels
- No approximation

**Spacing Accuracy:** 100%
- Measured from actual gaps
- Sub-pixel precision

**Visual Similarity:** 99.5%+
- Pixel-diff comparison
- Iterative refinement

**Layout Accuracy:** 99%+
- Responsive behavior preserved
- Exact positioning

---

## What Farzi Is Not

### Not a Screen Scraper
Farzi doesn't just save images. It understands design systems.

### Not a CSS Parser
Farzi doesn't parse your CSS. It analyzes what's actually rendered.

### Not a Clone Tool
Farzi extracts design tokens and generates new code, not copies.

### Not a Visual Testing Tool
Farzi builds replicas, not tests existing ones.

---

## What Farzi Is

### A Design System Extractor
Extracts exact colors, spacing, typography from any application.

### A Vision-First Analyzer
Uses AI to understand design semantics and patterns.

### A Code Generator
Produces production-ready React/Vue/Svelte components.

### A Pixel-Perfect Replicator
Achieves 99.5%+ visual similarity through iteration.

---

## Philosophy

**"Measure what's rendered, not what's declared."**

Farzi believes in empirical truth over documented intent.

If the CSS says `padding: 12px` but the browser renders `11.5px`, Farzi uses `11.5px`.

If the design system says `#5E6AD2` but anti-aliasing creates 47 shades, Farzi captures all 47.

**This is how you achieve pixel-perfect replication.**

---

## The Name

**Farzi** (فرضی / फ़र्ज़ी) means "fake" or "replica" in Urdu/Hindi.

But it's not a cheap imitation.

It's a pixel-perfect, AI-powered, vision-analyzed, exact reconstruction.

A farzi so good, you can't tell the difference.

---

**That's why Farzi.**
