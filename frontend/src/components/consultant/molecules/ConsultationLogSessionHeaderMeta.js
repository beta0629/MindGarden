import { toDisplayString } from '../../../utils/safeDisplay';
import { CONSULTATION_LOG_SESSION_NUMBER_STRINGS } from '../../../constants/consultationLogAutosaveStrings';
import { isConsultationLogSessionNumberAssigned } from '../../../utils/consultationRecordSessionNumber';

/**
 * 상담일지 모달 본문 상단 — 회기 칩(R1) + 세션 일자(R2)
 *
 * sessionNumber 가 없으면 1회기로 위장하지 않고 「회기 없음」을 표시한다.
 */
const ConsultationLogSessionHeaderMeta = ({
  sessionNumber,
  sessionDateLabel
}) => {
  const assigned = isConsultationLogSessionNumberAssigned(sessionNumber);
  const chipLabel = assigned
    ? `${Math.floor(Number(sessionNumber))}회기`
    : CONSULTATION_LOG_SESSION_NUMBER_STRINGS.UNSET_CHIP_LABEL;
  const dateStr = toDisplayString(sessionDateLabel, '—');
  const chipClassName = assigned
    ? 'mg-v2-consultation-log__session-chip'
    : 'mg-v2-consultation-log__session-chip mg-v2-consultation-log__session-chip--unassigned';

  return (
    <div className="mg-v2-consultation-log__header-meta mg-v2-consultation-log__summary-strip">
      <div className="mg-v2-consultation-log__header-meta-row">
        <span
          className={chipClassName}
          title={assigned
            ? CONSULTATION_LOG_SESSION_NUMBER_STRINGS.ASSIGNED_CHIP_TITLE
            : CONSULTATION_LOG_SESSION_NUMBER_STRINGS.UNSET_CHIP_TITLE}
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
