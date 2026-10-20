# Farzi Implementation Plan

## What We Need from REA

To make Farzi complete, we need these capabilities from REA:

### 1. Browser Automation & Capture ✅ (Already have Playwright)
- [x] Multi-DPI screenshot capture
- [x] DOM inspection
- [x] Computed style extraction
- [ ] Event listener capture
- [ ] Network request interception
- [ ] Frame tree navigation

### 2. JavaScript Analysis (NEED THIS)
**From REA:** `src/artifacts/javascript/`
- [ ] Module dependency graph
- [ ] Import/export analysis
- [ ] Function extraction
- [ ] AST parsing
- [ ] Source map handling

**Implement in Farzi:** `src/analysis/JavaScriptAnalyzer.ts`

### 3. State Management Detection (NEED THIS)
**From REA:** Pattern detection in JavaScript
- [ ] Redux detection
- [ ] Zustand detection
- [ ] Context API usage
- [ ] Event emitter patterns

**Implement in Farzi:** `src/analysis/StateDetector.ts`

### 4. Event Handler Analysis (NEED THIS)
**From REA:** Browser event capture
- [ ] Click handlers
- [ ] Form submissions
- [ ] Keyboard shortcuts
- [ ] Drag & drop

**Implement in Farzi:** `src/analysis/EventAnalyzer.ts`

### 5. Network/API Analysis (NEED THIS)
**From REA:** Network interception
- [ ] API endpoint discovery
- [ ] Request/response shapes
- [ ] GraphQL query detection
- [ ] WebSocket connections

**Implement in Farzi:** `src/analysis/NetworkAnalyzer.ts`

---

## Implementation Strategy

### Phase 1: Core Analysis (Week 1)
Port essential REA capabilities:

1. **JavaScript Module Analysis**
```typescript
// src/analysis/JavaScriptAnalyzer.ts
export class JavaScriptAnalyzer {
  async analyzeModules(url: string): Promise<ModuleGraph> {
    // Parse all JS files
    // Build dependency graph
    // Extract exports/imports
    // Identify framework (React/Vue/etc)
  }
}
```

2. **Event & Behavior Capture**
```typescript
// src/capture/BehaviorCapture.ts
export class BehaviorCapture {
  async captureEvents(page: Page): Promise<EventMap> {
    // Listen to all DOM events
    // Capture handlers
    // Map interactions
  }

  async captureNetwork(page: Page): Promise<NetworkMap> {
    // Intercept fetch/XHR
    // Record endpoints
    // Capture shapes
  }
}
```

### Phase 2: Pattern Detection (Week 2)

3. **State Management Detection**
```typescript
// src/analysis/StateDetector.ts
export class StateDetector {
  async detectPattern(modules: ModuleGraph): Promise<StatePattern> {
    // Scan for Redux patterns
    // Detect Zustand stores
    // Find Context providers
    // Identify custom patterns
  }
}
```

4. **Component Recognition**
```typescript
// src/analysis/ComponentAnalyzer.ts
export class ComponentAnalyzer {
  async identifyComponents(
    dom: DOM,
    modules: ModuleGraph
  ): Promise<Component[]> {
    // Match DOM to React components
    // Identify props
    // Map state
    // Detect variants
  }
}
```

### Phase 3: Code Generation (Week 3)

5. **Complete Generator**
```typescript
// src/generation/CompleteGenerator.ts
export class CompleteGenerator {
  async generate(
    behavior: BehaviorAnalysis,
    visual: VisualAnalysis,
    framework: string
  ): Promise<Project> {
    // Generate components (with logic)
    // Generate state management
    // Generate API client
    // Generate routing
    // Setup build system
  }
}
```

---

## File Structure

```
farzi/
├── src/
│   ├── capture/
│   │   ├── MultiZoomCapture.ts           ✅ Done
│   │   ├── DOMStyleCapture.ts            ✅ Done
│   │   ├── BehaviorCapture.ts            ⬜ TODO
│   │   └── NetworkCapture.ts             ⬜ TODO
│   │
│   ├── analysis/
│   │   ├── PixelColorExtractor.ts        ✅ Done
│   │   ├── SpacingDetector.ts            ✅ Done
│   │   ├── VisionAnalyzer.ts             ✅ Done (optional)
│   │   ├── JavaScriptAnalyzer.ts         ⬜ TODO (from REA)
│   │   ├── StateDetector.ts              ⬜ TODO (from REA)
│   │   ├── EventAnalyzer.ts              ⬜ TODO (from REA)
│   │   ├── NetworkAnalyzer.ts            ⬜ TODO (from REA)
│   │   └── ComponentAnalyzer.ts          ⬜ TODO
│   │
│   ├── extraction/
│   │   ├── DesignTokenExtractor.ts       ✅ Done
│   │   ├── BehaviorExtractor.ts          ⬜ TODO
│   │   └── CompleteExtractor.ts          ⬜ TODO (combines both)
│   │
│   ├── generation/
│   │   ├── ComponentGenerator.ts         ⬜ TODO
│   │   ├── StateGenerator.ts             ⬜ TODO
│   │   ├── APIGenerator.ts               ⬜ TODO
│   │   └── ProjectGenerator.ts           ⬜ TODO
│   │
│   └── validation/
│       ├── PixelDiffValidator.ts         ⬜ TODO
│       ├── BehaviorValidator.ts          ⬜ TODO
│       └── CompleteValidator.ts          ⬜ TODO
```

---

## Key REA Modules to Port

### 1. JavaScript Analysis
**REA Location:** `src/artifacts/javascript/JavaScriptSourceAnalysis.ts`

**What it does:**
- Parses JavaScript/TypeScript
- Builds AST
- Extracts imports/exports
- Identifies module relationships

**Port to Farzi:** `src/analysis/JavaScriptAnalyzer.ts`
```typescript
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';

export class JavaScriptAnalyzer {
  async analyzeSource(code: string): Promise<ModuleInfo> {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    const imports: Import[] = [];
    const exports: Export[] = [];
    const components: Component[] = [];

    traverse(ast, {
      ImportDeclaration(path) {
        imports.push({
          source: path.node.source.value,
          specifiers: path.node.specifiers.map(s => s.local.name)
        });
      },

      ExportNamedDeclaration(path) {
        // Extract exports
      },

      FunctionDeclaration(path) {
        // Detect React components
        if (this.isReactComponent(path)) {
          components.push(this.extractComponent(path));
        }
      }
    });

    return { imports, exports, components };
  }
}
```

### 2. Browser Event Capture
**REA Location:** `src/browser/CdpCaptureEvents.ts`

**What it does:**
- Intercepts all DOM events
- Captures event handlers
- Records interaction flows

**Port to Farzi:** `src/capture/BehaviorCapture.ts`
```typescript
export class BehaviorCapture {
  async captureEvents(page: Page): Promise<EventMap> {
    const events: Event[] = [];

    // Inject event listeners
    await page.evaluate(() => {
      const originalAddEventListener = EventTarget.prototype.addEventListener;

      EventTarget.prototype.addEventListener = function(type, listener, options) {
        // Record this event listener
        window.__farziEvents = window.__farziEvents || [];
        window.__farziEvents.push({
          target: this,
          type,
          selector: this.tagName + (this.className ? '.' + this.className : '')
        });

        return originalAddEventListener.call(this, type, listener, options);
      };
    });

    // Extract recorded events
    const recorded = await page.evaluate(() => window.__farziEvents);
    return this.buildEventMap(recorded);
  }
}
```

### 3. Network Interception
**REA Location:** `src/browser/CdpCaptureEvents.ts` (network part)

**What it does:**
- Intercepts fetch/XHR
- Records API calls
- Captures request/response shapes

**Port to Farzi:** `src/capture/NetworkCapture.ts`
```typescript
export class NetworkCapture {
  async captureNetwork(page: Page): Promise<APIMap> {
    const requests: Request[] = [];

    // Intercept network
    await page.route('**/*', async (route) => {
      const request = route.request();

      requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        body: request.postData()
      });

      await route.continue();
    });

    // Navigate and capture
    // ...

    return this.analyzeAPIs(requests);
  }

  private analyzeAPIs(requests: Request[]): APIMap {
    // Group by endpoint
    // Infer GraphQL vs REST
    // Extract data shapes
    // Build API client spec
  }
}
```

### 4. State Management Detection
**REA Approach:** Pattern matching in source code

**Port to Farzi:** `src/analysis/StateDetector.ts`
```typescript
export class StateDetector {
  async detectPattern(modules: ModuleGraph): Promise<StatePattern> {
    // Check for Redux
    if (modules.hasImport('redux') || modules.hasImport('react-redux')) {
      return {
        type: 'redux',
        stores: await this.findReduxStores(modules),
        actions: await this.findReduxActions(modules)
      };
    }

    // Check for Zustand
    if (modules.hasImport('zustand')) {
      return {
        type: 'zustand',
        stores: await this.findZustandStores(modules)
      };
    }

    // Check for Context API
    const contexts = await this.findContextUsage(modules);
    if (contexts.length > 0) {
      return {
        type: 'context',
        contexts
      };
    }

    return { type: 'unknown' };
  }
}
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@babel/parser": "^7.24.0",
    "@babel/traverse": "^7.24.0",
    "@babel/types": "^7.24.0",
    "acorn": "^8.11.0",
    "esprima": "^4.0.1"
  }
}
```

---

## Timeline

### Week 1: Core Analysis
- Day 1-2: JavaScriptAnalyzer (module graph)
- Day 3-4: BehaviorCapture (events)
- Day 5: NetworkCapture (APIs)

### Week 2: Pattern Detection
- Day 1-2: StateDetector
- Day 3-4: ComponentAnalyzer
- Day 5: Integration testing

### Week 3: Code Generation
- Day 1-2: ComponentGenerator (with behavior)
- Day 3: StateGenerator
- Day 4: APIGenerator
- Day 5: ProjectGenerator

### Week 4: Validation & Polish
- Day 1-2: BehaviorValidator
- Day 3: Complete integration
- Day 4-5: Testing & documentation

---

## Success Criteria

✅ **Complete Analysis**
- Captures behavior (events, state, API)
- Captures design (pixels, DOM, tokens)
- No external dependencies (self-contained)

✅ **Complete Generation**
- Working components (visual + logic)
- State management setup
- API integration layer
- Production-ready code

✅ **Complete Validation**
- Behavioral parity (interactions work)
- Visual accuracy (99.5%+ similarity)
- Both validated together

**Result: Farzi as complete standalone replication tool** 🎯
