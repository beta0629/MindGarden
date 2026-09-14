/**
 * MGDateInput — Korean ISO display overlay on native date input
 *
 * @author Core Solution
 * @since 2026-09-02
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import MGDateInput from '../MGDateInput';
import { ISO_DATE_DISPLAY_PLACEHOLDER } from '../../../utils/dateUtils';

describe('MGDateInput', () => {
  it('empty value shows YYYY-MM-DD placeholder in display layer', () => {
    render(<MGDateInput id="due-date" value="" onChange={jest.fn()} aria-label="마감일" />);

    expect(screen.getByText(ISO_DATE_DISPLAY_PLACEHOLDER)).toHaveClass(
      'mg-date-input__display--placeholder'
    );
  });

  it('value 2026-08-01 shows 2026-08-01 in display layer', () => {
    render(
      <MGDateInput
        id="due-date"
        value="2026-08-01"
        onChange={jest.fn()}
        aria-label="마감일"
      />
    );

    expect(screen.getByText('2026-08-01')).toBeInTheDocument();
    expect(screen.getByText('2026-08-01')).not.toHaveClass('mg-date-input__display--placeholder');
  });

  it('onChange still emits ISO YYYY-MM-DD via native input (controlled round-trip)', () => {
    const Stateful = () => {
      const [val, setVal] = React.useState('');
      return (
        <MGDateInput
          id="due-date"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          aria-label="마감일"
        />
      );
    };

    render(<Stateful />);
    const input = screen.getByLabelText('마감일');

    fireEvent.change(input, { target: { value: '2026-08-01' } });

    expect(input).toHaveValue('2026-08-01');
    expect(screen.getByText('2026-08-01')).toBeInTheDocument();
  });

  it('forwards disabled and readOnly props to native input', () => {
    render(
      <MGDateInput
        id="session-date"
        value="2026-01-15"
        onChange={jest.fn()}
        disabled
        readOnly
        aria-label="세션일"
      />
    );

    const input = screen.getByLabelText('세션일');
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute('readonly');
  });
});
