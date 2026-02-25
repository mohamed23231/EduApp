// Feature: auth-baseline-parent-mvp, Property 12: Translation Key Completeness
/**
 * Property 12: Translation Key Completeness
 *
 * For any translation key referenced in parent module source files (under parent.* namespace),
 * the key SHALL exist in both en.json and ar.json translation files with a non-empty string value.
 *
 * This property test scans all parent.* translation keys referenced in source files and verifies:
 * 1. Each key exists in en.json with a non-empty string value
 * 2. Each key exists in ar.json with a non-empty string value
 * 3. No keys are missing from either locale file
 *
 * Validates: Requirements 8.6, 9.7, 10.6, 11.5, 12.7, 17.2
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as fc from 'fast-check';

// ─── Translation File Loading ────────────────────────────────────────────────

/**
 * Load translation files from the mobile app
 */
function loadTranslationFiles(): {
  en: Record<string, any>;
  ar: Record<string, any>;
} {
  const translationsDir = path.join(__dirname, '..');
  const enPath = path.join(translationsDir, 'en.json');
  const arPath = path.join(translationsDir, 'ar.json');

  const enContent = fs.readFileSync(enPath, 'utf-8');
  const arContent = fs.readFileSync(arPath, 'utf-8');

  return {
    en: JSON.parse(enContent),
    ar: JSON.parse(arContent),
  };
}

/**
 * Recursively extract all keys from a nested object using dot notation
 * Example: { parent: { dashboard: { title: "My Students" } } }
 *          → ["parent.dashboard.title"]
 */
function extractKeysFromObject(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      keys.push(fullKey);
    }
    else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeysFromObject(value, fullKey));
    }
  }

  return keys;
}

/**
 * Get a nested value from an object using dot notation
 * Example: getNestedValue({ parent: { dashboard: { title: "..." } } }, "parent.dashboard.title")
 */
function getNestedValue(obj: Record<string, any>, keyPath: string): any {
  const parts = keyPath.split('.');
  let current = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    }
    else {
      return undefined;
    }
  }

  return current;
}

/**
 * Scan source files for all parent.* translation key references
 */
function scanSourceFilesForParentKeys(): Set<string> {
  const parentKeysSet = new Set<string>();
  const srcDir = path.join(__dirname, '../../modules/parent');

  // Recursively scan all TypeScript/TSX files
  function scanDirectory(dir: string) {
    if (!fs.existsSync(dir)) {
      return;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules and __tests__ directories for now (we'll scan them separately)
        if (file !== 'node_modules') {
          scanDirectory(filePath);
        }
      }
      else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Match patterns like t('parent.xxx.yyy') or t("parent.xxx.yyy")
        const regex = /t\(['"]parent\.([^'"]+)['"]\)/g;
        let match;

        while ((match = regex.exec(content)) !== null) {
          const fullKey = `parent.${match[1]}`;
          parentKeysSet.add(fullKey);
        }
      }
    }
  }

  scanDirectory(srcDir);
  return parentKeysSet;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line max-lines-per-function
describe('translation Completeness - Property 12: Translation Key Completeness', () => {
  let translations: { en: Record<string, any>; ar: Record<string, any> };
  let parentKeysFromSource: Set<string>;
  let allParentKeysInTranslations: Set<string>;

  beforeAll(() => {
    translations = loadTranslationFiles();
    parentKeysFromSource = scanSourceFilesForParentKeys();

    // Extract all parent.* keys from translation files
    const enParentKeys = extractKeysFromObject(translations.en.parent || {}, 'parent');
    const arParentKeys = extractKeysFromObject(translations.ar.parent || {}, 'parent');

    allParentKeysInTranslations = new Set([...enParentKeys, ...arParentKeys]);
  });

  it('should have all parent.* keys from source files defined in both en.json and ar.json', () => {
    const missingInEn: string[] = [];
    const missingInAr: string[] = [];
    const emptyInEn: string[] = [];
    const emptyInAr: string[] = [];

    for (const key of parentKeysFromSource) {
      const enValue = getNestedValue(translations.en, key);
      const arValue = getNestedValue(translations.ar, key);

      // Check if key exists in en.json
      if (enValue === undefined) {
        missingInEn.push(key);
      }
      else if (typeof enValue === 'string' && enValue.trim().length === 0) {
        emptyInEn.push(key);
      }

      // Check if key exists in ar.json
      if (arValue === undefined) {
        missingInAr.push(key);
      }
      else if (typeof arValue === 'string' && arValue.trim().length === 0) {
        emptyInAr.push(key);
      }
    }

    // Report all issues
    const issues: string[] = [];
    if (missingInEn.length > 0) {
      issues.push(`Missing in en.json: ${missingInEn.join(', ')}`);
    }
    if (missingInAr.length > 0) {
      issues.push(`Missing in ar.json: ${missingInAr.join(', ')}`);
    }
    if (emptyInEn.length > 0) {
      issues.push(`Empty in en.json: ${emptyInEn.join(', ')}`);
    }
    if (emptyInAr.length > 0) {
      issues.push(`Empty in ar.json: ${emptyInAr.join(', ')}`);
    }

    expect(issues).toEqual([]);
  });

  it('should have non-empty string values for all parent.* keys in en.json', () => {
    const enParentKeys = extractKeysFromObject(translations.en.parent || {}, 'parent');

    for (const key of enParentKeys) {
      const value = getNestedValue(translations.en, key);
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it('should have non-empty string values for all parent.* keys in ar.json', () => {
    const arParentKeys = extractKeysFromObject(translations.ar.parent || {}, 'parent');

    for (const key of arParentKeys) {
      const value = getNestedValue(translations.ar, key);
      expect(typeof value).toBe('string');
      expect(value.trim().length).toBeGreaterThan(0);
    }
  });

  it('should have matching key structure between en.json and ar.json parent namespace', () => {
    const enParentKeys = new Set(extractKeysFromObject(translations.en.parent || {}, 'parent'));
    const arParentKeys = new Set(extractKeysFromObject(translations.ar.parent || {}, 'parent'));

    // Check for keys in en but not in ar
    const missingInAr = Array.from(enParentKeys).filter(key => !arParentKeys.has(key));

    // Check for keys in ar but not in en
    const missingInEn = Array.from(arParentKeys).filter(key => !enParentKeys.has(key));

    const issues: string[] = [];
    if (missingInAr.length > 0) {
      issues.push(`Keys in en.json but missing in ar.json: ${missingInAr.join(', ')}`);
    }
    if (missingInEn.length > 0) {
      issues.push(`Keys in ar.json but missing in en.json: ${missingInEn.join(', ')}`);
    }

    expect(issues).toEqual([]);
  });

  it('should verify each referenced parent.* key exists with non-empty value in both locales', () => {
    const keysArray = Array.from(parentKeysFromSource);

    // If no keys found, skip this test
    if (keysArray.length === 0) {
      expect(keysArray.length).toBeGreaterThanOrEqual(0);
      return;
    }

    fc.assert(
      fc.property(fc.constantFrom(...keysArray), (key) => {
        const enValue = getNestedValue(translations.en, key);
        const arValue = getNestedValue(translations.ar, key);

        // Key must exist in both locales
        expect(enValue).toBeDefined();
        expect(arValue).toBeDefined();

        // Values must be non-empty strings
        expect(typeof enValue).toBe('string');
        expect(typeof arValue).toBe('string');
        expect(enValue.trim().length).toBeGreaterThan(0);
        expect(arValue.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: Math.max(keysArray.length, 1) },
    );
  });

  it('should have all parent.* keys from source files in the translation files', () => {
    const missingKeys: string[] = [];

    for (const key of parentKeysFromSource) {
      if (!allParentKeysInTranslations.has(key)) {
        missingKeys.push(key);
      }
    }

    expect(missingKeys).toEqual([]);
  });

  it('should document all parent.* keys found in source files', () => {
    // This test documents what keys are being used
    const sortedKeys = Array.from(parentKeysFromSource).sort();

    expect(sortedKeys.length).toBeGreaterThan(0);

    // Verify expected key categories exist
    const hasCommonKeys = sortedKeys.some(k => k.startsWith('parent.common.'));
    const hasDashboardKeys = sortedKeys.some(k => k.startsWith('parent.dashboard.'));
    const hasLinkStudentKeys = sortedKeys.some(k => k.startsWith('parent.linkStudent.'));
    const hasStudentListKeys = sortedKeys.some(k => k.startsWith('parent.studentList.'));
    const hasStudentDetailsKeys = sortedKeys.some(k => k.startsWith('parent.studentDetails.'));
    const hasAttendanceKeys = sortedKeys.some(k => k.startsWith('parent.attendance.'));

    expect(hasCommonKeys).toBe(true);
    expect(hasDashboardKeys).toBe(true);
    expect(hasLinkStudentKeys).toBe(true);
    expect(hasStudentListKeys).toBe(true);
    expect(hasStudentDetailsKeys).toBe(true);
    expect(hasAttendanceKeys).toBe(true);
  });
});
