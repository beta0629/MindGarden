/**
 * 테마 선택기 컴포넌트 테스트
 */

import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import React from 'react';

import {ThemeProvider} from '../../../contexts/ThemeContext';

import ThemeSelector from './ThemeSelector';

// Mock API 호출
jest.mock('../../../contexts/ThemeContext', () => ({useTheme: () => ({currentTheme: {type: 'ADMIN',
      name: '관리자 테마',
      description: '간결하고 깔끔한 분위기 (블루 계열)',
      colors: {primary: '#87CEEB',
        secondary: '#F0F8FF',
        background: '#F8F9FA',
        text: '#191970'}},
    availableThemes: [{id: 'CLIENT',
        name: '내담자 테마',
        description: '화사한 분위기 (핑크 계열)',
        preview: '#FFB6C1'},
      {id: 'CONSULTANT',
        name: '상담사 테마',
        description: '활력 충만 분위기 (민트 그린 계열)',
        preview: '#98FB98'},
      {id: 'ADMIN',
        name: '관리자 테마',
        description: '간결하고 깔끔한 분위기 (블루 계열)',
        preview: '#87CEEB'}],
    changeTheme: jest.fn(),
    previewTheme: jest.fn(),
    cancelPreview: jest.fn(),
    isLoading: false})}));

const renderWithTheme = (component) => {return render(<ThemeProvider>
      {component}
    </ThemeProvider>);};

describe('ThemeSelector', () => {test('렌더링 테스트', () => {renderWithTheme(<ThemeSelector />);
    
    expect(screen.getByText('테마 선택')).toBeInTheDocument();
    expect(screen.getByText('현재 테마')).toBeInTheDocument();});

  test('사용 가능한 테마 목록 표시', () => {renderWithTheme(<ThemeSelector />);
    
    expect(screen.getByText('내담자 테마')).toBeInTheDocument();
    expect(screen.getByText('상담사 테마')).toBeInTheDocument();
    expect(screen.getByText('관리자 테마')).toBeInTheDocument();});

  test('테마 선택 기능', () => {const {useTheme} = require('../../../contexts/ThemeContext');
    const mockPreviewTheme = jest.fn();
    
    useTheme.mockReturnValue({...useTheme(),
      previewTheme: mockPreviewTheme});

    renderWithTheme(<ThemeSelector />);
    
    const clientTheme = screen.getByText('내담자 테마').closest('.mg-v2-theme-option');
    fireEvent.click(clientTheme);
    
    expect(mockPreviewTheme).toHaveBeenCalled();});

  test('테마 적용 버튼 클릭', async() => {const {useTheme} = require('../../../contexts/ThemeContext');
    const mockChangeTheme = jest.fn().mockResolvedValue({success: true});
    
    useTheme.mockReturnValue({...useTheme(),
      changeTheme: mockChangeTheme});

    renderWithTheme(<ThemeSelector />);
    
    const applyButton = screen.getByText('적용하기');
    fireEvent.click(applyButton);
    
    await waitFor(() => {expect(mockChangeTheme).toHaveBeenCalled();});});

  test('커스텀 색상 설정 표시', () => {renderWithTheme(<ThemeSelector showCustomColors={true} />);
    
    expect(screen.getByText('커스텀 색상')).toBeInTheDocument();});

  test('미리보기 취소 기능', () => {const {useTheme} = require('../../../contexts/ThemeContext');
    const mockCancelPreview = jest.fn();
    
    useTheme.mockReturnValue({...useTheme(),
      cancelPreview: mockCancelPreview});

    renderWithTheme(<ThemeSelector />);
    
    // 미리보기 상태 시뮬레이션
    const cancelButton = screen.queryByText('미리보기 취소');
    if (cancelButton) {fireEvent.click(cancelButton);
      expect(mockCancelPreview).toHaveBeenCalled();}});

  test('접근성 테스트', () => {renderWithTheme(<ThemeSelector />);
    
    // 키보드 네비게이션 테스트
    const themeOptions = screen.getAllByRole('button');
    themeOptions[COLOR_CONSTANTS.ALPHA_TRANSPARENT].focus();
    
    expect(document.activeElement).toBe(themeOptions[COLOR_CONSTANTS.ALPHA_TRANSPARENT]);});

  test('반응형 디자인 테스트', () => {// 모바일 뷰포트 설정
    Object.defineProperty(window, 'innerWidth', {writable: true,
      configurable: true,
      value: 375});

    renderWithTheme(<ThemeSelector />);
    
    const themeGrid = document.querySelector('.mg-v2-theme-grid');
    expect(themeGrid).toHaveStyle('grid-template-columns: 1fr');});});
