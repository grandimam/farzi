/**
 * DOM and Computed Style Capture
 *
 * Extracts actual computed styles from the browser (no AI needed)
 */

import type { Page } from 'playwright';

export interface ComputedStyles {
  selector: string;
  styles: {
    color: string;
    backgroundColor: string;
    fontSize: string;
    fontFamily: string;
    fontWeight: string;
    lineHeight: string;
    padding: string;
    margin: string;
    borderRadius: string;
    boxShadow: string;
    width: string;
    height: string;
    display: string;
    [key: string]: string;
  };
}

export class DOMStyleCapture {
  /**
   * Capture computed styles for all elements
   */
  async captureComputedStyles(page: Page): Promise<ComputedStyles[]> {
    return await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const results: any[] = [];

      elements.forEach((element, index) => {
        // Skip hidden elements
        if (element.offsetParent === null) return;

        const computed = window.getComputedStyle(element);
        const selector = this.generateSelector(element, index);

        results.push({
          selector,
          styles: {
            // Colors
            color: computed.color,
            backgroundColor: computed.backgroundColor,

            // Typography
            fontSize: computed.fontSize,
            fontFamily: computed.fontFamily,
            fontWeight: computed.fontWeight,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing,

            // Spacing
            padding: computed.padding,
            paddingTop: computed.paddingTop,
            paddingRight: computed.paddingRight,
            paddingBottom: computed.paddingBottom,
            paddingLeft: computed.paddingLeft,
            margin: computed.margin,
            marginTop: computed.marginTop,
            marginRight: computed.marginRight,
            marginBottom: computed.marginBottom,
            marginLeft: computed.marginLeft,

            // Visual
            borderRadius: computed.borderRadius,
            boxShadow: computed.boxShadow,
            border: computed.border,

            // Layout
            width: computed.width,
            height: computed.height,
            display: computed.display,
            position: computed.position,

            // Transform
            transform: computed.transform
          }
        });
      });

      return results;
    });
  }

  /**
   * Extract all unique colors from computed styles
   */
  async extractColorsFromDOM(page: Page): Promise<Map<string, number>> {
    return await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const colors = new Map<string, number>();

      elements.forEach(element => {
        if (element.offsetParent === null) return;

        const computed = window.getComputedStyle(element);

        // Color
        const color = computed.color;
        if (color && color !== 'rgba(0, 0, 0, 0)') {
          colors.set(color, (colors.get(color) || 0) + 1);
        }

        // Background
        const bg = computed.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)') {
          colors.set(bg, (colors.get(bg) || 0) + 1);
        }

        // Border
        const borderColor = computed.borderColor;
        if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)') {
          colors.set(borderColor, (colors.get(borderColor) || 0) + 1);
        }
      });

      return Array.from(colors.entries());
    }).then(entries => new Map(entries));
  }

  /**
   * Extract all unique spacing values
   */
  async extractSpacingFromDOM(page: Page): Promise<number[]> {
    return await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const spacings = new Set<number>();

      elements.forEach(element => {
        if (element.offsetParent === null) return;

        const computed = window.getComputedStyle(element);

        // Parse pixel values
        const parsePx = (value: string): number | null => {
          const match = value.match(/^([\d.]+)px$/);
          return match ? parseFloat(match[1]) : null;
        };

        // Padding
        [computed.paddingTop, computed.paddingRight, computed.paddingBottom, computed.paddingLeft]
          .forEach(value => {
            const px = parsePx(value);
            if (px !== null && px > 0) spacings.add(px);
          });

        // Margin
        [computed.marginTop, computed.marginRight, computed.marginBottom, computed.marginLeft]
          .forEach(value => {
            const px = parsePx(value);
            if (px !== null && px > 0) spacings.add(px);
          });

        // Gap
        const gap = parsePx(computed.gap);
        if (gap !== null && gap > 0) spacings.add(gap);
      });

      return Array.from(spacings).sort((a, b) => a - b);
    });
  }

  /**
   * Extract typography information
   */
  async extractTypographyFromDOM(page: Page): Promise<{
    families: Set<string>;
    sizes: Set<number>;
    weights: Set<number>;
    lineHeights: Set<number>;
  }> {
    return await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const families = new Set<string>();
      const sizes = new Set<number>();
      const weights = new Set<number>();
      const lineHeights = new Set<number>();

      elements.forEach(element => {
        if (element.offsetParent === null) return;

        const computed = window.getComputedStyle(element);

        // Font family
        if (computed.fontFamily) {
          families.add(computed.fontFamily);
        }

        // Font size
        const fontSize = parseFloat(computed.fontSize);
        if (!isNaN(fontSize)) {
          sizes.add(Math.round(fontSize));
        }

        // Font weight
        const fontWeight = parseInt(computed.fontWeight);
        if (!isNaN(fontWeight)) {
          weights.add(fontWeight);
        }

        // Line height
        const lineHeight = parseFloat(computed.lineHeight);
        if (!isNaN(lineHeight)) {
          lineHeights.add(Math.round(lineHeight));
        }
      });

      return {
        families: Array.from(families),
        sizes: Array.from(sizes).sort((a, b) => a - b),
        weights: Array.from(weights).sort((a, b) => a - b),
        lineHeights: Array.from(lineHeights).sort((a, b) => a - b)
      };
    }).then(result => ({
      families: new Set(result.families),
      sizes: new Set(result.sizes),
      weights: new Set(result.weights),
      lineHeights: new Set(result.lineHeights)
    }));
  }

  /**
   * Generate a unique selector for an element
   */
  private generateSelector(element: Element, fallbackIndex: number): string {
    // Use ID if available
    if (element.id) {
      return `#${element.id}`;
    }

    // Use class if available
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        return `${element.tagName.toLowerCase()}.${classes[0]}`;
      }
    }

    // Use data attributes
    const dataAttrs = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-'));
    if (dataAttrs.length > 0) {
      return `${element.tagName.toLowerCase()}[${dataAttrs[0].name}="${dataAttrs[0].value}"]`;
    }

    // Fallback to tag + index
    return `${element.tagName.toLowerCase()}:nth-of-type(${fallbackIndex})`;
  }
}
