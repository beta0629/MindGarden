/**
 * Button 컴포넌트 테스트
 */

import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import Button from './Button';

describe('Button Component', () => {// 기본 렌더링 테스트
  test('renders button with text', () => {render(<Button>Click me</Button>);
    const button = screen.getByRole('button', {name: /click me/i});
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');});

  // 크기 테스트
  test('applies correct size class', () => {render(<Button size="large">Large Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mg-v2-button--large');});

  // 색상 변형 테스트
  test('applies correct variant class', () => {render(<Button variant="success">Success Button</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mg-v2-button--success');});

  // 클릭 이벤트 테스트
  test('handles click events', async() => {const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {expect(handleClick).toHaveBeenCalledTimes(DEFAULT_VALUES.CURRENT_PAGE);});});

  // 중복 클릭 방지 테스트
  test('prevents double click when preventDoubleClick is true', async() => {const handleClick = jest.fn();
    render(<Button onClick={handleClick} preventDoubleClick={true}>Click me</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    fireEvent.click(button); // 두 번째 클릭
    
    await waitFor(() => {expect(handleClick).toHaveBeenCalledTimes(DEFAULT_VALUES.CURRENT_PAGE);});});

  // 비활성화 상태 테스트
  test('disables interaction when disabled', () => {const handleClick = jest.fn();
    render(<Button onClick={handleClick} disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('mg-v2-button--disabled');
    
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();});

  // 로딩 상태 테스트
  test('shows loading state', () => {render(<Button loading loadingText="Loading...">Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Loading...');
    expect(button).toBeDisabled();});

  // 아이콘 테스트
  test('renders icon when provided', () => {render(<Button icon="PLUS">Add Item</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mg-v2-button--with-icon');
    expect(button).toHaveClass('mg-v2-button--icon-left');});

  // 아이콘 위치 테스트
  test('positions icon correctly', () => {render(<Button icon="CHEVRON_RIGHT" iconPosition="right">Next</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mg-v2-button--icon-right');});

  // 전체 너비 테스트
  test('applies full width class when fullWidth is true', () => {render(<Button fullWidth>Full Width Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('mg-v2-button--full-width');});

  // 커스텀 클래스 테스트
  test('applies custom className', () => {render(<Button className="custom-class">Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');});

  // 역할별 테마 테스트
  test('applies role-based theme', () => {render(<Button role="CLIENT">Client Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-role', 'CLIENT');});

  // 접근성 테스트
  test('has proper accessibility attributes', () => {render(<Button title="Tooltip text" aria-label="Custom label">Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', 'Tooltip text');
    expect(button).toHaveAttribute('aria-label', 'Custom label');});

  // 버튼 타입 테스트
  test('applies correct button type', () => {render(<Button type="submit">Submit</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'submit');});

  // 스타일 prop 테스트
  test('applies custom styles', () => {const customStyle = {backgroundColor: 'red'};
    render(<Button style={customStyle}>Styled Button</Button>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveStyle('background-color: red');});

  // 비동기 클릭 핸들러 테스트
  test('handles async click handlers', async() => {const asyncHandler = jest.fn().mockResolvedValue();
    render(<Button onClick={asyncHandler}>Async Button</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {expect(asyncHandler).toHaveBeenCalledTimes(DEFAULT_VALUES.CURRENT_PAGE);});});

  // 에러 핸들링 테스트
  test('handles click handler errors gracefully', async() => {const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const errorHandler = jest.fn().mockRejectedValue(new Error('Test error'));
    
    render(<Button onClick={errorHandler}>Error Button</Button>);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    await waitFor(() => {expect(errorHandler).toHaveBeenCalledTimes(DEFAULT_VALUES.CURRENT_PAGE);
      expect(consoleSpy).toHaveBeenCalledWith('Button click handler error:', expect.any(Error));});
    
    consoleSpy.mockRestore();});});
