---
name: farzi
description: Pixel-perfect web application replication via MCP. Clone complete apps with behavior analysis (JavaScript, state, APIs) and design extraction (pixel-perfect tokens). Generates production-ready React/Vue/Svelte code.
metadata:
  version: "0.1.0"
  tool_count: 5
---

# Farzi

Use Farzi to replicate web applications with complete behavior understanding and pixel-perfect design extraction. Unlike screenshot-to-code tools, Farzi analyzes JavaScript modules, state management patterns, API endpoints, and extracts exact design tokens to generate production-ready code.

## Connect only when needed

Installing this skill supplies instructions; it does not register the Farzi MCP server or add tools to an already-running agent.

If Farzi tools are available, proceed directly to the replication task. Do not run diagnostics before every use.

If tools are absent or a call is blocked, the server needs to be registered:

1. **Verify the server exists:**
   ```bash
   ls -la /Users/grandimam/Workspace/taraqqi/farzi/dist/mcp-server.js
   ```
   If missing, build it:
   ```bash
   cd /Users/grandimam/Workspace/taraqqi/farzi
   npm install
   npm run build
   ```

2. **Register with Claude CLI:**
   Edit `~/.claude/settings.json` and add to `mcpServers`:
   ```json
   {
     "mcpServers": {
       "farzi": {
         "command": "node",
         "args": ["/Users/grandimam/Workspace/taraqqi/farzi/dist/mcp-server.js"],
         "env": {
           "ANTHROPIC_API_KEY": "optional-for-vision-enhancement"
         }
       }
     }
   }
   ```

3. **Restart the CLI session** to load the new server.

## Available Tools

Farzi provides 5 MCP tools:

### `farzi_replicate`
Complete application replication with code generation.

**Parameters:**
- `url` (required): URL of the web application to replicate
- `output` (required): Output directory path (absolute or relative)
- `framework` (optional): 'react' | 'vue' | 'svelte' (default: 'react')
- `validate` (optional): Whether to validate after generation (default: true)
- `similarityTarget` (optional): Target similarity percentage (default: 99.5)

**Use when:** User wants to clone an entire application

**Example:**
```
User: Clone https://linear.app to ./my-clone
```

### `farzi_extract_design`
Extract design tokens without generating code.

**Parameters:**
- `url` (required): URL to analyze

**Returns:**
- Colors (exact hex from pixel scanning)
- Spacing system (base unit, scale)
- Typography (families, sizes, weights)
- Component variants detected

**Use when:** User wants just the design system or tokens

**Example:**
```
User: What design tokens does Stripe use?
User: Extract the color palette from https://vercel.com
```

### `farzi_analyze`
Complete technical analysis: modules, state, APIs, behavior, design.

**Parameters:**
- `url` (required): URL to analyze

**Returns:**
- Framework detected (React/Vue/Svelte)
- State management type (Redux, Zustand, Context, MobX, etc.)
- Module count and component count
- API endpoints (REST, GraphQL, WebSocket)
- Event listeners and interactions
- Design token summary

**Use when:** User wants to understand how an app is built

**Example:**
```
User: Analyze the tech stack of https://github.com
User: How does Notion implement their editor?
```

### `farzi_extract_component`
Extract a single component from a page.

**Parameters:**
- `url` (required): Page URL
- `selector` (required): CSS selector identifying the component
- `framework` (optional): 'react' | 'vue' | 'svelte' (default: 'react')

**Returns:**
- Generated component code
- Component-specific design tokens
- Detected variants and states

**Use when:** User wants to extract a specific UI element

**Example:**
```
User: Extract the pricing card from Stripe's homepage
User: Get the navbar from https://vercel.com
```

### `farzi_validate`
Validate a replica against the original.

**Parameters:**
- `originalUrl` (required): Original application URL
- `replicaPath` (required): Path to replica or URL
- `similarityTarget` (optional): Target similarity % (default: 99.5)

**Returns:**
- Visual similarity percentage
- Pixel-level differences
- Behavior test results

**Use when:** User wants to verify replication accuracy

**Example:**
```
User: Validate my Linear clone
User: Check if ./my-clone matches the original
```

## How Farzi Works

### Without AI (Default)
- **Pixel scanning:** Exact hex colors from bitmap data
- **DOM inspection:** Computed styles via browser APIs
- **JavaScript parsing:** AST analysis with Babel
- **Pattern matching:** State management detection

### With AI (ANTHROPIC_API_KEY set)
All of the above, plus:
- **Claude Vision:** Enhanced semantic understanding
- **Better inference:** Improved component recognition

## Workflow Patterns

### Complete Replication
```
User: Clone https://linear.app to ./my-clone

Process:
1. Capture screenshots at 1x, 2x, 4x DPI
2. Analyze JavaScript modules and state
3. Extract design tokens from pixels + DOM
4. Generate complete React project
5. Validate 99.5%+ similarity

Output:
./my-clone/
├── src/
│   ├── components/      # UI components
│   ├── design-system/   # Tokens + primitives
│   ├── store/           # State management
│   ├── api/             # API clients
│   └── pages/           # Page components
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

### Design System Extraction
```
User: What design tokens does Stripe use?

Process:
1. Load Stripe's page
2. Scan all pixels for colors
3. Extract spacing from whitespace
4. Capture typography from DOM

Returns:
- Primary colors with usage counts
- Spacing scale (base unit + values)
- Font families, sizes, weights
```

### Tech Stack Analysis
```
User: Analyze GitHub's pull request page

Process:
1. Capture all JavaScript modules
2. Detect framework and state pattern
3. Intercept API calls
4. Record event listeners

Returns:
- Framework: React
- State: Redux (12 stores)
- APIs: 8 REST endpoints, 2 GraphQL
- Behavior: 234 event listeners
```

### Component Library Building
```
User: Extract all button variants from Vercel

Process:
1. Find all <button> elements
2. Extract each variant's styles
3. Detect states (hover, active, disabled)
4. Consolidate into unified component

Returns:
- Unified Button component
- All variants as props
- Complete design tokens
```

## What Gets Generated

### Design Tokens
```typescript
// Exact from pixel scanning
export const colors = {
  primary: { 500: '#5E6AD2', 600: '#4C5FD5' },
  neutral: { 100: '#F2F5F7', 900: '#17191C' }
};
```

### Components with Behavior
```typescript
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  onClick,
  ...props
}) => {
  return (
    <button
      className={cn(
        'px-6 py-3 rounded-lg',
        variant === 'primary' && 'bg-primary-500'
      )}
      onClick={onClick}
      {...props}
    />
  );
};
```

### State Management
```typescript
// If Redux detected
export const store = configureStore({
  reducer: { items: itemsReducer }
});
```

### API Clients
```typescript
export const api = {
  getItems: () => apiClient.get<ItemsResponse>('/api/items'),
  createItem: (data) => apiClient.post<Item>('/api/items', data)
};
```

## Limitations

**Currently supports:**
- ✅ Web applications (any URL)
- ✅ Single-page apps (SPAs)
- ✅ Server-rendered sites

**Does not support:**
- ❌ Native desktop apps
- ❌ Mobile apps (iOS/Android)
- ❌ Electron/Tauri packages
- ❌ Browser extensions
- ❌ Native binaries

For native applications, use the REA skill instead.

## Best Practices

### 1. Start with Analysis
Before replicating, understand what you're building:
```
User: Analyze https://linear.app first
[Review framework, state, APIs]
User: Now replicate it to ./my-clone
```

### 2. Extract Incrementally
For large apps, extract components one by one:
```
User: Extract the sidebar from Linear
User: Extract the issue card component
User: Now combine them into a project
```

### 3. Validate Early
Check accuracy during development:
```
User: Clone Linear to ./clone
User: Validate ./clone against Linear
[Fix differences if needed]
```

### 4. Use Specific Selectors
For component extraction, use precise CSS selectors:
```
✅ selector: ".pricing-card.featured"
❌ selector: "div"
```

### 5. Specify Framework
Always specify the target framework:
```
User: Clone Notion to React (not Vue)
```

## Common Workflows

### Migration Project
```
User: I need to migrate our Vue app to React
1. Analyze the Vue app structure
2. Replicate with framework: 'react'
3. Validate the migration
```

### Competitive Analysis
```
User: How does Stripe build their pricing page?
1. Analyze the tech stack
2. Extract key components
3. Study the patterns used
```

### Component Library
```
User: Build a component library from Vercel
1. Extract all button variants
2. Extract input components
3. Extract card components
4. Consolidate into unified library
```

### Rapid Prototyping
```
User: Clone Excalidraw as a starting point
1. Replicate the base structure
2. Modify for our specific needs
3. Add custom business logic
```

## Troubleshooting

### Server Not Available
```bash
# Check if server exists
ls -la ~/Workspace/taraqqi/farzi/dist/mcp-server.js

# Rebuild if needed
cd ~/Workspace/taraqqi/farzi
npm run build

# Verify settings.json has mcpServers.farzi
cat ~/.claude/settings.json | grep -A 5 farzi
```

### Validation Failing
- Some dynamic content may differ
- Try lowering `similarityTarget` to 95-98%
- Check console for specific errors

### Browser Automation Errors
- Run `npx playwright install` to install browsers
- Some sites block automation (Cloudflare, etc.)

## Architecture

Farzi is self-contained with no dependencies on REA or other tools:

**Capture Layer:**
- Multi-DPI screenshots
- DOM computed styles
- JavaScript module capture
- Event listener interception
- Network request capture

**Analysis Layer:**
- JavaScript AST parsing (Babel)
- Pixel color extraction (Jimp)
- Spacing detection
- Vision analysis (optional)
- State pattern detection

**Generation Layer:**
- Component generation
- State management setup
- API client generation
- Complete project scaffolding

**Validation Layer:**
- Pixel-diff comparison
- Behavior testing

## Version

Current version: 0.1.0

Repository: https://github.com/grandimam/farzi
