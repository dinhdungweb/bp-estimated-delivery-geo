# Bug Condition Exploration - Counterexamples Found

**Test Date:** 2025-01-XX  
**Test Status:** ✅ PASSED (Bug successfully detected)  
**Test File:** `app/tests/bug-condition-exploration.test.ts`

## Summary

The bug condition exploration test **FAILED AS EXPECTED** on unfixed code, confirming that the bug exists. The test surfaced 7 distinct counterexamples demonstrating visual differences between Builder Preview/Template Gallery (Admin CSS) and Storefront (Storefront CSS).

---

## Counterexample 1: CSS Variables Mismatch

**Property Tested:** 1.1 - CSS Variables Match

### Differences Found:

| CSS Variable | Admin (Builder/Template) | Storefront | Difference |
|--------------|--------------------------|------------|------------|
| `--bp-pad` | `20px` | `16px` | **4px smaller** |
| `--bp-rad` | `16px` | `12px` | **4px smaller** |
| `--bp-gap` | `14px` | `12px` | **2px smaller** |
| `--bp-bc` | `rgba(229, 231, 235, 0.8)` | `#e5e7eb` | **Alpha vs solid** |
| `--bp-font` | `'Inter', system-ui, -apple-system, sans-serif` | *(missing)* | **Font family missing** |

**Impact:** Widgets in storefront have smaller padding, border-radius, and gap values, resulting in a more compact appearance.

---

## Counterexample 2: Typography Mismatch (.bp-text-label)

**Property Tested:** 1.2 - Typography Match

### Differences Found:

| Property | Admin (Builder/Template) | Storefront | Difference |
|----------|--------------------------|------------|------------|
| `font-weight` | `800` | `700` | **Lighter weight** |
| `font-size` | `15px` | `14px` | **1px smaller** |
| `letter-spacing` | `-0.01em` | `0` | **No letter spacing** |
| `color` | `#111827` | *(missing)* | **No explicit color** |

**Impact:** Label text in storefront is lighter, smaller, and has different letter spacing, making it less bold and prominent.

---

## Counterexample 3: Typography Mismatch (.bp-text-sub)

**Property Tested:** 1.2 - Typography Match

### Differences Found:

| Property | Admin (Builder/Template) | Storefront | Difference |
|----------|--------------------------|------------|------------|
| `font-size` | `12.5px` | `12px` | **0.5px smaller** |
| `color` | `#6b7280` | *(missing)* | **Uses opacity instead** |
| `opacity` | `1` | `0.6` | **Different approach** |
| `font-weight` | `500` | *(missing)* | **No explicit weight** |

**Impact:** Sub-text in storefront is smaller and uses opacity for dimming instead of a specific color, resulting in different visual rendering.

---

## Counterexample 4: Spacing Mismatch

**Property Tested:** 1.3 - Spacing Match

### Differences Found:

| Property | Admin (Builder/Template) | Storefront | Difference |
|----------|--------------------------|------------|------------|
| `padding` | `20px` | `16px` | **4px smaller** |
| `gap` | `14px` | `12px` | **2px smaller** |

**Impact:** Widgets in storefront have less internal spacing, making them more compact.

---

## Counterexample 5: Border Mismatch (Timeline Dots)

**Property Tested:** 1.4 - Border Match

### Differences Found:

| Property | Admin (Builder/Template) | Storefront | Difference |
|----------|--------------------------|------------|------------|
| `border-width` | `2.5px` | `2px` | **0.5px thinner** |
| `border-color` | `#f1f5f9` | `#eee` | **Different color** |
| `box-shadow` | `0 4px 6px -1px rgba(0,0,0,0.05)` | `0 0 0 4px var(--bp-bg)` | **Different shadow** |

**Impact:** Timeline dots in storefront have thinner borders, different colors, and different shadow effects.

---

## Counterexample 6: Chevron Preset Mismatch

**Property Tested:** 1.5 - Preset Styles Match (Chevron)

### Differences Found:

| Property | Admin (Builder/Template) | Storefront | Difference |
|----------|--------------------------|------------|------------|
| `clip-path` | `polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%, 8% 50%)` | `none` | **No chevron shape** |
| `margin-left` | `-6px` | `0` | **No overlapping** |
| `transition` | `all 0.3s ease` | `none` | **No animation** |

**Impact:** **CRITICAL** - Chevron preset in storefront displays as regular boxes instead of arrow shapes. This is a complete visual mismatch.

---

## Counterexample 7: Property-Based Test Failure

**Property Tested:** Visual Output Parity (Property-Based)

### Generated Counterexample:

```json
{
  "borderRadius": 0,
  "padding": 8,
  "textColor": "#000000",
  "iconColor": "#000000",
  "bgColor": "#000000"
}
```

**Failure Reason:** For any widget settings, the CSS defaults don't match across environments. The property-based test confirmed that the bug is systematic and affects all widget configurations.

---

## Root Cause Confirmation

The counterexamples confirm the root causes identified in the bugfix design:

1. ✅ **Divergent CSS Files** - Admin and Storefront CSS have different variable values
2. ✅ **Typography Inconsistency** - Font sizes, weights, and letter-spacing differ
3. ✅ **Missing Styles** - Storefront missing chevron clip-path, font variables, and other properties
4. ✅ **Different Approaches** - Color vs opacity for sub-text dimming

---

## Next Steps

1. ✅ **Task 1 Complete** - Bug condition exploration test written and run on unfixed code
2. ⏭️ **Task 2** - Write preservation property tests (before implementing fix)
3. ⏭️ **Task 3** - Implement fix for 100% style synchronization parity
4. ⏭️ **Task 4** - Verify bug condition test passes after fix

---

## Test Execution Details

- **Test Framework:** Vitest + fast-check (property-based testing)
- **Test File:** `app/tests/bug-condition-exploration.test.ts`
- **Total Tests:** 8 (7 failed, 1 passed)
- **Expected Outcome:** ✅ Tests FAIL on unfixed code (confirms bug exists)
- **Actual Outcome:** ✅ Tests FAILED as expected
- **PBT Status:** ✅ PASSED (bug successfully detected)

---

## Visual Impact Summary

| Environment | Padding | Border Radius | Font Weight | Font Size | Chevron |
|-------------|---------|---------------|-------------|-----------|---------|
| **Admin (Builder/Template)** | 20px | 16px | 800 | 15px | ✅ Arrow shape |
| **Storefront** | 16px | 12px | 700 | 14px | ❌ Regular boxes |
| **Difference** | -4px | -4px | -100 | -1px | **Complete mismatch** |

**Conclusion:** The bug is confirmed. Widgets in storefront are visually different from builder/template gallery across multiple dimensions (spacing, typography, borders, and preset styles).
