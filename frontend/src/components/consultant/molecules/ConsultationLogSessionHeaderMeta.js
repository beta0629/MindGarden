import { toDisplayString } from '../../../utils/safeDisplay';

/**
 * 상담일지 모달 본문 상단 — 회기 칩(R1) + 회기/세션 일자(R2)
 */
const ConsultationLogSessionHeaderMeta = ({
  sessionNumber,
  sessionDateLabel
}) => {
  const n = sessionNumber != null ? Number(sessionNumber) : 1;
  const safeN = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  const dateStr = toDisplayString(sessionDateLabel, '—');

  return (
    <div className="mg-v2-consultation-log__header-meta">
      <div className="mg-v2-consultation-log__header-meta-row">
        <span
          className="mg-v2-consultation-log__session-chip"
          title="회기 번호(시스템 부여)"
        >
          {safeN}
          회기
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
