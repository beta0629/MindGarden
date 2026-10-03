/**
 * 컴플라이언스 — 영향평가·교육 프로그램 표본 제거 후 빈 상태(미점검·등록된 항목이 없습니다).
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key })
}));

/* eslint-disable import/first -- jest.mock 이후 import */
import {
  BreachCard,
  COMPLIANCE_BREACH_EMPTY_TEXT,
  COMPLIANCE_EMPTY_LIST_TEXT,
  COMPLIANCE_NOT_REVIEWED_TEXT,
  EducationCard,
  ImpactCard
} from '../ComplianceDashboardCards';
/* eslint-enable import/first */

describe('ComplianceDashboardCards — 표본 제거 빈 상태', () => {
  it('영향평가가 미점검이면 미점검·빈 개선영역 안내를 보인다', () => {
    render(
      <ImpactCard
        impactAssessment={{
          assessmentDate: null,
          riskAssessment: {},
          overallAssessment: {
            overallRiskLevel: COMPLIANCE_NOT_REVIEWED_TEXT,
            complianceStatus: COMPLIANCE_NOT_REVIEWED_TEXT,
            improvementAreas: [],
            nextAssessmentDate: null
          }
        }}
      />
    );
    expect(screen.getAllByText(COMPLIANCE_NOT_REVIEWED_TEXT).length).toBeGreaterThan(0);
    expect(screen.getByTestId('compliance-empty-list')).toHaveTextContent(COMPLIANCE_EMPTY_LIST_TEXT);
    expect(screen.queryByText(/권한 관리 강화|암호화 강화|접근 로그/)).not.toBeInTheDocument();
  });

  it('교육 프로그램이 비면 등록된 항목이 없습니다 를 보인다', () => {
    render(<EducationCard educationStatus={{ educationPrograms: {} }} />);
    expect(screen.getByTestId('compliance-empty-list')).toHaveTextContent(COMPLIANCE_EMPTY_LIST_TEXT);
  });

  it('educationPrograms 가 없어도 깨지지 않고 빈 상태를 보인다', () => {
    render(<EducationCard educationStatus={{}} />);
    expect(screen.getByTestId('compliance-empty-list')).toHaveTextContent(COMPLIANCE_EMPTY_LIST_TEXT);
  });

  it('유출 대응 절차가 비면 서버 안내 「유출 대응 체계를 등록해 주세요」 를 보이고 표본 팀장은 없다', () => {
    render(
      <BreachCard
        breachResponse={{
          responseProcedures: {},
          responseTeam: { teamLeader: null, members: [], contactInfo: { emergency: '' } },
          registered: false,
          emptyMessage: '유출 대응 체계를 등록해 주세요',
          lastUpdated: null
        }}
      />
    );
    expect(screen.getByTestId('compliance-empty-list')).toHaveTextContent('유출 대응 체계를 등록해 주세요');
    expect(screen.queryByText(/기술팀장|법무팀장|마케팅팀장|개발팀장|침해사고 발견 및 신고/)).not.toBeInTheDocument();
  });

  it('emptyMessage·responseProcedures 가 없어도 깨지지 않고 기본 유출 대응 빈 상태를 보인다', () => {
    render(<BreachCard breachResponse={{}} />);
    expect(screen.getByTestId('compliance-empty-list')).toHaveTextContent(COMPLIANCE_BREACH_EMPTY_TEXT);
  });

  it('등록된 절차가 있으면 빈 상태 대신 절차를 보인다', () => {
    render(
      <BreachCard
        breachResponse={{
          responseProcedures: { s1: { title: '등록된 절차', timeframe: '즉시' } },
          responseTeam: {}
        }}
      />
    );
    expect(screen.queryByTestId('compliance-empty-list')).not.toBeInTheDocument();
    expect(screen.getByText('등록된 절차')).toBeInTheDocument();
  });
});
