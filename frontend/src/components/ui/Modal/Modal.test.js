/**
 * Modal 컴포넌트 테스트 (UnifiedModal 래퍼)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import Modal from './Modal';

const mockPortal = jest.fn();
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node) => mockPortal(node)
}));

describe('Modal Component (UnifiedModal)', () => {
  beforeEach(() => {
    mockPortal.mockClear();
  });

  test('renders modal when isOpen is true', () => {
    render(
      <Modal isOpen onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    expect(mockPortal).toHaveBeenCalled();
  });

  test('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    expect(mockPortal).not.toHaveBeenCalled();
  });

  test('displays title when provided', () => {
    render(
      <Modal isOpen title="Test Modal" onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    expect(mockPortal).toHaveBeenCalled();
    const portalContent = mockPortal.mock.calls[0][0];
    render(portalContent);
    expect(screen.getByRole('heading', { name: 'Test Modal' })).toBeInTheDocument();
  });

  test('shows close button when showCloseButton is true', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} showCloseButton>
        <div>Modal content</div>
      </Modal>
    );
    const portalContent = mockPortal.mock.calls[0][0];
    render(portalContent);
    expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
  });

  test('hides close button when showCloseButton is false', () => {
    render(
      <Modal isOpen onClose={jest.fn()} showCloseButton={false}>
        <div>Modal content</div>
      </Modal>
    );
    const portalContent = mockPortal.mock.calls[0][0];
    render(portalContent);
    expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument();
  });

  test('applies correct size class on dialog panel', () => {
    render(
      <Modal isOpen size="large" onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    const portalContent = mockPortal.mock.calls[0][0];
    const { container } = render(portalContent);
    const panel = container.querySelector('.mg-modal');
    expect(panel).toHaveClass('mg-modal--large');
  });

  test('applies correct variant class on overlay and panel', () => {
    render(
      <Modal isOpen variant="form" onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    const portalContent = mockPortal.mock.calls[0][0];
    const { container } = render(portalContent);
    const overlay = container.querySelector('.mg-modal-overlay');
    const panel = container.querySelector('.mg-modal');
    expect(overlay).toHaveClass('mg-modal-overlay--form');
    expect(panel).toHaveClass('mg-modal--form');
  });

  test('applies custom className to overlay and panel', () => {
    render(
      <Modal isOpen className="custom-class" onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    const portalContent = mockPortal.mock.calls[0][0];
    const { container } = render(portalContent);
    const overlay = container.querySelector('.mg-modal-overlay');
    const panel = container.querySelector('.mg-modal');
    expect(overlay).toHaveClass('custom-class');
    expect(panel).toHaveClass('custom-class');
  });

  test('has proper accessibility attributes on dialog root', () => {
    render(
      <Modal isOpen title="Test Modal" onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    const portalContent = mockPortal.mock.calls[0][0];
    const { container } = render(portalContent);
    const dialogRoot = container.querySelector('[role="dialog"]');
    expect(dialogRoot).toHaveAttribute('aria-modal', 'true');
    const title = screen.getByRole('heading', { name: 'Test Modal' });
    const labelledBy = dialogRoot.getAttribute('aria-labelledby');
    expect(labelledBy).toBe(title.id);
  });

  test('calls onClose when Escape key is pressed', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <div>Modal content</div>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when overlay is clicked (backdropClick true)', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} backdropClick>
        <div>Modal content</div>
      </Modal>
    );
    const portalContent = mockPortal.mock.calls[0][0];
    const { container } = render(portalContent);
    const overlay = container.querySelector('.mg-modal-overlay');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('does not call onClose when backdropClick is false', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} backdropClick={false}>
        <div>Modal content</div>
      </Modal>
    );
    const portalContent = mockPortal.mock.calls[0][0];
    const { container } = render(portalContent);
    const overlay = container.querySelector('.mg-modal-overlay');
    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });

  test('does not call onClose when modal panel is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal isOpen onClose={onClose} backdropClick>
        <div>Modal content</div>
      </Modal>
    );
    const portalContent = mockPortal.mock.calls[0][0];
    const { container } = render(portalContent);
    const panel = container.querySelector('.mg-modal');
    fireEvent.click(panel);
    expect(onClose).not.toHaveBeenCalled();
  });

  test('prevents body scroll when modal is open', () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('unset');
    rerender(
      <Modal isOpen onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('restores body scroll when component unmounts', () => {
    const { unmount } = render(
      <Modal isOpen onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('unset');
  });
});
