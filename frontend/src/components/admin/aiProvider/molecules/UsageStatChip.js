/**
 * 사용 통계 메트릭 카드 (단일) — 디자이너 §4 / §5.
 *
 * 좌측 4px 세로 악센트 바 + 라벨 + 값 + 단위.
 *
 * @author MindGarden
 * @since 2026-05-24
 */
import React from 'react';
import { toDisplayString } from '../../../../utils/safeDisplay';

const UsageStatChip = ({ label, value, unit, accent = 'primary' }) => (
  <div
    className={[
      'mg-ai-stat-chip',
      `mg-ai-stat-chip--accent-${accent}`
    ].join(' ')}
  >
    <span className="mg-ai-stat-chip__accent" aria-hidden="true" />
    <span className="mg-ai-stat-chip__body">
      <span className="mg-ai-stat-chip__label">{toDisplayString(label)}</span>
      <span className="mg-ai-stat-chip__value">
        {toDisplayString(value)}
        {unit ? <span className="mg-ai-stat-chip__unit">{toDisplayString(unit)}</span> : null}
      </span>
    </span>
  </div>
);

export default UsageStatChip;
