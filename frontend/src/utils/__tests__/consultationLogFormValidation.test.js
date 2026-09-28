/**
 * 상담일지 필수값 — 관리자 규칙과 상담사 작성 화면이 같은 함수를 쓰는지.
 */

import { CONSULTATION_LOG_SESSION_NUMBER_STRINGS } from '../../constants/consultationLogAutosaveStrings';
import { validateConsultationLogForm } from '../consultationLogFormValidation';

const messages = {
  sessionNumber: CONSULTATION_LOG_SESSION_NUMBER_STRINGS.REQUIRED_FOR_SAVE,
  sessionDurationMinutes: '세션 시간을 입력해주세요 (최소 1분)',
  clientCondition: '내담자 상태를 입력해주세요',
  clientConditionMaxLength: '내담자 상태는 4000자 이하로 입력해주세요',
  mainIssues: '주요 이슈를 입력해주세요',
  interventionMethods: '개입 방법을 입력해주세요',
  clientResponse: '내담자 반응을 입력해주세요',
  riskAssessment: '위험도 평가를 선택해주세요',
  progressEvaluation: '진행 평가를 입력해주세요',
  summary: '필수 항목을 모두 입력해주세요.'
};

const filledContent = {
  sessionDurationMinutes: 60,
  clientCondition: '상태',
  mainIssues: '이슈',
  interventionMethods: '개입',
  clientResponse: '반응',
  riskAssessment: 'LOW',
  progressEvaluation: '평가',
  nextSessionPlan: '',
  homeworkAssigned: '',
  riskFactors: '',
  emergencyResponsePlan: ''
};

describe('validateConsultationLogForm', () => {
  test('관리자에서 필수가 아닌 항목이 비어도 신규 저장은 통과한다', () => {
    const errors = validateConsultationLogForm({
      formData: {
        ...filledContent,
        sessionNumber: null
      },
      sessionNumber: null,
      isEditMode: false,
      isInstitutionLinkLog: false,
      messages
    });

    expect(errors).toEqual({});
  });

  test('수정 모드에서 회기가 없으면 막는다', () => {
    const errors = validateConsultationLogForm({
      formData: filledContent,
      sessionNumber: null,
      isEditMode: true,
      isInstitutionLinkLog: false,
      messages
    });

    expect(errors.sessionNumber).toBe(messages.sessionNumber);
  });

  test('관리자에서 필수인 본문이 비면 막는다', () => {
    const errors = validateConsultationLogForm({
      formData: {
        ...filledContent,
        clientCondition: '   ',
        progressEvaluation: ''
      },
      sessionNumber: 2,
      isEditMode: false,
      isInstitutionLinkLog: false,
      messages
    });

    expect(errors.clientCondition).toBe(messages.clientCondition);
    expect(errors.progressEvaluation).toBe(messages.progressEvaluation);
    expect(errors.nextSessionPlan).toBeUndefined();
    expect(errors.homeworkAssigned).toBeUndefined();
  });

  test('세션 시간이 없으면 막는다', () => {
    const errors = validateConsultationLogForm({
      formData: {
        ...filledContent,
        sessionDurationMinutes: ''
      },
      sessionNumber: 1,
      isEditMode: false,
      isInstitutionLinkLog: false,
      messages
    });

    expect(errors.sessionDurationMinutes).toBe(messages.sessionDurationMinutes);
  });

  test('타기관 연계는 위험도가 비어도 통과하고 본문은 여전히 필수다', () => {
    const withoutRisk = validateConsultationLogForm({
      formData: {
        ...filledContent,
        riskAssessment: ''
      },
      sessionNumber: null,
      isEditMode: true,
      isInstitutionLinkLog: true,
      messages
    });
    expect(withoutRisk.riskAssessment).toBeUndefined();
    expect(withoutRisk.sessionNumber).toBeUndefined();

    const withoutIssues = validateConsultationLogForm({
      formData: {
        ...filledContent,
        riskAssessment: '',
        mainIssues: ''
      },
      isEditMode: false,
      isInstitutionLinkLog: true,
      messages
    });
    expect(withoutIssues.mainIssues).toBe(messages.mainIssues);
  });
});
