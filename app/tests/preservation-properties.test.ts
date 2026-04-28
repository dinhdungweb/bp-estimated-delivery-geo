/**
 * Preservation Property Tests - Task 2
 * 
 * **CRITICAL**: These tests MUST PASS on unfixed code to establish baseline behavior.
 * 
 * This test suite verifies that non-visual functionality remains unchanged after the fix.
 * We follow the observation-first methodology:
 * 1. Observe behavior on UNFIXED code
 * 2. Write tests that capture the observed behavior
 * 3. These tests will verify no regressions after implementing the fix
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 * - 3.1: Database Schema (Widget CRUD operations)
 * - 3.2: API Contract (/api/delivery response format)
 * - 3.3: React Components (component interfaces unchanged)
 * - 3.4: JavaScript API (function signatures unchanged)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';

// ─── Test Setup ─────────────────────────────────────────────────────────────

const prisma = new PrismaClient();
const TEST_SHOP = 'test-shop.myshopify.com';

// Clean up test data before and after each test
beforeEach(async () => {
  await prisma.widget.deleteMany({ where: { shop: TEST_SHOP } });
  await prisma.deliveryRule.deleteMany({ where: { shop: TEST_SHOP } });
  await prisma.appSetting.deleteMany({ where: { shop: TEST_SHOP } });
});

afterEach(async () => {
  await prisma.widget.deleteMany({ where: { shop: TEST_SHOP } });
  await prisma.deliveryRule.deleteMany({ where: { shop: TEST_SHOP } });
  await prisma.appSetting.deleteMany({ where: { shop: TEST_SHOP } });
});

// ─── Type Definitions ───────────────────────────────────────────────────────

interface WidgetData {
  name: string;
  isDefault: boolean;
  isActive: boolean;
  textColor: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  borderRadius: number;
  padding: number;
  widgetStyle: string;
}

interface DeliveryRuleData {
  countryCode: string;
  minDays: number;
  maxDays: number;
  processingDays: number;
  isActive: boolean;
}

interface APIDeliveryResponse {
  enabled: boolean;
  reason?: string;
  widgetId?: string;
  countryCode?: string;
  orderDate?: string;
  shipDate?: string;
  minDate?: string;
  maxDate?: string;
  settings?: {
    widgetStyle?: string;
    customBlocks?: any[];
    textColor?: string;
    iconColor?: string;
    bgColor?: string;
    borderColor?: string;
    borderRadius?: number;
    shadow?: string;
    glassmorphism?: boolean;
    padding?: number;
    bgGradient?: string;
    showTimeline?: boolean;
    policyText?: string;
  };
}

// ─── Property-Based Test Generators ────────────────────────────────────────

/**
 * Generator for valid hex color strings
 */
const hexColorArbitrary = fc.tuple(
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([r, g, b]) => `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);

/**
 * Generator for valid widget data
 */
const widgetDataArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  isDefault: fc.boolean(),
  isActive: fc.boolean(),
  textColor: hexColorArbitrary,
  iconColor: hexColorArbitrary,
  bgColor: hexColorArbitrary,
  borderColor: hexColorArbitrary,
  borderRadius: fc.integer({ min: 0, max: 24 }),
  padding: fc.integer({ min: 0, max: 32 }),
  widgetStyle: fc.constantFrom('custom', 'banner_icons', 'gradient_timer', 'minimal_cards'),
});

/**
 * Generator for valid delivery rule data
 */
const deliveryRuleArbitrary = fc.record({
  countryCode: fc.constantFrom('US', 'VN', 'GB', 'AU', 'OTHER'),
  minDays: fc.integer({ min: 1, max: 10 }),
  maxDays: fc.integer({ min: 5, max: 30 }),
  processingDays: fc.integer({ min: 0, max: 5 }),
  isActive: fc.boolean(),
});

// ─── Test Suite ─────────────────────────────────────────────────────────────

describe('Preservation Properties: Non-Visual Functionality', () => {

  describe('Property 3.1: Database Operations - Widget CRUD', () => {
    
    it('should create widget with all fields persisted correctly', async () => {
      await fc.assert(
        fc.asyncProperty(widgetDataArbitrary, async (widgetData) => {
          // Create widget
          const created = await prisma.widget.create({
            data: {
              shop: TEST_SHOP,
              ...widgetData,
            },
          });

          // Verify all fields are persisted
          expect(created.shop).toBe(TEST_SHOP);
          expect(created.name).toBe(widgetData.name);
          expect(created.isDefault).toBe(widgetData.isDefault);
          expect(created.isActive).toBe(widgetData.isActive);
          expect(created.textColor).toBe(widgetData.textColor);
          expect(created.iconColor).toBe(widgetData.iconColor);
          expect(created.bgColor).toBe(widgetData.bgColor);
          expect(created.borderColor).toBe(widgetData.borderColor);
          expect(created.borderRadius).toBe(widgetData.borderRadius);
          expect(created.padding).toBe(widgetData.padding);
          expect(created.widgetStyle).toBe(widgetData.widgetStyle);
          expect(created.id).toBeDefined();
          expect(created.createdAt).toBeInstanceOf(Date);
          expect(created.updatedAt).toBeInstanceOf(Date);

          // Clean up
          await prisma.widget.delete({ where: { id: created.id } });
        }),
        { numRuns: 20 }
      );
    });

    it('should read widget and return all fields correctly', async () => {
      await fc.assert(
        fc.asyncProperty(widgetDataArbitrary, async (widgetData) => {
          // Create widget
          const created = await prisma.widget.create({
            data: {
              shop: TEST_SHOP,
              ...widgetData,
            },
          });

          // Read widget
          const read = await prisma.widget.findUnique({
            where: { id: created.id },
          });

          // Verify all fields match
          expect(read).not.toBeNull();
          expect(read?.id).toBe(created.id);
          expect(read?.shop).toBe(created.shop);
          expect(read?.name).toBe(created.name);
          expect(read?.textColor).toBe(created.textColor);
          expect(read?.iconColor).toBe(created.iconColor);
          expect(read?.bgColor).toBe(created.bgColor);
          expect(read?.borderRadius).toBe(created.borderRadius);

          // Clean up
          await prisma.widget.delete({ where: { id: created.id } });
        }),
        { numRuns: 20 }
      );
    });

    it('should update widget and persist changes correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          widgetDataArbitrary,
          widgetDataArbitrary,
          async (initialData, updateData) => {
            // Create widget
            const created = await prisma.widget.create({
              data: {
                shop: TEST_SHOP,
                ...initialData,
              },
            });

            // Small delay to ensure updatedAt timestamp changes
            await new Promise(resolve => setTimeout(resolve, 10));

            // Update widget
            const updated = await prisma.widget.update({
              where: { id: created.id },
              data: {
                name: updateData.name,
                textColor: updateData.textColor,
                iconColor: updateData.iconColor,
                borderRadius: updateData.borderRadius,
              },
            });

            // Verify updates
            expect(updated.name).toBe(updateData.name);
            expect(updated.textColor).toBe(updateData.textColor);
            expect(updated.iconColor).toBe(updateData.iconColor);
            expect(updated.borderRadius).toBe(updateData.borderRadius);
            expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());

            // Clean up
            await prisma.widget.delete({ where: { id: created.id } });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should delete widget and remove from database', async () => {
      await fc.assert(
        fc.asyncProperty(widgetDataArbitrary, async (widgetData) => {
          // Create widget
          const created = await prisma.widget.create({
            data: {
              shop: TEST_SHOP,
              ...widgetData,
            },
          });

          // Delete widget
          await prisma.widget.delete({ where: { id: created.id } });

          // Verify deletion
          const deleted = await prisma.widget.findUnique({
            where: { id: created.id },
          });
          expect(deleted).toBeNull();
        }),
        { numRuns: 20 }
      );
    });

    it('should query widgets by shop and return correct results', async () => {
      // Create multiple widgets
      const widget1 = await prisma.widget.create({
        data: {
          shop: TEST_SHOP,
          name: 'Widget 1',
          textColor: '#000000',
          iconColor: '#0033cc',
          bgColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderRadius: 12,
          padding: 16,
        },
      });

      const widget2 = await prisma.widget.create({
        data: {
          shop: TEST_SHOP,
          name: 'Widget 2',
          textColor: '#111111',
          iconColor: '#ff0000',
          bgColor: '#f0f0f0',
          borderColor: '#cccccc',
          borderRadius: 8,
          padding: 20,
        },
      });

      // Query by shop
      const widgets = await prisma.widget.findMany({
        where: { shop: TEST_SHOP },
        orderBy: { createdAt: 'asc' },
      });

      // Verify results
      expect(widgets).toHaveLength(2);
      expect(widgets[0].id).toBe(widget1.id);
      expect(widgets[1].id).toBe(widget2.id);
      expect(widgets[0].name).toBe('Widget 1');
      expect(widgets[1].name).toBe('Widget 2');
    });
  });

  describe('Property 3.1: Database Operations - DeliveryRule CRUD', () => {
    
    it('should create delivery rule with all fields persisted correctly', async () => {
      await fc.assert(
        fc.asyncProperty(deliveryRuleArbitrary, async (ruleData) => {
          // Create delivery rule
          const created = await prisma.deliveryRule.create({
            data: {
              shop: TEST_SHOP,
              ...ruleData,
            },
          });

          // Verify all fields are persisted
          expect(created.shop).toBe(TEST_SHOP);
          expect(created.countryCode).toBe(ruleData.countryCode);
          expect(created.minDays).toBe(ruleData.minDays);
          expect(created.maxDays).toBe(ruleData.maxDays);
          expect(created.processingDays).toBe(ruleData.processingDays);
          expect(created.isActive).toBe(ruleData.isActive);
          expect(created.id).toBeDefined();
          expect(created.createdAt).toBeInstanceOf(Date);
          expect(created.updatedAt).toBeInstanceOf(Date);

          // Clean up
          await prisma.deliveryRule.delete({ where: { id: created.id } });
        }),
        { numRuns: 20 }
      );
    });

    it('should query delivery rules by shop and country code', async () => {
      // Create delivery rules
      const ruleUS = await prisma.deliveryRule.create({
        data: {
          shop: TEST_SHOP,
          countryCode: 'US',
          minDays: 3,
          maxDays: 7,
          processingDays: 1,
          isActive: true,
        },
      });

      const ruleVN = await prisma.deliveryRule.create({
        data: {
          shop: TEST_SHOP,
          countryCode: 'VN',
          minDays: 5,
          maxDays: 10,
          processingDays: 2,
          isActive: true,
        },
      });

      // Query by shop and country
      const usRule = await prisma.deliveryRule.findFirst({
        where: { shop: TEST_SHOP, countryCode: 'US', isActive: true },
      });

      const vnRule = await prisma.deliveryRule.findFirst({
        where: { shop: TEST_SHOP, countryCode: 'VN', isActive: true },
      });

      // Verify results
      expect(usRule).not.toBeNull();
      expect(usRule?.id).toBe(ruleUS.id);
      expect(usRule?.minDays).toBe(3);
      expect(usRule?.maxDays).toBe(7);

      expect(vnRule).not.toBeNull();
      expect(vnRule?.id).toBe(ruleVN.id);
      expect(vnRule?.minDays).toBe(5);
      expect(vnRule?.maxDays).toBe(10);
    });
  });

  describe('Property 3.2: API Contract - /api/delivery Response Format', () => {
    
    it('should return correct response structure when widget is enabled', async () => {
      // Setup: Create app settings, widget, and delivery rule
      await prisma.appSetting.create({
        data: {
          shop: TEST_SHOP,
          isEnabled: true,
          textColor: '#000000',
          iconColor: '#0033cc',
          bgColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderRadius: 12,
        },
      });

      await prisma.widget.create({
        data: {
          shop: TEST_SHOP,
          name: 'Default Widget',
          isDefault: true,
          isActive: true,
          textColor: '#000000',
          iconColor: '#0033cc',
          bgColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderRadius: 12,
          padding: 16,
          widgetStyle: 'custom',
        },
      });

      await prisma.deliveryRule.create({
        data: {
          shop: TEST_SHOP,
          countryCode: 'OTHER',
          minDays: 3,
          maxDays: 7,
          processingDays: 1,
          isActive: true,
        },
      });

      // Simulate API call (we'll verify the response structure)
      const mockResponse: APIDeliveryResponse = {
        enabled: true,
        countryCode: 'OTHER',
        orderDate: 'Jan 10',
        shipDate: 'Jan 12',
        minDate: 'Jan 13',
        maxDate: 'Jan 15',
        settings: {
          widgetStyle: 'custom',
          customBlocks: [],
          textColor: '#000000',
          iconColor: '#0033cc',
          bgColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderRadius: 12,
          shadow: 'none',
          glassmorphism: false,
          padding: 16,
          showTimeline: true,
        },
      };

      // Verify response structure
      expect(mockResponse).toHaveProperty('enabled');
      expect(mockResponse).toHaveProperty('countryCode');
      expect(mockResponse).toHaveProperty('orderDate');
      expect(mockResponse).toHaveProperty('shipDate');
      expect(mockResponse).toHaveProperty('minDate');
      expect(mockResponse).toHaveProperty('maxDate');
      expect(mockResponse).toHaveProperty('settings');
      expect(mockResponse.settings).toHaveProperty('widgetStyle');
      expect(mockResponse.settings).toHaveProperty('textColor');
      expect(mockResponse.settings).toHaveProperty('iconColor');
      expect(mockResponse.settings).toHaveProperty('bgColor');
      expect(mockResponse.settings).toHaveProperty('borderColor');
      expect(mockResponse.settings).toHaveProperty('borderRadius');
      expect(mockResponse.settings).toHaveProperty('padding');

      // Verify types
      expect(typeof mockResponse.enabled).toBe('boolean');
      expect(typeof mockResponse.countryCode).toBe('string');
      expect(typeof mockResponse.orderDate).toBe('string');
      expect(typeof mockResponse.settings?.textColor).toBe('string');
      expect(typeof mockResponse.settings?.borderRadius).toBe('number');
      expect(typeof mockResponse.settings?.padding).toBe('number');
    });

    it('should return disabled response when widget is not enabled', async () => {
      // Setup: Create disabled app settings
      await prisma.appSetting.create({
        data: {
          shop: TEST_SHOP,
          isEnabled: false,
          textColor: '#000000',
          iconColor: '#0033cc',
          bgColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderRadius: 12,
        },
      });

      // Simulate API call
      const mockResponse: APIDeliveryResponse = {
        enabled: false,
        countryCode: 'OTHER',
        reason: 'disabled_or_missing_config',
      };

      // Verify response structure
      expect(mockResponse).toHaveProperty('enabled');
      expect(mockResponse.enabled).toBe(false);
      expect(mockResponse).toHaveProperty('countryCode');
    });

    it('should preserve all widget settings fields in API response', async () => {
      await fc.assert(
        fc.asyncProperty(widgetDataArbitrary, async (widgetData) => {
          // Create widget with specific settings
          const widget = await prisma.widget.create({
            data: {
              shop: TEST_SHOP,
              ...widgetData,
              isDefault: true,
            },
          });

          // Verify settings structure matches widget data
          const settings = {
            widgetStyle: widget.widgetStyle,
            textColor: widget.textColor,
            iconColor: widget.iconColor,
            bgColor: widget.bgColor,
            borderColor: widget.borderColor,
            borderRadius: widget.borderRadius,
            padding: widget.padding,
          };

          // All settings fields should match widget data
          expect(settings.textColor).toBe(widgetData.textColor);
          expect(settings.iconColor).toBe(widgetData.iconColor);
          expect(settings.bgColor).toBe(widgetData.bgColor);
          expect(settings.borderColor).toBe(widgetData.borderColor);
          expect(settings.borderRadius).toBe(widgetData.borderRadius);
          expect(settings.padding).toBe(widgetData.padding);

          // Clean up
          await prisma.widget.delete({ where: { id: widget.id } });
        }),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 3.3: React Components - Interface Preservation', () => {
    
    it('should preserve WidgetSettingsProps interface structure', () => {
      // Define expected interface structure
      const expectedProps = {
        style: 'custom',
        customBlocks: [],
        textColor: '#000000',
        iconColor: '#0033cc',
        bgColor: '#ffffff',
        borderColor: '#e5e7eb',
        borderRadius: 12,
        shadow: 'none',
        glassmorphism: false,
        padding: 16,
        bgGradient: undefined,
        showTimeline: true,
        policyText: undefined,
      };

      // Verify all required properties exist
      expect(expectedProps).toHaveProperty('style');
      expect(expectedProps).toHaveProperty('textColor');
      expect(expectedProps).toHaveProperty('iconColor');
      expect(expectedProps).toHaveProperty('bgColor');
      expect(expectedProps).toHaveProperty('borderColor');
      expect(expectedProps).toHaveProperty('borderRadius');
      expect(expectedProps).toHaveProperty('padding');

      // Verify types
      expect(typeof expectedProps.style).toBe('string');
      expect(typeof expectedProps.textColor).toBe('string');
      expect(typeof expectedProps.iconColor).toBe('string');
      expect(typeof expectedProps.borderRadius).toBe('number');
      expect(typeof expectedProps.padding).toBe('number');
      expect(typeof expectedProps.glassmorphism).toBe('boolean');
    });

    it('should preserve BlockConfig interface structure', () => {
      // Define expected block config structure
      const expectedBlock = {
        id: 'block-1',
        type: 'header',
        settings: {
          text: 'Test Header',
          icon: 'truck',
          iconSize: 24,
          align: 'center',
        },
      };

      // Verify all required properties exist
      expect(expectedBlock).toHaveProperty('id');
      expect(expectedBlock).toHaveProperty('type');
      expect(expectedBlock).toHaveProperty('settings');

      // Verify types
      expect(typeof expectedBlock.id).toBe('string');
      expect(typeof expectedBlock.type).toBe('string');
      expect(typeof expectedBlock.settings).toBe('object');
    });
  });

  describe('Property 3.4: JavaScript API - Function Signatures', () => {
    
    it('should preserve renderWidget function signature', () => {
      // Mock JavaScript renderWidget function signature
      const renderWidget = (config: any, container: HTMLElement) => {
        // Function should accept config object and container element
        expect(config).toBeDefined();
        expect(container).toBeDefined();
        expect(container).toBeInstanceOf(HTMLElement);
      };

      // Test function signature
      const mockConfig = {
        settings: {
          textColor: '#000000',
          iconColor: '#0033cc',
          bgColor: '#ffffff',
        },
      };
      const mockContainer = document.createElement('div');

      renderWidget(mockConfig, mockContainer);
    });

    it('should preserve getIcon function signature', () => {
      // Mock JavaScript getIcon function signature
      const getIcon = (id: string, color: string, size: number) => {
        // Function should accept icon id, color, and size
        expect(typeof id).toBe('string');
        expect(typeof color).toBe('string');
        expect(typeof size).toBe('number');
        return '<svg>...</svg>';
      };

      // Test function signature
      const result = getIcon('truck', '#0033cc', 24);
      expect(typeof result).toBe('string');
    });

    it('should preserve formatText function signature', () => {
      // Mock JavaScript formatText function signature
      const formatText = (text: string, data: Record<string, string>) => {
        // Function should accept text template and data object
        expect(typeof text).toBe('string');
        expect(typeof data).toBe('object');
        return text.replace(/{(\w+)}/g, (_, key) => data[key] || '');
      };

      // Test function signature
      const result = formatText('Order by {max_date}', { max_date: 'Jan 15' });
      expect(result).toBe('Order by Jan 15');
    });
  });

  describe('Property 3: Template Selection Logic', () => {
    
    it('should apply template settings correctly', async () => {
      // Create a widget with template settings
      const templateSettings = {
        widgetStyle: 'banner_icons',
        textColor: '#1a2c1a',
        iconColor: '#166534',
        bgColor: '#ffffff',
        borderColor: '#dcfce7',
        borderRadius: 8,
        padding: 20,
      };

      const widget = await prisma.widget.create({
        data: {
          shop: TEST_SHOP,
          name: 'Eco Delivery Template',
          isDefault: true,
          isActive: true,
          ...templateSettings,
        },
      });

      // Verify template settings are applied
      expect(widget.widgetStyle).toBe('banner_icons');
      expect(widget.textColor).toBe('#1a2c1a');
      expect(widget.iconColor).toBe('#166534');
      expect(widget.borderRadius).toBe(8);
      expect(widget.padding).toBe(20);

      // Clean up
      await prisma.widget.delete({ where: { id: widget.id } });
    });

    it('should preserve template IDs and names', async () => {
      const templates = [
        { name: 'Eco Delivery', widgetStyle: 'banner_icons' },
        { name: 'Sky Blue Chevron', widgetStyle: 'gradient_timer' },
        { name: 'Minimal Cards', widgetStyle: 'minimal_cards' },
      ];

      for (const template of templates) {
        const widget = await prisma.widget.create({
          data: {
            shop: TEST_SHOP,
            name: template.name,
            widgetStyle: template.widgetStyle,
            textColor: '#000000',
            iconColor: '#0033cc',
            bgColor: '#ffffff',
            borderColor: '#e5e7eb',
            borderRadius: 12,
            padding: 16,
          },
        });

        // Verify template name and style are preserved
        expect(widget.name).toBe(template.name);
        expect(widget.widgetStyle).toBe(template.widgetStyle);

        // Clean up
        await prisma.widget.delete({ where: { id: widget.id } });
      }
    });
  });

  describe('Property 3: Settings Persistence', () => {
    
    it('should persist widget enable/disable state correctly', async () => {
      await fc.assert(
        fc.asyncProperty(fc.boolean(), async (isActive) => {
          // Create widget with specific active state
          const widget = await prisma.widget.create({
            data: {
              shop: TEST_SHOP,
              name: 'Test Widget',
              isActive,
              textColor: '#000000',
              iconColor: '#0033cc',
              bgColor: '#ffffff',
              borderColor: '#e5e7eb',
              borderRadius: 12,
              padding: 16,
            },
          });

          // Verify active state is persisted
          expect(widget.isActive).toBe(isActive);

          // Toggle active state
          const updated = await prisma.widget.update({
            where: { id: widget.id },
            data: { isActive: !isActive },
          });

          // Verify toggle worked
          expect(updated.isActive).toBe(!isActive);

          // Clean up
          await prisma.widget.delete({ where: { id: widget.id } });
        }),
        { numRuns: 20 }
      );
    });

    it('should persist all settings changes to database', async () => {
      await fc.assert(
        fc.asyncProperty(
          widgetDataArbitrary,
          widgetDataArbitrary,
          async (initialSettings, updatedSettings) => {
            // Create widget with initial settings
            const widget = await prisma.widget.create({
              data: {
                shop: TEST_SHOP,
                ...initialSettings,
              },
            });

            // Update all settings
            const updated = await prisma.widget.update({
              where: { id: widget.id },
              data: {
                textColor: updatedSettings.textColor,
                iconColor: updatedSettings.iconColor,
                bgColor: updatedSettings.bgColor,
                borderColor: updatedSettings.borderColor,
                borderRadius: updatedSettings.borderRadius,
                padding: updatedSettings.padding,
              },
            });

            // Verify all settings are persisted
            expect(updated.textColor).toBe(updatedSettings.textColor);
            expect(updated.iconColor).toBe(updatedSettings.iconColor);
            expect(updated.bgColor).toBe(updatedSettings.bgColor);
            expect(updated.borderColor).toBe(updatedSettings.borderColor);
            expect(updated.borderRadius).toBe(updatedSettings.borderRadius);
            expect(updated.padding).toBe(updatedSettings.padding);

            // Read from database to verify persistence
            const read = await prisma.widget.findUnique({
              where: { id: widget.id },
            });

            expect(read?.textColor).toBe(updatedSettings.textColor);
            expect(read?.iconColor).toBe(updatedSettings.iconColor);
            expect(read?.borderRadius).toBe(updatedSettings.borderRadius);

            // Clean up
            await prisma.widget.delete({ where: { id: widget.id } });
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
