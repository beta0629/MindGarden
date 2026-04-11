import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VacationStatsWidget from '../admin/VacationStatsWidget.js';

jest.mock('react-router-dom', () => {
  const R = require('react');
  return {
    useNavigate: () => jest.fn(),
    BrowserRouter: ({ children }) =>
      R.createElement(R.Fragment, null, children)
  };
});

jest.mock('../../../../utils/ajax', () => ({
  apiGet: jest.fn()
}));

const { apiGet } = require('../../../../utils/ajax');

const renderWidget = (props = {}) => {
  const defaultProps = {
    widget: {
      config: {
        title: 'Test VacationStats',
        subtitle: 'Test subtitle'
      },
      dataSource: {
        type: 'api',
        url: '/api/v1/admin/vacation-stats',
        params: {}
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
    apiGet.mockResolvedValue({ count: 0 });
    renderWidget();

    expect(screen.getByText('Test VacationStats')).toBeInTheDocument();
  });

  it('로딩 상태를 표시한다', () => {
    apiGet.mockImplementation(() => new Promise(() => {}));
    renderWidget();

    expect(screen.getByText('데이터를 불러오는 중...')).toBeInTheDocument();
  });

  it('API 오류를 처리한다', async () => {
    apiGet.mockRejectedValue(new Error('API Error'));
    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('데이터를 성공적으로 로드한다', async () => {
    apiGet.mockResolvedValue({ count: 10 });
    renderWidget();

    await waitFor(() => {
      expect(screen.getByText('데이터 수')).toBeInTheDocument();
    });
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
