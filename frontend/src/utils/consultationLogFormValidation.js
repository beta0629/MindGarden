/**
 * 상담일지 저장 필수값 — 관리자·상담사 작성 화면 공통.
 * 신규 작성은 회기(sessionNumber) 미부여를 막지 않고, 수정만 회기를 요구한다.
 * 타기관 연계는 회기·위험도를 요구하지 않는다.
 *
 * @author CoreSolution
 * @since 2026-09-28
 */

import { CONSULTATION_LOG_CLIENT_CONDITION_MAX_LENGTH } from '../constants/consultationLogAutosaveConstants';
import { CONSULTATION_LOG_SESSION_NUMBER_STRINGS } from '../constants/consultationLogAutosaveStrings';
import { shouldBlockSaveForMissingSessionNumber } from './consultationRecordSessionNumber';

/** 관리자 작성 폼과 동일한 기본 필수 항목 안내 문구 */
export const CONSULTATION_LOG_BASE_REQUIRED_LABELS =
  '세션 시간, 내담자 상태, 주요 이슈, 개입 방법, 내담자 반응, 위험도 평가, 진행 평가';

const MESSAGE_KEYS = {
  sessionNumber: 'common:consultant.ConsultationLogModal.t_sessionNumberRequired',
  sessionDurationMinutes: 'common:consultant.ConsultationLogModal.t_7f40290f',
  clientCondition: 'common:consultant.ConsultationLogModal.t_d431db7c',
  clientConditionMaxLength: 'common:consultant.ConsultationLogModal.t_82f32b59',
  mainIssues: 'common:consultant.ConsultationLogModal.t_27da1035',
  interventionMethods: 'common:consultant.ConsultationLogModal.t_8b0e82cb',
  clientResponse: 'common:consultant.ConsultationLogModal.t_4b56e38c',
  riskAssessment: 'common:consultant.ConsultationLogModal.t_213f1150',
  progressEvaluation: 'common:consultant.ConsultationLogModal.t_784bce95',
  summary: 'common:consultant.ConsultationLogModal.t_bad7173d'
};

const isBlank = (value) => value == null || String(value).trim() === '';

/**
 * 기존 상담일지 모달 문구 키로 필드 오류 메시지를 만든다.
 *
 * @param {function} t i18n t
 * @returns {Record<string, string>}
 */
export function buildConsultationLogFormMessages(t) {
  return {
    sessionNumber: t(
      MESSAGE_KEYS.sessionNumber,
      CONSULTATION_LOG_SESSION_NUMBER_STRINGS.REQUIRED_FOR_SAVE
    ),
    sessionDurationMinutes: t(MESSAGE_KEYS.sessionDurationMinutes),
    clientCondition: t(MESSAGE_KEYS.clientCondition),
    clientConditionMaxLength: t(MESSAGE_KEYS.clientConditionMaxLength),
    mainIssues: t(MESSAGE_KEYS.mainIssues),
    interventionMethods: t(MESSAGE_KEYS.interventionMethods),
    clientResponse: t(MESSAGE_KEYS.clientResponse),
    riskAssessment: t(MESSAGE_KEYS.riskAssessment),
    progressEvaluation: t(MESSAGE_KEYS.progressEvaluation),
    summary: t(MESSAGE_KEYS.summary)
  };
}

/**
 * @param {{
 *   formData?: object,
 *   sessionNumber?: unknown,
 *   isEditMode?: boolean,
 *   isInstitutionLinkLog?: boolean,
 *   messages: Record<string, string>
 * }} params
 * @returns {Record<string, string>} 필드별 오류. 비어 있으면 통과.
 */
export function validateConsultationLogForm({
  formData,
  sessionNumber,
  isEditMode = false,
  isInstitutionLinkLog = false,
  messages
}) {
  const data = formData || {};
  const errors = {};
  const resolvedSessionNumber = sessionNumber != null && sessionNumber !== ''
    ? sessionNumber
    : data.sessionNumber;

  if (!isInstitutionLinkLog
      && shouldBlockSaveForMissingSessionNumber(resolvedSessionNumber, isEditMode)) {
    errors.sessionNumber = messages.sessionNumber;
  }

  if (!data.sessionDurationMinutes || data.sessionDurationMinutes < 1) {
    errors.sessionDurationMinutes = messages.sessionDurationMinutes;
  }

  if (isBlank(data.clientCondition)) {
    errors.clientCondition = messages.clientCondition;
  } else if (String(data.clientCondition).length > CONSULTATION_LOG_CLIENT_CONDITION_MAX_LENGTH) {
    errors.clientCondition = messages.clientConditionMaxLength;
  }

  if (isBlank(data.mainIssues)) {
    errors.mainIssues = messages.mainIssues;
  }

  if (isBlank(data.interventionMethods)) {
    errors.interventionMethods = messages.interventionMethods;
  }

  if (isBlank(data.clientResponse)) {
    errors.clientResponse = messages.clientResponse;
  }

  if (!isInstitutionLinkLog && (!data.riskAssessment || data.riskAssessment === '')) {
    errors.riskAssessment = messages.riskAssessment;
  }

  if (isBlank(data.progressEvaluation)) {
    errors.progressEvaluation = messages.progressEvaluation;
  }

  return errors;
}
