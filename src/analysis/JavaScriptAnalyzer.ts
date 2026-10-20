/**
 * JavaScript Module Analysis
 *
 * Analyzes JavaScript/TypeScript source code to understand:
 * - Module dependencies
 * - Component structure
 * - Import/export relationships
 * - Framework detection
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { Page } from 'playwright';

export interface ModuleInfo {
  path: string;
  imports: Import[];
  exports: Export[];
  components: ComponentInfo[];
  framework?: 'react' | 'vue' | 'svelte' | 'angular' | 'unknown';
}

export interface Import {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isNamespace: boolean;
}

export interface Export {
  name: string;
  isDefault: boolean;
  type: 'function' | 'class' | 'variable' | 'const';
}

export interface ComponentInfo {
  name: string;
  type: 'function' | 'class';
  props: PropInfo[];
  state: StateInfo[];
  hooks: HookInfo[];
}

export interface PropInfo {
  name: string;
  type?: string;
  required: boolean;
}

export interface StateInfo {
  name: string;
  initialValue?: string;
}

export interface HookInfo {
  name: string;
  type: 'useState' | 'useEffect' | 'useContext' | 'useMemo' | 'useCallback' | 'custom';
}

export interface ModuleGraph {
  modules: Map<string, ModuleInfo>;
  dependencies: Map<string, string[]>;
  framework: 'react' | 'vue' | 'svelte' | 'angular' | 'unknown';
}

export class JavaScriptAnalyzer {
  /**
   * Analyze all JavaScript in a page
   */
  async analyzePage(page: Page): Promise<ModuleGraph> {
    // Extract all script sources from the page
    const scripts = await page.evaluate(() => {
      const scripts: Array<{ src?: string; content?: string }> = [];

      // External scripts
      document.querySelectorAll('script[src]').forEach(script => {
        scripts.push({ src: script.getAttribute('src') || undefined });
      });

      // Inline scripts
      document.querySelectorAll('script:not([src])').forEach(script => {
        scripts.push({ content: script.textContent || undefined });
      });

      return scripts;
    });

    const modules = new Map<string, ModuleInfo>();
    const dependencies = new Map<string, string[]>();
    let detectedFramework: ModuleGraph['framework'] = 'unknown';

    // Analyze each script
    for (const script of scripts) {
      if (script.src) {
        // Fetch and analyze external script
        try {
          const response = await page.context().request.get(script.src);
          const code = await response.text();
          const moduleInfo = this.analyzeSource(code, script.src);
          modules.set(script.src, moduleInfo);

          if (moduleInfo.framework && moduleInfo.framework !== 'unknown') {
            detectedFramework = moduleInfo.framework;
          }
        } catch (e) {
          // Skip if can't fetch
        }
      } else if (script.content) {
        // Analyze inline script
        const moduleInfo = this.analyzeSource(script.content, 'inline');
        modules.set('inline-' + modules.size, moduleInfo);
      }
    }

    // Build dependency graph
    modules.forEach((info, path) => {
      const deps = info.imports.map(imp => imp.source);
      dependencies.set(path, deps);
    });

    return {
      modules,
      dependencies,
      framework: detectedFramework
    };
  }

  /**
   * Analyze source code
   */
  analyzeSource(code: string, path: string): ModuleInfo {
    let ast;

    try {
      ast = parser.parse(code, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties',
          'dynamicImport'
        ]
      });
    } catch (e) {
      // If parsing fails, try as script
      try {
        ast = parser.parse(code, {
          sourceType: 'script',
          plugins: ['jsx', 'typescript']
        });
      } catch (e2) {
        // Can't parse, return empty
        return {
          path,
          imports: [],
          exports: [],
          components: [],
          framework: 'unknown'
        };
      }
    }

    const imports: Import[] = [];
    const exports: Export[] = [];
    const components: ComponentInfo[] = [];
    let framework: ModuleInfo['framework'] = 'unknown';

    traverse(ast, {
      // Import declarations
      ImportDeclaration: (path) => {
        const source = path.node.source.value;

        // Detect framework
        if (source === 'react' || source.startsWith('react/')) {
          framework = 'react';
        } else if (source === 'vue' || source.startsWith('@vue/')) {
          framework = 'vue';
        } else if (source === 'svelte') {
          framework = 'svelte';
        } else if (source.startsWith('@angular/')) {
          framework = 'angular';
        }

        const specifiers = path.node.specifiers.map(spec => {
          if (t.isImportDefaultSpecifier(spec)) {
            return spec.local.name;
          } else if (t.isImportNamespaceSpecifier(spec)) {
            return '*';
          } else {
            return spec.local.name;
          }
        });

        imports.push({
          source,
          specifiers,
          isDefault: path.node.specifiers.some(s => t.isImportDefaultSpecifier(s)),
          isNamespace: path.node.specifiers.some(s => t.isImportNamespaceSpecifier(s))
        });
      },

      // Export declarations
      ExportNamedDeclaration: (path) => {
        path.node.specifiers.forEach(spec => {
          if (t.isExportSpecifier(spec)) {
            exports.push({
              name: spec.exported.type === 'Identifier' ? spec.exported.name : '',
              isDefault: false,
              type: 'variable'
            });
          }
        });
      },

      ExportDefaultDeclaration: (path) => {
        exports.push({
          name: 'default',
          isDefault: true,
          type: this.getExportType(path.node.declaration)
        });
      },

      // React components (function)
      FunctionDeclaration: (path) => {
        if (this.isReactComponent(path)) {
          const component = this.extractFunctionComponent(path);
          if (component) components.push(component);
        }
      },

      // React components (arrow function)
      VariableDeclarator: (path) => {
        if (t.isArrowFunctionExpression(path.node.init) ||
            t.isFunctionExpression(path.node.init)) {
          if (this.isReactComponentExpression(path)) {
            const component = this.extractVariableComponent(path);
            if (component) components.push(component);
          }
        }
      },

      // React components (class)
      ClassDeclaration: (path) => {
        if (this.isReactClassComponent(path)) {
          const component = this.extractClassComponent(path);
          if (component) components.push(component);
        }
      }
    });

    return {
      path,
      imports,
      exports,
      components,
      framework
    };
  }

  /**
   * Check if function is a React component
   */
  private isReactComponent(path: any): boolean {
    const node = path.node;

    // Check if name starts with capital letter
    if (!node.id || !node.id.name) return false;
    const name = node.id.name;
    if (name[0] !== name[0].toUpperCase()) return false;

    // Check if returns JSX
    let hasJSX = false;
    path.traverse({
      JSXElement: () => { hasJSX = true; },
      JSXFragment: () => { hasJSX = true; }
    });

    return hasJSX;
  }

  /**
   * Check if variable is a React component
   */
  private isReactComponentExpression(path: any): boolean {
    const node = path.node;

    // Check if name starts with capital letter
    if (!t.isIdentifier(node.id)) return false;
    const name = node.id.name;
    if (name[0] !== name[0].toUpperCase()) return false;

    // Check if returns JSX
    let hasJSX = false;
    path.traverse({
      JSXElement: () => { hasJSX = true; },
      JSXFragment: () => { hasJSX = true; }
    });

    return hasJSX;
  }

  /**
   * Check if class is a React component
   */
  private isReactClassComponent(path: any): boolean {
    const node = path.node;

    // Check extends React.Component or Component
    if (!node.superClass) return false;

    const superClass = node.superClass;
    if (t.isMemberExpression(superClass)) {
      return superClass.property.type === 'Identifier' &&
             superClass.property.name === 'Component';
    }

    return t.isIdentifier(superClass) && superClass.name === 'Component';
  }

  /**
   * Extract function component info
   */
  private extractFunctionComponent(path: any): ComponentInfo | null {
    const node = path.node;
    if (!node.id) return null;

    const name = node.id.name;
    const props: PropInfo[] = [];
    const state: StateInfo[] = [];
    const hooks: HookInfo[] = [];

    // Extract props from function parameter
    if (node.params.length > 0) {
      const propsParam = node.params[0];
      if (t.isObjectPattern(propsParam)) {
        propsParam.properties.forEach(prop => {
          if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
            props.push({
              name: prop.key.name,
              required: true // Assume required for now
            });
          }
        });
      }
    }

    // Extract hooks
    path.traverse({
      CallExpression: (hookPath: any) => {
        const callee = hookPath.node.callee;
        if (t.isIdentifier(callee) && callee.name.startsWith('use')) {
          const hookName = callee.name;

          if (hookName === 'useState') {
            hooks.push({ name: hookName, type: 'useState' });

            // Extract state variable name
            const parent = hookPath.parent;
            if (t.isVariableDeclarator(parent) &&
                t.isArrayPattern(parent.id) &&
                parent.id.elements.length > 0) {
              const stateVar = parent.id.elements[0];
              if (t.isIdentifier(stateVar)) {
                state.push({ name: stateVar.name });
              }
            }
          } else if (hookName === 'useEffect') {
            hooks.push({ name: hookName, type: 'useEffect' });
          } else if (hookName === 'useContext') {
            hooks.push({ name: hookName, type: 'useContext' });
          } else {
            hooks.push({ name: hookName, type: 'custom' });
          }
        }
      }
    });

    return {
      name,
      type: 'function',
      props,
      state,
      hooks
    };
  }

  /**
   * Extract variable component info
   */
  private extractVariableComponent(path: any): ComponentInfo | null {
    const node = path.node;
    if (!t.isIdentifier(node.id)) return null;

    return this.extractFunctionComponent({
      node: { ...node.init, id: node.id },
      traverse: path.traverse.bind(path)
    });
  }

  /**
   * Extract class component info
   */
  private extractClassComponent(path: any): ComponentInfo | null {
    const node = path.node;
    if (!node.id) return null;

    const name = node.id.name;
    const props: PropInfo[] = [];
    const state: StateInfo[] = [];

    // TODO: Extract from class methods
    // - constructor (props, state)
    // - render method
    // - lifecycle methods

    return {
      name,
      type: 'class',
      props,
      state,
      hooks: []
    };
  }

  /**
   * Get export type
   */
  private getExportType(node: any): Export['type'] {
    if (t.isFunctionDeclaration(node)) return 'function';
    if (t.isClassDeclaration(node)) return 'class';
    if (t.isVariableDeclaration(node)) return 'variable';
    return 'const';
  }
}
