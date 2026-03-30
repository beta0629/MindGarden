import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VacationStatsWidget from './VacationStatsWidget.js';

// API 모킹
jest.mock('../../../utils/ajax', () => ({
  apiGet: jest.fn()
}));

const { apiGet } = require('../../../utils/ajax');

const renderWidget = (props = {}) => {
  const defaultProps = {
    widget: {
      config: {
        title: 'Test VacationStats',
        subtitle: 'Test subtitle'
      }
    },
    user: {
      id: 1,
      name: 'Test User',
      role: 'ADMIN'
    }
  };

  return render(
    <BrowserRouter>
      <VacationStatsWidget {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('VacationStatsWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('위젯이 정상적으로 렌더링된다', () => {
    apiGet.mockResolvedValue({ data: 'test' });
    renderWidget();
    
    expect(screen.getByText('Test VacationStats')).toBeInTheDocument();
  });

  it('로딩 상태를 표시한다', () => {
    apiGet.mockImplementation(() => new Promise(() => {})); // 무한 대기
    renderWidget();
    
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('API 오류를 처리한다', async () => {
    apiGet.mockRejectedValue(new Error('API Error'));
    renderWidget();
    
    await waitFor(() => {
      expect(screen.getByText(/데이터를 불러올 수 없습니다/)).toBeInTheDocument();
    });
  });

  it('데이터를 성공적으로 로드한다', async () => {
    const mockData = { count: 10, items: [] };
    apiGet.mockResolvedValue(mockData);
    renderWidget();
    
    await waitFor(() => {
      expect(screen.getByText(JSON.stringify(mockData, null, 2))).toBeInTheDocument();
    });
  });
});
