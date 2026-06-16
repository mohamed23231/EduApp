import { describe, expect, it } from '@jest/globals';
import colors from './colors';

function luminance(hex: string): number {
  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.072 * toLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const TOKENS = {
  ink: '#0B0D10',
  inkSoft: '#3A3F47',
  inkMuted: '#5C636E',
  dim: '#C7CBD3',
  paper: '#F5F5F0',
  card: '#FFFFFF',
  rule: '#E6E3DB',
  brandPrimary: '#22C572',
  // Foreground rendered on brand-green surfaces (EmptyState/ErrorState CTAs,
  // SegTabs active tab, lime toast tone). Must clear WCAG AA on green.
  primaryInk: '#0B0D10',
  brandPrimaryDeep: '#0E8B4F',
  brandBlue: '#2D7DE0',
  brandBlueDeep: '#1B5BB8',
  present: '#00C2A0',
  absent: '#FF5B4A',
  excused: '#FFB020',
  info: '#3D7FFF',
} as const;

const AA_THRESHOLD = 4.5;

const TEXT_ON_BG_PAIRS: Array<{
  fg: keyof typeof TOKENS;
  bg: keyof typeof TOKENS;
  label: string;
  minRatio: number;
}> = [
  { fg: 'inkMuted', bg: 'paper', label: 'inkMuted on paper', minRatio: AA_THRESHOLD },
  { fg: 'dim', bg: 'ink', label: 'dim on ink', minRatio: AA_THRESHOLD },
  { fg: 'ink', bg: 'paper', label: 'ink on paper', minRatio: AA_THRESHOLD },
  { fg: 'inkSoft', bg: 'paper', label: 'inkSoft on paper', minRatio: AA_THRESHOLD },
  // On-brand-green foreground (brand.primaryInk) must clear WCAG AA. The design
  // renders dark ink on green; white (the old value) was 2.26:1 — a clear fail.
  { fg: 'primaryInk', bg: 'brandPrimary', label: 'brand.primaryInk on brand.primary', minRatio: AA_THRESHOLD },
];

describe('theme-contrast', () => {
  describe('WCAG AA contrast ratios', () => {
    for (const pair of TEXT_ON_BG_PAIRS) {
      it(`${pair.label} meets ≥${pair.minRatio}:1`, () => {
        const ratio = contrastRatio(TOKENS[pair.fg], TOKENS[pair.bg]);
        expect(ratio).toBeGreaterThanOrEqual(pair.minRatio);
      });
    }
  });

  // Guards against a silent revert of the actual token value (B0 contrast fix).
  // Reads the LIVE colors.js value, not the local hardcoded copy.
  describe('live brand.primaryInk on brand.primary (B0 contrast fix)', () => {
    it('the actual brand.primaryInk token clears WCAG AA on brand.primary', () => {
      const fg = (colors as unknown as { brand: { primaryInk: string; primary: string } }).brand;
      const ratio = contrastRatio(fg.primaryInk, fg.primary);
      expect(ratio).toBeGreaterThanOrEqual(AA_THRESHOLD);
    });
  });

  describe('FR-106 brand.primary vs semantic.present perceptual distance', () => {
    it('brand.primary and present are perceptually distinct (≥10 hue points or ≥15 in any channel)', () => {
      const brand = TOKENS.brandPrimary;
      const present = TOKENS.present;

      const rB = Number.parseInt(brand.slice(1, 3), 16);
      const gB = Number.parseInt(brand.slice(3, 5), 16);
      const bB = Number.parseInt(brand.slice(5, 7), 16);

      const rP = Number.parseInt(present.slice(1, 3), 16);
      const gP = Number.parseInt(present.slice(3, 5), 16);
      const bP = Number.parseInt(present.slice(5, 7), 16);

      const hueB
        = (Math.atan2(
          Math.sqrt(3) * (gB - bB),
          2 * rB - gB - bB,
        )
        * (180 / Math.PI)
        + 360)
      % 360;
      const hueP
        = (Math.atan2(
          Math.sqrt(3) * (gP - bP),
          2 * rP - gP - bP,
        )
        * (180 / Math.PI)
        + 360)
      % 360;

      const hueDiff = Math.min(Math.abs(hueB - hueP), 360 - Math.abs(hueB - hueP));
      const channelDiff = Math.max(
        Math.abs(rB - rP),
        Math.abs(gB - gP),
        Math.abs(bB - bP),
      );

      const hueOk = hueDiff >= 10;
      const channelOk = channelDiff >= 15;

      if (!hueOk && !channelOk) {
        throw new Error(
          `brand.primary (${brand}) and present (${present}) are too similar: hueDiff=${hueDiff.toFixed(1)}°, channelDiff=${channelDiff}`,
        );
      }
      expect(hueOk || channelOk).toBe(true);
    });
  });
});
