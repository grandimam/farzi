/**
 * State Management Detection
 *
 * Detects state management patterns:
 * - Redux
 * - Zustand
 * - Context API
 * - MobX
 * - Custom patterns
 */

import type { ModuleGraph, ModuleInfo } from './JavaScriptAnalyzer';

export interface StatePattern {
  type: 'redux' | 'zustand' | 'context' | 'mobx' | 'jotai' | 'recoil' | 'custom' | 'unknown';
  stores: StoreInfo[];
  actions?: ActionInfo[];
  selectors?: SelectorInfo[];
}

export interface StoreInfo {
  name: string;
  path: string;
  initialState?: object;
  reducers?: string[];
}

export interface ActionInfo {
  name: string;
  type: string;
  payload?: object;
}

export interface SelectorInfo {
  name: string;
  path: string[];
}

export class StateDetector {
  /**
   * Detect state management pattern
   */
  async detect(moduleGraph: ModuleGraph): Promise<StatePattern> {
    // Check for Redux
    if (this.hasRedux(moduleGraph)) {
      return this.detectRedux(moduleGraph);
    }

    // Check for Zustand
    if (this.hasZustand(moduleGraph)) {
      return this.detectZustand(moduleGraph);
    }

    // Check for MobX
    if (this.hasMobX(moduleGraph)) {
      return this.detectMobX(moduleGraph);
    }

    // Check for Jotai
    if (this.hasJotai(moduleGraph)) {
      return this.detectJotai(moduleGraph);
    }

    // Check for Recoil
    if (this.hasRecoil(moduleGraph)) {
      return this.detectRecoil(moduleGraph);
    }

    // Check for Context API
    const contexts = this.detectContext(moduleGraph);
    if (contexts.stores.length > 0) {
      return contexts;
    }

    return { type: 'unknown', stores: [] };
  }

  /**
   * Check if uses Redux
   */
  private hasRedux(graph: ModuleGraph): boolean {
    return this.hasImport(graph, 'redux') ||
           this.hasImport(graph, 'react-redux') ||
           this.hasImport(graph, '@reduxjs/toolkit');
  }

  /**
   * Check if uses Zustand
   */
  private hasZustand(graph: ModuleGraph): boolean {
    return this.hasImport(graph, 'zustand');
  }

  /**
   * Check if uses MobX
   */
  private hasMobX(graph: ModuleGraph): boolean {
    return this.hasImport(graph, 'mobx') ||
           this.hasImport(graph, 'mobx-react');
  }

  /**
   * Check if uses Jotai
   */
  private hasJotai(graph: ModuleGraph): boolean {
    return this.hasImport(graph, 'jotai');
  }

  /**
   * Check if uses Recoil
   */
  private hasRecoil(graph: ModuleGraph): boolean {
    return this.hasImport(graph, 'recoil');
  }

  /**
   * Check if module graph has import
   */
  private hasImport(graph: ModuleGraph, packageName: string): boolean {
    for (const module of graph.modules.values()) {
      if (module.imports.some(imp => imp.source === packageName || imp.source.startsWith(packageName + '/'))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Detect Redux pattern
   */
  private detectRedux(graph: ModuleGraph): StatePattern {
    const stores: StoreInfo[] = [];
    const actions: ActionInfo[] = [];

    // Look for store configuration
    for (const [path, module] of graph.modules) {
      // Look for configureStore or createStore calls
      if (path.includes('store') || path.includes('redux')) {
        stores.push({
          name: 'main',
          path,
          reducers: this.findReducerNames(module)
        });
      }

      // Look for action creators
      if (module.exports.some(exp => exp.name.includes('Action'))) {
        actions.push({
          name: module.exports[0]?.name || 'unknown',
          type: 'redux-action'
        });
      }
    }

    return {
      type: 'redux',
      stores,
      actions
    };
  }

  /**
   * Detect Zustand pattern
   */
  private detectZustand(graph: ModuleGraph): StatePattern {
    const stores: StoreInfo[] = [];

    for (const [path, module] of graph.modules) {
      // Look for create() calls from zustand
      const hasZustandImport = module.imports.some(imp => imp.source === 'zustand');

      if (hasZustandImport) {
        stores.push({
          name: this.extractStoreName(path),
          path
        });
      }
    }

    return {
      type: 'zustand',
      stores
    };
  }

  /**
   * Detect MobX pattern
   */
  private detectMobX(graph: ModuleGraph): StatePattern {
    const stores: StoreInfo[] = [];

    for (const [path, module] of graph.modules) {
      const hasMobXImport = module.imports.some(imp =>
        imp.source === 'mobx' || imp.source === 'mobx-react'
      );

      if (hasMobXImport && (path.includes('store') || path.includes('Store'))) {
        stores.push({
          name: this.extractStoreName(path),
          path
        });
      }
    }

    return {
      type: 'mobx',
      stores
    };
  }

  /**
   * Detect Jotai pattern
   */
  private detectJotai(graph: ModuleGraph): StatePattern {
    const stores: StoreInfo[] = [];

    for (const [path, module] of graph.modules) {
      if (module.imports.some(imp => imp.source === 'jotai')) {
        stores.push({
          name: 'atoms',
          path
        });
      }
    }

    return {
      type: 'jotai',
      stores
    };
  }

  /**
   * Detect Recoil pattern
   */
  private detectRecoil(graph: ModuleGraph): StatePattern {
    const stores: StoreInfo[] = [];

    for (const [path, module] of graph.modules) {
      if (module.imports.some(imp => imp.source === 'recoil')) {
        stores.push({
          name: 'atoms',
          path
        });
      }
    }

    return {
      type: 'recoil',
      stores
    };
  }

  /**
   * Detect Context API usage
   */
  private detectContext(graph: ModuleGraph): StatePattern {
    const stores: StoreInfo[] = [];

    for (const [path, module] of graph.modules) {
      // Look for createContext usage
      const hasReactImport = module.imports.some(imp => imp.source === 'react');

      if (hasReactImport) {
        // Check for Context in component names or exports
        const hasContext = module.exports.some(exp =>
          exp.name.includes('Context') || exp.name.includes('Provider')
        );

        if (hasContext) {
          stores.push({
            name: this.extractStoreName(path),
            path
          });
        }
      }
    }

    return {
      type: stores.length > 0 ? 'context' : 'unknown',
      stores
    };
  }

  /**
   * Extract store name from path
   */
  private extractStoreName(path: string): string {
    const filename = path.split('/').pop() || '';
    return filename.replace(/\.(ts|tsx|js|jsx)$/, '');
  }

  /**
   * Find reducer names in module
   */
  private findReducerNames(module: ModuleInfo): string[] {
    // Simplified - would need AST traversal for real implementation
    return module.exports
      .filter(exp => exp.name.includes('reducer') || exp.name.includes('Reducer'))
      .map(exp => exp.name);
  }
}
