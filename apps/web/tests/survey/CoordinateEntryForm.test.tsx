/**
 * @vitest-environment jsdom
 */
import '../setup';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CoordinateEntryForm } from '../../src/components/survey/CoordinateEntryForm';

describe('CoordinateEntryForm (ACC-1 & SUR-1 Non-Map Alternative)', () => {
  it('calculates haversine distance live and validates between 5m and 500m', () => {
    const handleSave = vi.fn();
    render(<CoordinateEntryForm onSave={handleSave} />);

    // Enter start coordinates (Trafalgar Square)
    fireEvent.change(screen.getByLabelText(/start latitude/i), { target: { value: '51.508000' } });
    fireEvent.change(screen.getByLabelText(/start longitude/i), { target: { value: '-0.128000' } });

    // Enter end coordinates ~70m away
    fireEvent.change(screen.getByLabelText(/end latitude/i), { target: { value: '51.508500' } });
    fireEvent.change(screen.getByLabelText(/end longitude/i), { target: { value: '-0.128500' } });

    // Verify live calculation displays valid status
    expect(screen.getByText(/valid \(5 m – 500 m\)/i)).toBeInTheDocument();

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /confirm segment geometry/i }));
    expect(handleSave).toHaveBeenCalledTimes(1);
    const result = handleSave.mock.calls[0]![0];
    expect(result.geometry.type).toBe('LineString');
    expect(result.geometry.coordinates).toHaveLength(2);
    expect(result.lengthM).toBeGreaterThan(50);
    expect(result.lengthM).toBeLessThan(100);
  });

  it('rejects segments shorter than 5m with SUR-1 validation error', () => {
    const handleSave = vi.fn();
    render(<CoordinateEntryForm onSave={handleSave} />);

    // Identical start & end points (0m distance)
    fireEvent.change(screen.getByLabelText(/start latitude/i), { target: { value: '51.508000' } });
    fireEvent.change(screen.getByLabelText(/start longitude/i), { target: { value: '-0.128000' } });
    fireEvent.change(screen.getByLabelText(/end latitude/i), { target: { value: '51.508000' } });
    fireEvent.change(screen.getByLabelText(/end longitude/i), { target: { value: '-0.128000' } });

    // Button should be disabled due to invalid length
    const submitBtn = screen.getByRole('button', { name: /confirm segment geometry/i });
    expect(submitBtn).toBeDisabled();
    expect(handleSave).not.toHaveBeenCalled();
  });
});
