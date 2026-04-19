/**
 * Bug Condition Exploration Test - Task 1
 * 
 * **CRITICAL**: This test MUST FAIL on unfixed code to confirm the bug exists.
 * 
 * This test encodes the EXPECTED BEHAVIOR (visual output parity across all three environments).
 * When run on unfixed code, it will surface counterexamples showing visual differences.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
 * - 1.1: CSS Variables Match
 * - 1.2: Typography Match
 * - 1.3: Spacing Match
 * - 1.4: Border Match
 * - 1.5: Preset Styles Match
 * - 1.6: Mobile Responsive Match
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

// ─── Type Definitions ───────────────────────────────────────────────────────

interface CSSVariables {
  '--bp-pad': string;
  '--bp-rad': string;
  '--bp-gap': string;
  '--bp-font': string;
  '--bp-bc': string;
  '--bp-size': string;
}

interface TypographyProperties {
  'font-weight': string;
  'font-size': string;
  'letter-spacing': string;
  'color': string;
  'opacity': string;
}

interface SpacingProperties {
  'padding': string;
  'margin': string;
  'gap': string;
}

interface BorderProperties {
  'border-radius': string;
  'border-width': string;
  'border-color': string;
  'border-style': string;
}

interface PresetStyles {
  'clip-path': string;
  'margin-left': string;
  'transition': string;
  'box-shadow': string;
}

interface EnvironmentStyles {
  cssVariables: CSSVariables;
  labelTypography: TypographyProperties;
  subTextTypography: TypographyProperties;
  spacing: SpacingProperties;
  borders: BorderProperties;
  chevronPreset: PresetStyles;
  timelineDot: BorderProperties & { 'box-shadow': string };
}

// ─── CSS Parser Utilities ───────────────────────────────────────────────────

/**
 * Parse CSS file and extract CSS variable values from :root
 */
function parseCSSVariables(cssContent: string): Partial<CSSVariables> {
  const rootMatch = cssContent.match(/:root\s*\{([^}]+)\}/s);
  if (!rootMatch) return {};

  const variables: Partial<CSSVariables> = {};
  const declarations = rootMatch[1];

  const varPattern = /--(bp-[a-z]+):\s*([^;]+);/g;
  let match;
  while ((match = varPattern.exec(declarations)) !== null) {
    const varName = `--${match[1]}` as keyof CSSVariables;
    variables[varName] = match[2].trim();
  }

  return variables;
}

/**
 * Parse CSS class properties
 */
function parseCSSClass(cssContent: string, className: string): Record<string, string> {
  const classPattern = new RegExp(`\\.${className}\\s*\\{([^}]+)\\}`, 's');
  const match = cssContent.match(classPattern);
  if (!match) return {};

  const properties: Record<string, string> = {};
  const declarations = match[1];

  const propPattern = /([a-z-]+):\s*([^;]+);/g;
  let propMatch;
  while ((propMatch = propPattern.exec(declarations)) !== null) {
    properties[propMatch[1]] = propMatch[2].trim();
  }

  return properties;
}

/**
 * Parse mobile responsive CSS values at 480px breakpoint
 */
function parseMobileCSS(cssContent: string): Partial<CSSVariables> & Record<string, string> {
  const mediaMatch = cssContent.match(/@media\s+screen\s+and\s+\(max-width:\s*480px\)\s*\{([^}]+(?:\{[^}]+\}[^}]*)*)\}/s);
  if (!mediaMatch) return {};

  const mobileStyles: Partial<CSSVariables> & Record<string, string> = {};
  const content = mediaMatch[1];

  // Extract CSS variables from .bp-widget
  const widgetMatch = content.match(/\.bp-widget\s*\{([^}]+)\}/s);
  if (widgetMatch) {
    const varPattern = /--(bp-[a-z]+):\s*([^;]+);/g;
    let match;
    while ((match = varPattern.exec(widgetMatch[1])) !== null) {
      const varName = `--${match[1]}` as keyof CSSVariables;
      mobileStyles[varName] = match[2].trim();
    }
  }

  // Extract font-size from .bp-text-label
  const labelMatch = content.match(/\.bp-text-label\s*\{([^}]+)\}/s);
  if (labelMatch) {
    const fontSizeMatch = labelMatch[1].match(/font-size:\s*([^;]+);/);
    if (fontSizeMatch) {
      mobileStyles['label-font-size'] = fontSizeMatch[1].trim();
    }
  }

  // Extract font-size from .bp-text-sub
  const subMatch = content.match(/\.bp-text-sub\s*\{([^}]+)\}/s);
  if (subMatch) {
    const fontSizeMatch = subMatch[1].match(/font-size:\s*([^;]+);/);
    if (fontSizeMatch) {
      mobileStyles['sub-font-size'] = fontSizeMatch[1].trim();
    }
  }

  // Extract timeline dot size
  const dotMatch = content.match(/\.bp-timeline-dot\s*\{([^}]+)\}/s);
  if (dotMatch) {
    const widthMatch = dotMatch[1].match(/width:\s*([^;]+);/);
    if (widthMatch) {
      mobileStyles['timeline-dot-width'] = widthMatch[1].trim();
    }
  }

  return mobileStyles;
}

// ─── Environment Style Extractors ──────────────────────────────────────────

/**
 * Extract styles from Admin CSS (Builder Preview & Template Gallery)
 */
function extractAdminStyles(): EnvironmentStyles {
  const adminCSSPath = path.join(process.cwd(), 'app/styles/bp-delivery.css');
  const cssContent = fs.readFileSync(adminCSSPath, 'utf-8');

  const cssVariables = parseCSSVariables(cssContent) as CSSVariables;
  const labelProps = parseCSSClass(cssContent, 'bp-text-label');
  const subProps = parseCSSClass(cssContent, 'bp-text-sub');
  const chevronProps = parseCSSClass(cssContent, 'bp-steps-chevron .bp-segment');
  const timelineDotProps = parseCSSClass(cssContent, 'bp-timeline-dot');

  return {
    cssVariables,
    labelTypography: {
      'font-weight': labelProps['font-weight'] || '',
      'font-size': labelProps['font-size'] || '',
      'letter-spacing': labelProps['letter-spacing'] || '0',
      'color': labelProps['color'] || '',
      'opacity': labelProps['opacity'] || '1',
    },
    subTextTypography: {
      'font-weight': subProps['font-weight'] || '',
      'font-size': subProps['font-size'] || '',
      'letter-spacing': subProps['letter-spacing'] || '0',
      'color': subProps['color'] || '',
      'opacity': subProps['opacity'] || '1',
    },
    spacing: {
      'padding': cssVariables['--bp-pad'] || '',
      'margin': '0',
      'gap': cssVariables['--bp-gap'] || '',
    },
    borders: {
      'border-radius': cssVariables['--bp-rad'] || '',
      'border-width': timelineDotProps['border']?.split(' ')[0] || '',
      'border-color': timelineDotProps['border']?.split(' ').slice(2).join(' ') || '',
      'border-style': timelineDotProps['border']?.split(' ')[1] || '',
    },
    chevronPreset: {
      'clip-path': chevronProps['clip-path'] || 'none',
      'margin-left': chevronProps['margin-left'] || '0',
      'transition': chevronProps['transition'] || 'none',
      'box-shadow': chevronProps['box-shadow'] || 'none',
    },
    timelineDot: {
      'border-radius': '50%',
      'border-width': timelineDotProps['border']?.split(' ')[0] || '',
      'border-color': timelineDotProps['border']?.split(' ').slice(2).join(' ') || '',
      'border-style': timelineDotProps['border']?.split(' ')[1] || '',
      'box-shadow': timelineDotProps['box-shadow'] || 'none',
    },
  };
}

/**
 * Extract styles from Storefront CSS
 */
function extractStorefrontStyles(): EnvironmentStyles {
  const storefrontCSSPath = path.join(process.cwd(), 'extensions/bp-estimated-delivery/assets/bp-delivery.css');
  const cssContent = fs.readFileSync(storefrontCSSPath, 'utf-8');

  const cssVariables = parseCSSVariables(cssContent) as CSSVariables;
  const labelProps = parseCSSClass(cssContent, 'bp-text-label');
  const subProps = parseCSSClass(cssContent, 'bp-text-sub');
  const chevronProps = parseCSSClass(cssContent, 'bp-segment');
  const timelineDotProps = parseCSSClass(cssContent, 'bp-timeline-dot');

  return {
    cssVariables,
    labelTypography: {
      'font-weight': labelProps['font-weight'] || '',
      'font-size': labelProps['font-size'] || '',
      'letter-spacing': labelProps['letter-spacing'] || '0',
      'color': labelProps['color'] || '',
      'opacity': labelProps['opacity'] || '1',
    },
    subTextTypography: {
      'font-weight': subProps['font-weight'] || '',
      'font-size': subProps['font-size'] || '',
      'letter-spacing': subProps['letter-spacing'] || '0',
      'color': subProps['color'] || '',
      'opacity': subProps['opacity'] || '1',
    },
    spacing: {
      'padding': cssVariables['--bp-pad'] || '',
      'margin': '0',
      'gap': cssVariables['--bp-gap'] || '',
    },
    borders: {
      'border-radius': cssVariables['--bp-rad'] || '',
      'border-width': timelineDotProps['border']?.split(' ')[0] || '',
      'border-color': timelineDotProps['border']?.split(' ').slice(2).join(' ') || '',
      'border-style': timelineDotProps['border']?.split(' ')[1] || '',
    },
    chevronPreset: {
      'clip-path': chevronProps['clip-path'] || 'none',
      'margin-left': chevronProps['margin-left'] || '0',
      'transition': chevronProps['transition'] || 'none',
      'box-shadow': chevronProps['box-shadow'] || 'none',
    },
    timelineDot: {
      'border-radius': '50%',
      'border-width': timelineDotProps['border']?.split(' ')[0] || '',
      'border-color': timelineDotProps['border']?.split(' ').slice(2).join(' ') || '',
      'border-style': timelineDotProps['border']?.split(' ')[1] || '',
      'box-shadow': timelineDotProps['box-shadow'] || 'none',
    },
  };
}

/**
 * Extract mobile responsive styles
 */
function extractMobileStyles(environment: 'admin' | 'storefront'): Record<string, string> {
  const cssPath = environment === 'admin'
    ? path.join(process.cwd(), 'app/styles/bp-delivery.css')
    : path.join(process.cwd(), 'extensions/bp-estimated-delivery/assets/bp-delivery.css');
  
  const cssContent = fs.readFileSync(cssPath, 'utf-8');
  return parseMobileCSS(cssContent);
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('Bug Condition Exploration: 100% Style Synchronization Parity', () => {
  
  describe('Property 1.1: CSS Variables Match', () => {
    it('should have identical CSS variable values across Builder and Storefront', () => {
      const adminStyles = extractAdminStyles();
      const storefrontStyles = extractStorefrontStyles();

      // Expected counterexamples on unfixed code:
      // - Admin: --bp-pad: 20px, Storefront: --bp-pad: 16px (4px difference)
      // - Admin: --bp-rad: 16px, Storefront: --bp-rad: 12px (4px difference)
      // - Admin: --bp-gap: 14px, Storefront: --bp-gap: 12px (2px difference)
      // - Admin: --bp-bc: rgba(229, 231, 235, 0.8), Storefront: --bp-bc: #e5e7eb
      // - Admin: --bp-font: 'Inter', ..., Storefront: missing

      console.log('\n=== CSS Variables Comparison ===');
      console.log('Admin (Builder/Template):', adminStyles.cssVariables);
      console.log('Storefront:', storefrontStyles.cssVariables);

      // Assert all CSS variables match
      expect(adminStyles.cssVariables['--bp-pad']).toBe(storefrontStyles.cssVariables['--bp-pad']);
      expect(adminStyles.cssVariables['--bp-rad']).toBe(storefrontStyles.cssVariables['--bp-rad']);
      expect(adminStyles.cssVariables['--bp-gap']).toBe(storefrontStyles.cssVariables['--bp-gap']);
      expect(adminStyles.cssVariables['--bp-bc']).toBe(storefrontStyles.cssVariables['--bp-bc']);
      expect(adminStyles.cssVariables['--bp-font']).toBe(storefrontStyles.cssVariables['--bp-font']);
    });
  });

  describe('Property 1.2: Typography Match', () => {
    it('should have identical typography properties for .bp-text-label across environments', () => {
      const adminStyles = extractAdminStyles();
      const storefrontStyles = extractStorefrontStyles();

      // Expected counterexamples on unfixed code:
      // - Admin: font-weight: 800, Storefront: font-weight: 700
      // - Admin: font-size: 15px, Storefront: font-size: 14px
      // - Admin: letter-spacing: -0.01em, Storefront: letter-spacing: 0

      console.log('\n=== Label Typography Comparison ===');
      console.log('Admin (Builder/Template):', adminStyles.labelTypography);
      console.log('Storefront:', storefrontStyles.labelTypography);

      expect(adminStyles.labelTypography['font-weight']).toBe(storefrontStyles.labelTypography['font-weight']);
      expect(adminStyles.labelTypography['font-size']).toBe(storefrontStyles.labelTypography['font-size']);
      expect(adminStyles.labelTypography['letter-spacing']).toBe(storefrontStyles.labelTypography['letter-spacing']);
    });

    it('should have identical typography properties for .bp-text-sub across environments', () => {
      const adminStyles = extractAdminStyles();
      const storefrontStyles = extractStorefrontStyles();

      // Expected counterexamples on unfixed code:
      // - Admin: font-size: 12.5px, Storefront: font-size: 12px
      // - Admin: color: #6b7280, Storefront: opacity: 0.6

      console.log('\n=== Sub-text Typography Comparison ===');
      console.log('Admin (Builder/Template):', adminStyles.subTextTypography);
      console.log('Storefront:', storefrontStyles.subTextTypography);

      expect(adminStyles.subTextTypography['font-size']).toBe(storefrontStyles.subTextTypography['font-size']);
      
      // Check color rendering approach (either color or opacity)
      const adminHasColor = adminStyles.subTextTypography['color'] !== '';
      const storefrontHasColor = storefrontStyles.subTextTypography['color'] !== '';
      const adminHasOpacity = adminStyles.subTextTypography['opacity'] !== '1';
      const storefrontHasOpacity = storefrontStyles.subTextTypography['opacity'] !== '1';

      // Both should use the same approach (either color or opacity, not mixed)
      expect(adminHasColor).toBe(storefrontHasColor);
      expect(adminHasOpacity).toBe(storefrontHasOpacity);
    });
  });

  describe('Property 1.3: Spacing Match', () => {
    it('should have identical spacing values across environments', () => {
      const adminStyles = extractAdminStyles();
      const storefrontStyles = extractStorefrontStyles();

      // Expected counterexamples on unfixed code:
      // - Admin: padding: 20px, Storefront: padding: 16px
      // - Admin: gap: 14px, Storefront: gap: 12px

      console.log('\n=== Spacing Comparison ===');
      console.log('Admin (Builder/Template):', adminStyles.spacing);
      console.log('Storefront:', storefrontStyles.spacing);

      expect(adminStyles.spacing['padding']).toBe(storefrontStyles.spacing['padding']);
      expect(adminStyles.spacing['gap']).toBe(storefrontStyles.spacing['gap']);
    });
  });

  describe('Property 1.4: Border Match', () => {
    it('should have identical border properties for timeline dots across environments', () => {
      const adminStyles = extractAdminStyles();
      const storefrontStyles = extractStorefrontStyles();

      // Expected counterexamples on unfixed code:
      // - Admin: border: 2.5px solid #f1f5f9, Storefront: border: 2px solid #eee
      // - Admin: no box-shadow, Storefront: box-shadow: 0 0 0 4px var(--bp-bg)

      console.log('\n=== Timeline Dot Border Comparison ===');
      console.log('Admin (Builder/Template):', adminStyles.timelineDot);
      console.log('Storefront:', storefrontStyles.timelineDot);

      expect(adminStyles.timelineDot['border-width']).toBe(storefrontStyles.timelineDot['border-width']);
      expect(adminStyles.timelineDot['border-color']).toBe(storefrontStyles.timelineDot['border-color']);
      expect(adminStyles.timelineDot['box-shadow']).toBe(storefrontStyles.timelineDot['box-shadow']);
    });
  });

  describe('Property 1.5: Preset Styles Match (Chevron)', () => {
    it('should have identical chevron preset styles across environments', () => {
      const adminStyles = extractAdminStyles();
      const storefrontStyles = extractStorefrontStyles();

      // Expected counterexamples on unfixed code:
      // - Admin: clip-path: polygon(...), Storefront: clip-path: none
      // - Admin: margin-left: -6px, Storefront: margin-left: 0
      // - Admin: transition: all 0.3s ease, Storefront: transition: none

      console.log('\n=== Chevron Preset Comparison ===');
      console.log('Admin (Builder/Template):', adminStyles.chevronPreset);
      console.log('Storefront:', storefrontStyles.chevronPreset);

      expect(adminStyles.chevronPreset['clip-path']).toBe(storefrontStyles.chevronPreset['clip-path']);
      expect(adminStyles.chevronPreset['margin-left']).toBe(storefrontStyles.chevronPreset['margin-left']);
      expect(adminStyles.chevronPreset['transition']).toBe(storefrontStyles.chevronPreset['transition']);
    });
  });

  describe('Property 1.6: Mobile Responsive Match', () => {
    it('should have identical mobile responsive values at 480px viewport', () => {
      const adminMobile = extractMobileStyles('admin');
      const storefrontMobile = extractMobileStyles('storefront');

      // Expected counterexamples on unfixed code:
      // - Admin: --bp-pad: 16px, Storefront: --bp-pad: 12px
      // - Admin: label font-size: 13px, Storefront: label font-size: 12px
      // - Admin: sub font-size: 11px, Storefront: sub font-size: 10px
      // - Admin: timeline-dot: +20px, Storefront: timeline-dot: +12px

      console.log('\n=== Mobile Responsive Comparison (480px) ===');
      console.log('Admin (Builder/Template):', adminMobile);
      console.log('Storefront:', storefrontMobile);

      expect(adminMobile['--bp-pad']).toBe(storefrontMobile['--bp-pad']);
      expect(adminMobile['label-font-size']).toBe(storefrontMobile['label-font-size']);
      expect(adminMobile['sub-font-size']).toBe(storefrontMobile['sub-font-size']);
      expect(adminMobile['timeline-dot-width']).toBe(storefrontMobile['timeline-dot-width']);
    });
  });

  describe('Property-Based Test: Visual Output Parity', () => {
    it('should produce identical visual output for any widget settings across all environments', () => {
      // Property-based test using fast-check
      // Generate random widget settings and verify CSS values match

      const widgetSettingsArbitrary = fc.record({
        borderRadius: fc.integer({ min: 0, max: 24 }),
        padding: fc.integer({ min: 8, max: 32 }),
        textColor: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
        iconColor: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
        bgColor: fc.integer({ min: 0, max: 0xFFFFFF }).map(n => `#${n.toString(16).padStart(6, '0')}`),
      });

      fc.assert(
        fc.property(widgetSettingsArbitrary, (settings) => {
          // For any widget settings, the CSS defaults should be identical
          const adminStyles = extractAdminStyles();
          const storefrontStyles = extractStorefrontStyles();

          // Core CSS variables must match
          const cssVarsMatch = 
            adminStyles.cssVariables['--bp-pad'] === storefrontStyles.cssVariables['--bp-pad'] &&
            adminStyles.cssVariables['--bp-rad'] === storefrontStyles.cssVariables['--bp-rad'] &&
            adminStyles.cssVariables['--bp-gap'] === storefrontStyles.cssVariables['--bp-gap'];

          // Typography must match
          const typographyMatch =
            adminStyles.labelTypography['font-weight'] === storefrontStyles.labelTypography['font-weight'] &&
            adminStyles.labelTypography['font-size'] === storefrontStyles.labelTypography['font-size'];

          return cssVarsMatch && typographyMatch;
        }),
        { numRuns: 10 } // Run 10 test cases
      );
    });
  });
});
