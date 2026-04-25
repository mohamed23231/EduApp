import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from '@jest/globals';

const ROOT = path.resolve(__dirname, '../..');

// Files allowed to contain hex literals: token contracts + web-only HTML
// wrapper + legitimate inline-SVG illustrations.
const ALLOWED_FILES = new Set([
  'src/global.css',
  'src/components/ui/colors.js',
  'src/components/ui/color-utils.ts',
  'src/components/ui/theme.tsx',
  'src/components/ui/theme-token-parity.test.ts',
  'src/components/ui/theme-contrast.test.ts',
  'src/__tests__/redesign-token-guard.test.ts',
  'src/app/+html.tsx',
  'src/features/onboarding/components/cover.tsx',
]);

// In-scope targets — same expansion model as scripts/check-redesign.mjs.
// Add entries as Phases 6-9 migrate their dirs.
const IN_SCOPE: string[] = [
  'src/app/_layout.tsx',
  'src/app/org-invite.tsx',
  'src/app/(parent)/(tabs)/_layout.tsx',
  'src/app/(teacher)/(tabs)/_layout.tsx',
  'src/app/(manager)/(tabs)/_layout.tsx',
  // Redesign primitives only. Legacy primitives are excluded — Phase 4 US7
  // (T033-T044) replaces them. Add new primitive paths as US7 tasks land.
  'src/components/ui/theme.tsx',
  'src/components/ui/use-theme-config.tsx',
  'src/components/ui/press-button.tsx',
];

const HEX_PATTERN = /#[0-9A-F]{3,8}\b/gi;

const IGNORE_CONTENT_PATTERNS = [
  /\/\*[\s\S]*?\*\//g,
  /\/\/.*$/gm,
];

function walkDir(dir: string): string[] {
  if (!fs.existsSync(dir))
    return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'node_modules')
        return [];
      return walkDir(fullPath);
    }
    const ext = path.extname(entry.name);
    if (ext === '.tsx' || ext === '.ts')
      return [fullPath];
    return [];
  });
}

function expandScope(scope: string[]): string[] {
  const files: string[] = [];
  for (const entry of scope) {
    const abs = path.resolve(ROOT, entry);
    if (!fs.existsSync(abs))
      continue;
    const stat = fs.statSync(abs);
    if (stat.isFile())
      files.push(abs);
    else files.push(...walkDir(abs));
  }
  return files;
}

function stripComments(content: string): string {
  let stripped = content;
  for (const pat of IGNORE_CONTENT_PATTERNS) {
    stripped = stripped.replace(pat, '');
  }
  return stripped;
}

function findHexViolations(): Array<{ file: string; matches: string[] }> {
  const violations: Array<{ file: string; matches: string[] }> = [];
  const files = expandScope(IN_SCOPE);

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    if (ALLOWED_FILES.has(rel))
      continue;

    const content = stripComments(fs.readFileSync(file, 'utf8'));
    const matches = content.match(HEX_PATTERN);
    if (matches && matches.length > 0) {
      violations.push({ file: rel, matches });
    }
  }

  return violations;
}

const LEGACY_KEY_PATTERNS = [
  /\bcolors\.primary\b/,
  /\bcolors\.charcoal\b/,
  /\bcolors\.status\b/,
  /\bcolors\.avatar[A-Z]/,
  /\bcolors\.text\b/,
  /\bcolors\.background\b/,
  /\bcolors\.border\b/,
  /\bcolors\.white\b/,
  /\bcolors\.black\b/,
];

const LEGACY_KEY_ALLOWLIST = new Set([
  'src/components/ui/colors.js',
  'src/components/ui/color-utils.ts',
  'src/components/ui/theme.tsx',
  'src/components/ui/theme-token-parity.test.ts',
  'src/components/ui/theme-contrast.test.ts',
  'src/__tests__/redesign-token-guard.test.ts',
]);

function findLegacyKeyViolations(): Array<{ file: string; keys: string[] }> {
  const violations: Array<{ file: string; keys: string[] }> = [];
  const files = expandScope(IN_SCOPE);

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    if (LEGACY_KEY_ALLOWLIST.has(rel))
      continue;

    const content = stripComments(fs.readFileSync(file, 'utf8'));
    const matched: string[] = [];
    for (const pat of LEGACY_KEY_PATTERNS) {
      if (pat.test(content))
        matched.push(pat.source.replace(/\\b/g, ''));
    }
    if (matched.length > 0)
      violations.push({ file: rel, keys: matched });
  }

  return violations;
}

describe('redesign token guard', () => {
  it('no hex literals outside token files in any in-scope directory', () => {
    const violations = findHexViolations();
    if (violations.length > 0) {
      const details = violations
        .map(v => `  ${v.file}: ${v.matches.join(', ')}`)
        .join('\n');
      throw new Error(
        `Found hex color literals in in-scope code:\n${details}\n\nUse tokens from colors.js / color-utils.ts instead.`,
      );
    }
    expect(violations).toHaveLength(0);
  });

  it('no legacy color-key imports in migrated files (use brand/neutral/semantic)', () => {
    const violations = findLegacyKeyViolations();
    if (violations.length > 0) {
      const details = violations
        .map(v => `  ${v.file}: ${v.keys.join(', ')}`)
        .join('\n');
      throw new Error(
        `Legacy color keys found in migrated code:\n${details}\n\nUse colors.brand.*, colors.neutral.*, colors.semantic.* instead. Legacy keys are deprecated and will be removed in Phase C.`,
      );
    }
    expect(violations).toHaveLength(0);
  });
});
