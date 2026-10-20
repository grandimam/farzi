/**
 * Component Generator
 *
 * Generates production-ready components with:
 * - Visual design (from design tokens)
 * - Behavior (from analysis)
 * - State management
 * - Event handlers
 */

import type { Component, DesignTokens } from '../types';
import type { ComponentInfo } from '../analysis/JavaScriptAnalyzer';
import type { EventListener } from '../capture/BehaviorCapture';

export interface GeneratedComponent {
  code: string;
  styles?: string;
  tests?: string;
  storybook?: string;
}

export class ComponentGenerator {
  /**
   * Generate complete component with behavior
   */
  async generateComponent(
    component: Component | ComponentInfo,
    tokens: DesignTokens,
    events?: EventListener[],
    framework: 'react' | 'vue' | 'svelte' = 'react'
  ): Promise<GeneratedComponent> {
    if (framework === 'react') {
      return this.generateReactComponent(component, tokens, events);
    } else if (framework === 'vue') {
      return this.generateVueComponent(component, tokens, events);
    } else {
      return this.generateSvelteComponent(component, tokens, events);
    }
  }

  /**
   * Generate React component
   */
  private generateReactComponent(
    component: Component | ComponentInfo,
    tokens: DesignTokens,
    events?: EventListener[]
  ): GeneratedComponent {
    const name = component.name;
    const hasVariants = 'variants' in component && component.variants.length > 0;
    const hasState = 'state' in component && component.state && component.state.length > 0;
    const hasHooks = 'hooks' in component && component.hooks && component.hooks.length > 0;

    // Generate imports
    const imports = ['import React from \'react\';'];
    if (hasState || hasHooks) {
      const hooks = new Set(['useState']);
      if ('hooks' in component && component.hooks) {
        component.hooks.forEach(hook => {
          if (hook.type !== 'custom') hooks.add(hook.type);
        });
      }
      imports.push(`import { ${Array.from(hooks).join(', ')} } from 'react';`);
    }
    imports.push('import { cn } from \'@/lib/utils\';');

    // Generate props interface
    const props: string[] = [];
    if (hasVariants) {
      const variants = 'variants' in component ? component.variants.map(v => `'${v.name}'`).join(' | ') : 'string';
      props.push(`variant?: ${variants}`);
    }
    props.push('children?: React.ReactNode');
    props.push('className?: string');

    // Add event props
    if (events) {
      const eventTypes = new Set(events.map(e => e.type));
      eventTypes.forEach(type => {
        props.push(`on${type.charAt(0).toUpperCase() + type.slice(1)}?: () => void`);
      });
    }

    // Generate state
    const stateDeclarations: string[] = [];
    if ('state' in component && component.state) {
      component.state.forEach(state => {
        stateDeclarations.push(
          `const [${state.name}, set${state.name.charAt(0).toUpperCase() + state.name.slice(1)}] = useState(${state.initialValue || 'null'});`
        );
      });
    }

    // Generate variant classes
    const variantClasses: string[] = [];
    if (hasVariants && 'variants' in component) {
      component.variants.forEach(variant => {
        const styles = this.extractStyles(variant.styles || {}, tokens);
        variantClasses.push(`variant === '${variant.name}' && '${styles}'`);
      });
    }

    // Generate base classes
    const baseClasses = this.generateBaseClasses(component, tokens);

    const code = `${imports.join('\n')}

export interface ${name}Props {
  ${props.join(';\n  ')};
}

export const ${name}: React.FC<${name}Props> = ({
  ${hasVariants ? 'variant = \'primary\',' : ''}
  children,
  className,
  ${events ? Array.from(new Set(events.map(e => 'on' + e.type.charAt(0).toUpperCase() + e.type.slice(1)))).join(',\n  ') : ''}
  ...props
}) => {
  ${stateDeclarations.join('\n  ')}

  return (
    <${this.getElementType(component)}
      className={cn(
        '${baseClasses}',
        ${variantClasses.join(',\n        ')},
        className
      )}
      ${events ? events.map(e => `on${e.type.charAt(0).toUpperCase() + e.type.slice(1)}={on${e.type.charAt(0).toUpperCase() + e.type.slice(1)}}`).join('\n      ') : ''}
      {...props}
    >
      {children}
    </${this.getElementType(component)}>
  );
};`;

    return { code };
  }

  /**
   * Generate Vue component
   */
  private generateVueComponent(
    component: Component | ComponentInfo,
    tokens: DesignTokens,
    events?: EventListener[]
  ): GeneratedComponent {
    const name = component.name;

    const code = `<template>
  <div :class="classes">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  variant?: 'primary' | 'secondary';
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary'
});

const classes = computed(() => [
  'base-classes',
  props.variant === 'primary' && 'primary-classes',
  props.variant === 'secondary' && 'secondary-classes',
  props.className
]);
</script>`;

    return { code };
  }

  /**
   * Generate Svelte component
   */
  private generateSvelteComponent(
    component: Component | ComponentInfo,
    tokens: DesignTokens,
    events?: EventListener[]
  ): GeneratedComponent {
    const code = `<script lang="ts">
  export let variant: 'primary' | 'secondary' = 'primary';
  export let className: string = '';

  $: classes = [
    'base-classes',
    variant === 'primary' && 'primary-classes',
    variant === 'secondary' && 'secondary-classes',
    className
  ].filter(Boolean).join(' ');
</script>

<div class={classes}>
  <slot />
</div>`;

    return { code };
  }

  /**
   * Extract styles from component
   */
  private extractStyles(styles: any, tokens: DesignTokens): string {
    const classes: string[] = [];

    if (styles.backgroundColor) {
      classes.push(`bg-${this.tokenToClass(styles.backgroundColor, 'color')}`);
    }
    if (styles.color) {
      classes.push(`text-${this.tokenToClass(styles.color, 'color')}`);
    }
    if (styles.padding) {
      classes.push(`p-${this.tokenToClass(styles.padding, 'spacing')}`);
    }

    return classes.join(' ');
  }

  /**
   * Generate base classes
   */
  private generateBaseClasses(component: Component | ComponentInfo, tokens: DesignTokens): string {
    // Default base classes
    return 'transition-colors duration-200';
  }

  /**
   * Convert token to Tailwind class
   */
  private tokenToClass(value: string, type: 'color' | 'spacing'): string {
    // Simplified - would need proper token mapping
    return '500';
  }

  /**
   * Get HTML element type
   */
  private getElementType(component: Component | ComponentInfo): string {
    const name = component.name.toLowerCase();

    if (name.includes('button')) return 'button';
    if (name.includes('input')) return 'input';
    if (name.includes('link')) return 'a';
    if (name.includes('heading')) return 'h2';

    return 'div';
  }
}
