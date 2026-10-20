/**
 * Multi-zoom screenshot capture
 *
 * Captures screenshots at different zoom levels for precision
 */

import { chromium, Browser, Page } from 'playwright';
import type { CaptureSet, BoundingBox } from '../types';

export class MultiZoomCapture {
  private browser?: Browser;

  async init(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true
      });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = undefined;
    }
  }

  /**
   * Capture URL at multiple zoom levels
   */
  async captureUrl(url: string): Promise<CaptureSet> {
    await this.init();

    const captures: CaptureSet = {
      standard: {},
      retina: {},
      ultra: { elements: [] }
    };

    // 100% zoom - Full page layout
    const page100 = await this.browser!.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    await page100.goto(url, { waitUntil: 'networkidle' });
    captures.standard.fullPage = await page100.screenshot({
      fullPage: true,
      type: 'png'
    });

    // 200% zoom - Component details (Retina)
    const page200 = await this.browser!.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2
    });
    await page200.goto(url, { waitUntil: 'networkidle' });
    captures.retina.fullPage = await page200.screenshot({
      fullPage: true,
      type: 'png'
    });

    // 400% zoom - Ultra-precise individual elements
    const page400 = await this.browser!.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 4
    });
    await page400.goto(url, { waitUntil: 'networkidle' });

    // Capture individual elements
    const selectors = [
      'button',
      'input',
      'a',
      '[class*="card"]',
      '[class*="button"]',
      '[data-component]'
    ];

    for (const selector of selectors) {
      const elements = await page400.$$(selector);
      for (const element of elements.slice(0, 10)) { // Limit to first 10 of each type
        try {
          const screenshot = await element.screenshot({ type: 'png' });
          const boundingBox = await element.boundingBox();

          captures.ultra.elements!.push({
            screenshot,
            boundingBox,
            selector
          });
        } catch (e) {
          // Element might not be visible, skip it
        }
      }
    }

    await page100.close();
    await page200.close();
    await page400.close();

    return captures;
  }

  /**
   * Capture a specific element
   */
  async captureElement(url: string, selector: string): Promise<CaptureSet> {
    await this.init();

    const captures: CaptureSet = {
      standard: {},
      retina: {},
      ultra: { elements: [] }
    };

    const page = await this.browser!.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2
    });

    await page.goto(url, { waitUntil: 'networkidle' });

    const element = await page.$(selector);
    if (element) {
      const screenshot = await element.screenshot({ type: 'png' });
      const boundingBox = await element.boundingBox();

      captures.retina.components = [screenshot];
      captures.ultra.elements = [{
        screenshot,
        boundingBox,
        selector
      }];
    }

    await page.close();

    return captures;
  }

  /**
   * Capture with state variations (hover, active, etc.)
   */
  async captureWithStates(
    url: string,
    selector: string
  ): Promise<Record<string, Buffer>> {
    await this.init();

    const page = await this.browser!.newPage({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 2
    });

    await page.goto(url, { waitUntil: 'networkidle' });

    const element = await page.$(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    const states: Record<string, Buffer> = {};

    // Default state
    states.default = await element.screenshot({ type: 'png' });

    // Hover state
    await element.hover();
    await page.waitForTimeout(100); // Wait for transition
    states.hover = await element.screenshot({ type: 'png' });

    // Active state (mouse down)
    await page.mouse.down();
    await page.waitForTimeout(100);
    states.active = await element.screenshot({ type: 'png' });
    await page.mouse.up();

    // Focus state
    await element.focus();
    await page.waitForTimeout(100);
    states.focus = await element.screenshot({ type: 'png' });

    await page.close();

    return states;
  }
}
