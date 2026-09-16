/**
 * ClientDashboardWelcomeSection — PENDING_PAYMENT 배정 표시
 *
 * @author MindGarden
 * @since 2026-09-16
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MAPPING_STATUS } from '../../../../constants/mapping';

jest.mock('../../../dashboard-v2/content', () => ({
  ContentSection: ({ children }) => <section>{children}</section>
}));

jest.mock('../../../common/SafeText', () => ({
  __esModule: true,
  default: ({ children }) => <span>{children}</span>
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const map = {
        'common:client.ClientDashboard.t_e85b3406': '담당 상담사 배정 전',
        'common:client.ClientDashboard.t_07de2f32': '상담 진행 중',
        'common:client.ClientDashboard.t_db16bb78': '결제 대기',
        'common:client.ClientDashboard.t_69c40d10': '좋은 아침',
        'common:client.ClientDashboard.t_2f3e0450': '좋은 오후',
        'common:client.ClientDashboard.t_c626e85b': '좋은 저녁'
      };
      return map[key] ?? key;
    }
  })
}));

import ClientDashboardWelcomeSection from '../ClientDashboardWelcomeSection';

describe('ClientDashboardWelcomeSection assigned display', () => {
  test('PENDING_PAYMENT 매핑이면 담당 상담사 표시 · 배정 전 아님', () => {
    render(
      <ClientDashboardWelcomeSection
        user={{ name: '내담자' }}
        clientStatus={{ mappingStatus: MAPPING_STATUS.PENDING_PAYMENT, paymentStatus: 'PENDING' }}
        primaryActiveMapping={{
          status: MAPPING_STATUS.PENDING_PAYMENT,
          consultant: { consultantName: '배정상담' }
        }}
      />
    );

    expect(screen.getByText(/담당 상담사/)).toBeInTheDocument();
    expect(screen.getByText('배정상담')).toBeInTheDocument();
    expect(screen.queryByText('담당 상담사 배정 전')).not.toBeInTheDocument();
    expect(screen.getByText('결제 대기')).toBeInTheDocument();
  });

  test('매핑 없으면 배정 전', () => {
    render(
      <ClientDashboardWelcomeSection
        user={{ name: '내담자' }}
        clientStatus={{ mappingStatus: 'NONE', paymentStatus: null }}
        primaryActiveMapping={null}
      />
    );

    expect(screen.getByText('담당 상담사 배정 전')).toBeInTheDocument();
  });
});
