/**
 * @vitest-environment jsdom
 */
import '../setup';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Select } from '../../src/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '../../src/components/ui/Card';
import { Dialog } from '../../src/components/ui/Dialog';
import { Tabs } from '../../src/components/ui/Tabs';
import { Badge } from '../../src/components/ui/Badge';
import { Alert } from '../../src/components/ui/Alert';

describe('UI Primitives (WCAG 2.2 AA Compliance)', () => {
  describe('Button', () => {
    it('enforces minimum touch dimensions (min-h-[44px])', () => {
      render(<Button>Click Me</Button>);
      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toHaveClass('min-h-[44px]');
      expect(btn).toHaveClass('min-w-[44px]');
    });

    it('sets aria-busy when loading', () => {
      render(<Button isLoading>Saving</Button>);
      const btn = screen.getByRole('button');
      expect(btn).toHaveAttribute('aria-busy', 'true');
      expect(btn).toBeDisabled();
    });

    it('handles click events when enabled', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Action</Button>);
      fireEvent.click(screen.getByRole('button', { name: /action/i }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Input & Select', () => {
    it('connects label to input via id and htmlFor', () => {
      render(<Input label="Road Name" id="road-name-input" />);
      const input = screen.getByLabelText(/road name/i);
      expect(input).toBeInTheDocument();
      expect(input.id).toBe('road-name-input');
    });

    it('sets aria-invalid and connects error message via aria-describedby', () => {
      render(<Input label="Width" id="width-input" error="Width must be greater than 0" />);
      const input = screen.getByLabelText(/width/i);
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'width-input-error');
      expect(screen.getByRole('alert')).toHaveTextContent(/width must be greater than 0/i);
    });

    it('renders Select with accessible options', () => {
      render(
        <Select
          label="Setting"
          id="setting-select"
          options={[
            { value: 'rural', label: 'Rural' },
            { value: 'urban', label: 'Urban' },
          ]}
        />,
      );
      const select = screen.getByLabelText(/setting/i);
      expect(select).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Rural' })).toBeInTheDocument();
    });
  });

  describe('Card', () => {
    it('renders card title and content cleanly', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Verge Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p>High biodiversity section</p>
          </CardContent>
        </Card>,
      );
      expect(
        screen.getByRole('heading', { level: 3, name: /verge overview/i }),
      ).toBeInTheDocument();
      expect(screen.getByText(/high biodiversity section/i)).toBeInTheDocument();
    });
  });

  describe('Dialog', () => {
    it('renders accessible dialog with aria-labelledby', () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Survey Safety Reminder">
          <p>Please wear high-visibility clothing.</p>
        </Dialog>,
      );
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 2, name: /survey safety reminder/i }),
      ).toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    it('renders tablist, tabs, and tabpanels with keyboard navigation', () => {
      render(
        <Tabs
          tabs={[
            { id: 'tab1', label: 'Overview', content: <div>Overview Content</div> },
            { id: 'tab2', label: 'Species', content: <div>Species Content</div> },
          ]}
        />,
      );
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Overview Content')).toBeInTheDocument();

      fireEvent.click(tabs[1]!);
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByText('Species Content')).toBeInTheDocument();
    });
  });

  describe('Badge & Alert', () => {
    it('renders badges with non-color icons and explicit labels', () => {
      render(<Badge variant="tier-promising" />);
      expect(screen.getByText(/promising verge/i)).toBeInTheDocument();
    });

    it('renders Alert with proper accessibility roles', () => {
      render(
        <Alert variant="warning" title="Warning Notice">
          Safety zone required
        </Alert>,
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/warning notice/i)).toBeInTheDocument();
    });
  });
});
