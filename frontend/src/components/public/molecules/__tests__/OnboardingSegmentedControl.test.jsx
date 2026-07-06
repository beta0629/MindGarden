/**
 * OnboardingSegmentedControl 단위 테스트 (Phase C-Refine v2)
 *
 * SPEC §3.2 / §5: 4분할 Segmented Control, 키보드 화살표/Enter/Space 접근성.
 *
 * @author CoreSolution
 * @since 2026-06-16
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

const OnboardingSegmentedControl = require('../OnboardingSegmentedControl').default;

const OPTIONS = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201+', label: '201+' },
];

describe('OnboardingSegmentedControl', () => {
  it('renders all options as radio buttons', () => {
    render(<OnboardingSegmentedControl options={OPTIONS} ariaLabel="Staff size" />);
    expect(screen.getAllByRole('radio').length).toBe(4);
  });

  it('marks selected option with aria-checked=true', () => {
    render(<OnboardingSegmentedControl options={OPTIONS} value="11-50" ariaLabel="Staff size" />);
    const selected = screen.getByRole('radio', { checked: true });
    expect(selected).toHaveTextContent('11-50');
  });

  it('calls onChange when option clicked', () => {
    const onChange = jest.fn();
    render(<OnboardingSegmentedControl options={OPTIONS} onChange={onChange} name="staffSize" ariaLabel="Staff size" />);
    fireEvent.click(screen.getByText('51-200'));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ name: 'staffSize', value: '51-200' }),
    }));
  });

  it('selects next option via ArrowRight', () => {
    const onChange = jest.fn();
    render(<OnboardingSegmentedControl options={OPTIONS} value="1-10" onChange={onChange} ariaLabel="Staff size" />);
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[0], { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: '11-50' }),
    }));
  });

  it('selects previous option via ArrowLeft (wraps around)', () => {
    const onChange = jest.fn();
    render(<OnboardingSegmentedControl options={OPTIONS} value="1-10" onChange={onChange} ariaLabel="Staff size" />);
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[0], { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: '201+' }),
    }));
  });

  it('confirms option via Enter key', () => {
    const onChange = jest.fn();
    render(<OnboardingSegmentedControl options={OPTIONS} onChange={onChange} ariaLabel="Staff size" />);
    const radios = screen.getAllByRole('radio');
    fireEvent.keyDown(radios[2], { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      target: expect.objectContaining({ value: '51-200' }),
    }));
  });

  it('uses radiogroup role and ariaLabel on container', () => {
    render(<OnboardingSegmentedControl options={OPTIONS} ariaLabel="Staff size" />);
    expect(screen.getByRole('radiogroup', { name: 'Staff size' })).toBeInTheDocument();
  });
});
