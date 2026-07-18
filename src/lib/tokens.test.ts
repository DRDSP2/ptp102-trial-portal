import { describe, it, expect } from 'vitest';

/**
 * WCAG contrast locks for the brand palette (UI_REVIEW.md §5.5).
 * The HSL channel triplets below mirror the custom properties in src/index.css
 * (:root / .dark) — if the palette is nudged, these assertions fail.
 */

type HslTriplet = [number, number, number];

function parseHsl(hsl: string): HslTriplet {
  const [h, s, l] = hsl.split(/\s+/).map((v) => parseFloat(v));
  return [h, s, l];
}

function hslToRgb([h, s, l]: HslTriplet): [number, number, number] {
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let base: [number, number, number];
  if (hp < 1) base = [c, x, 0];
  else if (hp < 2) base = [x, c, 0];
  else if (hp < 3) base = [0, c, x];
  else if (hp < 4) base = [0, x, c];
  else if (hp < 5) base = [x, 0, c];
  else base = [c, 0, x];
  const m = lig - c / 2;
  return [base[0] + m, base[1] + m, base[2] + m];
}

function linearize(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hsl: string): number {
  const [r, g, b] = hslToRgb(parseHsl(hsl));
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** WCAG 2.x contrast ratio between two HSL channel triplets ("79 39% 33%"). */
export function contrastRatioHsl(hslA: string, hslB: string): number {
  const l1 = relativeLuminance(hslA);
  const l2 = relativeLuminance(hslB);
  const [lighter, darker] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

// Token values — keep in sync with src/index.css
const BRAND = '79 39% 33%'; // --brand / --primary (#64752f)
const BRAND_FOREGROUND = '0 0% 100%'; // --brand-foreground / --primary-foreground
const DESTRUCTIVE = '0 72% 51%'; // --destructive (#dc2626)
const DESTRUCTIVE_FOREGROUND = '0 0% 98%'; // --destructive-foreground
const RING = '240 5% 46%'; // --ring
const BACKGROUND = '0 0% 100%'; // --background (light)
const DARK_BACKGROUND = '240 10% 3.9%'; // --background (dark)

describe('brand tokens (WCAG-locked)', () => {
  it('brand on white passes AA normal text (>= 4.5:1)', () => {
    expect(contrastRatioHsl(BRAND, BRAND_FOREGROUND)).toBeGreaterThanOrEqual(4.5);
  });

  it('destructive on white passes AA normal text (>= 4.5:1)', () => {
    expect(contrastRatioHsl(DESTRUCTIVE, DESTRUCTIVE_FOREGROUND)).toBeGreaterThanOrEqual(4.5);
  });

  it('focus ring on background passes WCAG 1.4.11 non-text contrast (>= 3:1)', () => {
    expect(contrastRatioHsl(RING, BACKGROUND)).toBeGreaterThanOrEqual(3.0);
  });

  it('same tokens also hold on the dark background', () => {
    expect(contrastRatioHsl(BRAND, DARK_BACKGROUND)).toBeGreaterThanOrEqual(3.0);
    expect(contrastRatioHsl(RING, DARK_BACKGROUND)).toBeGreaterThanOrEqual(3.0);
    expect(contrastRatioHsl(DESTRUCTIVE, DARK_BACKGROUND)).toBeGreaterThanOrEqual(3.0);
  });
});
