# Farzi MCP Server Setup

Farzi is a Model Context Protocol (MCP) server that provides pixel-perfect web application replication capabilities to Claude and other MCP clients.

## Installation

```bash
git clone https://github.com/grandimam/farzi.git
cd farzi
npm install
npm run build
```

## Configuration

### Claude Desktop

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "farzi": {
      "command": "node",
      "args": ["/absolute/path/to/farzi/dist/mcp-server.js"],
      "env": {
        "ANTHROPIC_API_KEY": "your-api-key-here-optional"
      }
    }
  }
}
```

**Note:** The `ANTHROPIC_API_KEY` is optional. Farzi works without it using pixel scanning + DOM analysis. With the key, it uses Claude Vision for enhanced semantic understanding.

### Other MCP Clients

For other MCP clients, use:
- **Command**: `node /absolute/path/to/farzi/dist/mcp-server.js`
- **Transport**: stdio

## Available Tools

Once configured, Claude can use these Farzi tools:

### 1. `farzi_replicate`
Replicate a complete web application with pixel-perfect accuracy.

**Parameters:**
- `url` (required): URL of the web application
- `output` (required): Output directory path
- `framework` (optional): 'react' | 'vue' | 'svelte' (default: 'react')
- `validate` (optional): Whether to validate (default: true)
- `similarityTarget` (optional): Target similarity % (default: 99.5)

**Example:**
```
Claude, use farzi_replicate to clone https://linear.app to ./my-replica
```

### 2. `farzi_extract_design`
Extract design tokens without generating code.

**Parameters:**
- `url` (required): URL to analyze

**Example:**
```
Claude, use farzi_extract_design on https://stripe.com to get their design system
```

### 3. `farzi_analyze`
Perform complete technical analysis (modules, state, APIs, behavior, design).

**Parameters:**
- `url` (required): URL to analyze

**Example:**
```
Claude, use farzi_analyze on https://github.com to understand their tech stack
```

### 4. `farzi_extract_component`
Extract a single component from a page.

**Parameters:**
- `url` (required): Page URL
- `selector` (required): CSS selector
- `framework` (optional): 'react' | 'vue' | 'svelte'

**Example:**
```
Claude, use farzi_extract_component from https://stripe.com with selector ".pricing-card"
```

### 5. `farzi_validate`
Validate a replica against the original.

**Parameters:**
- `originalUrl` (required): Original application URL
- `replicaPath` (required): Replica path or URL
- `similarityTarget` (optional): Target similarity %

**Example:**
```
Claude, use farzi_validate to compare https://linear.app with ./my-replica
```

## What Farzi Does

1. **Captures** everything:
   - Multi-DPI screenshots (1x, 2x, 4x)
   - DOM structure and computed styles
   - JavaScript modules and dependencies
   - Event listeners and interactions
   - Network requests (REST, GraphQL, WebSocket)

2. **Analyzes** completely:
   - Framework detection (React, Vue, Svelte)
   - State management (Redux, Zustand, Context, MobX, Jotai, Recoil)
   - Component structure and props
   - Design tokens (colors, spacing, typography)
   - API endpoints and types

3. **Generates** production code:
   - Complete project structure
   - Components with behavior
   - State management setup
   - Type-safe API clients
   - Design system (Tailwind config)
   - Package.json with dependencies

4. **Validates** accuracy:
   - Pixel-by-pixel comparison (99.5%+ target)
   - Interaction testing
   - Behavioral parity verification

## Usage Examples

### Simple Replication
```
User: Clone https://linear.app to ./my-linear-clone
Claude: [Uses farzi_replicate]
```

### Design System Extraction
```
User: What design tokens does Stripe use?
Claude: [Uses farzi_extract_design on stripe.com]
```

### Technical Analysis
```
User: Analyze the architecture of GitHub's UI
Claude: [Uses farzi_analyze]
```

### Component Library Building
```
User: Extract all buttons from https://vercel.com
Claude: [Multiple farzi_extract_component calls]
```

## Requirements

- Node.js 18+
- Playwright browsers (installed automatically)
- (Optional) Anthropic API key for AI enhancement

## How It Works

**Without AI (default):**
- Pixel scanning for exact colors
- DOM inspection for computed styles
- JavaScript AST parsing for behavior
- Pattern matching for state management

**With AI (ANTHROPIC_API_KEY set):**
- All of the above, plus:
- Claude Vision for semantic understanding
- Enhanced component recognition
- Better design system inference

## Troubleshooting

**Server not appearing in Claude:**
- Check the path is absolute in config
- Run `npm run build` to ensure dist/ exists
- Restart Claude Desktop after config changes

**Validation failing:**
- Some dynamic content may differ
- Try lowering `similarityTarget` to 95-98%
- Check console for specific errors

**Browser errors:**
- Run `npx playwright install` to install browsers
- Some sites may block automation (Cloudflare, etc.)

## Development

```bash
npm run dev       # Watch mode for development
npm run build     # Build for production
npm test          # Run tests
```

## Architecture

Farzi is self-contained with no external dependencies on other reverse engineering tools. It implements:

- **Capture Layer**: Multi-zoom screenshots, DOM styles, behavior, network
- **Analysis Layer**: JavaScript, pixels, spacing, vision, state
- **Extraction Layer**: Design tokens, complete analysis
- **Generation Layer**: Components, state, APIs, projects
- **Validation Layer**: Pixel-diff, behavior testing

## Support

Issues: https://github.com/grandimam/farzi/issues

## License

MIT
