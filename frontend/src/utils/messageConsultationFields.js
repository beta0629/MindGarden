/**
 * 상담 메시지 metadata 에서 모달 필드(관련 상담·남은 회기)만 읽는다.
 * API 필드를 새로 만들지 않고, 이미 내려온 metadata/객체 키만 사용한다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */

/**
 * @param {unknown} metadata
 * @returns {object}
 */
const parseMetadataObject = (metadata) => {
  if (metadata == null) {
    return {};
  }
  if (typeof metadata === 'string') {
    const trimmed = metadata.trim();
    if (!trimmed) {
      return {};
    }
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (err) {
      return {};
    }
  }
  if (typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata;
  }
  return {};
};

/**
 * @param {unknown} value
 * @returns {string}
 */
const asTrimmedString = (value) => {
  if (value == null) {
    return '';
  }
  const text = String(value).trim();
  return text;
};

/**
 * 메시지에서 모달용 상담 관련 표시값을 모은다.
 *
 * @param {object|null|undefined} message
 * @returns {{
 *   relatedConsultation: string,
 *   remainingSessions: string
 * }}
 */
export const parseMessageConsultationFields = (message) => {
  const empty = { relatedConsultation: '', remainingSessions: '' };
  if (!message || typeof message !== 'object') {
    return empty;
  }
  const meta = parseMetadataObject(message.metadata);
  const source = { ...meta };
  [
    'relatedConsultation',
    'consultationLabel',
    'scheduleLabel',
    'scheduleDate',
    'consultationDate',
    'date',
    'scheduleTime',
    'time',
    'consultationType',
    'type',
    'modality',
    'remainingSessions',
    'remainingSessionsText',
    'remainingSessionText',
    'totalSessions',
    'sessionCount'
  ].forEach((key) => {
    if (source[key] == null && message[key] != null) {
      source[key] = message[key];
    }
  });

  const relatedReady = asTrimmedString(
    source.relatedConsultation || source.consultationLabel || source.scheduleLabel
  );
  if (relatedReady) {
    // relatedConsultation 이미 완성된 문구
  }
  const datePart = asTrimmedString(
    source.scheduleDate || source.consultationDate || source.date
  );
  const timePart = asTrimmedString(source.scheduleTime || source.time);
  const typePart = asTrimmedString(source.consultationType || source.type || source.modality);
  const composedRelated = relatedReady || [datePart, timePart].filter(Boolean).join(' ').trim();
  const relatedConsultation = composedRelated
    ? (typePart ? `${composedRelated} · ${typePart}` : composedRelated)
    : '';

  const remainingReady = asTrimmedString(
    source.remainingSessionsText || source.remainingSessionText
  );
  let remainingSessions = remainingReady;
  if (!remainingSessions) {
    const remaining = source.remainingSessions;
    const total = source.totalSessions || source.sessionCount;
    if (remaining != null && total != null
      && String(remaining).trim() !== '' && String(total).trim() !== '') {
      remainingSessions = `${total}회기 패키지 중 ${remaining}회 남음`;
    } else if (remaining != null && String(remaining).trim() !== '') {
      remainingSessions = asTrimmedString(remaining);
    }
  }

  return {
    relatedConsultation,
    remainingSessions
  };
};

export default parseMessageConsultationFields;
