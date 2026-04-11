import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PendingDepositsWidget from '../admin/PendingDepositsWidget.js';

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

const renderWidget = (props = {}) => {
  const defaultProps = {
    widget: {
      config: {
        title: 'Test PendingDeposits',
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
      <PendingDepositsWidget {...defaultProps} {...props} />
    </BrowserRouter>
  );
};

describe('PendingDepositsWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('관리자에게 위젯 제목이 보인다', () => {
    renderWidget();

    expect(screen.getByText('Test PendingDeposits')).toBeInTheDocument();
  });

  it('대기 입금이 없을 때 안내 문구를 표시한다', () => {
    renderWidget();

    expect(screen.getByText(/확인 대기 중인 입금이 없습니다/)).toBeInTheDocument();
  });
});
