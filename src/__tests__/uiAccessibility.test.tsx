import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CardTitle } from '@/components/ui/card';

describe('shared UI accessibility contracts', () => {
  it('keeps section card titles at heading level three by default', () => {
    render(<CardTitle>Clinical Notes</CardTitle>);
    expect(screen.getByRole('heading', { level: 3, name: 'Clinical Notes' })).toBeInTheDocument();
  });

  it('allows a card to provide the page-level heading without changing its styling API', () => {
    render(<CardTitle as="h1">Veterinarian Login</CardTitle>);
    expect(screen.getByRole('heading', { level: 1, name: 'Veterinarian Login' })).toBeInTheDocument();
  });
});
