import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(__dirname, '../../..');
const INVENTORY_PATH = resolve(ROOT, 'specs/002-ui-redesign/route-inventory.md');
const APP_DIR = resolve(ROOT, 'mobile-app/src/app');

// Em-dash tolerant: accept either U+2014 em-dash, ` - `, or `--` between
// the column label and "In scope".
const IN_SCOPE_ROUTE_ROWS: RegExp = /\|\s*`?[^`|\n]+`?\s*\|\s*`[^`]+`\s*\|\s*Product\s*(—|--|-)\s*In scope\s*\|/g;

const FILE_PATH_COL = /^\|\s*`?([^`|\n]+)`?\s*\|/;

// Files under src/app that are intentionally excluded from the route inventory.
// Test fixtures + web-only Expo Router special files do not need a row.
const INVENTORY_EXCLUDED = new Set<string>([
  '+html.tsx', // Web-only HTML wrapper for Expo Router static rendering
]);

function isInventoryExcluded(rel: string): boolean {
  if (INVENTORY_EXCLUDED.has(rel))
    return true;
  if (rel.includes('__tests__'))
    return true;
  if (/\.test\.tsx?$/.test(rel))
    return true;
  if (/\.spec\.tsx?$/.test(rel))
    return true;
  return false;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
    }
    else {
      const ext = entry.name;
      if (ext.endsWith('.tsx') || ext.endsWith('.ts')) {
        out.push(full);
      }
    }
  }
  return out;
}

function extractInScopeFilePaths(content: string): string[] {
  const paths: string[] = [];
  let match: RegExpExecArray | null;
  IN_SCOPE_ROUTE_ROWS.lastIndex = 0;
  while ((match = IN_SCOPE_ROUTE_ROWS.exec(content)) !== null) {
    const row = match[0];
    const fileMatch = FILE_PATH_COL.exec(row);
    if (fileMatch) {
      const fp = fileMatch[1].trim();
      if (!fp.endsWith('/') && !fp.startsWith('features')) {
        paths.push(fp);
      }
    }
  }
  return paths;
}

// This suite cross-checks the monorepo's specs/route-inventory.md against
// mobile-app/src/app/**. Both INVENTORY_PATH and APP_DIR assume the monorepo
// layout (mobile-app nested beside specs/). In a standalone mobile-repo CI
// checkout those paths don't exist, so skip gracefully there; the check still
// runs (and enforces) in the monorepo dev environment where both are present.
const MONOREPO_LAYOUT = existsSync(INVENTORY_PATH) && existsSync(APP_DIR);

(MONOREPO_LAYOUT ? describe : describe.skip)('redesign route inventory', () => {
  it('route inventory file exists', () => {
    expect(existsSync(INVENTORY_PATH)).toBe(true);
  });

  it('inventory contains route classification data', () => {
    if (!existsSync(INVENTORY_PATH))
      return;
    const content = readFileSync(INVENTORY_PATH, 'utf-8');
    expect(content).toContain('Product');
    expect(content).toContain('Infrastructure');
    expect(content).toContain('Dead/Demo');
  });

  it('no unresolved release-blocking decisions', () => {
    if (!existsSync(INVENTORY_PATH))
      return;
    const content = readFileSync(INVENTORY_PATH, 'utf-8');
    const unresolvedPattern = /\|\s*RB-\d+\s*\|[^|]*\|[^|]*\|\s*\|\s*Before/i;
    const matches = content.match(unresolvedPattern);
    if (matches) {
      throw new Error(`Unresolved release-blocking decisions found. All RB-* items must have an owner.`);
    }
  });

  it('in-scope product routes have corresponding screen files', () => {
    if (!existsSync(INVENTORY_PATH))
      return;
    const content = readFileSync(INVENTORY_PATH, 'utf-8');
    const filePaths = extractInScopeFilePaths(content);
    const missing: string[] = [];

    for (const fp of filePaths) {
      const fullPath = resolve(APP_DIR, fp);
      if (!existsSync(fullPath)) {
        missing.push(fp);
      }
    }

    if (missing.length > 0) {
      throw new Error(`Missing screen files for in-scope routes:\n${missing.map(f => `  ${f}`).join('\n')}`);
    }
  });

  it('every file under src/app/** appears in the inventory (or is explicitly excluded)', () => {
    if (!existsSync(INVENTORY_PATH))
      return;
    if (!existsSync(APP_DIR))
      return;

    const content = readFileSync(INVENTORY_PATH, 'utf-8');
    const allFiles = walk(APP_DIR).map(f => relative(APP_DIR, f));
    const unclassified: string[] = [];

    for (const rel of allFiles) {
      if (isInventoryExcluded(rel))
        continue;
      // The inventory cites filenames inside backticks. Match either the bare
      // basename or the route-grouped form.
      const basename = rel.split('/').pop()!;
      const inventoryHasFile = content.includes(`\`${rel}\``)
        || content.includes(`\`${basename}\``)
        || content.includes(rel);
      if (!inventoryHasFile) {
        unclassified.push(rel);
      }
    }

    if (unclassified.length > 0) {
      throw new Error(
        `Files under mobile-app/src/app/** that are not classified in route-inventory.md:\n${
          unclassified.map(f => `  ${f}`).join('\n')
        }\n\nClassify each file in route-inventory.md before merging Phase B work.`,
      );
    }
  });
});

// Avoid unused-import warning when Node version differs.
void statSync;
