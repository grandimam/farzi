# Farzi

**MCP Server for pixel-perfect application replication**

Farzi is a Model Context Protocol (MCP) server that gives Claude the ability to replicate any web application with pixel-perfect accuracy, understanding both behavior and design.

---

## What is Farzi?

**Farzi** (فرضی / फ़र्ज़ी) means "replica" in Urdu/Hindi.

It's an MCP server that enables Claude to:
1. **Analyze** how applications work (JavaScript, state, APIs, interactions)
2. **Extract** design systems (colors, spacing, typography, components)
3. **Generate** production-ready code (React, Vue, Svelte)
4. **Validate** replicas for pixel-perfect accuracy

---

## Quick Start

### 1. Install

```bash
git clone https://github.com/grandimam/farzi.git
cd farzi
npm install
npm run build
```

### 2. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "farzi": {
      "command": "node",
      "args": ["/absolute/path/to/farzi/dist/mcp-server.js"],
      "env": {
        "ANTHROPIC_API_KEY": "optional-for-ai-enhancement"
      }
    }
  }
}
```

### 3. Restart Claude Desktop

Farzi tools will now be available to Claude.

---

## Usage

Once configured, simply ask Claude:

```
Clone https://linear.app to ./my-clone
```

```
Extract the design system from https://stripe.com
```

```
Analyze the architecture of https://github.com
```

```
Extract the pricing card component from https://vercel.com
```

Claude will use Farzi's MCP tools automatically.

---

## MCP Tools

Farzi exposes 5 tools via MCP:

### `farzi_replicate`
Complete application replication with code generation.

```
farzi_replicate({
  url: "https://linear.app",
  output: "./my-replica",
  framework: "react",
  validate: true,
  similarityTarget: 99.5
})
```

### `farzi_extract_design`
Extract design tokens only (no code generation).

```
farzi_extract_design({
  url: "https://stripe.com"
})
```

### `farzi_analyze`
Complete technical analysis (modules, state, APIs, behavior).

```
farzi_analyze({
  url: "https://github.com"
})
```

### `farzi_extract_component`
Extract a single component from a page.

```
farzi_extract_component({
  url: "https://stripe.com",
  selector: ".pricing-card",
  framework: "react"
})
```

### `farzi_validate`
Validate a replica against the original.

```
farzi_validate({
  originalUrl: "https://linear.app",
  replicaPath: "./my-replica",
  similarityTarget: 99.5
})
```

---

## How It Works

### Capture Layer
- **Multi-DPI Screenshots**: 1x, 2x, 4x zoom for perfect detail
- **DOM Inspection**: Computed styles from browser APIs
- **Behavior Capture**: Event listeners, interactions, mutations
- **Network Capture**: REST APIs, GraphQL queries, WebSockets

### Analysis Layer
- **JavaScript Analyzer**: AST parsing, module graphs, component detection
- **Pixel Color Extractor**: Exact color scanning from bitmap data
- **Spacing Detector**: Whitespace analysis for spacing scale
- **Vision Analyzer** (optional): Claude Vision for semantic understanding
- **State Detector**: Redux, Zustand, Context, MobX, Jotai, Recoil

### Extraction Layer
- **Design Token Extractor**: Complete design system extraction
- **Complete Extractor**: Orchestrates all analysis

### Generation Layer
- **Component Generator**: React/Vue/Svelte components with behavior
- **State Generator**: State management setup for detected pattern
- **API Generator**: Type-safe REST/GraphQL clients
- **Project Generator**: Complete project scaffolding

### Validation Layer
- **Pixel Diff Validator**: Pixel-by-pixel comparison (99.5%+ target)
- **Behavior Validator**: Interaction testing for behavioral parity

---

## What Gets Generated

```
output/
├── src/
│   ├── components/          # Generated UI components
│   ├── design-system/
│   │   ├── tokens/          # Colors, spacing, typography
│   │   └── components/      # Design system primitives
│   ├── store/               # State management (Redux/Zustand/etc)
│   ├── api/                 # Type-safe API clients
│   └── pages/               # Page components
├── package.json             # Dependencies
├── tailwind.config.js       # Design system config
├── tsconfig.json            # TypeScript config
└── vite.config.js           # Build config
```

**Example generated code:**

```typescript
// src/design-system/tokens/colors.ts
export const colors = {
  primary: {
    500: '#5E6AD2',  // Exact from pixel scanning
    600: '#4C5FD5'
  }
};

// src/design-system/components/Button.tsx
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  onClick
}) => {
  return (
    <button
      className={cn(
        'px-6 py-3 text-base font-medium rounded-lg',
        variant === 'primary' && 'bg-primary-500 hover:bg-primary-600'
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// src/store/index.ts (if Redux detected)
export const store = configureStore({
  reducer: {
    items: itemsReducer
  }
});

// src/api/rest.ts
export const api = {
  getItems: () => apiClient.get<ItemsResponse>('/api/items'),
  createItem: (data: CreateItemRequest) =>
    apiClient.post<Item>('/api/items', data)
};
```

---

## AI Optional

Farzi works **without AI** by default:
- Pixel scanning for exact colors
- DOM inspection for computed styles
- JavaScript AST parsing for behavior
- Pattern matching for state management

With `ANTHROPIC_API_KEY`, Farzi uses Claude Vision for:
- Enhanced semantic understanding
- Better component recognition
- Improved design system inference

---

## Capabilities

| Feature | Status |
|---------|--------|
| Multi-DPI Capture | ✅ |
| JavaScript Analysis | ✅ |
| State Detection | ✅ Redux, Zustand, Context, MobX, Jotai, Recoil |
| Framework Detection | ✅ React, Vue, Svelte |
| Design Token Extraction | ✅ |
| Behavior Capture | ✅ |
| Network Analysis | ✅ REST, GraphQL, WebSocket |
| Component Generation | ✅ |
| Project Scaffolding | ✅ |
| Pixel-Diff Validation | ✅ |
| Behavior Validation | ✅ |
| Self-Contained | ✅ No external tool dependencies |
| MCP Server | ✅ Claude Desktop compatible |

---

## Use Cases

### Design System Extraction
Extract complete design systems from existing applications:
```
Claude, extract the design system from https://linear.app
```

### Rapid Prototyping
Clone applications to use as starting points:
```
Claude, clone https://excalidraw.com to ./my-drawing-app
```

### Competitive Analysis
Understand how competitors build their UIs:
```
Claude, analyze the tech stack of https://notion.so
```

### Component Libraries
Build component libraries from existing designs:
```
Claude, extract all buttons from https://stripe.com
```

### Migration Projects
Convert applications to different frameworks:
```
Clone https://old-vue-app.com to React in ./new-react-app
```

---

## Architecture Principles

### 1. Self-Contained
No dependencies on external reverse engineering tools. Everything is implemented internally.

### 2. Multi-Source Truth
Combines multiple data sources for accuracy:
- Pixel data (bitmap scanning)
- DOM data (computed styles)
- JavaScript data (AST parsing)
- Network data (request interception)
- (Optional) Vision data (Claude AI)

### 3. Behavior + Design
Unlike screenshot-to-code tools, Farzi understands:
- State management patterns
- API endpoints and data flows
- Event handlers and interactions
- Component hierarchies and props

### 4. Production-Ready Output
Generates actual working applications, not just HTML/CSS:
- Full project structure
- State management
- API integration
- Type safety
- Build configuration

---

## Requirements

- Node.js 18+
- Playwright (browsers installed automatically)
- (Optional) Anthropic API key for AI enhancement

---

## Documentation

- [MCP Setup Guide](./MCP_SETUP.md) - Detailed setup instructions
- [Architecture](./ARCHITECTURE.md) - Technical deep-dive
- [Why Farzi](./WHY_FARZI.md) - Philosophy and approach
- [Status](./STATUS.md) - Implementation status

---

## Comparison: Farzi vs Others

| Feature | Farzi | Screenshot-to-Code | Traditional RE |
|---------|-------|-------------------|----------------|
| **Visual Analysis** | ✅ Multi-DPI pixel scanning | ✅ Single screenshot | ❌ |
| **Behavior Analysis** | ✅ JavaScript + state + APIs | ❌ | ✅ |
| **Code Generation** | ✅ Full projects | ✅ HTML/CSS snippets | ❌ |
| **Framework Detection** | ✅ React, Vue, Svelte | ❌ | ❌ |
| **State Management** | ✅ All major patterns | ❌ | ❌ |
| **API Extraction** | ✅ REST + GraphQL | ❌ | ✅ |
| **Validation** | ✅ Pixel-diff + behavior | ❌ | ❌ |
| **MCP Integration** | ✅ Native | ❌ | ❌ |
| **AI Optional** | ✅ Works without AI | ❌ AI required | ✅ |

Farzi is the only tool that combines behavior understanding with pixel-perfect replication.

---

## Limitations

**Currently supports:**
- ✅ Web applications (any URL)
- ✅ Single-page apps
- ✅ Server-rendered sites

**Does not support:**
- ❌ Native desktop applications
- ❌ Mobile apps (iOS/Android)
- ❌ Electron/Tauri apps
- ❌ Browser extensions
- ❌ Native binaries

(Binary support planned for future releases)

---

## License

MIT

---

## Contributing

Issues and PRs welcome at https://github.com/grandimam/farzi

---

**Farzi: Complete application replication through MCP** 🎯
