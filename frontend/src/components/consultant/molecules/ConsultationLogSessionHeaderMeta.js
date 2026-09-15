import { toDisplayString } from '../../../utils/safeDisplay';
import { CONSULTATION_LOG_SESSION_NUMBER_STRINGS } from '../../../constants/consultationLogAutosaveStrings';
import { parseOptionalSessionNumber } from '../../../utils/consultationRecordSessionNumber';

/**
 * 상담일지 모달 본문 상단 — 회기 칩(R1) + 회기/세션 일자(R2)
 *
 * <p>sessionNumber null → 1 위조 금지. 타기관은 회기권 칩 대신 기관연계 라벨.</p>
 *
 * @param {{ sessionNumber?: unknown, sessionDateLabel?: unknown, institutionLink?: boolean }} props
 */
const ConsultationLogSessionHeaderMeta = ({
  sessionNumber,
  sessionDateLabel,
  institutionLink = false
}) => {
  const parsed = parseOptionalSessionNumber(sessionNumber);
  const hasValidSession = parsed != null && parsed >= 1;
  const safeN = hasValidSession ? parsed : null;
  const dateStr = toDisplayString(sessionDateLabel, '—');

  let chipLabel = CONSULTATION_LOG_SESSION_NUMBER_STRINGS.UNSET_CHIP_LABEL;
  if (institutionLink && safeN == null) {
    chipLabel = '기관연계';
  } else if (safeN != null) {
    chipLabel = `${safeN}회기`;
  }

  return (
    <div className="mg-v2-consultation-log__header-meta mg-v2-consultation-log__summary-strip">
      <div className="mg-v2-consultation-log__header-meta-row">
        <span
          className="mg-v2-consultation-log__session-chip"
          title={institutionLink
            ? '타기관 연계 상담'
            : (safeN != null
              ? '회기 번호(시스템 부여)'
              : CONSULTATION_LOG_SESSION_NUMBER_STRINGS.REQUIRED_FOR_COMPLETE)}
          data-institution-link={institutionLink ? 'true' : 'false'}
          data-session-unset={!institutionLink && safeN == null ? 'true' : 'false'}
        >
          {toDisplayString(chipLabel, CONSULTATION_LOG_SESSION_NUMBER_STRINGS.UNSET_CHIP_LABEL)}
        </span>
        <dl className="mg-v2-consultation-log__session-dl">
          <div className="mg-v2-consultation-log__session-dl-row">
            <dt className="mg-v2-consultation-log__session-dt">세션 일자</dt>
            <dd className="mg-v2-consultation-log__session-dd">{dateStr}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default ConsultationLogSessionHeaderMeta;
