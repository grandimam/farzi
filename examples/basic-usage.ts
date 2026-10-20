/**
 * Basic Farzi usage examples
 */

import { Farzi } from '../src/index';

async function main() {
  // Initialize Farzi (API key optional)
  const farzi = new Farzi(process.env.ANTHROPIC_API_KEY);

  // Example 1: Complete replication
  await farzi.replicate({
    url: 'https://example.com',
    output: './my-replica',
    framework: 'react',
    validate: true,
    similarityTarget: 99.5
  });

  // Example 2: Extract design tokens only
  const { tokens } = await farzi.extractDesign('https://example.com');
  console.log('Colors:', tokens.colors.primary.length);
  console.log('Spacing scale:', tokens.spacing.scale);
  console.log('Typography:', tokens.typography.families);

  // Example 3: Extract complete analysis
  const analysis = await farzi.extract('https://example.com');
  console.log('Framework detected:', analysis.modules.framework);
  console.log('State management:', analysis.state.type);
  console.log('API endpoints:', analysis.network.endpoints.length);
  console.log('Components found:',
    Array.from(analysis.modules.modules.values())
      .reduce((sum, m) => sum + m.components.length, 0)
  );

  // Example 4: Extract a single component
  const { code, tokens: componentTokens } = await farzi.extractComponent(
    'https://example.com',
    'button.primary-button'
  );
  console.log('Component code:', code);
  console.log('Component tokens:', componentTokens);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
