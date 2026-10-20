/**
 * Project Generator
 *
 * Generates complete project structure with all components
 */

import type { DesignTokens } from '../types';
import type { StatePattern } from '../analysis/StateDetector';
import type { NetworkMap } from '../capture/NetworkCapture';
import type { ModuleGraph } from '../analysis/JavaScriptAnalyzer';
import { StateGenerator } from './StateGenerator';
import { APIGenerator } from './APIGenerator';
import { ComponentGenerator } from './ComponentGenerator';
import * as fs from 'fs';
import * as path from 'path';

export interface ProjectConfig {
  name: string;
  framework: 'react' | 'vue' | 'svelte';
  styling: 'tailwind' | 'css-modules' | 'styled-components';
  typescript: boolean;
}

export class ProjectGenerator {
  private stateGenerator = new StateGenerator();
  private apiGenerator = new APIGenerator();
  private componentGenerator = new ComponentGenerator();

  /**
   * Generate complete project
   */
  async generate(
    config: ProjectConfig,
    tokens: DesignTokens,
    moduleGraph: ModuleGraph,
    statePattern: StatePattern,
    networkMap: NetworkMap,
    outputDir: string
  ): Promise<void> {
    // Create directory structure
    this.createDirectoryStructure(outputDir, config);

    // Generate design system
    await this.generateDesignSystem(tokens, outputDir, config);

    // Generate state management
    const stateFiles = await this.stateGenerator.generate(statePattern, config.framework);
    await this.writeFiles(stateFiles, outputDir);

    // Generate API client
    const apiFiles = await this.apiGenerator.generate(networkMap);
    await this.writeFiles(apiFiles, outputDir);

    // Generate components
    await this.generateComponents(tokens, moduleGraph, outputDir, config);

    // Generate config files
    await this.generateConfigFiles(outputDir, config, tokens);

    // Generate package.json
    await this.generatePackageJson(outputDir, config, statePattern);

    // Generate README
    await this.generateReadme(outputDir, config);
  }

  /**
   * Create directory structure
   */
  private createDirectoryStructure(outputDir: string, config: ProjectConfig): void {
    const dirs = [
      'src',
      'src/components',
      'src/design-system',
      'src/design-system/tokens',
      'src/design-system/components',
      'src/pages',
      'src/store',
      'src/api',
      'src/hooks',
      'src/utils',
      'public'
    ];

    dirs.forEach(dir => {
      const fullPath = path.join(outputDir, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  /**
   * Generate design system files
   */
  private async generateDesignSystem(
    tokens: DesignTokens,
    outputDir: string,
    config: ProjectConfig
  ): Promise<void> {
    const ext = config.typescript ? 'ts' : 'js';

    // Colors
    const colorsFile = this.generateColorsToken(tokens);
    fs.writeFileSync(
      path.join(outputDir, `src/design-system/tokens/colors.${ext}`),
      colorsFile
    );

    // Spacing
    const spacingFile = this.generateSpacingToken(tokens);
    fs.writeFileSync(
      path.join(outputDir, `src/design-system/tokens/spacing.${ext}`),
      spacingFile
    );

    // Typography
    const typographyFile = this.generateTypographyToken(tokens);
    fs.writeFileSync(
      path.join(outputDir, `src/design-system/tokens/typography.${ext}`),
      typographyFile
    );
  }

  /**
   * Generate colors token file
   */
  private generateColorsToken(tokens: DesignTokens): string {
    const primaryColors = tokens.colors.primary.slice(0, 3).map((c, i) =>
      `  ${i * 100 + 500}: '${c.primary.hex}'`
    );

    const neutralColors = tokens.colors.neutral.slice(0, 10).map((c, i) =>
      `  ${i * 100}: '${c.primary.hex}'`
    );

    return `export const colors = {
  primary: {
${primaryColors.join(',\n')}
  },
  neutral: {
${neutralColors.join(',\n')}
  },
  semantic: {
    success: '${tokens.colors.semantic.success?.[0]?.primary.hex || '#10B981'}',
    error: '${tokens.colors.semantic.error?.[0]?.primary.hex || '#EF4444'}',
    warning: '${tokens.colors.semantic.warning?.[0]?.primary.hex || '#F59E0B'}'
  }
};`;
  }

  /**
   * Generate spacing token file
   */
  private generateSpacingToken(tokens: DesignTokens): string {
    const scale = tokens.spacing.scale.map(s => `  ${s}: '${s}px'`);

    return `export const spacing = {
  baseUnit: ${tokens.spacing.baseUnit},
  scale: {
${scale.join(',\n')}
  }
};`;
  }

  /**
   * Generate typography token file
   */
  private generateTypographyToken(tokens: DesignTokens): string {
    const families = tokens.typography.families.map(f => `'${f}'`).join(', ');
    const sizes = tokens.typography.sizes.map(s => `  ${s}: '${s}px'`);

    return `export const typography = {
  fontFamily: {
    sans: [${families}]
  },
  fontSize: {
${sizes.join(',\n')}
  },
  fontWeight: {
${tokens.typography.weights.map(w => `    ${w}: ${w}`).join(',\n')}
  }
};`;
  }

  /**
   * Generate components
   */
  private async generateComponents(
    tokens: DesignTokens,
    moduleGraph: ModuleGraph,
    outputDir: string,
    config: ProjectConfig
  ): Promise<void> {
    // Generate from detected components
    for (const [, module] of moduleGraph.modules) {
      for (const component of module.components) {
        const generated = await this.componentGenerator.generateComponent(
          component,
          tokens,
          undefined,
          config.framework
        );

        const ext = config.typescript ? 'tsx' : 'jsx';
        const filename = `${component.name}.${ext}`;
        const filepath = path.join(outputDir, 'src/design-system/components', filename);

        fs.writeFileSync(filepath, generated.code);
      }
    }

    // Generate default components if none found
    if (moduleGraph.modules.size === 0) {
      await this.generateDefaultComponents(tokens, outputDir, config);
    }
  }

  /**
   * Generate default components
   */
  private async generateDefaultComponents(
    tokens: DesignTokens,
    outputDir: string,
    config: ProjectConfig
  ): Promise<void> {
    const defaultComponents = ['Button', 'Input', 'Card'];

    for (const name of defaultComponents) {
      const component = {
        name,
        type: 'button' as const,
        variants: [
          { name: 'primary', styles: {} },
          { name: 'secondary', styles: {} }
        ],
        states: []
      };

      const generated = await this.componentGenerator.generateComponent(
        component,
        tokens,
        undefined,
        config.framework
      );

      const ext = config.typescript ? 'tsx' : 'jsx';
      const filepath = path.join(outputDir, `src/design-system/components/${name}.${ext}`);
      fs.writeFileSync(filepath, generated.code);
    }
  }

  /**
   * Generate config files
   */
  private async generateConfigFiles(
    outputDir: string,
    config: ProjectConfig,
    tokens: DesignTokens
  ): Promise<void> {
    // Tailwind config
    if (config.styling === 'tailwind') {
      const tailwindConfig = this.generateTailwindConfig(tokens);
      fs.writeFileSync(path.join(outputDir, 'tailwind.config.js'), tailwindConfig);
    }

    // TypeScript config
    if (config.typescript) {
      const tsConfig = this.generateTsConfig(config);
      fs.writeFileSync(path.join(outputDir, 'tsconfig.json'), tsConfig);
    }

    // Next.js config (if React)
    if (config.framework === 'react') {
      const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

module.exports = nextConfig;`;
      fs.writeFileSync(path.join(outputDir, 'next.config.js'), nextConfig);
    }
  }

  /**
   * Generate Tailwind config
   */
  private generateTailwindConfig(tokens: DesignTokens): string {
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
${tokens.colors.primary.slice(0, 3).map((c, i) => `          ${i * 100 + 500}: '${c.primary.hex}'`).join(',\n')}
        },
        neutral: {
${tokens.colors.neutral.slice(0, 10).map((c, i) => `          ${i * 100}: '${c.primary.hex}'`).join(',\n')}
        }
      },
      spacing: {
${tokens.spacing.scale.map(s => `        '${s}': '${s}px'`).join(',\n')}
      },
      fontSize: {
${tokens.typography.sizes.map(s => `        '${s}': '${s}px'`).join(',\n')}
      }
    },
  },
  plugins: [],
};`;
  }

  /**
   * Generate TypeScript config
   */
  private generateTsConfig(config: ProjectConfig): string {
    return `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "${config.framework === 'react' ? 'preserve' : 'react'}",
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}`;
  }

  /**
   * Generate package.json
   */
  private async generatePackageJson(
    outputDir: string,
    config: ProjectConfig,
    statePattern: StatePattern
  ): Promise<void> {
    const dependencies: Record<string, string> = {
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    };

    const devDependencies: Record<string, string> = {
      'typescript': '^5.0.0',
      '@types/react': '^18.2.0',
      '@types/node': '^20.0.0',
      'tailwindcss': '^3.3.0',
      'autoprefixer': '^10.4.0',
      'postcss': '^8.4.0'
    };

    // Add state management dependencies
    if (statePattern.type === 'redux') {
      dependencies['@reduxjs/toolkit'] = '^2.0.0';
      dependencies['react-redux'] = '^9.0.0';
    } else if (statePattern.type === 'zustand') {
      dependencies['zustand'] = '^4.4.0';
    }

    const packageJson = {
      name: config.name,
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint'
      },
      dependencies,
      devDependencies
    };

    fs.writeFileSync(
      path.join(outputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  /**
   * Generate README
   */
  private async generateReadme(outputDir: string, config: ProjectConfig): Promise<void> {
    const readme = `# ${config.name}

Generated by Farzi - Pixel-perfect application replication.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Project Structure

- \`src/design-system/\` - Design tokens and components
- \`src/components/\` - Application components
- \`src/pages/\` - Application pages
- \`src/store/\` - State management
- \`src/api/\` - API client

## Generated Features

- ✅ Pixel-perfect design system
- ✅ Production-ready components
- ✅ State management (${config.framework === 'react' ? 'Redux/Zustand' : 'Pinia/Vuex'})
- ✅ API client
- ✅ TypeScript support

---

**Generated with [Farzi](https://github.com/grandimam/farzi)** 🎯
`;

    fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  }

  /**
   * Write files from map
   */
  private async writeFiles(files: Map<string, string>, outputDir: string): Promise<void> {
    for (const [filepath, content] of files) {
      const fullPath = path.join(outputDir, filepath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content);
    }
  }
}
