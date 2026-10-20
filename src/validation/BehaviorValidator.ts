/**
 * Behavior Validator
 *
 * Validates that replica behaves like original
 */

import type { Page } from 'playwright';

export interface BehaviorValidationResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  scenarios: ScenarioResult[];
}

export interface ScenarioResult {
  name: string;
  passed: boolean;
  expected: any;
  actual: any;
  error?: string;
}

export interface TestScenario {
  name: string;
  action: (page: Page) => Promise<void>;
  assertion: (page: Page) => Promise<boolean>;
}

export class BehaviorValidator {
  /**
   * Validate behavior against scenarios
   */
  async validate(
    originalUrl: string,
    replicaUrl: string,
    scenarios: TestScenario[]
  ): Promise<BehaviorValidationResult> {
    const results: ScenarioResult[] = [];

    for (const scenario of scenarios) {
      const result = await this.runScenario(originalUrl, replicaUrl, scenario);
      results.push(result);
    }

    const passedTests = results.filter(r => r.passed).length;

    return {
      passed: passedTests === scenarios.length,
      totalTests: scenarios.length,
      passedTests,
      failedTests: scenarios.length - passedTests,
      scenarios: results
    };
  }

  /**
   * Run a single test scenario
   */
  private async runScenario(
    originalUrl: string,
    replicaUrl: string,
    scenario: TestScenario
  ): Promise<ScenarioResult> {
    try {
      // Test on original
      const { chromium } = await import('playwright');
      const browser = await chromium.launch();

      const originalPage = await browser.newPage();
      await originalPage.goto(originalUrl);
      await scenario.action(originalPage);
      const originalResult = await scenario.assertion(originalPage);

      // Test on replica
      const replicaPage = await browser.newPage();
      await replicaPage.goto(replicaUrl);
      await scenario.action(replicaPage);
      const replicaResult = await scenario.assertion(replicaPage);

      await browser.close();

      return {
        name: scenario.name,
        passed: originalResult === replicaResult && replicaResult === true,
        expected: originalResult,
        actual: replicaResult
      };
    } catch (error) {
      return {
        name: scenario.name,
        passed: false,
        expected: true,
        actual: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Generate common test scenarios
   */
  generateCommonScenarios(): TestScenario[] {
    return [
      {
        name: 'Button click shows modal',
        action: async (page) => {
          await page.click('button');
        },
        assertion: async (page) => {
          return await page.isVisible('[role="dialog"]');
        }
      },
      {
        name: 'Form submission',
        action: async (page) => {
          await page.fill('input[type="text"]', 'test');
          await page.click('button[type="submit"]');
        },
        assertion: async (page) => {
          await page.waitForTimeout(1000);
          return await page.isVisible('.success-message');
        }
      },
      {
        name: 'Hover shows tooltip',
        action: async (page) => {
          await page.hover('[data-tooltip]');
        },
        assertion: async (page) => {
          return await page.isVisible('[role="tooltip"]');
        }
      }
    ];
  }

  /**
   * Validate interactions match
   */
  async validateInteractions(
    originalUrl: string,
    replicaUrl: string
  ): Promise<boolean> {
    const scenarios = this.generateCommonScenarios();
    const result = await this.validate(originalUrl, replicaUrl, scenarios);
    return result.passed;
  }
}
