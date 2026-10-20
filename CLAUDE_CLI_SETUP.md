# Farzi Setup for Claude CLI

This guide shows how to set up Farzi with Claude CLI (not Claude Desktop).

## Installation

### 1. Build Farzi MCP Server

```bash
cd /Users/grandimam/Workspace/taraqqi/farzi
npm install
npm run build
```

This creates `dist/mcp-server.js`.

### 2. Install Farzi Skill

Copy the skill to your Claude CLI skills directory:

```bash
# Create directory
mkdir -p ~/.claude/skills/farzi

# Copy skill file
cp /Users/grandimam/Workspace/taraqqi/farzi/skill/SKILL.md ~/.claude/skills/farzi/
```

Or create a symlink:

```bash
ln -s /Users/grandimam/Workspace/taraqqi/farzi/skill ~/.claude/skills/farzi
```

### 3. Register MCP Server

Edit `~/.claude/settings.json` and add Farzi to `mcpServers`:

```json
{
  "mcpServers": {
    "farzi": {
      "command": "node",
      "args": [
        "/Users/grandimam/Workspace/taraqqi/farzi/dist/mcp-server.js"
      ],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-... (optional)"
      }
    }
  }
}
```

**Note:** Use absolute path to `mcp-server.js`, not relative.

### 4. Restart Claude CLI

Exit and restart your Claude CLI session to load the new server.

## Verification

Check if Farzi is available:

```
You: What Farzi tools do you have?
```

Expected response:
```
I have access to Farzi with these 5 tools:
- farzi_replicate
- farzi_extract_design
- farzi_analyze
- farzi_extract_component
- farzi_validate
```

## Usage

### Clone an App
```
Clone https://linear.app to ./my-clone
```

### Extract Design Tokens
```
What design tokens does Stripe use?
```

### Analyze Tech Stack
```
Analyze the architecture of GitHub's PR page
```

### Extract Component
```
Extract the pricing card from Vercel
```

### Validate Replica
```
Validate ./my-clone against the original
```

## Troubleshooting

### "Farzi tools not available"

**Check if server exists:**
```bash
ls -la /Users/grandimam/Workspace/taraqqi/farzi/dist/mcp-server.js
```

**Check settings.json:**
```bash
cat ~/.claude/settings.json | jq .mcpServers.farzi
```

**Rebuild if needed:**
```bash
cd /Users/grandimam/Workspace/taraqqi/farzi
npm run build
```

**Restart CLI session completely**

### "Server crashes"

**Test server manually:**
```bash
node /Users/grandimam/Workspace/taraqqi/farzi/dist/mcp-server.js
```

Should see:
```
Farzi MCP Server running on stdio
Environment: Pixel+DOM only
```

Press Ctrl+C to exit.

### "Module not found errors"

**Install dependencies:**
```bash
cd /Users/grandimam/Workspace/taraqqi/farzi
npm install
```

## Claude CLI vs Claude Desktop

| Feature | Claude CLI | Claude Desktop |
|---------|------------|----------------|
| Config location | `~/.claude/settings.json` | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Skill support | ✅ Yes (`~/.claude/skills/`) | ❌ No |
| MCP servers | ✅ Yes (`mcpServers` in settings) | ✅ Yes (separate config) |
| How to use | Talk naturally in terminal | Talk naturally in app |

This guide is for **Claude CLI**. For Claude Desktop, see [MCP_SETUP.md](./MCP_SETUP.md).

## Current Setup

Your current Farzi installation:

```
Location: /Users/grandimam/Workspace/taraqqi/farzi
Server:   /Users/grandimam/Workspace/taraqqi/farzi/dist/mcp-server.js
Skill:    ~/.claude/skills/farzi/SKILL.md
Config:   ~/.claude/settings.json (mcpServers.farzi)
```

## Next Steps

1. ✅ Skill installed: `~/.claude/skills/farzi/SKILL.md`
2. ✅ MCP server registered: `~/.claude/settings.json`
3. ⏳ **Restart your Claude CLI session**
4. ✅ Test: Ask "What Farzi tools do you have?"
5. ✅ Use: "Clone https://linear.app to ./my-clone"

You're ready to use Farzi! 🎯
