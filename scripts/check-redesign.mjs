#!/usr/bin/env node

/**
 * Redesign launch gates — phase-scoped.
 *
 * Each Phase B screen migration adds its dir to IN_SCOPE_HEX / IN_SCOPE_RTL
 * below. By Phase 10 (T108) the in-scope set should equal {src/app, src/modules,
 * src/features} and this comment can be deleted.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src');
const isJson = process.argv.includes('--json');

const errors = [];

// In-scope targets for end of Phase 3. Add entries as Phases 4-10 migrate
// their dirs. Each entry is a path relative to ROOT, either a file or dir.
const IN_SCOPE_HEX = [
  'src/app/_layout.tsx',
  'src/app/org-invite.tsx',
  'src/app/(parent)/(tabs)/_layout.tsx',
  'src/app/(teacher)/(tabs)/_layout.tsx',
  'src/app/(manager)/(tabs)/_layout.tsx',
  // Redesign primitives. Legacy primitives (button, modal, confirm-modal,
  // option-picker-sheet, progress-bar, checkbox, select, ...) are intentionally
  // excluded — Phase 4 US7 replaces them. Add new primitive paths here as US7
  // tasks T033-T044 land them.
  'src/components/ui/theme.tsx',
  'src/components/ui/use-theme-config.tsx',
  'src/components/ui/press-button.tsx',
];

const IN_SCOPE_RTL = [
  'src/app/_layout.tsx',
  'src/app/org-invite.tsx',
  'src/app/(parent)/(tabs)/_layout.tsx',
  'src/app/(teacher)/(tabs)/_layout.tsx',
  'src/app/(manager)/(tabs)/_layout.tsx',
  // Redesign primitives. Legacy primitives (button, modal, confirm-modal,
  // option-picker-sheet, progress-bar, checkbox, select, ...) are intentionally
  // excluded — Phase 4 US7 replaces them. Add new primitive paths here as US7
  // tasks T033-T044 land them.
  'src/components/ui/theme.tsx',
  'src/components/ui/use-theme-config.tsx',
  'src/components/ui/press-button.tsx',
];

// Files allowed to contain hex literals: token contracts + web-only HTML wrapper
// + legitimate inline-SVG illustrations (cover.tsx).
const HEX_ALLOWLIST = new Set([
  'src/global.css',
  'src/components/ui/colors.js',
  'src/components/ui/color-utils.ts',
  'src/components/ui/theme.tsx',
  'src/components/ui/theme-token-parity.test.ts',
  'src/components/ui/theme-contrast.test.ts',
  'src/app/+html.tsx',
  'src/features/onboarding/components/cover.tsx',
]);

function walkDir(dir) {
  if (!existsSync(dir))
    return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules')
        return [];
      return walkDir(fullPath);
    }
    const ext = entry.name.slice(entry.name.lastIndexOf('.'));
    if (ext === '.tsx' || ext === '.ts')
      return [fullPath];
    return [];
  });
}

function expandScope(scopeList) {
  const files = [];
  for (const entry of scopeList) {
    const abs = resolve(ROOT, entry);
    if (!existsSync(abs))
      continue;
    const stat = statSync(abs);
    if (stat.isFile()) {
      files.push(abs);
    }
    else {
      files.push(...walkDir(abs));
    }
  }
  return files;
}

// ── Check 1: No hex color literals in in-scope files (SC-002) ──
function checkHexLiterals() {
  const hexPattern = /#[0-9A-F]{3,8}\b/i;
  const violations = [];

  const files = expandScope(IN_SCOPE_HEX);
  for (const file of files) {
    const rel = relative(ROOT, file);
    if (HEX_ALLOWLIST.has(rel))
      continue;

    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*(import|\/\/|\/\*|\*)/.test(line))
        continue;
      const codeOnly = line.replace(/\/\/.*$/, '');
      const match = codeOnly.match(hexPattern);
      if (match) {
        violations.push({ file: rel, line: i + 1, match: match[0] });
      }
    }
  }

  if (violations.length > 0) {
    const label = 'SC-002: hex color literals in migrated screens';
    const details = violations.map(v => `  ${v.file}:${v.line} — found "${v.match}"`);
    errors.push({ check: label, violations: details });
  }
}

// ── Check 2: No physical RTL styles in in-scope files ──
function checkPhysicalRTL() {
  const physicalProps = ['marginLeft', 'marginRight', 'paddingLeft', 'paddingRight'];
  const violations = [];

  const files = expandScope(IN_SCOPE_RTL);
  for (const file of files) {
    if (/(__tests__|\.test\.|\.spec\.)/.test(file))
      continue;

    const content = readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*(\/\/|\/\*|\*)/.test(line))
        continue;
      for (const prop of physicalProps) {
        const regex = new RegExp(`\\b${prop}\\s*[:=]`);
        if (regex.test(line)) {
          violations.push({ file: relative(ROOT, file), line: i + 1, prop });
          break;
        }
      }
    }
  }

  if (violations.length > 0) {
    const label = 'Physical RTL styles in migrated screens';
    const details = violations.map(v => `  ${v.file}:${v.line} — "${v.prop}" (use marginStart/marginEnd/paddingStart/paddingEnd)`);
    errors.push({ check: label, violations: details });
  }
}

// ── Check 3: Arabic {{count}} keys must have plural suffix families ──
function checkArabicPlurals() {
  const arPath = resolve(SRC, 'translations', 'ar.json');
  if (!existsSync(arPath)) {
    errors.push({ check: 'Arabic translations missing', violations: ['  ar.json not found'] });
    return;
  }

  const ar = JSON.parse(readFileSync(arPath, 'utf-8'));
  const violations = [];

  const PLURAL_SUFFIXES = ['_zero', '_one', '_two', '_few', '_many', '_other'];

  function walk(obj, prefix) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        walk(value, fullKey);
      }
      else if (typeof value === 'string' && value.includes('{{count}}')) {
        const parent = prefix ? prefix.split('.').reduce((o, k) => o?.[k], ar) : ar;
        const hasSuffix = PLURAL_SUFFIXES.some(s => key.endsWith(s));
        if (hasSuffix)
          continue;

        const baseName = key;
        const hasPluralFamily = PLURAL_SUFFIXES.some(s => parent && typeof parent === 'object' && parent[`${baseName}${s}`] !== undefined);
        if (!hasPluralFamily) {
          violations.push(`  "${fullKey}" contains {{count}} but has no plural suffix family (_zero/_one/_two/_few/_many/_other)`);
        }
      }
    }
  }

  walk(ar, '');

  if (violations.length > 0) {
    errors.push({ check: 'Arabic plural suffixes', violations });
  }
}

// ── Run all checks ──
checkHexLiterals();
checkPhysicalRTL();
checkArabicPlurals();

// ── Output ──
if (isJson) {
  console.log(JSON.stringify({ passed: errors.length === 0, errors }, null, 2));
}
else if (errors.length > 0) {
  console.error('❌ Redesign checks FAILED:\n');
  for (const { check, violations } of errors) {
    console.error(`  ${check}:`);
    for (const v of violations) {
      console.error(v);
    }
    console.error();
  }
  console.error(`  ${errors.reduce((sum, e) => sum + e.violations.length, 0)} violation(s) found.`);
  process.exit(1);
}
else {
  console.log('✅ All redesign checks passed.');
  process.exit(0);
}
