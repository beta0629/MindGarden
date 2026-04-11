/**
 * UI 컴포넌트 통합 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import Modal from '../Modal/Modal';
import Table from '../Table/Table';

const mockPortal = jest.fn();
jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node) => mockPortal(node)
}));

describe('UI Components Integration Tests', () => {
  beforeEach(() => {
    mockPortal.mockClear();
  });

  test('Icon and Button work together', () => {
    render(
      <Button icon="PLUS" size="small">
        Add Item
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Add Item');
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

    render(<TestComponent />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockPortal).toHaveBeenCalled();
    });
  });

  test('Table with simple markup', () => {
    render(
      <Table>
        <tbody>
          <tr>
            <td data-label="이름">Test User</td>
          </tr>
        </tbody>
      </Table>
    );

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  test('All components work together in a simple scenario', async() => {
    const ComplexComponent = () => {
      const [isModalOpen, setIsModalOpen] = React.useState(false);

      return (
        <div>
          <Button icon="PLUS" onClick={() => setIsModalOpen(true)}>
            Add User
          </Button>

          <Table>
            <tbody>
              <tr>
                <td data-label="이름">User 1</td>
              </tr>
            </tbody>
          </Table>

          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add User">
            <div>
              <p>Add new user form would go here</p>
              <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            </div>
          </Modal>
        </div>
      );
    };

    render(<ComplexComponent />);

    expect(screen.getByText('Add User')).toBeInTheDocument();
    expect(screen.getByText('User 1')).toBeInTheDocument();

    const addButton = screen.getByText('Add User');
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(mockPortal).toHaveBeenCalled();
    });
  });

  test('All components maintain accessibility standards', () => {
    render(
      <div>
        <Icon name="CALENDAR" aria-label="Calendar icon" />
        <Button icon="PLUS" aria-label="Add item">
          Add
        </Button>
        <Table>
          <tbody>
            <tr>
              <td data-label="이름">Test User</td>
            </tr>
          </tbody>
        </Table>
      </div>
    );

    const icon = screen.getByLabelText('Calendar icon');
    const button = screen.getByLabelText('Add item');
    const table = screen.getByRole('table');

    expect(icon).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(table).toBeInTheDocument();
  });

  test('Icon warns when name is missing from registry', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    render(<Icon name="NON_EXISTENT" />);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  test('Components render efficiently', () => {
    const startTime = performance.now();

    render(
      <div>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i}>
            <Icon name="CALENDAR" />
            <Button size="small">Button {i}</Button>
          </div>
        ))}
      </div>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    expect(renderTime).toBeLessThan(5000);
  });
});
