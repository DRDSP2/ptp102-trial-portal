import type { DealTier } from '@/types/roles';

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function generateWatermark(userName: string, company: string): string {
  const timestamp = new Date().toISOString();
  return `${userName} | ${company} | ${timestamp} | CONFIDENTIAL — BYROCK DEAL ROOM`;
}

export function tierRank(tier: string): number {
  const ranks: Record<DealTier, number> = {
    none: 0,
    evaluation: 1,
    diligence: 2,
    exclusive: 3,
  };
  return ranks[tier as DealTier] || 0;
}
