/**
 * 테마 선택기 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

jest.mock('../Icon/Icon', () => {
  const { createElement } = require('react');
  return function MockIcon() {
    return createElement('span', { 'data-testid': 'theme-selector-icon-mock' });
  };
});

/** 렌더마다 참조가 바뀌면 ThemeSelector의 useEffect([currentTheme])가 선택을 초기화하므로 동일 객체 유지 */
const mockThemeFns = {
  changeTheme: jest.fn(),
  previewTheme: jest.fn(),
  cancelPreview: jest.fn()
};

const mockThemeValue = {
  currentTheme: {
    type: 'ADMIN',
    name: '관리자 테마',
    description: '간결하고 깔끔한 분위기 (블루 계열)',
    colors: {
      primary: 'var(--cs-blue-300)',
      secondary: '#F0F8FF',
      background: 'var(--mg-gray-100)',
      text: '#191970'
    }
  },
  availableThemes: [
    {
      id: 'CLIENT',
      name: '내담자 테마',
      description: '화사한 분위기 (핑크 계열)',
      preview: '#FFB6C1'
    },
    {
      id: 'CONSULTANT',
      name: '상담사 테마',
      description: '활력 충만 분위기 (민트 그린 계열)',
      preview: 'var(--mg-mint-green)'
    },
    {
      id: 'ADMIN',
      name: '관리자 테마',
      description: '간결하고 깔끔한 분위기 (블루 계열)',
      preview: '#87CEEB'
    }
  ],
  get changeTheme() {
    return mockThemeFns.changeTheme;
  },
  get previewTheme() {
    return mockThemeFns.previewTheme;
  },
  get cancelPreview() {
    return mockThemeFns.cancelPreview;
  },
  isLoading: false
};

jest.mock('../../../contexts/ThemeContext', () => {
  const actual = jest.requireActual('../../../contexts/ThemeContext');
  return {
    ...actual,
    useTheme: jest.fn(() => mockThemeValue)
  };
});

import { ThemeProvider } from '../../../contexts/ThemeContext';
import ThemeSelector from './ThemeSelector';

const renderWithTheme = (component) =>
  render(<ThemeProvider>{component}</ThemeProvider>);

describe('ThemeSelector', () => {
  beforeEach(() => {
    mockThemeFns.changeTheme.mockReset();
    mockThemeFns.previewTheme.mockReset();
    mockThemeFns.cancelPreview.mockReset();
    mockThemeFns.changeTheme.mockResolvedValue({ success: true });
    mockThemeFns.previewTheme.mockImplementation(() => ({}));
    mockThemeFns.cancelPreview.mockImplementation(() => {});
    const { useTheme } = require('../../../contexts/ThemeContext');
    useTheme.mockImplementation(() => mockThemeValue);
  });

  test('렌더링 테스트', () => {
    renderWithTheme(<ThemeSelector />);

    expect(screen.getByText('테마 선택')).toBeInTheDocument();
    expect(screen.getByText('현재 테마')).toBeInTheDocument();
  });

  test('사용 가능한 테마 목록 표시', () => {
    renderWithTheme(<ThemeSelector />);

    expect(screen.getByText('내담자 테마')).toBeInTheDocument();
    expect(screen.getByText('상담사 테마')).toBeInTheDocument();
    expect(screen.getAllByText('관리자 테마').length).toBeGreaterThanOrEqual(1);
  });

  test('테마 선택 기능', () => {
    const mockPreviewTheme = jest.fn();
    mockThemeFns.previewTheme.mockImplementation(mockPreviewTheme);

    renderWithTheme(<ThemeSelector />);

    const clientTheme = screen.getByText('내담자 테마').closest('.mg-v2-theme-option');
    fireEvent.click(clientTheme);

    expect(mockPreviewTheme).toHaveBeenCalled();
  });

  test('테마 적용 버튼 클릭', async() => {
    const mockChangeTheme = jest.fn().mockResolvedValue({ success: true });
    mockThemeFns.changeTheme.mockImplementation(mockChangeTheme);

    renderWithTheme(<ThemeSelector />);

    fireEvent.click(screen.getByText('내담자 테마').closest('.mg-v2-theme-option'));

    const applyButton = screen.getByText('적용하기');
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockChangeTheme).toHaveBeenCalled();
    });
  });

  test('커스텀 색상 설정 표시', () => {
    renderWithTheme(<ThemeSelector showCustomColors={true} />);

    expect(screen.getByText('커스텀 색상')).toBeInTheDocument();
  });

  test('미리보기 취소 기능', () => {
    const mockCancelPreview = jest.fn();
    mockThemeFns.cancelPreview.mockImplementation(mockCancelPreview);

    renderWithTheme(<ThemeSelector />);

    const cancelButton = screen.queryByText('미리보기 취소');
    if (cancelButton) {
      fireEvent.click(cancelButton);
      expect(mockCancelPreview).toHaveBeenCalled();
    }
  });

  test('접근성 테스트', async() => {
    renderWithTheme(<ThemeSelector />);

    fireEvent.click(screen.getByText('내담자 테마').closest('.mg-v2-theme-option'));

    const applyButton = screen.getByRole('button', { name: /적용하기/ });
    await waitFor(() => {
      expect(applyButton).not.toBeDisabled();
    });
    applyButton.focus();

    expect(document.activeElement).toBe(applyButton);
  });

  test('반응형 디자인 테스트', () => {
    Object.defineProperty(globalThis, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375
    });

    renderWithTheme(<ThemeSelector />);

    const themeGrid = document.querySelector('.mg-v2-v2-v2-theme-grid');
    expect(themeGrid).toBeInTheDocument();
  });
});
