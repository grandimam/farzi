#!/usr/bin/env node
/**
 * Farzi MCP Server
 *
 * Exposes Farzi replication capabilities via Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { Farzi } from './Farzi';
import * as path from 'path';
import * as fs from 'fs/promises';

// MCP Server
const server = new Server(
  {
    name: 'farzi',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Global Farzi instance
let farziInstance: Farzi | null = null;

// Tool definitions
const tools: Tool[] = [
  {
    name: 'farzi_replicate',
    description: 'Replicate a complete web application with pixel-perfect accuracy. Captures screenshots, analyzes behavior, extracts design tokens, and generates production-ready code in React/Vue/Svelte.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the web application to replicate',
        },
        output: {
          type: 'string',
          description: 'Output directory path (absolute or relative)',
        },
        framework: {
          type: 'string',
          enum: ['react', 'vue', 'svelte'],
          description: 'Framework to generate code for',
          default: 'react',
        },
        validate: {
          type: 'boolean',
          description: 'Whether to validate the replica after generation',
          default: true,
        },
        similarityTarget: {
          type: 'number',
          description: 'Target similarity percentage for validation (0-100)',
          default: 99.5,
        },
      },
      required: ['url', 'output'],
    },
  },
  {
    name: 'farzi_extract_design',
    description: 'Extract design tokens (colors, spacing, typography) from a web application without generating code. Returns a complete design system analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the web application to analyze',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'farzi_analyze',
    description: 'Perform complete analysis of a web application including JavaScript modules, state management, API endpoints, behavior patterns, and design tokens. Returns comprehensive technical analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the web application to analyze',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'farzi_extract_component',
    description: 'Extract a single component from a web page using a CSS selector. Generates component code and its design tokens.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the page containing the component',
        },
        selector: {
          type: 'string',
          description: 'CSS selector to identify the component',
        },
        framework: {
          type: 'string',
          enum: ['react', 'vue', 'svelte'],
          description: 'Framework to generate component code for',
          default: 'react',
        },
      },
      required: ['url', 'selector'],
    },
  },
  {
    name: 'farzi_validate',
    description: 'Validate a replica against the original by comparing screenshots and behavior. Returns similarity scores and detailed comparison.',
    inputSchema: {
      type: 'object',
      properties: {
        originalUrl: {
          type: 'string',
          description: 'URL of the original application',
        },
        replicaPath: {
          type: 'string',
          description: 'Path to the replica (can be local file path or URL)',
        },
        similarityTarget: {
          type: 'number',
          description: 'Target similarity percentage (0-100)',
          default: 99.5,
        },
      },
      required: ['originalUrl', 'replicaPath'],
    },
  },
];

// Initialize Farzi instance
function getFarziInstance(): Farzi {
  if (!farziInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    farziInstance = new Farzi(apiKey);
  }
  return farziInstance;
}

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const farzi = getFarziInstance();

    switch (name) {
      case 'farzi_replicate': {
        const { url, output, framework = 'react', validate = true, similarityTarget = 99.5 } = args as any;

        const outputPath = path.resolve(output);

        await farzi.replicate({
          url,
          output: outputPath,
          framework,
          validate,
          similarityTarget,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Application replicated successfully',
                output: outputPath,
                framework,
                validated: validate,
              }, null, 2),
            },
          ],
        };
      }

      case 'farzi_extract_design': {
        const { url } = args as any;

        const result = await farzi.extractDesign(url);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                tokens: result.tokens,
                timestamp: result.timestamp,
                summary: {
                  colors: result.tokens.colors.all.length,
                  spacing: result.tokens.spacing.scale.length,
                  typography: result.tokens.typography.families.length,
                  components: result.tokens.components.length,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'farzi_analyze': {
        const { url } = args as any;

        const analysis = await farzi.extract(url);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                analysis: {
                  modules: {
                    framework: analysis.modules.framework,
                    moduleCount: analysis.modules.modules.size,
                    componentCount: Array.from(analysis.modules.modules.values())
                      .reduce((sum, m) => sum + m.components.length, 0),
                  },
                  state: {
                    type: analysis.state.type,
                    storeCount: analysis.state.stores.length,
                  },
                  network: {
                    endpointCount: analysis.network.endpoints.length,
                    endpoints: analysis.network.endpoints,
                    graphqlQueries: analysis.network.graphql,
                  },
                  behavior: {
                    eventListenerCount: analysis.behavior.eventListeners.length,
                    interactionCount: analysis.behavior.interactions.length,
                  },
                  design: {
                    colorCount: analysis.design.colors.all.length,
                    spacingScale: analysis.design.spacing.scale,
                    typography: analysis.design.typography.families,
                  },
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'farzi_extract_component': {
        const { url, selector, framework = 'react' } = args as any;

        const { code, tokens } = await farzi.extractComponent(url, selector);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                component: {
                  code,
                  framework,
                  tokens,
                  selector,
                },
              }, null, 2),
            },
          ],
        };
      }

      case 'farzi_validate': {
        const { originalUrl, replicaPath, similarityTarget = 99.5 } = args as any;

        // Capture original
        const capture = farzi['capture'];
        const originalCaptures = await capture.captureUrl(originalUrl);

        // Validate
        const validator = farzi['pixelValidator'];
        const behaviorValidator = farzi['behaviorValidator'];

        const replicaCaptures = await capture.captureUrl(
          replicaPath.startsWith('http') ? replicaPath : `file://${path.resolve(replicaPath)}/index.html`
        );

        const comparison = await validator.compare(
          originalCaptures.standard.fullPage!,
          replicaCaptures.standard.fullPage!,
          10,
          similarityTarget
        );

        const behaviorPassed = await behaviorValidator.validateInteractions(
          originalUrl,
          replicaPath.startsWith('http') ? replicaPath : `file://${path.resolve(replicaPath)}/index.html`
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                validation: {
                  similarity: comparison.similarity,
                  passed: comparison.passed && behaviorPassed,
                  visualPassed: comparison.passed,
                  behaviorPassed,
                  differentPixels: comparison.differentPixels,
                  totalPixels: comparison.totalPixels,
                  differenceCount: comparison.differences.length,
                  targetSimilarity: similarityTarget,
                },
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: errorMessage,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with MCP communication
  console.error('Farzi MCP Server running on stdio');
  console.error('Environment:', process.env.ANTHROPIC_API_KEY ? 'AI-enhanced' : 'Pixel+DOM only');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
