/**
 * AI Vision-based design analysis
 *
 * Uses Claude Vision to understand design semantics
 */

import Anthropic from '@anthropic-ai/sdk';
import type { DesignTokens, Typography, SpacingSystem } from '../types';

export class VisionAnalyzer {
  private claude: Anthropic;

  constructor(apiKey?: string) {
    this.claude = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Analyze screenshot to extract complete design system
   */
  async analyzeDesignSystem(screenshot: Buffer): Promise<Partial<DesignTokens>> {
    const base64 = screenshot.toString('base64');

    const response = await this.claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: base64
            }
          },
          {
            type: "text",
            text: `Analyze this screenshot and extract the design system as JSON:

{
  "colors": {
    "primary": ["#hex1", "#hex2"],
    "secondary": ["#hex3"],
    "neutral": ["#hex4", "#hex5", "#hex6"],
    "semantic": {
      "success": "#hex7",
      "error": "#hex8",
      "warning": "#hex9"
    }
  },
  "spacing": {
    "baseUnit": 4,
    "scale": [4, 8, 12, 16, 24, 32, 48, 64]
  },
  "typography": {
    "families": ["Inter", "sans-serif"],
    "sizes": [12, 14, 16, 18, 20, 24, 32],
    "weights": [400, 500, 600, 700]
  },
  "components": [
    {"type": "button", "variants": ["primary", "secondary"]},
    {"type": "input"},
    {"type": "card"}
  ]
}

Return ONLY valid JSON, no markdown formatting.`
          }
        ]
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return this.parseDesignSystemResponse(content.text);
  }

  /**
   * Analyze spacing specifically
   */
  async analyzeSpacing(screenshot: Buffer): Promise<SpacingSystem> {
    const base64 = screenshot.toString('base64');

    const response = await this.claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: base64
            }
          },
          {
            type: "text",
            text: `Analyze the spacing in this design:

1. Measure gaps between elements (in pixels)
2. Identify the base unit (likely 4px or 8px)
3. List the spacing scale used
4. Note any padding/margin patterns

Return as JSON:
{
  "baseUnit": 4,
  "scale": [4, 8, 12, 16, 24, 32, 48, 64],
  "gaps": [8, 16, 24, 32],
  "confidence": 0.95
}

Return ONLY valid JSON.`
          }
        ]
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return this.parseSpacingResponse(content.text);
  }

  /**
   * Parse design system response
   */
  private parseDesignSystemResponse(text: string): Partial<DesignTokens> {
    try {
      // Remove markdown code blocks if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        colors: parsed.colors ? {
          primary: parsed.colors.primary?.map((hex: string) => ({
            primary: { hex, rgb: this.hexToRgb(hex), count: 0, locations: [] },
            colors: [],
            totalCount: 0
          })) || [],
          neutral: parsed.colors.neutral?.map((hex: string) => ({
            primary: { hex, rgb: this.hexToRgb(hex), count: 0, locations: [] },
            colors: [],
            totalCount: 0
          })) || [],
          semantic: {
            success: parsed.colors.semantic?.success ? [{
              primary: { hex: parsed.colors.semantic.success, rgb: this.hexToRgb(parsed.colors.semantic.success), count: 0, locations: [] },
              colors: [],
              totalCount: 0
            }] : [],
            error: parsed.colors.semantic?.error ? [{
              primary: { hex: parsed.colors.semantic.error, rgb: this.hexToRgb(parsed.colors.semantic.error), count: 0, locations: [] },
              colors: [],
              totalCount: 0
            }] : [],
            warning: parsed.colors.semantic?.warning ? [{
              primary: { hex: parsed.colors.semantic.warning, rgb: this.hexToRgb(parsed.colors.semantic.warning), count: 0, locations: [] },
              colors: [],
              totalCount: 0
            }] : [],
            info: []
          },
          all: []
        } : undefined,
        spacing: parsed.spacing,
        typography: parsed.typography,
        components: parsed.components?.map((c: any) => ({
          name: c.type,
          type: c.type,
          variants: c.variants?.map((v: string) => ({ name: v, styles: {} })) || [],
          states: []
        })) || []
      };
    } catch (e) {
      console.error('Failed to parse vision response:', text);
      throw new Error(`Failed to parse Claude response: ${e}`);
    }
  }

  /**
   * Parse spacing response
   */
  private parseSpacingResponse(text: string): SpacingSystem {
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('Failed to parse spacing response:', text);
      return {
        baseUnit: 8,
        scale: [8, 16, 24, 32, 48, 64],
        gaps: [],
        confidence: 0.5
      };
    }
  }

  /**
   * Convert hex to RGB
   */
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ]
      : [0, 0, 0];
  }
}
