import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from '@jest/globals';
import colors from './colors';

// Parse the canonical Tailwind 4 @theme block in src/global.css and assert
// hex equivalence between CSS-side tokens and the colors.js mirror. Without
// this the two files can drift (one mode shifts, the other does not).
const GLOBAL_CSS_PATH = resolve(__dirname, '../../global.css');

function parseCssTokenMap(): Record<string, string> {
  const css = readFileSync(GLOBAL_CSS_PATH, 'utf-8');
  const startIdx = css.indexOf('@theme {');
  if (startIdx === -1) {
    throw new Error('global.css does not contain a top-level @theme {} block');
  }
  let depth = 0;
  let endIdx = startIdx;
  for (let i = startIdx; i < css.length; i++) {
    if (css[i] === '{')
      depth++;
    if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }
  const body = css.substring(startIdx, endIdx + 1);
  const map: Record<string, string> = {};
  const lineRe = /--([a-z0-9-]+):\s*([^;]+);/gi;
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(body)) !== null) {
    map[m[1]] = m[2].trim();
  }
  return map;
}

const cssTokens = parseCssTokenMap();

// Pairs: colors.js path → matching CSS variable name.
const PARITY_PAIRS: Array<[string, string]> = [
  ['brand.primary', 'color-brand'],
  ['brand.primaryDeep', 'color-brand-deep'],
  ['brand.blue', 'color-brand-blue'],
  ['brand.blueDeep', 'color-brand-blue-deep'],
  ['neutral.ink', 'color-ink'],
  ['neutral.paper', 'color-paper'],
  ['neutral.card', 'color-card'],
  ['neutral.cardWarm', 'color-card-warm'],
  ['neutral.rule', 'color-rule'],
  ['neutral.inkSoft', 'color-ink-soft'],
  ['neutral.inkMuted', 'color-ink-muted'],
  ['neutral.dim', 'color-dim'],
  ['semantic.present', 'color-present'],
  ['semantic.presentSoft', 'color-present-soft'],
  ['semantic.presentInk', 'color-present-ink'],
  ['semantic.absent', 'color-absent'],
  ['semantic.absentSoft', 'color-absent-soft'],
  ['semantic.absentInk', 'color-absent-ink'],
  ['semantic.excused', 'color-excused'],
  ['semantic.excusedSoft', 'color-excused-soft'],
  ['semantic.excusedInk', 'color-excused-ink'],
  ['semantic.info', 'color-info'],
  ['semantic.infoSoft', 'color-info-soft'],
];

const EXPECTED_BRAND_TOKENS: Record<string, string> = {
  primary: '#22C572',
  primaryDeep: '#0E8B4F',
  blue: '#2D7DE0',
  blueDeep: '#1B5BB8',
};

const EXPECTED_SEMANTIC_TOKENS: Record<string, string> = {
  present: '#00C2A0',
  presentSoft: '#CCF1E7',
  absent: '#FF5B4A',
  absentSoft: '#FFE1DD',
  excused: '#FFB020',
  excusedSoft: '#FFF0D5',
  info: '#3D7FFF',
};

const EXPECTED_NEUTRAL_TOKENS: Record<string, string> = {
  ink: '#0B0D10',
  paper: '#F5F5F0',
  card: '#FFFFFF',
  rule: '#E6E3DB',
  inkMuted: '#5C636E',
  dim: '#C7CBD3',
};

const EXPECTED_RADII: Record<string, number> = {
  r1: 8,
  r2: 12,
  r3: 18,
  r4: 24,
  r5: 32,
};

describe('theme-token-parity', () => {
  describe('brand tokens', () => {
    for (const [key, expected] of Object.entries(EXPECTED_BRAND_TOKENS)) {
      it(`colors.js brand.${key} === ${expected}`, () => {
        const actual = (colors as unknown as Record<string, Record<string, string>>).brand?.[key];
        expect(actual).toBeDefined();
        expect(actual!.toUpperCase()).toBe(expected.toUpperCase());
      });
    }
  });

  describe('semantic tokens', () => {
    for (const [key, expected] of Object.entries(EXPECTED_SEMANTIC_TOKENS)) {
      it(`colors.js semantic.${key} === ${expected}`, () => {
        const actual = (colors as unknown as Record<string, Record<string, string>>).semantic?.[key];
        expect(actual).toBeDefined();
        expect(actual!.toUpperCase()).toBe(expected.toUpperCase());
      });
    }
  });

  describe('neutral tokens', () => {
    for (const [key, expected] of Object.entries(EXPECTED_NEUTRAL_TOKENS)) {
      it(`colors.js neutral.${key} === ${expected}`, () => {
        const actual = (colors as unknown as Record<string, Record<string, string>>).neutral?.[key];
        expect(actual).toBeDefined();
        expect(actual!.toUpperCase()).toBe(expected.toUpperCase());
      });
    }
  });

  describe('radii tokens', () => {
    for (const [key, expected] of Object.entries(EXPECTED_RADII)) {
      it(`radii.${key} === ${expected}`, () => {
        const radii = (colors as unknown as Record<string, Record<string, number>>).radii;
        expect(radii).toBeDefined();
        expect(radii![key]).toBe(expected);
      });
    }
  });

  describe('global.css ↔ colors.js parity', () => {
    for (const [jsPath, cssVar] of PARITY_PAIRS) {
      it(`colors.${jsPath} === --${cssVar}`, () => {
        const cssValue = cssTokens[cssVar];
        expect(cssValue).toBeDefined();
        const [head, leaf] = jsPath.split('.');
        const jsValue = (colors as unknown as Record<string, Record<string, string>>)[head]?.[leaf];
        expect(jsValue).toBeDefined();
        expect(jsValue!.toUpperCase()).toBe(cssValue!.toUpperCase());
      });
    }
  });

  it('covers every contract token — no missing keys', () => {
    const contractKeys = [
      ...Object.keys(EXPECTED_BRAND_TOKENS),
      ...Object.keys(EXPECTED_SEMANTIC_TOKENS),
      ...Object.keys(EXPECTED_NEUTRAL_TOKENS),
    ];
    const brand = (colors as unknown as Record<string, Record<string, unknown>>).brand ?? {};
    const semantic = (colors as unknown as Record<string, Record<string, unknown>>).semantic ?? {};
    const neutral = (colors as unknown as Record<string, Record<string, unknown>>).neutral ?? {};
    const presentKeys = [
      ...Object.keys(brand),
      ...Object.keys(semantic),
      ...Object.keys(neutral),
    ];
    for (const key of contractKeys) {
      expect(presentKeys).toContain(key);
    }
  });
});
