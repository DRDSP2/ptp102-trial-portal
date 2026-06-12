import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ByrockLogo } from '@/components/ByrockLogo';

describe('ByrockLogo', () => {
  let originalClientWidth: PropertyDescriptor | undefined;

  beforeAll(() => {
    originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientWidth');
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      value: 300,
    });
  });

  afterAll(() => {
    if (originalClientWidth) {
      Object.defineProperty(HTMLElement.prototype, 'clientWidth', originalClientWidth);
    }
  });

  it('renders the icon variant with the correct src and square default height', () => {
    render(<ByrockLogo variant="icon" />);
    const img = screen.getByAltText('Byrock Technologies Limited') as HTMLImageElement;
    expect(img.src).toContain('/assets/byrock-icon.png');
    expect(img.parentElement?.style.height).toBe('32px');
  });

  it('renders the full variant with the correct src and default height', () => {
    render(<ByrockLogo variant="full" />);
    const img = screen.getByAltText('Byrock Technologies Limited') as HTMLImageElement;
    expect(img.src).toContain('/assets/byrock-logo-full.png');
    expect(img.parentElement?.style.height).toBe('40px');
  });

  it('uses the provided height', () => {
    render(<ByrockLogo variant="full" height={60} />);
    const img = screen.getByAltText('Byrock Technologies Limited') as HTMLImageElement;
    expect(img.parentElement?.style.height).toBe('60px');
  });

  it('does not force inline height when className already sets height', () => {
    render(<ByrockLogo variant="full" className="h-16" />);
    const img = screen.getByAltText('Byrock Technologies Limited') as HTMLImageElement;
    expect(img.parentElement?.style.height).toBe('');
  });
});
