/**
 * FeatureUnavailable — column stack, 30rem measure, outline CTA
 *
 * @author CoreSolution
 * @since 2026-10-05
 */

import React from 'react';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FeatureUnavailable, { FEATURE_UNAVAILABLE_ICON } from '../FeatureUnavailable';

const TITLE = 'Feature off';
const DESCRIPTION = 'Not offered.';
const ACTION_LABEL = 'Back home';
const ACTION_HREF = '/admin/dashboard';

function renderUnavailable(props = {}) {
  return render(
    <MemoryRouter>
      <FeatureUnavailable
        title={TITLE}
        description={DESCRIPTION}
        actionLabel={ACTION_LABEL}
        actionHref={ACTION_HREF}
        {...props}
      />
    </MemoryRouter>
  );
}

describe('FeatureUnavailable', () => {
  test('renders a single h1, description, and outline link from props', () => {
    renderUnavailable();

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(TITLE);
    expect(headings[0]).toHaveClass('feature-unavailable__title');
    expect(screen.getByText(DESCRIPTION)).toBeInTheDocument();

    const link = screen.getByRole('link', { name: ACTION_LABEL });
    expect(link).toHaveAttribute('href', ACTION_HREF);
    expect(link).toHaveClass('feature-unavailable__action');
    expect(link.className).not.toMatch(/primary/);
    expect(link.className).not.toMatch(/mg-button--primary/);
    expect(screen.getByRole('region', { name: TITLE })).toHaveClass('feature-unavailable');
    expect(document.querySelector('.feature-unavailable__icon')).toBeInTheDocument();
  });

  test('icon none omits the glyph', () => {
    renderUnavailable({ icon: FEATURE_UNAVAILABLE_ICON.NONE });
    expect(document.querySelector('.feature-unavailable__icon')).not.toBeInTheDocument();
  });

  test('lock icon still keeps the column stack and outline action', () => {
    renderUnavailable({ icon: FEATURE_UNAVAILABLE_ICON.LOCK });
    expect(document.querySelector('.feature-unavailable__icon')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: ACTION_LABEL })).toHaveClass('feature-unavailable__action');
  });

  test('stylesheet is a column stack at 30rem with an outline action', () => {
    const css = fs.readFileSync(path.join(__dirname, '../FeatureUnavailable.css'), 'utf8');
    expect(css).toMatch(/--feature-unavailable-measure:\s*30rem/);
    expect(css).toMatch(/max-width:\s*var\(--feature-unavailable-measure\)/);
    expect(css).toMatch(/\.feature-unavailable\s*\{[^}]*flex-direction:\s*column/);
    expect(css).toMatch(/\.feature-unavailable-host\s*\{[^}]*flex-direction:\s*column/);
    expect(css).toMatch(/border:\s*1px solid var\(--mg-v2-color-border-default\)/);
    expect(css).toMatch(/background:\s*var\(--mg-v2-color-surface-card\)/);
    expect(css).not.toMatch(/--mg-v2-color-primary-solid/);
    expect(css).not.toMatch(/--mg-color-primary/);
    expect(css).not.toMatch(/#A84848/);
  });
});
