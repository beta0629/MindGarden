/**
 * Icon 컴포넌트 테스트
 */

import {render, screen, fireEvent} from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import {ICONS} from '../../../constants/icons';

import Icon from './Icon';

describe('Icon Component', () => {// 기본 렌더링 테스트
  test('renders icon with correct name', () => {render(<Icon name="CALENDAR" />);
    const iconElement = screen.getByRole('img');
    expect(iconElement).toBeInTheDocument();
    expect(iconElement).toHaveAttribute('aria-label', 'CALENDAR');});

  // 크기 테스트
  test('applies correct size class', () => {render(<Icon name="CALENDAR" size="LG" />);
    const iconElement = screen.getByRole('img');
    expect(iconElement).toHaveClass('mg-v2-icon--lg');});

  // 색상 테스트
  test('applies correct color class', () => {render(<Icon name="CALENDAR" color="SUCCESS" />);
    const iconElement = screen.getByRole('img');
    expect(iconElement).toHaveClass('mg-v2-icon--success');});

  // 클릭 이벤트 테스트
  test('handles click events', () => {const handleClick = jest.fn();
    render(<Icon name="CALENDAR" onClick={handleClick} />);
    
    const iconElement = screen.getByRole('button');
    fireEvent.click(iconElement);
    
    expect(handleClick).toHaveBeenCalledTimes(DEFAULT_VALUES.CURRENT_PAGE);});

  // 키보드 이벤트 테스트
  test('handles keyboard events', () => {const handleClick = jest.fn();
    render(<Icon name="CALENDAR" onClick={handleClick} />);
    
    const iconElement = screen.getByRole('button');
    fireEvent.keyDown(iconElement, {key: 'Enter'});
    
    expect(handleClick).toHaveBeenCalledTimes(DEFAULT_VALUES.CURRENT_PAGE);});

  // 비활성화 상태 테스트
  test('disables interaction when disabled', () => {const handleClick = jest.fn();
    render(<Icon name="CALENDAR" onClick={handleClick} disabled />);
    
    const iconElement = screen.getByRole('button');
    expect(iconElement).toHaveAttribute('aria-disabled', 'true');
    expect(iconElement).toHaveClass('mg-v2-icon--disabled');
    
    fireEvent.click(iconElement);
    expect(handleClick).not.toHaveBeenCalled();});

  // 로딩 상태 테스트
  test('shows loading spinner when loading', () => {render(<Icon name="CALENDAR" loading />);
    
    const spinnerElement = document.querySelector('.mg-v2-icon-spinner');
    expect(spinnerElement).toBeInTheDocument();});

  // 존재하지 않는 아이콘 테스트
  test('returns null for non-existent icon', () => {const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    const {container} = render(<Icon name="NON_EXISTENT" />);
    
    expect(container.firstChild).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith("Icon 'NON_EXISTENT' not found in ICONS registry");
    
    consoleSpy.mockRestore();});

  // 커스텀 클래스 테스트
  test('applies custom className', () => {render(<Icon name="CALENDAR" className="custom-class" />);
    const iconElement = screen.getByRole('img');
    expect(iconElement).toHaveClass('custom-class');});

  // 역할별 테마 테스트
  test('applies role-based theme', () => {render(<Icon name="CALENDAR" role="CLIENT" color="PRIMARY" />);
    const iconElement = screen.getByRole('img');
    expect(iconElement).toBeInTheDocument();});

  // 접근성 테스트
  test('has proper accessibility attributes', () => {render(<Icon name="CALENDAR" aria-label="Custom label" />);
    const iconElement = screen.getByRole('img');
    expect(iconElement).toHaveAttribute('aria-label', 'Custom label');});

  // 변형 테스트
  test('applies correct variant class', () => {render(<Icon name="CALENDAR" variant="outlined" />);
    const iconElement = screen.getByRole('img');
    expect(iconElement).toHaveClass('mg-v2-icon--outlined');});});
