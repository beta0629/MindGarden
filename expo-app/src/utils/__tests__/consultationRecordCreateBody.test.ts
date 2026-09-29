/**
 * 상담일지 작성 본문·필수값 — 서버 ConsultationRecordCreateRequestValidator 계약 단위 테스트
 *
 * @author MindGarden
 * @since 2026-09-29
 */
import {
  buildConsultationRecordCreateBody,
  findMissingConsultationRecordFields,
  resolveDefaultSessionDurationMinutes,
  CONSULTATION_RECORD_CLIENT_CONDITION_MAX_LENGTH,
  CONSULTATION_RECORD_DEFAULT_SESSION_DURATION_MINUTES,
  type ConsultationRecordCreateBodyInput,
} from '@/utils/consultationRecordCreateBody';

const SERVER_REQUIRED_KEYS = [
  'sessionDurationMinutes',
  'clientCondition',
  'mainIssues',
  'interventionMethods',
  'clientResponse',
  'riskAssessment',
  'progressEvaluation',
];

function validInput(): ConsultationRecordCreateBodyInput {
  return {
    consultationId: 30,
    sessionNumber: 3,
    clientId: 20,
    consultantId: 41,
    consultantObservations: '요약\n\n메모',
    isSessionCompleted: true,
    nextSessionPlan: ' 과제 점검 ',
    sessionDurationMinutes: 50,
    clientCondition: ' 요약 ',
    mainIssues: '불안',
    interventionMethods: '인지행동',
    clientResponse: '긍정적',
    riskAssessment: 'LOW',
    progressEvaluation: '호전',
  };
}

describe('buildConsultationRecordCreateBody', () => {
  it('서버 필수값 키를 모두 담고 문자열은 trim 한다', () => {
    const body = buildConsultationRecordCreateBody(validInput());
    expect(Object.keys(body)).toEqual(expect.arrayContaining(SERVER_REQUIRED_KEYS));
    expect(body.clientCondition).toBe('요약');
    expect(body.nextSessionPlan).toBe('과제 점검');
    expect(body.consultationId).toBe(30);
    expect(body.sessionNumber).toBe(3);
  });

  it('값이 비어도 필수값 키는 빠뜨리지 않는다 (서버가 기존 앱 본문으로 오인하지 않도록)', () => {
    const body = buildConsultationRecordCreateBody({
      ...validInput(),
      sessionDurationMinutes: null,
      clientCondition: '',
      mainIssues: '',
      interventionMethods: '',
      clientResponse: '',
      riskAssessment: '',
      progressEvaluation: '',
      nextSessionPlan: '',
    });
    for (const key of SERVER_REQUIRED_KEYS) {
      expect(body).toHaveProperty(key);
    }
    expect(body.sessionDurationMinutes).toBe('');
    expect(body).not.toHaveProperty('nextSessionPlan');
  });
});

describe('findMissingConsultationRecordFields', () => {
  it('모두 채우면 통과', () => {
    expect(findMissingConsultationRecordFields(validInput())).toEqual([]);
  });

  it('공백·0분·한도 초과를 누락으로 본다', () => {
    const missing = findMissingConsultationRecordFields({
      ...validInput(),
      sessionDurationMinutes: 0,
      mainIssues: '   ',
      clientCondition: '가'.repeat(CONSULTATION_RECORD_CLIENT_CONDITION_MAX_LENGTH + 1),
    });
    expect(missing).toEqual(['sessionDurationMinutes', 'clientCondition', 'mainIssues']);
  });

  it('위험도는 타기관 판별이 서버에 있으므로 앱에서 막지 않는다', () => {
    expect(findMissingConsultationRecordFields({ ...validInput(), riskAssessment: '' })).toEqual([]);
  });
});

describe('resolveDefaultSessionDurationMinutes', () => {
  it('스케줄 시각 차이를 쓴다', () => {
    expect(resolveDefaultSessionDurationMinutes('10:00', '10:50')).toBe(50);
  });

  it('계산 불가면 웹 기본값', () => {
    expect(resolveDefaultSessionDurationMinutes(undefined, '10:50')).toBe(
      CONSULTATION_RECORD_DEFAULT_SESSION_DURATION_MINUTES,
    );
    expect(resolveDefaultSessionDurationMinutes('11:00', '10:00')).toBe(
      CONSULTATION_RECORD_DEFAULT_SESSION_DURATION_MINUTES,
    );
  });
});
