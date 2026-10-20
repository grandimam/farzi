/**
 * Behavior Capture
 *
 * Captures all runtime behavior:
 * - Event listeners
 * - User interactions
 * - DOM mutations
 * - State changes
 */

import type { Page } from 'playwright';

export interface EventListener {
  target: string;
  type: string;
  selector: string;
  handler: string;
}

export interface Interaction {
  type: 'click' | 'hover' | 'focus' | 'input' | 'submit' | 'keypress';
  target: string;
  selector: string;
  timestamp: number;
  data?: any;
}

export interface BehaviorMap {
  eventListeners: EventListener[];
  interactions: Interaction[];
  mutations: DOMMutation[];
  stateChanges: StateChange[];
}

export interface DOMMutation {
  type: 'childList' | 'attributes' | 'characterData';
  target: string;
  timestamp: number;
}

export interface StateChange {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
}

export class BehaviorCapture {
  /**
   * Capture all behavior from a page
   */
  async capture(page: Page): Promise<BehaviorMap> {
    const eventListeners = await this.captureEventListeners(page);
    const interactions: Interaction[] = [];
    const mutations: DOMMutation[] = [];
    const stateChanges: StateChange[] = [];

    // Set up mutation observer
    await this.setupMutationObserver(page);

    // Set up state change observer
    await this.setupStateObserver(page);

    // Record interactions for a brief period
    await this.recordInteractions(page, interactions);

    // Get captured data
    const capturedMutations = await page.evaluate(() => window.__farziMutations || []);
    const capturedStateChanges = await page.evaluate(() => window.__farziStateChanges || []);

    mutations.push(...capturedMutations);
    stateChanges.push(...capturedStateChanges);

    return {
      eventListeners,
      interactions,
      mutations,
      stateChanges
    };
  }

  /**
   * Capture all event listeners
   */
  private async captureEventListeners(page: Page): Promise<EventListener[]> {
    await page.evaluate(() => {
      window.__farziEventListeners = [];

      // Intercept addEventListener
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type: string, listener: any, options?: any) {
        const target = this as Element;
        const selector = target.tagName?.toLowerCase() +
          (target.id ? '#' + target.id : '') +
          (target.className ? '.' + String(target.className).split(' ').join('.') : '');

        window.__farziEventListeners.push({
          target: target.tagName || 'unknown',
          type,
          selector,
          handler: listener.toString().substring(0, 200)
        });

        return originalAddEventListener.call(this, type, listener, options);
      };
    });

    // Wait a bit for listeners to be attached
    await page.waitForTimeout(500);

    return await page.evaluate(() => window.__farziEventListeners || []);
  }

  /**
   * Setup mutation observer
   */
  private async setupMutationObserver(page: Page): Promise<void> {
    await page.evaluate(() => {
      window.__farziMutations = [];

      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          window.__farziMutations.push({
            type: mutation.type,
            target: (mutation.target as Element).tagName || 'unknown',
            timestamp: Date.now()
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        attributes: true,
        characterData: true,
        subtree: true
      });
    });
  }

  /**
   * Setup state observer (for React/Vue/etc)
   */
  private async setupStateObserver(page: Page): Promise<void> {
    await page.evaluate(() => {
      window.__farziStateChanges = [];

      // Try to hook into React DevTools
      // This is a simplified version
      const reactRoot = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (reactRoot) {
        // Hook into state changes
        // TODO: Implement React state tracking
      }
    });
  }

  /**
   * Record user interactions
   */
  private async recordInteractions(page: Page, interactions: Interaction[]): Promise<void> {
    // Setup interaction listeners
    await page.evaluate(() => {
      window.__farziInteractions = [];

      const recordInteraction = (type: string, event: Event) => {
        const target = event.target as Element;
        window.__farziInteractions.push({
          type,
          target: target.tagName || 'unknown',
          selector: target.id ? '#' + target.id : target.className || '',
          timestamp: Date.now()
        });
      };

      document.addEventListener('click', (e) => recordInteraction('click', e), true);
      document.addEventListener('mouseover', (e) => recordInteraction('hover', e), true);
      document.addEventListener('focus', (e) => recordInteraction('focus', e), true);
      document.addEventListener('input', (e) => recordInteraction('input', e), true);
    });
  }
}
