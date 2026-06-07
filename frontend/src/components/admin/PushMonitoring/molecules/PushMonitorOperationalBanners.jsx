/**
 * PushMonitorOperationalBanners — 운영 상태 안내 + 비용 placeholder 묶음 molecule.
 *
 * 디자이너 핸드오프 §10 운영 가드 5개 중 4개를 본 molecule 에서 모두 표출:
 *  - 알림톡 OFF 배너 (warning, 토글 OFF 시)
 *  - PUSH 갭 배너 (info, 항상)
 *  - 비용 placeholder (단가 미등록 — 항상 표시, 숫자 노출 X)
 *
 * 본인 테넌트 + PII 가드는 페이지·실패 사례에서 별도 처리.
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import PushMonitorOperationalBadge, {
  PUSH_MONITOR_BADGE_TONES
} from '../atoms/PushMonitorOperationalBadge';
import { ADMIN_WEB_SCAFFOLD_COPY } from '../../../../constants/adminWebScaffold';
import './PushMonitorOperationalBanners.css';

const formatCount = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return '0';
  }
  return n.toLocaleString('ko-KR');
};

const PushMonitorOperationalBanners = ({
  alimtalkRouteEnabled,
  channelBreakdown
}) => {
  const showAlimtalkOff = !alimtalkRouteEnabled;
  const channelEntry = (key) => {
    if (!Array.isArray(channelBreakdown)) {
      return 0;
    }
    const row = channelBreakdown.find((r) => r && r.channel === key);
    return row ? Number(row.totalCount) || 0 : 0;
  };
  const alimtalkCount = channelEntry('ALIMTALK');
  const smsCount = channelEntry('SMS');
  const pushCount = channelEntry('PUSH');

  const costSummary = `${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_ALIMTALK} ${formatCount(alimtalkCount)}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_VALUE_UNIT}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_DISTRIBUTION_SEPARATOR}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_SMS} ${formatCount(smsCount)}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_VALUE_UNIT}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_DISTRIBUTION_SEPARATOR}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_CHANNEL_PUSH} ${formatCount(pushCount)}${ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_KPI_VALUE_UNIT}`;

  return (
    <div className="mg-push-monitor__operational-banners" data-testid="push-monitor-operational-banners">
      {showAlimtalkOff ? (
        <PushMonitorOperationalBadge
          tone={PUSH_MONITOR_BADGE_TONES.WARNING}
          title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_BANNER_ALIMTALK_OFF_TITLE}
          description={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_BANNER_ALIMTALK_OFF_DESC}
          code={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_BANNER_ALIMTALK_OFF_CODE}
        />
      ) : null}
      <PushMonitorOperationalBadge
        tone={PUSH_MONITOR_BADGE_TONES.INFO}
        title={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_BANNER_PUSH_GUARD_TITLE}
        description={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_BANNER_PUSH_GUARD_DESC}
      />
      <div
        className="mg-push-monitor__cost-card"
        role="note"
        aria-label={ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_COST_TITLE}
      >
        <div className="mg-push-monitor__cost-card__title">
          {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_COST_TITLE}
        </div>
        <div className="mg-push-monitor__cost-card__channels" aria-hidden="true">
          {costSummary}
        </div>
        <div className="mg-push-monitor__cost-card__desc">
          {ADMIN_WEB_SCAFFOLD_COPY.PUSH_MONITOR_COST_DESC}
        </div>
      </div>
    </div>
  );
};

PushMonitorOperationalBanners.propTypes = {
  alimtalkRouteEnabled: PropTypes.bool.isRequired,
  channelBreakdown: PropTypes.arrayOf(PropTypes.shape({
    channel: PropTypes.string,
    totalCount: PropTypes.number
  }))
};

PushMonitorOperationalBanners.defaultProps = {
  channelBreakdown: null
};

export default PushMonitorOperationalBanners;
