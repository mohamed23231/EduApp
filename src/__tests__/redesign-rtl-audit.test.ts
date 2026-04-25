import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from '@jest/globals';

const ROOT = path.resolve(__dirname, '../..');

const IN_SCOPE: string[] = [
  'src/app/_layout.tsx',
  'src/app/org-invite.tsx',
  'src/app/(parent)/(tabs)/_layout.tsx',
  'src/app/(teacher)/(tabs)/_layout.tsx',
  'src/app/(manager)/(tabs)/_layout.tsx',
  'src/components/ui/theme.tsx',
  'src/components/ui/use-theme-config.tsx',
  'src/components/ui/press-button.tsx',
  'src/components/ui/toast-host.tsx',
  'src/components/ui/taba-mark.tsx',
  'src/components/ui/taba-wordmark.tsx',
  'src/components/ui/status-chip.tsx',
  'src/components/ui/dot.tsx',
  'src/components/ui/hairline.tsx',
  'src/components/ui/icon.tsx',
];

const PHYSICAL_RTL_PATTERNS = [
  /\bmarginLeft\b/,
  /\bmarginRight\b/,
  /\bpaddingLeft\b/,
  /\bpaddingRight\b/,
  /\bborderLeftWidth\b/,
  /\bborderRightWidth\b/,
  /\bleft:\s*\d/,
  /\bright:\s*\d/,
];

const _ALLOWED_PATTERNS: RegExp[] = [
  /paddingLeft|paddingRight|marginLeft|marginRight/i,
];

const ALLOWED_FILES = new Set([
  'src/components/ui/colors.js',
  'src/components/ui/color-utils.ts',
  'src/__tests__/redesign-rtl-audit.test.ts',
]);

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

const COMMENT_PATTERNS = [
  /\/\*[\s\S]*?\*\//g,
  /\/\/.*$/gm,
];

function stripComments(content: string): string {
  let stripped = content;
  for (const pat of COMMENT_PATTERNS) {
    stripped = stripped.replace(pat, '');
  }
  return stripped;
}

function findRTLViolations(): Array<{ file: string; matches: Array<{ pattern: string; line: string }> }> {
  const violations: Array<{ file: string; matches: Array<{ pattern: string; line: string }> }> = [];
  const files = expandScope(IN_SCOPE);

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    if (ALLOWED_FILES.has(rel))
      continue;

    const content = stripComments(fs.readFileSync(file, 'utf8'));
    const lines = content.split('\n');
    const matched: Array<{ pattern: string; line: string }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pat of PHYSICAL_RTL_PATTERNS) {
        if (pat.test(line)) {
          matched.push({ pattern: pat.source, line: `L${i + 1}: ${line.trim()}` });
        }
      }
    }

    if (matched.length > 0)
      violations.push({ file: rel, matches: matched });
  }

  return violations;
}

describe('redesign RTL audit', () => {
  it('no physical directional properties (marginLeft/Right, paddingLeft/Right) in in-scope files', () => {
    const violations = findRTLViolations();
    if (violations.length > 0) {
      const details = violations
        .map(v =>
          `${v.file}:\n${v.matches.map(m => `  ${m.pattern} → ${m.line}`).join('\n')}`,
        )
        .join('\n\n');
      throw new Error(
        `Physical directional properties found. Use logical properties (marginStart/marginEnd, paddingStart/paddingEnd):\n\n${details}`,
      );
    }
    expect(violations).toHaveLength(0);
  });
});
