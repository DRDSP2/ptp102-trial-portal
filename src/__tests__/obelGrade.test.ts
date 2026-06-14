import { describe, it, expect } from 'vitest';
import { normalizeObelGrade, OBEL_MIN, OBEL_MAX } from '@/lib/obelGrade';

describe('normalizeObelGrade', () => {
  it('leaves valid 0–4 integers unchanged', () => {
    expect(normalizeObelGrade(0)).toBe(0);
    expect(normalizeObelGrade(1)).toBe(1);
    expect(normalizeObelGrade(2)).toBe(2);
    expect(normalizeObelGrade(3)).toBe(3);
    expect(normalizeObelGrade(4)).toBe(4);
  });

  it('returns null for null, undefined, or missing values', () => {
    expect(normalizeObelGrade(null)).toBeNull();
    expect(normalizeObelGrade(undefined)).toBeNull();
  });

  it('clamps out-of-range values to the nearest valid grade', () => {
    expect(normalizeObelGrade(-1)).toBe(OBEL_MIN);
    expect(normalizeObelGrade(-10)).toBe(OBEL_MIN);
    expect(normalizeObelGrade(5)).toBe(OBEL_MAX);
    expect(normalizeObelGrade(99)).toBe(OBEL_MAX);
  });

  it('rounds and then clamps decimal values', () => {
    expect(normalizeObelGrade(1.4)).toBe(1);
    expect(normalizeObelGrade(1.5)).toBe(2);
    expect(normalizeObelGrade(2.7)).toBe(3);
    expect(normalizeObelGrade(4.9)).toBe(OBEL_MAX);
    expect(normalizeObelGrade(-0.4)).toBe(OBEL_MIN);
  });

  it('coerces numeric strings to valid grades', () => {
    expect(normalizeObelGrade('3')).toBe(3);
    expect(normalizeObelGrade('0')).toBe(0);
    expect(normalizeObelGrade('5')).toBe(OBEL_MAX);
    expect(normalizeObelGrade('2.6')).toBe(3);
  });

  it('returns null for non-numeric or object values', () => {
    expect(normalizeObelGrade('')).toBeNull();
    expect(normalizeObelGrade('bad')).toBeNull();
    expect(normalizeObelGrade({})).toBeNull();
    expect(normalizeObelGrade(NaN)).toBeNull();
    expect(normalizeObelGrade(Infinity)).toBeNull();
  });
});
