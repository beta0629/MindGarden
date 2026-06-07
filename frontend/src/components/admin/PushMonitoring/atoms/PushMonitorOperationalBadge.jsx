/**
 * PushMonitorOperationalBadge — 운영 상태 안내 배지(ALIMTALK OFF / PUSH 갭).
 *
 * 디자이너 핸드오프 §10 — 알림톡 OFF (warning) / PUSH 가드 (info) 배지를 atomic 단위로
 * 분리. `code` prop 으로 inline code 토큰 표기를 허용한다(ENV 키 노출 — 운영자가 토글 위치
 * 즉시 식별).
 *
 * @author MindGarden core-coder
 * @since 2026-06-07
 */

import React from 'react';
import PropTypes from 'prop-types';
import './PushMonitorOperationalBadge.css';

const TONES = Object.freeze({
  WARNING: 'warning',
  INFO: 'info'
});

const PushMonitorOperationalBadge = ({
  tone,
  title,
  description,
  code = null
}) => {
  const className = [
    'mg-push-monitor__operational-banner',
    `mg-push-monitor__operational-banner--${tone}`
  ].join(' ');
  const role = tone === TONES.WARNING ? 'status' : 'note';
  return (
    <div className={className} role={role} data-testid={`push-monitor-banner-${tone}`}>
      <div className="mg-push-monitor__operational-banner__title">{title}</div>
      <div className="mg-push-monitor__operational-banner__desc">
        {description}
        {code ? (
          <code className="mg-push-monitor__operational-banner__code">{code}</code>
        ) : null}
      </div>
    </div>
  );
};

PushMonitorOperationalBadge.propTypes = {
  tone: PropTypes.oneOf(Object.values(TONES)).isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  code: PropTypes.string
};

export default PushMonitorOperationalBadge;
export { TONES as PUSH_MONITOR_BADGE_TONES };
