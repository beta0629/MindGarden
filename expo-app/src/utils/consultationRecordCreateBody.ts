/**
 * 상담일지 작성(POST /api/v1/schedules/consultation-records) 본문·필수값.
 * 서버 ConsultationRecordCreateRequestValidator / 웹 validateConsultationLogForm 과 같은 필드를 쓴다.
 * 서버는 필수값 키가 하나도 없는 앱 본문을 필수값 폼 이전 빌드로 보고 통과시키므로, 키는 값이 비어도 항상 보낸다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */

/** 웹 CONSULTATION_LOG_CLIENT_CONDITION_MAX_LENGTH · 서버 CLIENT_CONDITION_MAX_LENGTH 와 동일 */
export const CONSULTATION_RECORD_CLIENT_CONDITION_MAX_LENGTH = 4000;

export const CONSULTATION_RECORD_SESSION_DURATION_MIN = 1;

/** 웹 ConsultationLogModal 신규 작성 기본 세션 시간과 동일 */
export const CONSULTATION_RECORD_DEFAULT_SESSION_DURATION_MINUTES = 60;

const MINUTES_PER_HOUR = 60;

export interface ConsultationRecordRequiredFields {
  sessionDurationMinutes: number | null;
  /** 앱 화면의 상담 요약 — 서버 clientCondition */
  clientCondition: string;
  mainIssues: string;
  interventionMethods: string;
  clientResponse: string;
  /** 앱은 항상 선택을 요구한다. 비어 있으면 본문에서 뺀다(빈 문자열 전송 금지). */
  riskAssessment: string;
  progressEvaluation: string;
}

export type ConsultationRecordRequiredField = keyof ConsultationRecordRequiredFields;

export interface ConsultationRecordCreateBodyInput extends ConsultationRecordRequiredFields {
  consultationId: number;
  sessionNumber: number;
  clientId: number;
  consultantId: number;
  consultantObservations: string;
  isSessionCompleted: boolean;
  nextSessionPlan?: string;
}

export const CONSULTATION_RECORD_REQUIRED_FIELDS: readonly ConsultationRecordRequiredField[] = [
  'sessionDurationMinutes',
  'clientCondition',
  'mainIssues',
  'interventionMethods',
  'clientResponse',
  'riskAssessment',
  'progressEvaluation',
];

export type ConsultationRecordFieldErrors = Partial<Record<ConsultationRecordRequiredField, string>>;

const isBlank = (value: unknown): boolean => value == null || String(value).trim() === '';

/**
 * 서버와 같은 필수값 오류 필드 목록. 위험도는 앱에서 항상 선택을 요구한다.
 *
 * @param fields 필수값 입력
 * @returns 누락·한도 초과 필드 (비어 있으면 통과)
 */
export function findMissingConsultationRecordFields(
  fields: ConsultationRecordRequiredFields,
): ConsultationRecordRequiredField[] {
  const missing: ConsultationRecordRequiredField[] = [];
  const duration = fields.sessionDurationMinutes;
  if (duration == null || !Number.isFinite(duration) || duration < CONSULTATION_RECORD_SESSION_DURATION_MIN) {
    missing.push('sessionDurationMinutes');
  }
  if (
    isBlank(fields.clientCondition) ||
    fields.clientCondition.length > CONSULTATION_RECORD_CLIENT_CONDITION_MAX_LENGTH
  ) {
    missing.push('clientCondition');
  }
  const textFields: ConsultationRecordRequiredField[] = [
    'mainIssues',
    'interventionMethods',
    'clientResponse',
    'riskAssessment',
    'progressEvaluation',
  ];
  for (const key of textFields) {
    if (isBlank(fields[key])) {
      missing.push(key);
    }
  }
  return missing;
}

/**
 * POST 본문. 위험도 외 필수값 키는 비어 있어도 빠뜨리지 않는다. 위험도는 선택하지 않았으면 키를 뺀다.
 *
 * @param input 본문 입력
 * @returns 요청 본문
 */
export function buildConsultationRecordCreateBody(
  input: ConsultationRecordCreateBodyInput,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    consultationId: input.consultationId,
    sessionNumber: input.sessionNumber,
    clientId: input.clientId,
    consultantId: input.consultantId,
    consultantObservations: input.consultantObservations,
    isSessionCompleted: input.isSessionCompleted,
    sessionDurationMinutes: input.sessionDurationMinutes ?? '',
    clientCondition: input.clientCondition.trim(),
    mainIssues: input.mainIssues.trim(),
    interventionMethods: input.interventionMethods.trim(),
    clientResponse: input.clientResponse.trim(),
    progressEvaluation: input.progressEvaluation.trim(),
  };
  if (!isBlank(input.riskAssessment)) {
    body.riskAssessment = input.riskAssessment.trim();
  }
  if (input.nextSessionPlan && input.nextSessionPlan.trim()) {
    body.nextSessionPlan = input.nextSessionPlan.trim();
  }
  return body;
}

const DETAILS_FIELD_PATTERN_SOURCE = `(?:^|,\\s*)(${CONSULTATION_RECORD_REQUIRED_FIELDS.join('|')}):\\s*`;

/**
 * 서버 400 {@code details}("필드: 문구, 필드: 문구") 를 필드별 문구로 바꾼다. 필수값 필드만 남긴다.
 *
 * @param details 응답 본문 details (문자열 또는 필드→문구 객체)
 * @returns 필드별 문구
 */
export function parseConsultationRecordFieldErrors(details: unknown): ConsultationRecordFieldErrors {
  const errors: ConsultationRecordFieldErrors = {};
  const known = CONSULTATION_RECORD_REQUIRED_FIELDS as readonly string[];
  if (details != null && typeof details === 'object' && !Array.isArray(details)) {
    for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
      if (known.includes(key) && typeof value === 'string' && value.trim()) {
        errors[key as ConsultationRecordRequiredField] = value.trim();
      }
    }
    return errors;
  }
  if (typeof details !== 'string' || !details.trim()) {
    return errors;
  }
  const pattern = new RegExp(DETAILS_FIELD_PATTERN_SOURCE, 'g');
  const matches: { field: string; start: number; valueStart: number }[] = [];
  let match = pattern.exec(details);
  while (match) {
    const field = match[1];
    if (field) {
      matches.push({ field, start: match.index, valueStart: match.index + match[0].length });
    }
    match = pattern.exec(details);
  }
  matches.forEach((current, index) => {
    const end = matches[index + 1]?.start ?? details.length;
    const message = details.slice(current.valueStart, end).trim();
    if (message) {
      errors[current.field as ConsultationRecordRequiredField] = message;
    }
  });
  return errors;
}

/**
 * apiClient 거부 값(ApiClientError.originalError.response.data)에서 필드별 오류를 꺼낸다.
 *
 * @param error mutation 오류
 * @returns 필드별 문구 (400 details 가 없으면 빈 객체)
 */
export function extractConsultationRecordFieldErrors(error: unknown): ConsultationRecordFieldErrors {
  if (error == null || typeof error !== 'object') {
    return {};
  }
  const original = (error as { originalError?: unknown }).originalError;
  const data =
    original != null && typeof original === 'object'
      ? (original as { response?: { data?: unknown } }).response?.data
      : undefined;
  if (data == null || typeof data !== 'object') {
    return {};
  }
  return parseConsultationRecordFieldErrors((data as Record<string, unknown>).details);
}

function parseClockMinutes(value: string | undefined): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? '').trim());
  if (!match) return null;
  return Number(match[1]) * MINUTES_PER_HOUR + Number(match[2]);
}

/**
 * 스케줄 시작·종료 시각으로 세션 시간 기본값을 만든다. 계산이 안 되면 웹 기본값.
 *
 * @param startTime HH:mm
 * @param endTime HH:mm
 * @returns 분
 */
export function resolveDefaultSessionDurationMinutes(startTime?: string, endTime?: string): number {
  const start = parseClockMinutes(startTime);
  const end = parseClockMinutes(endTime);
  if (start == null || end == null || end - start < CONSULTATION_RECORD_SESSION_DURATION_MIN) {
    return CONSULTATION_RECORD_DEFAULT_SESSION_DURATION_MINUTES;
  }
  return end - start;
}
