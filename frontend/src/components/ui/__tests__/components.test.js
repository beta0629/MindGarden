/**
 * UI 컴포넌트 테스트 스위트
 */

import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import {TEST_DATA, TestWrapper} from '../../setupTests';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import Modal from '../Modal/Modal';
import Table from '../Table/Table';

describe('UI Components Test Suite', () => {// Icon 컴포넌트 테스트
  describe('Icon Component', () => {test('renders icon with correct name', () => {render(<TestWrapper>
          <Icon name="CALENDAR" />
        </TestWrapper>);
      
      const icon = screen.getByRole('img');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('aria-label', 'CALENDAR');});

    test('handles all size variants', () => {const sizes = ['XS', 'SM', 'MD', 'LG', 'XL', 'XXL', 'XXXL', 'HUGE'];
      
      sizes.forEach(size => {const {unmount} = render(<TestWrapper>
            <Icon name="CALENDAR" size={size} />
          </TestWrapper>);
        
        const icon = screen.getByRole('img');
        expect(icon).toHaveClass(`mg-v2-icon--${size.toLowerCase()}`);
        unmount();});});

    test('handles all color variants', () => {const colors = ['PRIMARY', 'SECONDARY', 'SUCCESS', 'WARNING', 'ERROR', 'INFO', 'MUTED', 'TRANSPARENT'];
      
      colors.forEach(color => {const {unmount} = render(<TestWrapper>
            <Icon name="CALENDAR" color={color} />
          </TestWrapper>);
        
        const icon = screen.getByRole('img');
        expect(icon).toHaveClass(`mg-v2-icon--${color.toLowerCase()}`);
        unmount();});});

    test('handles click events', () => {const handleClick = jest.fn();
      render(<TestWrapper>
          <Icon name="CALENDAR" onClick={handleClick} />
        </TestWrapper>);
      
      const icon = screen.getByRole('button');
      fireEvent.click(icon);
      
      expect(handleClick).toHaveBeenCalledTimes(DEFAULT_VALUES.CURRENT_PAGE);});

    test('shows loading state', () => {render(<TestWrapper>
          <Icon name="CALENDAR" loading />
        </TestWrapper>);
      
      const spinner = document.querySelector('.mg-v2-icon-spinner');
      expect(spinner).toBeInTheDocument();});

    test('handles disabled state', () => {const handleClick = jest.fn();
      render(<TestWrapper>
          <Icon name="CALENDAR" onClick={handleClick} disabled />
        </TestWrapper>);
      
      const icon = screen.getByRole('button');
      expect(icon).toHaveAttribute('aria-disabled', 'true');
      
      fireEvent.click(icon);
      expect(handleClick).not.toHaveBeenCalled();});});

  // Button 컴포넌트 테스트
  describe('Button Component', () => {test('renders button with text', () => {render(<TestWrapper>
          <Button>Test Button</Button>
        </TestWrapper>);
      
      const button = screen.getByRole('button', {name: /test button/i});
      expect(button).toBeInTheDocument();});

    test('handles all variants', () => {TEST_DATA.BUTTON_VARIANTS.forEach(variant => {const {unmount} = render(<TestWrapper>
            <Button variant={variant}>Button</Button>
          </TestWrapper>);
        
        const button = screen.getByRole('button');
        expect(button).toHaveClass(`mg-v2-button--${variant}`);
        unmount();});});

    test('handles all sizes', () => {TEST_DATA.BUTTON_SIZES.forEach(size => {const {unmount} = render(<TestWrapper>
            <Button size={size}>Button</Button>
          </TestWrapper>);
        
        const button = screen.getByRole('button');
        expect(button).toHaveClass(`mg-v2-button--${size}`);
        unmount();});});

    test('handles icon buttons', () => {render(<TestWrapper>
          <Button icon="PLUS">Add</Button>
        </TestWrapper>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('mg-v2-button--with-icon');});

    test('handles loading state', () => {render(<TestWrapper>
          <Button loading>Loading</Button>
        </TestWrapper>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('처리 중...');});

    test('prevents double click', async() => {const handleClick = jest.fn();
      render(<TestWrapper>
          <Button onClick={handleClick} preventDoubleClick={true}>Click</Button>
        </TestWrapper>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      fireEvent.click(button);
      
      await waitFor(() => {expect(handleClick).toHaveBeenCalledTimes(DEFAULT_VALUES.CURRENT_PAGE);});});});

  // Modal 컴포넌트 테스트
  describe('Modal Component', () => {beforeEach(() => {// ReactDOM.createPortal 모킹
      jest.mock('react-dom', () => ({...jest.requireActual('react-dom'),
        createPortal: (node) => node}));});

    test('renders modal when open', () => {render(<TestWrapper>
          <Modal isOpen={true} onClose={jest.fn()} title="Test Modal">
            <p>Modal content</p>
          </Modal>
        </TestWrapper>);
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();});

    test('does not render when closed', () => {render(<TestWrapper>
          <Modal isOpen={false} onClose={jest.fn()}>
            <p>Modal content</p>
          </Modal>
        </TestWrapper>);
      
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();});

    test('handles all sizes', () => {TEST_DATA.MODAL_SIZES.forEach(size => {const {unmount} = render(<TestWrapper>
            <Modal isOpen={true} onClose={jest.fn()} size={size}>
              <p>Content</p>
            </Modal>
          </TestWrapper>);
        
        const modal = document.querySelector('.mg-v2-modal');
        expect(modal).toHaveClass(`mg-v2-modal--${size}`);
        unmount();});});

    test('handles all variants', () => {TEST_DATA.MODAL_VARIANTS.forEach(variant => {const {unmount} = render(<TestWrapper>
            <Modal isOpen={true} onClose={jest.fn()} variant={variant}>
              <p>Content</p>
            </Modal>
          </TestWrapper>);
        
        const modal = document.querySelector('.mg-v2-modal');
        expect(modal).toHaveClass(`mg-v2-modal--${variant}`);
        unmount();});});

    test('handles close events', () => {const handleClose = jest.fn();
      render(<TestWrapper>
          <Modal isOpen={true} onClose={handleClose} title="Test Modal">
            <p>Content</p>
          </Modal>
        </TestWrapper>);
      
      const closeButton = screen.getByLabelText('모달 닫기');
      fireEvent.click(closeButton);
      
      expect(handleClose).toHaveBeenCalledTimes(DEFAULT_VALUES.CURRENT_PAGE);});

    test('handles escape key', () => {const handleClose = jest.fn();
      render(<TestWrapper>
          <Modal isOpen={true} onClose={handleClose}>
            <p>Content</p>
          </Modal>
        </TestWrapper>);
      
      fireEvent.keyDown(document, {key: 'Escape'});
      expect(handleClose).toHaveBeenCalledTimes(DEFAULT_VALUES.CURRENT_PAGE);});});

  // Table 컴포넌트 테스트
  describe('Table Component', () => {test('renders table with data', () => {render(<TestWrapper>
          <Table data={TEST_DATA.USERS} columns={TEST_DATA.COLUMNS} />
        </TestWrapper>);
      
      expect(screen.getByText('홍길동')).toBeInTheDocument();
      expect(screen.getByText('hong@example.com')).toBeInTheDocument();});

    test('handles all variants', () => {TEST_DATA.TABLE_VARIANTS.forEach(variant => {const {unmount} = render(<TestWrapper>
            <Table data={TEST_DATA.USERS} columns={TEST_DATA.COLUMNS} variant={variant} />
          </TestWrapper>);
        
        const table = document.querySelector('.mg-v2-table');
        expect(table).toHaveClass(`mg-v2-table--${variant}`);
        unmount();});});

    test('handles all sizes', () => {TEST_DATA.TABLE_SIZES.forEach(size => {const {unmount} = render(<TestWrapper>
            <Table data={TEST_DATA.USERS} columns={TEST_DATA.COLUMNS} size={size} />
          </TestWrapper>);
        
        const table = document.querySelector('.mg-v2-table');
        expect(table).toHaveClass(`mg-v2-table--${size}`);
        unmount();});});

    test('shows loading state', () => {render(<TestWrapper>
          <Table data={[]} columns={TEST_DATA.COLUMNS} loading={true} />
        </TestWrapper>);
      
      expect(screen.getByText('데이터를 불러오는 중...')).toBeInTheDocument();});

    test('shows empty state', () => {render(<TestWrapper>
          <Table data={[]} columns={TEST_DATA.COLUMNS} emptyMessage="No data" />
        </TestWrapper>);
      
      expect(screen.getByText('No data')).toBeInTheDocument();});

    test('handles row clicks', () => {const handleRowClick = jest.fn();
      render(<TestWrapper>
          <Table 
            data={TEST_DATA.USERS} 
            columns={TEST_DATA.COLUMNS} 
            onRowClick={handleRowClick}
          />
        </TestWrapper>);
      
      const firstRow = screen.getByText('홍길동').closest('tr');
      fireEvent.click(firstRow);
      
      expect(handleRowClick).toHaveBeenCalledWith(TEST_DATA.USERS[COLOR_CONSTANTS.ALPHA_TRANSPARENT], COLOR_CONSTANTS.ALPHA_TRANSPARENT);});

    test('handles cell clicks', () => {const handleCellClick = jest.fn();
      render(<TestWrapper>
          <Table 
            data={TEST_DATA.USERS} 
            columns={TEST_DATA.COLUMNS} 
            onCellClick={handleCellClick}
          />
        </TestWrapper>);
      
      const firstCell = screen.getByText('홍길동');
      fireEvent.click(firstCell);
      
      expect(handleCellClick).toHaveBeenCalledWith('홍길동', TEST_DATA.USERS[COLOR_CONSTANTS.ALPHA_TRANSPARENT], COLOR_CONSTANTS.ALPHA_TRANSPARENT, DEFAULT_VALUES.CURRENT_PAGE);});});

  // 통합 테스트
  describe('Component Integration', () => {test('Icon and Button work together', () => {render(<TestWrapper>
          <Button icon="PLUS">Add Item</Button>
        </TestWrapper>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('mg-v2-button--with-icon');});

    test('Button opens Modal', async() => {const TestComponent = () => {const [isOpen, setIsOpen] = React.useState(false);
        
        return (<>
            <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test Modal">
              <p>Modal content</p>
            </Modal>
          </>);};
      
      render(<TestWrapper>
          <TestComponent />
        </TestWrapper>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      await waitFor(() => {expect(screen.getByText('Test Modal')).toBeInTheDocument();});});

    test('Table with action buttons', () => {const columns = [...TEST_DATA.COLUMNS,
        {key: 'actions',
          header: 'Actions',
          render: (value, row) => (<Button size="small" icon="EDIT" variant="outline" />)}];
      
      render(<TestWrapper>
          <Table data={TEST_DATA.USERS} columns={columns} />
        </TestWrapper>);
      
      expect(screen.getByRole('button')).toBeInTheDocument();});});

  // 접근성 테스트
  describe('Accessibility', () => {test('All components have proper ARIA attributes', () => {render(<TestWrapper>
          <Icon name="CALENDAR" aria-label="Calendar icon" />
          <Button aria-label="Add button">Add</Button>
          <Table data={TEST_DATA.USERS} columns={TEST_DATA.COLUMNS} />
        </TestWrapper>);
      
      const icon = screen.getByLabelText('Calendar icon');
      const button = screen.getByLabelText('Add button');
      const table = screen.getByRole('table');
      
      expect(icon).toBeInTheDocument();
      expect(button).toBeInTheDocument();
      expect(table).toBeInTheDocument();});

    test('Components support keyboard navigation', () => {const handleClick = jest.fn();
      render(<TestWrapper>
          <Icon name="CALENDAR" onClick={handleClick} />
          <Button onClick={handleClick}>Button</Button>
        </TestWrapper>);
      
      const icon = screen.getByRole('button');
      const button = screen.getByRole('button', {name: /button/i});
      
      fireEvent.keyDown(icon, {key: 'Enter'});
      fireEvent.keyDown(button, {key: 'Enter'});
      
      expect(handleClick).toHaveBeenCalledTimes(FORM_CONSTANTS.MIN_INPUT_LENGTH);});});

  // 테마 테스트
  describe('Theme Support', () => {test('All components respect role themes', () => {TEST_DATA.ROLES.forEach(role => {const {unmount} = render(<TestWrapper role={role}>
            <Icon name="CALENDAR" role={role} />
            <Button role={role}>Button</Button>
            <Table data={TEST_DATA.USERS} columns={TEST_DATA.COLUMNS} role={role} />
          </TestWrapper>);
        
        const icon = screen.getByRole('img');
        const button = screen.getByRole('button');
        const table = screen.getByRole('table');
        
        expect(icon).toHaveAttribute('data-role', role);
        expect(button).toHaveAttribute('data-role', role);
        expect(table).toHaveAttribute('data-role', role);
        
        unmount();});});});});
