import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MappingListRow from '../MappingListRow';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe('MappingListRow', () => {
  const defaultMapping = {
    id: 1,
    consultantName: '홍길동',
    clientName: '김철수',
    packageName: '기본 10회기',
    status: 'ACTIVE',
    packagePrice: 300000,
    usedSessions: 2,
    totalSessions: 10,
    startDate: '2026-05-22T00:00:00Z',
  };

  const renderComponent = (mappingOverrides = {}) => {
    const mapping = { ...defaultMapping, ...mappingOverrides };
    return render(
      <BrowserRouter>
        <MappingListRow mapping={mapping} />
      </BrowserRouter>
    );
  };

  it('단일 패키지일 때 패키지명이 그대로 렌더링된다', () => {
    renderComponent({ packageName: '기본 10회기' });
    expect(screen.getByText('기본 10회기')).toBeInTheDocument();
    expect(screen.queryByText('+1')).not.toBeInTheDocument();
  });

  it('다중 패키지일 때 첫 패키지명과 +N 뱃지가 렌더링된다', () => {
    renderComponent({ packageName: '기본 10회기 + 심리검사 + 추가상담' });
    
    // 첫 패키지명 확인
    const nameSpan = screen.getByText('기본 10회기');
    expect(nameSpan).toBeInTheDocument();
    expect(nameSpan).toHaveClass('mg-v2-package-compact__name');
    expect(nameSpan).toHaveAttribute('title', '기본 10회기 + 심리검사 + 추가상담');

    // 뱃지 확인
    const badgeSpan = screen.getByText('+2');
    expect(badgeSpan).toBeInTheDocument();
    expect(badgeSpan).toHaveClass('mg-v2-badge');
  });

  it('패키지명이 없을 때 N/A 또는 - 가 렌더링된다', () => {
    renderComponent({ packageName: null });
    // renderCompactPackageName returns '-' for falsy values, but MappingListRow checks `mapping.packageName ? renderCompactPackageName(...) : <span>N/A</span>`
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('타기관 연계 배정에 기관연동 배지를 표시한다', () => {
    renderComponent({ paymentTiming: 'INSTITUTION_LINK', remainingSessions: 0 });
    expect(screen.getByTestId('engagement-type-badge')).toHaveTextContent('기관연동');
  });

  it('IL: 최초 상담일은 이 매핑 consultationSchedules MIN, client lifetime 제외', () => {
    renderComponent({
      paymentTiming: 'INSTITUTION_LINK',
      startDate: '2026-09-01',
      createdAt: '2026-09-01T19:25:12',
      consultationSchedules: [
        { id: 378, date: '2026-09-07', status: 'COMPLETED' }
      ],
      clientConsultationSchedules: [
        { id: 373, date: '2026-08-31', status: 'COMPLETED' },
        { id: 378, date: '2026-09-07', status: 'COMPLETED' }
      ]
    });
    const dateCell = screen.getByTestId('mapping-list-row-date');
    expect(dateCell).toHaveTextContent('최초 상담일');
    expect(dateCell).toHaveTextContent('2026. 09. 07');
    expect(dateCell).not.toHaveTextContent('2026. 08. 31');
    expect(dateCell.getAttribute('title')).toContain('매핑 시작일');
  });

});
