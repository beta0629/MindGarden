/**
 * ConsultationLogFormPanel 회귀 테스트 — 모달 "큰 본문" textarea maxLength 회귀 가드.
 *
 * 검증 범위:
 *  - 슈퍼블록 4개 ({@code clientCondition}, {@code mainIssues},
 *    {@code interventionMethods}, {@code clientResponse}) + 풀폭 {@code progressEvaluation}
 *    총 5개 textarea의 {@code maxLength} 속성이 4000 으로 통일되어 있다.
 *
 * 본 테스트는 2026-06-12 "상담일지 모달 textarea 최대 글자수 2000 → 4000 확장" 작업의
 * 회귀 방지 가드. {@link CONSULTATION_LOG_TEXTAREA_MAX_LENGTH} 상수의 값이 변경되면
 * 본 테스트도 함께 변경한다.
 *
 * @author CoreSolution
 * @since 2026-06-12
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import ConsultationLogFormPanel from '../ConsultationLogFormPanel';
import { CONSULTATION_LOG_TEXTAREA_MAX_LENGTH } from '../../../../constants/consultationLogAutosaveConstants';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'ko', changeLanguage: () => Promise.resolve() }
  }),
  Trans: ({ children }) => children,
  initReactI18next: { type: '3rdParty', init: () => {} }
}));

jest.mock('lucide-react', () => ({
  __esModule: true,
  FileText: () => null
}));

jest.mock('../../../common/BadgeSelect', () => ({
  __esModule: true,
  default: ({ value }) => <div data-testid="mock-badge-select">{value || ''}</div>
}));

const noop = () => {};

const defaultFormData = {
  clientCondition: '',
  mainIssues: '',
  interventionMethods: '',
  clientResponse: '',
  sessionDate: '2026-06-12',
  sessionDurationMinutes: 50,
  isSessionCompleted: false,
  nextSessionPlan: '',
  homeworkAssigned: '',
  homeworkDueDate: '',
  riskAssessment: '',
  riskFactors: '',
  emergencyResponsePlan: '',
  progressEvaluation: '',
  progressScore: 0,
  goalAchievement: '',
  familyRelationships: '',
  socialSupport: '',
  medicalInformation: '',
  incompletionReason: ''
};

const renderPanel = (overrides = {}) =>
  render(
    <ConsultationLogFormPanel
      formData={{ ...defaultFormData, ...(overrides.formData || {}) }}
      handleInputChange={noop}
      setFormData={noop}
      validationErrors={{}}
      riskLevels={[]}
      goalAchievementLevels={[]}
      completionStatusOptions={[]}
      loadingCodes={false}
    />
  );

describe('ConsultationLogFormPanel — 큰 본문 textarea maxLength', () => {
  test('CONSULTATION_LOG_TEXTAREA_MAX_LENGTH 상수는 4000', () => {
    expect(CONSULTATION_LOG_TEXTAREA_MAX_LENGTH).toBe(4000);
  });

  test.each([
    ['consultation-log-client-condition', 'clientCondition'],
    ['consultation-log-main-issues', 'mainIssues'],
    ['consultation-log-intervention', 'interventionMethods'],
    ['consultation-log-client-response', 'clientResponse'],
    ['consultation-log-progress-eval', 'progressEvaluation']
  ])('id=%s (name=%s) textarea 의 maxLength 는 상수 값과 같다', (id) => {
    renderPanel();
    const textarea = document.getElementById(id);
    expect(textarea).not.toBeNull();
    expect(textarea.tagName).toBe('TEXTAREA');
    expect(textarea.maxLength).toBe(CONSULTATION_LOG_TEXTAREA_MAX_LENGTH);
  });
});
