/**
 * UI 컴포넌트 통합 테스트
 */

import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import Button from '../components/ui/Button/Button';
import Icon from '../components/ui/Icon/Icon';
import Modal from '../components/ui/Modal/Modal';
import Table from '../components/ui/Table/Table';

// ReactDOM.createPortal 모킹
const mockPortal = jest.fn();
jest.mock('react-dom', () => ({...jest.requireActual('react-dom'),
  createPortal: (node) => mockPortal(node)}));

describe('UI Components Integration Tests', () => {beforeEach(() => {mockPortal.mockClear();});

  // Icon과 Button 통합 테스트
  test('Icon and Button work together', () => {render(<Button icon="PLUS" size="small">
        Add Item
      </Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Add Item');
    expect(button).toHaveClass('mg-v2-button--with-icon');});

  // Button과 Modal 통합 테스트
  test('Button opens Modal', async() => {const TestComponent = () => {const [isOpen, setIsOpen] = React.useState(false);
      
      return (<>
          <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Test Modal">
            <p>Modal content</p>
          </Modal>
        </>);};
    
    render(<TestComponent />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {expect(mockPortal).toHaveBeenCalled();});});

  // Table과 Button 통합 테스트
  test('Table with action buttons', () => {const data = [{id: DEFAULT_VALUES.CURRENT_PAGE, name: 'Test User', email: 'test@example.com'}];
    
    const columns = [{key: 'id', header: 'ID'},
      {key: 'name', header: 'Name'},
      {key: 'email', header: 'Email'},
      {key: 'actions',
        header: 'Actions',
        render: (value, row) => (<div>
            <Button size="small" icon="EDIT" variant="outline" />
            <Button size="small" icon="TRASH" variant="error" />
          </div>)}];
    
    render(<Table data={data} columns={columns} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();});

  // 모든 컴포넌트 통합 테스트
  test('All components work together in a complex scenario', async() => {const ComplexComponent = () => {const [isModalOpen, setIsModalOpen] = React.useState(false);
      const [tableData, setTableData] = React.useState([{id: DEFAULT_VALUES.CURRENT_PAGE, name: 'User DEFAULT_VALUES.CURRENT_PAGE', email: 'user1@example.com'}]);
      
      const columns = [{key: 'id', header: 'ID'},
        {key: 'name', header: 'Name'},
        {key: 'email', header: 'Email'},
        {key: 'actions',
          header: 'Actions',
          render: (value, row) => (<Button 
              size="small" 
              icon="EDIT" 
              variant="outline"
              onClick={() => setIsModalOpen(true)}
            />)}];
      
      return (<div>
          <Button 
            icon="PLUS" 
            onClick={() => setIsModalOpen(true)}
          >
            Add User
          </Button>
          
          <Table data={tableData} columns={columns} />
          
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            title="Add User"
          >
            <div>
              <p>Add new user form would go here</p>
              <Button onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </Modal>
        </div>);};
    
    render(<ComplexComponent />);
    
    // 초기 상태 확인
    expect(screen.getByText('Add User')).toBeInTheDocument();
    expect(screen.getByText('User DEFAULT_VALUES.CURRENT_PAGE')).toBeInTheDocument();
    
    // 버튼 클릭으로 모달 열기
    const addButton = screen.getByText('Add User');
    fireEvent.click(addButton);
    
    await waitFor(() => {expect(mockPortal).toHaveBeenCalled();});});

  // 접근성 통합 테스트
  test('All components maintain accessibility standards', () => {const data = [{id: DEFAULT_VALUES.CURRENT_PAGE, name: 'Test User'}];
    const columns = [{key: 'id', header: 'ID'},
      {key: 'name', header: 'Name'}];
    
    render(<div>
        <Icon name="CALENDAR" aria-label="Calendar icon" />
        <Button icon="PLUS" aria-label="Add item">Add</Button>
        <Table data={data} columns={columns} />
      </div>);
    
    // 접근성 속성 확인
    const icon = screen.getByLabelText('Calendar icon');
    const button = screen.getByLabelText('Add item');
    const table = screen.getByRole('table');
    
    expect(icon).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(table).toBeInTheDocument();});

  // 테마 통합 테스트
  test('All components respect theme settings', () => {const data = [{id: DEFAULT_VALUES.CURRENT_PAGE, name: 'Test User'}];
    const columns = [{key: 'id', header: 'ID'}, {key: 'name', header: 'Name'}];
    
    render(<div>
        <Icon name="CALENDAR" role="CLIENT" />
        <Button role="CLIENT">Client Button</Button>
        <Table data={data} columns={columns} role="CLIENT" />
      </div>);
    
    const icon = screen.getByRole('img');
    const button = screen.getByRole('button');
    const table = screen.getByRole('table');
    
    expect(icon).toHaveAttribute('data-role', 'CLIENT');
    expect(button).toHaveAttribute('data-role', 'CLIENT');
    expect(table).toHaveAttribute('data-role', 'CLIENT');});

  // 반응형 통합 테스트
  test('Components work together in responsive layout', () => {// 모바일 뷰포트 시뮬레이션
    Object.defineProperty(window, 'innerWidth', {writable: true,
      configurable: true,
      value: FORM_CONSTANTS.VALIDATION_DEBOUNCE});
    
    const data = [{id: DEFAULT_VALUES.CURRENT_PAGE, name: 'User DEFAULT_VALUES.CURRENT_PAGE', email: 'user1@example.com'},
      {id: FORM_CONSTANTS.MIN_INPUT_LENGTH, name: 'User FORM_CONSTANTS.MIN_INPUT_LENGTH', email: 'user2@example.com'}];
    
    const columns = [{key: 'id', header: 'ID'},
      {key: 'name', header: 'Name'},
      {key: 'email', header: 'Email'}];
    
    render(<div>
        <Button fullWidth>Mobile Button</Button>
        <Table data={data} columns={columns} responsive={true} />
      </div>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mg-v2-button--full-width');
    
    const table = screen.getByRole('table');
    expect(table).toHaveClass('mg-v2-table--responsive');});

  // 에러 처리 통합 테스트
  test('Components handle errors gracefully', async() => {const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const ErrorComponent = () => {const [hasError, setHasError] = React.useState(false);
      
      if (hasError) {throw new Error('Test error');}
      
      return (<div>
          <Button onClick={() => setHasError(true)}>Trigger Error</Button>
          <Icon name="NON_EXISTENT" />
        </div>);};
    
    render(<ErrorComponent />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // 에러가 발생해도 다른 컴포넌트는 정상 작동
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();});

  // 성능 통합 테스트
  test('Components render efficiently', () => {const startTime = performance.now();
    
    render(<div>
        {Array.from({length: CACHE_CONSTANTS.MAX_CACHE_SIZE}, (_, i) => (<div key={i}>
            <Icon name="CALENDAR" />
            <Button size="small">Button {i}</Button>
          </div>))}
      </div>);
    
    const endTime = performance.now();
    const renderTime = endTime - startTime;
    
    // 렌더링 시간이 100ms 이하인지 확인
    expect(renderTime).toBeLessThan(CACHE_CONSTANTS.MAX_CACHE_SIZE);});});
