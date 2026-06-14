import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ObelScoreChart } from '@/components/ObelScoreChart';

function createAssessment(overrides: Partial<{
  id: number;
  assessment_datetime: string;
  obel_grade: number;
  pain_score: number;
  protocol_hour: number;
}> = {}) {
  return {
    id: 1,
    assessment_datetime: '2025-11-14T08:00:00.000Z',
    obel_grade: 2,
    pain_score: 4,
    protocol_hour: 0,
    ...overrides,
  };
}

describe('ObelScoreChart', () => {
  it('shows an empty state when no Obel grades are available', () => {
    render(<ObelScoreChart assessments={[]} protocolStartTime={null} />);
    expect(screen.getByText('No Obel scores recorded yet')).toBeInTheDocument();
  });

  it('renders each valid Obel grade 0–4', () => {
    const assessments = [0, 1, 2, 3, 4].map((grade, index) =>
      createAssessment({
        id: index + 1,
        obel_grade: grade,
        protocol_hour: index * 12,
      })
    );

    render(<ObelScoreChart assessments={assessments} protocolStartTime={new Date('2025-11-14T08:00:00.000Z')} />);

    // All grades appear as bar labels (grade 0 also appears in the starting score box).
    [0, 1, 2, 3, 4].forEach((grade) => {
      expect(screen.getAllByText(grade.toString()).length).toBeGreaterThanOrEqual(1);
    });

    // Standard descriptions are rendered in tooltips / legend.
    expect(screen.getByText(/Grade 0: Sound/)).toBeInTheDocument();
    expect(screen.getByText(/Grade 4: Very severe/)).toBeInTheDocument();
  });

  it('calculates an improving trend', () => {
    const assessments = [
      createAssessment({ id: 1, obel_grade: 4, protocol_hour: 0 }),
      createAssessment({ id: 2, obel_grade: 1, protocol_hour: 36 }),
    ];

    render(<ObelScoreChart assessments={assessments} protocolStartTime={new Date('2025-11-14T08:00:00.000Z')} />);
    expect(screen.getByText('Improved by 3 grades')).toBeInTheDocument();
  });

  it('calculates a worsening trend', () => {
    const assessments = [
      createAssessment({ id: 1, obel_grade: 1, protocol_hour: 0 }),
      createAssessment({ id: 2, obel_grade: 3, protocol_hour: 12 }),
    ];

    render(<ObelScoreChart assessments={assessments} protocolStartTime={new Date('2025-11-14T08:00:00.000Z')} />);
    expect(screen.getByText('Worsened by 2 grades')).toBeInTheDocument();
  });

  it('reports no change when first and last scores match', () => {
    const assessments = [
      createAssessment({ id: 1, obel_grade: 2, protocol_hour: 0 }),
      createAssessment({ id: 2, obel_grade: 2, protocol_hour: 12 }),
    ];

    render(<ObelScoreChart assessments={assessments} protocolStartTime={new Date('2025-11-14T08:00:00.000Z')} />);
    expect(screen.getByText('No change')).toBeInTheDocument();
  });

  it('ignores assessments with null Obel grades', () => {
    const assessments = [
      createAssessment({ id: 1, obel_grade: null as unknown as number, protocol_hour: 0 }),
      createAssessment({ id: 2, obel_grade: 2, protocol_hour: 12 }),
    ];

    render(<ObelScoreChart assessments={assessments} protocolStartTime={new Date('2025-11-14T08:00:00.000Z')} />);
    expect(screen.getByText('Starting Score')).toBeInTheDocument();
    expect(screen.getByText('Latest Score')).toBeInTheDocument();
    expect(screen.queryByText('No Obel scores recorded yet')).not.toBeInTheDocument();
  });
});
