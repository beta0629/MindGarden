import { toDisplayString } from '../../../utils/safeDisplay';
import { CONSULTATION_LOG_SESSION_NUMBER_STRINGS } from '../../../constants/consultationLogAutosaveStrings';
import { parseOptionalSessionNumber } from '../../../utils/consultationRecordSessionNumber';

/**
 * 상담일지 모달 본문 상단 — 회기 칩(R1) + 회기/세션 일자(R2)
 *
 * <p>sessionNumber null → 1 위조 금지. 타기관은 회기권 칩 대신 기관연계 라벨.</p>
 */
const ConsultationLogSessionHeaderMeta = ({
  sessionNumber,
  sessionDateLabel,
  institutionLink = false
}) => {
  const n = sessionNumber != null && sessionNumber !== '' ? Number(sessionNumber) : null;
  const hasValidSession = Number.isFinite(n) && n >= 1;
  const dateStr = toDisplayString(sessionDateLabel, '—');
  const chipLabel = safeN != null
    ? `${safeN}회기`
    : CONSULTATION_LOG_SESSION_NUMBER_STRINGS.UNSET_CHIP_LABEL;

  let chipLabel = '—';
  if (institutionLink && !hasValidSession) {
    chipLabel = '기관연계';
  } else if (hasValidSession) {
    chipLabel = `${Math.floor(n)}회기`;
  }

  return (
    <div className="mg-v2-consultation-log__header-meta mg-v2-consultation-log__summary-strip">
      <div className="mg-v2-consultation-log__header-meta-row">
        <span
          className="mg-v2-consultation-log__session-chip"
          title={institutionLink ? '타기관 연계 상담' : '회기 번호(시스템 부여)'}
          data-institution-link={institutionLink ? 'true' : 'false'}
        >
          {chipLabel}
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
