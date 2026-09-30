/**
 * 상담일지 작성 본문·필수값 — 서버 ConsultationRecordCreateRequestValidator 계약 단위 테스트
 *
 * @author MindGarden
 * @since 2026-09-29
 */
import {
  buildConsultationRecordCreateBody,
  extractConsultationRecordFieldErrors,
  findMissingConsultationRecordFields,
  parseConsultationRecordFieldErrors,
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

  it('위험도 외 필수값 키는 값이 비어도 빠뜨리지 않고, 위험도는 빈 문자열로 보내지 않는다', () => {
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
    for (const key of SERVER_REQUIRED_KEYS.filter((k) => k !== 'riskAssessment')) {
      expect(body).toHaveProperty(key);
    }
    expect(body).not.toHaveProperty('riskAssessment');
    expect(body.sessionDurationMinutes).toBe('');
    expect(body).not.toHaveProperty('nextSessionPlan');
  });

  it('위험도가 공백뿐이어도 키를 뺀다', () => {
    const body = buildConsultationRecordCreateBody({ ...validInput(), riskAssessment: '  ' });
    expect(body).not.toHaveProperty('riskAssessment');
    expect(buildConsultationRecordCreateBody(validInput()).riskAssessment).toBe('LOW');
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

  it('위험도를 선택하지 않으면 누락으로 막는다', () => {
    expect(findMissingConsultationRecordFields({ ...validInput(), riskAssessment: '' })).toEqual([
      'riskAssessment',
    ]);
  });
});

describe('parseConsultationRecordFieldErrors', () => {
  it('서버 details 문자열을 필드별 문구로 나눈다', () => {
    const details =
      'sessionDurationMinutes: 세션 시간을 입력해주세요 (최소 1분), riskAssessment: 위험도 평가를 선택해주세요, '
      + 'progressEvaluation: 진행 평가를 입력해주세요';
    expect(parseConsultationRecordFieldErrors(details)).toEqual({
      sessionDurationMinutes: '세션 시간을 입력해주세요 (최소 1분)',
      riskAssessment: '위험도 평가를 선택해주세요',
      progressEvaluation: '진행 평가를 입력해주세요',
    });
  });

  it('필드→문구 객체도 받고 모르는 필드는 버린다', () => {
    expect(
      parseConsultationRecordFieldErrors({ mainIssues: '주요 이슈를 입력해주세요', unknown: 'x' }),
    ).toEqual({ mainIssues: '주요 이슈를 입력해주세요' });
  });

  it('비었거나 형식이 다르면 빈 객체', () => {
    expect(parseConsultationRecordFieldErrors(null)).toEqual({});
    expect(parseConsultationRecordFieldErrors('')).toEqual({});
    expect(parseConsultationRecordFieldErrors('알 수 없는 오류')).toEqual({});
  });
});

describe('extractConsultationRecordFieldErrors', () => {
  it('ApiClientError.originalError.response.data.details 에서 꺼낸다', () => {
    const error = Object.assign(new Error('필수 항목을 모두 입력해주세요.'), {
      status: 400,
      code: 'VALIDATION_ERROR',
      originalError: {
        response: {
          data: {
            errorCode: 'VALIDATION_ERROR',
            details: 'clientResponse: 내담자 반응을 입력해주세요, riskAssessment: 위험도 평가를 선택해주세요',
          },
        },
      },
    });
    expect(extractConsultationRecordFieldErrors(error)).toEqual({
      clientResponse: '내담자 반응을 입력해주세요',
      riskAssessment: '위험도 평가를 선택해주세요',
    });
  });

  it('details 가 없으면 빈 객체', () => {
    expect(extractConsultationRecordFieldErrors(new Error('network'))).toEqual({});
    expect(extractConsultationRecordFieldErrors(undefined)).toEqual({});
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
