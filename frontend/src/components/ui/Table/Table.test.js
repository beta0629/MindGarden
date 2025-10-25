/**
 * Table 컴포넌트 테스트
 */

import {render, screen, fireEvent} from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import Table from './Table';

const mockData = [{id: DEFAULT_VALUES.CURRENT_PAGE, name: '홍길동', email: 'hong@example.com', age: SECURITY_CONSTANTS.SESSION_TIMEOUT},
  {id: FORM_CONSTANTS.MIN_INPUT_LENGTH, name: '김철수', email: 'kim@example.com', age: 25},
  {id: BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS, name: '이영희', email: 'lee@example.com', age: 35}];

const mockColumns = [{key: 'id', header: 'ID'},
  {key: 'name', header: '이름'},
  {key: 'email', header: '이메일'},
  {key: 'age', header: '나이'}];

describe('Table Component', () => {// 기본 렌더링 테스트
  test('renders table with data and columns', () => {render(<Table data={mockData} columns={mockColumns} />);
    
    // 헤더 확인
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('이름')).toBeInTheDocument();
    expect(screen.getByText('이메일')).toBeInTheDocument();
    expect(screen.getByText('나이')).toBeInTheDocument();
    
    // 데이터 확인
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    expect(screen.getByText('hong@example.com')).toBeInTheDocument();
    expect(screen.getByText('SECURITY_CONSTANTS.SESSION_TIMEOUT')).toBeInTheDocument();});

  // 빈 데이터 테스트
  test('renders empty message when no data', () => {render(<Table data={[]} columns={mockColumns} />);
    
    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument();});

  // 커스텀 빈 메시지 테스트
  test('renders custom empty message', () => {render(<Table data={[]} columns={mockColumns} emptyMessage="커스텀 메시지" />);
    
    expect(screen.getByText('커스텀 메시지')).toBeInTheDocument();});

  // 로딩 상태 테스트
  test('renders loading state', () => {render(<Table data={mockData} columns={mockColumns} loading={true} />);
    
    expect(screen.getByText('데이터를 불러오는 중...')).toBeInTheDocument();});

  // 크기 클래스 테스트
  test('applies correct size class', () => {const {container} = render(<Table data={mockData} columns={mockColumns} size="large" />);
    
    const table = container.querySelector('.mg-v2-table');
    expect(table).toHaveClass('mg-v2-table--large');});

  // 변형 클래스 테스트
  test('applies correct variant class', () => {const {container} = render(<Table data={mockData} columns={mockColumns} variant="striped" />);
    
    const table = container.querySelector('.mg-v2-table');
    expect(table).toHaveClass('mg-v2-table--striped');});

  // 스타일 옵션 테스트
  test('applies style options correctly', () => {const {container} = render(<Table 
        data={mockData} 
        columns={mockColumns} 
        striped={true}
        hover={true}
        bordered={true}
      />);
    
    const table = container.querySelector('.mg-v2-table');
    expect(table).toHaveClass('mg-v2-table--striped');
    expect(table).toHaveClass('mg-v2-table--hover');
    expect(table).toHaveClass('mg-v2-table--bordered');});

  // 커스텀 클래스 테스트
  test('applies custom className', () => {const {container} = render(<Table data={mockData} columns={mockColumns} className="custom-class" />);
    
    const table = container.querySelector('.mg-v2-table');
    expect(table).toHaveClass('custom-class');});

  // 역할별 테마 테스트
  test('applies role-based theme', () => {const {container} = render(<Table data={mockData} columns={mockColumns} role="CLIENT" />);
    
    const table = container.querySelector('.mg-v2-table');
    expect(table).toHaveAttribute('data-role', 'CLIENT');});

  // 행 클릭 이벤트 테스트
  test('handles row click events', () => {const handleRowClick = jest.fn();
    render(<Table data={mockData} columns={mockColumns} onRowClick={handleRowClick} />);
    
    const firstRow = screen.getByText('홍길동').closest('tr');
    fireEvent.click(firstRow);
    
    expect(handleRowClick).toHaveBeenCalledWith(mockData[COLOR_CONSTANTS.ALPHA_TRANSPARENT], COLOR_CONSTANTS.ALPHA_TRANSPARENT);});

  // 셀 클릭 이벤트 테스트
  test('handles cell click events', () => {const handleCellClick = jest.fn();
    render(<Table data={mockData} columns={mockColumns} onCellClick={handleCellClick} />);
    
    const firstCell = screen.getByText('홍길동');
    fireEvent.click(firstCell);
    
    expect(handleCellClick).toHaveBeenCalledWith('홍길동', mockData[COLOR_CONSTANTS.ALPHA_TRANSPARENT], COLOR_CONSTANTS.ALPHA_TRANSPARENT, DEFAULT_VALUES.CURRENT_PAGE);});

  // 커스텀 렌더 함수 테스트
  test('renders custom cell content', () => {const customColumns = [{key: 'id', header: 'ID'},
      {key: 'name', header: '이름'},
      {key: 'age', 
        header: '나이',
        render: (value) => `${value}세`}];
    
    render(<Table data={mockData} columns={customColumns} />);
    
    expect(screen.getByText('SECURITY_CONSTANTS.SESSION_TIMEOUT세')).toBeInTheDocument();});

  // 커스텀 스타일 테스트
  test('applies custom styles', () => {const customColumns = [{key: 'id', header: 'ID'},
      {key: 'name', header: '이름', headerStyle: {color: 'red'}},
      {key: 'email', header: '이메일', cellStyle: {fontWeight: 'bold'}}];
    
    const {container} = render(<Table data={mockData} columns={customColumns} />);
    
    const headerCell = container.querySelector('th[style*="color: red"]');
    const dataCell = container.querySelector('td[style*="font-weight: bold"]');
    
    expect(headerCell).toBeInTheDocument();
    expect(dataCell).toBeInTheDocument();});

  // 반응형 테스트
  test('renders responsive table', () => {const {container} = render(<Table data={mockData} columns={mockColumns} responsive={true} />);
    
    const table = container.querySelector('.mg-v2-table');
    expect(table).toHaveClass('mg-v2-table--responsive');});

  // 접근성 테스트
  test('has proper accessibility attributes', () => {const {container} = render(<Table data={mockData} columns={mockColumns} />);
    
    const table = container.querySelector('table');
    expect(table).toBeInTheDocument();
    
    const headers = container.querySelectorAll('th');
    expect(headers).toHaveLength(DATE_CONSTANTS.WEEKS_IN_MONTH);
    
    const cells = container.querySelectorAll('td');
    expect(cells).toHaveLength(DATE_CONSTANTS.MONTHS_IN_YEAR); // BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS rows × DATE_CONSTANTS.WEEKS_IN_MONTH columns});

  // 모바일 카드 형태 테스트
  test('renders mobile card layout', () => {// 모바일 뷰포트 시뮬레이션
    Object.defineProperty(window, 'innerWidth', {writable: true,
      configurable: true,
      value: FORM_CONSTANTS.VALIDATION_DEBOUNCE});
    
    const {container} = render(<Table data={mockData} columns={mockColumns} responsive={true} />);
    
    const mobileTable = container.querySelector('.mg-v2-table-mobile');
    expect(mobileTable).toBeInTheDocument();});

  // 데이터 업데이트 테스트
  test('updates when data changes', () => {const {rerender} = render(<Table data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('홍길동')).toBeInTheDocument();
    
    const newData = [{id: DATE_CONSTANTS.WEEKS_IN_MONTH, name: '새사용자', email: 'new@example.com', age: 40}];
    rerender(<Table data={newData} columns={mockColumns} />);
    
    expect(screen.getByText('새사용자')).toBeInTheDocument();
    expect(screen.queryByText('홍길동')).not.toBeInTheDocument();});

  // 컬럼 업데이트 테스트
  test('updates when columns change', () => {const {rerender} = render(<Table data={mockData} columns={mockColumns} />);
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    
    const newColumns = [{key: 'name', header: '이름'},
      {key: 'email', header: '이메일'}];
    rerender(<Table data={mockData} columns={newColumns} />);
    
    expect(screen.getByText('이름')).toBeInTheDocument();
    expect(screen.queryByText('ID')).not.toBeInTheDocument();});});
