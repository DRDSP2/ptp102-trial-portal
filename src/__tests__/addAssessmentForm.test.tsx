import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider } from '@/context/AuthContext';
import { AddAssessmentForm } from '@/components/AddAssessmentForm';

function seedAuth() {
  localStorage.setItem(
    'laminitis_auth_state',
    JSON.stringify({ role: 'vet', email: 'vet@test.com', termsAccepted: true, pendingApproval: false })
  );
}

function renderForm() {
  return render(
    <AuthProvider>
      <AddAssessmentForm patientId={1} protocolHour={0} onSuccess={() => {}} />
    </AuthProvider>
  );
}

describe('AddAssessmentForm', () => {
  beforeEach(() => {
    localStorage.clear();
    seedAuth();
  });

  it('renders the Obel grade selector and pain score fields', () => {
    renderForm();
    expect(screen.getByText('Obel Laminitis Grade (0–4)')).toBeInTheDocument();
    expect(screen.getByText('Pain Score (0-10)')).toBeInTheDocument();
  });

  it('shows validation errors for missing required fields', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: /Save Assessment/i }));

    await waitFor(() => {
      expect(screen.getByText('Pain score must be 0–10')).toBeInTheDocument();
    });
  });

  it('rejects out-of-range optional numeric inputs', async () => {
    const user = userEvent.setup();
    renderForm();

    // Pain score required but valid so we can reach the optional fields.
    await user.click(screen.getByRole('combobox', { name: /Pain Score/i }));
    await user.click(screen.getByRole('option', { name: /5 - Moderate/i }));

    const mobilityInput = screen.getByRole('spinbutton', { name: /Mobility Score/i });
    await user.clear(mobilityInput);
    await user.type(mobilityInput, '15');

    const pulseInput = screen.getByRole('spinbutton', { name: /Digital Pulse/i });
    await user.clear(pulseInput);
    await user.type(pulseInput, '5');

    await user.click(screen.getByRole('button', { name: /Save Assessment/i }));

    await waitFor(() => {
      expect(screen.getByText('Mobility score must be 0–10')).toBeInTheDocument();
      expect(screen.getByText('Digital pulse score must be 0–4')).toBeInTheDocument();
    });
  });

  it('saves a valid assessment to localStorage', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('combobox', { name: /Pain Score/i }));
    await user.click(screen.getByRole('option', { name: /3 - Mild/i }));

    const mobilityInput = screen.getByRole('spinbutton', { name: /Mobility Score/i });
    await user.clear(mobilityInput);
    await user.type(mobilityInput, '7');

    await user.click(screen.getByRole('button', { name: /Save Assessment/i }));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('ptp102_mock_assessments') || '[]');
      expect(stored.length).toBeGreaterThan(0);
      const created = stored.find((a: any) => a.patient_id === 1 && a.pain_score === 3);
      expect(created).toBeDefined();
      expect(created.obel_grade).toBe(2); // default grade selected by the reference component
      expect(created.mobility_score).toBe(7);
      expect(created.veterinarian_name).toBe('vet@test.com');
    });
  });
});
