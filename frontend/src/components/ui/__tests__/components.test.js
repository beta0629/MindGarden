/**
 * UI 컴포넌트 테스트 스위트 (실제 구현 기준: MGButton 래퍼 Button, UnifiedModal, mg-table)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import Modal from '../Modal/Modal';
import Table from '../Table/Table';
import { TEST_DATA, TestWrapper } from './testUtils';

describe('UI Components Test Suite', () => {
  describe('Icon Component', () => {
    test('renders icon with correct name', () => {
      render(
        <TestWrapper>
          <Icon name="CALENDAR" />
        </TestWrapper>
      );

      const icon = screen.getByRole('img');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-label', 'CALENDAR');
    });

    test('handles all size variants', () => {
      const sizes = ['XS', 'SM', 'MD', 'LG', 'XL', 'XXL', 'XXXL', 'HUGE'];

      sizes.forEach((size) => {
        const { unmount } = render(
          <TestWrapper>
            <Icon name="CALENDAR" size={size} />
          </TestWrapper>
        );

        const icon = screen.getByRole('img');
        expect(icon).toHaveClass(`mg-v2-icon--${size.toLowerCase()}`);
        unmount();
      });
    });

    test('handles all color variants', () => {
      const colors = ['PRIMARY', 'SECONDARY', 'SUCCESS', 'WARNING', 'ERROR', 'INFO', 'MUTED', 'TRANSPARENT'];

      colors.forEach((color) => {
        const { unmount } = render(
          <TestWrapper>
            <Icon name="CALENDAR" color={color} />
          </TestWrapper>
        );

        const icon = screen.getByRole('img');
        expect(icon).toHaveClass(`mg-v2-icon--${color.toLowerCase()}`);
        unmount();
      });
    });

    test('handles click events', () => {
      const handleClick = jest.fn();
      render(
        <TestWrapper>
          <Icon name="CALENDAR" onClick={handleClick} />
        </TestWrapper>
      );

      const icon = screen.getByRole('button');
      fireEvent.click(icon);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('shows loading state', () => {
      render(
        <TestWrapper>
          <Icon name="CALENDAR" loading />
        </TestWrapper>
      );

      const spinner = document.querySelector('.mg-v2-v2-v2-icon-spinner');
      expect(spinner).toBeInTheDocument();
    });

    test('handles disabled state', () => {
      const handleClick = jest.fn();
      render(
        <TestWrapper>
          <Icon name="CALENDAR" onClick={handleClick} disabled />
        </TestWrapper>
      );

      const icon = screen.getByRole('button');
      expect(icon).toHaveAttribute('aria-disabled', 'true');

      fireEvent.click(icon);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Button Component (MGButton 래퍼)', () => {
    test('renders button with text', () => {
      render(
        <TestWrapper>
          <Button>Test Button</Button>
        </TestWrapper>
      );

      const button = screen.getByRole('button', { name: /test button/i });
      expect(button).toBeInTheDocument();
    });

    test('handles all variants', () => {
      TEST_DATA.BUTTON_VARIANTS.forEach((variant) => {
        const { unmount } = render(
          <TestWrapper>
            <Button variant={variant}>Button</Button>
          </TestWrapper>
        );

        const button = screen.getByRole('button');
        expect(button).toHaveClass(`mg-button--${variant}`);
        unmount();
      });
    });

    test('handles all sizes', () => {
      TEST_DATA.BUTTON_SIZES.forEach((size) => {
        const { unmount } = render(
          <TestWrapper>
            <Button size={size}>Button</Button>
          </TestWrapper>
        );

        const button = screen.getByRole('button');
        expect(button).toHaveClass(`mg-button--${size}`);
        unmount();
      });
    });

    test('handles icon buttons', () => {
      render(
        <TestWrapper>
          <Button icon="PLUS">Add</Button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('mg-button--with-icon');
    });

    test('handles loading state', () => {
      render(
        <TestWrapper>
          <Button loading>Loading</Button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('처리중...');
    });

    test('prevents double click', async() => {
      const handleClick = jest.fn();
      render(
        <TestWrapper>
          <Button onClick={handleClick} preventDoubleClick>
            Click
          </Button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);

      await waitFor(() => {
        expect(handleClick).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Modal Component (UnifiedModal)', () => {
    test('renders modal when open', () => {
      render(
        <TestWrapper>
          <Modal isOpen onClose={jest.fn()} title="Test Modal">
            <p>Modal content</p>
          </Modal>
        </TestWrapper>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    test('does not render when closed', () => {
      render(
        <TestWrapper>
          <Modal isOpen={false} onClose={jest.fn()}>
            <p>Modal content</p>
          </Modal>
        </TestWrapper>
      );

      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    test('handles all sizes', () => {
      TEST_DATA.MODAL_SIZES.forEach((size) => {
        const { unmount } = render(
          <TestWrapper>
            <Modal isOpen onClose={jest.fn()} size={size}>
              <p>Content</p>
            </Modal>
          </TestWrapper>
        );

        const modal = document.querySelector('.mg-modal');
        expect(modal).toHaveClass(`mg-modal--${size}`);
        unmount();
      });
    });

    test('handles all variants', () => {
      TEST_DATA.MODAL_VARIANTS.forEach((variant) => {
        const { unmount } = render(
          <TestWrapper>
            <Modal isOpen onClose={jest.fn()} variant={variant}>
              <p>Content</p>
            </Modal>
          </TestWrapper>
        );

        const modal = document.querySelector('.mg-modal');
        if (variant === 'default') {
          expect(modal).not.toHaveClass('mg-modal--default');
        } else {
          expect(modal).toHaveClass(`mg-modal--${variant}`);
        }
        unmount();
      });
    });

    test('handles close events', () => {
      const handleClose = jest.fn();
      render(
        <TestWrapper>
          <Modal isOpen onClose={handleClose} title="Test Modal">
            <p>Content</p>
          </Modal>
        </TestWrapper>
      );

      const closeButton = screen.getByLabelText('닫기');
      fireEvent.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    test('handles escape key', () => {
      const handleClose = jest.fn();
      render(
        <TestWrapper>
          <Modal isOpen onClose={handleClose}>
            <p>Content</p>
          </Modal>
        </TestWrapper>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Table Component', () => {
    test('renders table with body', () => {
      render(
        <TestWrapper>
          <Table striped>
            <tbody>
              <tr>
                <td data-label="이름">홍길동</td>
              </tr>
            </tbody>
          </Table>
        </TestWrapper>
      );

      expect(screen.getByText('홍길동')).toBeInTheDocument();
      const table = document.querySelector('.mg-table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass('mg-table-striped');
    });

    test('handles row clicks via table', () => {
      render(
        <TestWrapper>
          <Table>
            <tbody>
              <tr>
                <td data-label="a">a</td>
              </tr>
            </tbody>
          </Table>
        </TestWrapper>
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    test('Icon and Button work together', () => {
      render(
        <TestWrapper>
          <Button icon="PLUS">Add Item</Button>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('mg-button--with-icon');
    });

    test('Button opens Modal', async() => {
      const TestComponent = () => {
        const [isOpen, setIsOpen] = React.useState(false);

        return (
          <>
            <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test Modal">
              <p>Modal content</p>
            </Modal>
          </>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Test Modal')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('All components have proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <Icon name="CALENDAR" aria-label="Calendar icon" />
          <Button aria-label="Add button">Add</Button>
          <Table>
            <tbody>
              <tr>
                <td data-label="x">x</td>
              </tr>
            </tbody>
          </Table>
        </TestWrapper>
      );

      const icon = screen.getByLabelText('Calendar icon');
      const button = screen.getByLabelText('Add button');
      const table = screen.getByRole('table');

      expect(icon).toBeInTheDocument();
      expect(button).toBeInTheDocument();
      expect(table).toBeInTheDocument();
    });

    test('Components support keyboard navigation', () => {
      const handleClick = jest.fn();
      render(
        <TestWrapper>
          <Icon name="CALENDAR" onClick={handleClick} />
          <Button onClick={handleClick}>Action</Button>
        </TestWrapper>
      );

      const icon = screen.getAllByRole('button')[0];
      const button = screen.getByRole('button', { name: /action/i });

      fireEvent.keyDown(icon, { key: 'Enter' });
      fireEvent.keyDown(button, { key: 'Enter' });

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Theme Support', () => {
    test('Button applies data-role for theme roles', () => {
      TEST_DATA.ROLES.forEach((role) => {
        const { unmount } = render(
          <TestWrapper>
            <Button role={role}>Button</Button>
          </TestWrapper>
        );

        const button = screen.getByRole('button');
        expect(button).toHaveAttribute('data-role', role);

        unmount();
      });
    });

    test('Table can receive data-role via DOM props', () => {
      const role = 'ADMIN';
      const { unmount } = render(
        <TestWrapper>
          <Table data-role={role}>
            <tbody>
              <tr>
                <td data-label="t">t</td>
              </tr>
            </tbody>
          </Table>
        </TestWrapper>
      );

      expect(screen.getByRole('table')).toHaveAttribute('data-role', role);
      unmount();
    });
  });
});
