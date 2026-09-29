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
  /** 회기권 일지만 서버 필수. 타기관 연계 여부는 서버가 판별한다. */
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

const isBlank = (value: unknown): boolean => value == null || String(value).trim() === '';

/**
 * 서버와 같은 필수값 오류 필드 목록. 위험도는 타기관 연계 판별이 서버에 있으므로 여기서 요구하지 않는다.
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
 * POST 본문. 필수값 키는 비어 있어도 빠뜨리지 않는다.
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
    riskAssessment: input.riskAssessment.trim(),
    progressEvaluation: input.progressEvaluation.trim(),
  };
  if (input.nextSessionPlan && input.nextSessionPlan.trim()) {
    body.nextSessionPlan = input.nextSessionPlan.trim();
  }
  return body;
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
