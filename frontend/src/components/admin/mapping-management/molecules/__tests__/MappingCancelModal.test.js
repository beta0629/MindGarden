/**
 * MappingCancelModal — secondary/danger equal-height footer contract + dismiss/confirm wiring.
 *
 * @author CoreSolution
 * @since 2026-08-31
 */

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('../../../../common/modals/UnifiedModal', () => ({
  __esModule: true,
  default: ({ isOpen, title, children, actions, onClose }) =>
    isOpen ? (
      <div role="dialog" aria-label={title} data-testid="mapping-cancel-modal">
        <div data-testid="mapping-cancel-modal-body">{children}</div>
        <div data-testid="mapping-cancel-modal-actions">{actions}</div>
        <button type="button" data-testid="unified-modal-dismiss" onClick={onClose}>
          dismiss
        </button>
      </div>
    ) : null
}));

jest.mock('../../../../common/MGButton', () => ({
  __esModule: true,
  default: ({
    children,
    onClick,
    disabled,
    loading,
    type = 'button',
    variant = 'primary',
    size = 'medium',
    className = '',
    loadingText: _loadingText,
    preventDoubleClick: _preventDoubleClick,
    'data-testid': dataTestId,
    'aria-label': ariaLabel
  }) => (
    // eslint-disable-next-line react/button-has-type
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        'mg-button',
        `mg-button--${variant}`,
        `mg-button--${size}`,
        className
      ]
        .filter(Boolean)
        .join(' ')}
      data-variant={variant}
      data-size={size}
      data-testid={dataTestId}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}));

import MappingCancelModal from '../MappingCancelModal';

describe('MappingCancelModal footer equal-height + dismiss/confirm', () => {
  const defaultProps = {
    isOpen: true,
    onConfirm: jest.fn(),
    onClose: jest.fn(),
    processing: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders secondary+danger medium MGButtons with shared size class', () => {
    render(<MappingCancelModal {...defaultProps} />);

    const back = screen.getByTestId('mapping-cancel-modal-back');
    const confirm = screen.getByTestId('mapping-cancel-modal-confirm');

    expect(back).toHaveClass('mg-button--medium');
    expect(confirm).toHaveClass('mg-button--medium');
    expect(back).toHaveClass('mg-button--secondary');
    expect(confirm).toHaveClass('mg-button--danger');
    expect(back.getAttribute('data-size')).toBe(confirm.getAttribute('data-size'));
    expect(back).toHaveClass('mg-v2-button');
    expect(back).toHaveClass('mg-v2-button-secondary');
    expect(confirm).toHaveClass('mg-v2-button');
    expect(confirm).toHaveClass('mg-v2-button-danger');
  });

  it('back button calls onClose (dismiss) without calling onConfirm', () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();
    render(
      <MappingCancelModal
        {...defaultProps}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByTestId('mapping-cancel-modal-back'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('confirm button calls onConfirm (danger) without calling onClose', () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();
    render(
      <MappingCancelModal
        {...defaultProps}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByTestId('mapping-cancel-modal-confirm'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
