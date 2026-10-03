/**
 * 컴플라이언스 — 고정 표본값(100점·90%·50명·회사명·연락처) 제거와 빈 상태 '—', Invalid Date 방지.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../../utils/standardizedApi', () => ({
  __esModule: true,
  default: { get: jest.fn() }
}));

jest.mock('../../layout/AdminCommonLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="admin-layout">{children}</div>
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

/* eslint-disable import/first -- jest.mock 이후 import */
import StandardizedApi from '../../../utils/standardizedApi';
import {
  DestructionCard,
  EducationCard,
  OverallSection,
  PolicyCard,
  formatComplianceCount
} from '../ComplianceDashboardCards';
import ComplianceMenu from '../ComplianceMenu';
/* eslint-enable import/first */

const EMPTY = '—';
const TENANT_NAME = '테스트 센터';
const TENANT_EMAIL = 'contact@example.test';
const TENANT_PHONE = '010-0000-0001';
const TENANT_ADDRESS = '테스트시 테스트로 1 2층';

describe('formatComplianceCount', () => {
  it('값이 없으면 0이 아니라 —', () => {
    expect(formatComplianceCount(null, '명')).toBe(EMPTY);
    expect(formatComplianceCount(undefined, '점')).toBe(EMPTY);
    expect(formatComplianceCount('', '명')).toBe(EMPTY);
  });

  it('0·양수는 단위를 붙인다', () => {
    expect(formatComplianceCount(0, '명')).toBe('0명');
    expect(formatComplianceCount(7, '명')).toBe('7명');
  });
});

describe('OverallSection', () => {
  it('점수가 null이면 — (100점·0점 고정 표시 없음)', () => {
    const { container } = render(
      <OverallSection overallStatus={{ overallScore: null, complianceLevel: null, lastUpdated: null }} levelMod="unknown" />
    );
    expect(container.textContent).not.toMatch(/100점|0점/);
    expect(container.textContent).toContain(EMPTY);
    expect(container.textContent).not.toMatch(/Invalid Date/);
  });

  it.each([
    ['ISO 문자열', '2026-10-03T09:15:30.123'],
    ['Jackson 배열', [2026, 10, 3, 9, 15, 30]],
    ['파싱 불가 문자열', 'not-a-date']
  ])('lastUpdated %s 에서 Invalid Date 가 나오지 않는다', (_label, lastUpdated) => {
    const { container } = render(
      <OverallSection overallStatus={{ overallScore: null, lastUpdated }} levelMod="unknown" />
    );
    expect(container.textContent).not.toMatch(/Invalid Date/);
  });
});

describe('EducationCard', () => {
  it('대상 인원·이수율이 없으면 — (50명·90% 고정 없음)', () => {
    const { container } = render(
      <EducationCard
        educationStatus={{ completionStatus: { totalEmployees: null, completionRate: null }, educationPrograms: {} }}
      />
    );
    expect(container.textContent).not.toMatch(/50명|90%|0명/);
    expect(screen.getAllByText(EMPTY).length).toBeGreaterThanOrEqual(2);
  });

  it('테넌트 실집계 인원을 표시한다', () => {
    render(<EducationCard educationStatus={{ completionStatus: { totalEmployees: 7 }, educationPrograms: {} }} />);
    expect(screen.getByText('7명')).toBeInTheDocument();
  });
});

describe('PolicyCard', () => {
  it('회사명은 테넌트 값, 비어 있는 담당자·날짜는 —', () => {
    const { container } = render(
      <PolicyCard
        policyStatus={{
          policyComponents: { basicInfo: { companyName: TENANT_NAME, privacyOfficer: null, lastUpdated: null } },
          nextReviewDate: null
        }}
      />
    );
    expect(screen.getByText(TENANT_NAME)).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/마인드가든|N\/A|Invalid Date/);
    expect(screen.getAllByText(EMPTY).length).toBe(3);
  });

  it('검토일이 ISO·배열이면 YYYY-MM-DD, 잘못된 형식도 Invalid Date 아님', () => {
    const { rerender, container } = render(
      <PolicyCard policyStatus={{ policyComponents: { basicInfo: {} }, nextReviewDate: '2026-12-31T00:00:00' }} />
    );
    expect(screen.getByText('2026-12-31')).toBeInTheDocument();
    rerender(<PolicyCard policyStatus={{ policyComponents: { basicInfo: {} }, nextReviewDate: [2027, 1, 5, 0, 0] }} />);
    expect(screen.getByText('2027-01-05')).toBeInTheDocument();
    rerender(<PolicyCard policyStatus={{ policyComponents: { basicInfo: {} }, nextReviewDate: 'garbage' }} />);
    expect(container.textContent).not.toMatch(/Invalid Date/);
  });
});

describe('DestructionCard', () => {
  it('마지막 파기일 null 이면 — (N/A·Invalid Date 없음)', () => {
    const { container } = render(
      <DestructionCard destructionStatus={{ totalDestroyed: 0, lastDestruction: null, destructionStats: {} }} />
    );
    expect(container.textContent).not.toMatch(/N\/A|Invalid Date/);
    expect(container.textContent).toContain(EMPTY);
  });
});

describe('ComplianceMenu 문의 카드', () => {
  beforeEach(() => {
    StandardizedApi.get.mockReset();
  });

  const renderMenu = () => render(
    <MemoryRouter>
      <ComplianceMenu />
    </MemoryRouter>
  );

  it('현재 테넌트 이메일·전화·주소를 처리방침 API 에서 표시한다', async() => {
    StandardizedApi.get.mockResolvedValue({
      policyComponents: {
        basicInfo: {
          companyName: TENANT_NAME,
          contactEmail: TENANT_EMAIL,
          contactPhone: TENANT_PHONE,
          address: TENANT_ADDRESS
        }
      }
    });
    renderMenu();
    const contact = screen.getByTestId('compliance-menu-contact');
    await waitFor(() => expect(contact.textContent).toContain(TENANT_EMAIL));
    expect(contact.textContent).toContain(TENANT_PHONE);
    expect(contact.textContent).toContain(TENANT_ADDRESS);
    expect(StandardizedApi.get).toHaveBeenCalledWith('/api/v1/admin/compliance/policy');
  });

  it('조회 실패 시 고정 연락처 없이 — 만 표시한다', async() => {
    StandardizedApi.get.mockRejectedValue(new Error('network'));
    renderMenu();
    const contact = screen.getByTestId('compliance-menu-contact');
    await waitFor(() => expect(StandardizedApi.get).toHaveBeenCalled());
    expect(contact.textContent).not.toMatch(/mindgarden|032-724-8501|해돋이로/i);
    expect(contact.querySelectorAll('p')).toHaveLength(3);
    expect(contact.textContent.split(EMPTY).length - 1).toBe(3);
  });
});
