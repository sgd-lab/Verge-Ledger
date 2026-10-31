/**
 * @vitest-environment jsdom
 */
import './setup';
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { App } from '../src/App';

describe('App Shell & Root Layout', () => {
  it('renders brand header, navigation links, and skip link', () => {
    render(<App />);

    // Brand and Version tag
    expect(screen.getAllByText('Verge Ledger')[0]).toBeInTheDocument();
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();

    // Skip to main content link
    const skipLink = screen.getByText(/skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');

    // Navigation links within Main Navigation
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(within(nav).getByRole('link', { name: /overview/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /^survey$/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /cut advisor/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /simulator/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /councils/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /evidence & export/i })).toBeInTheDocument();

    // Main landmark container
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');

    // Footer citations
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByText(/mit license/i)).toBeInTheDocument();
    expect(within(footer).getByText(/plantlife/i)).toBeInTheDocument();
  });
});
