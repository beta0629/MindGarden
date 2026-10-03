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
});
