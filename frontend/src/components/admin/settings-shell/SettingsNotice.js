/**
 * SettingsNotice — 설정 화면 안내 배너 (SafeErrorDisplay 배너와 같은 기하 · 톤 3종)
 * 문자열만 받는 SafeErrorDisplay 와 달리 링크·버튼 등 자식과 우측 액션을 받는다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import PropTypes from 'prop-types';
import './SettingsSuite.css';

const TONE_ROLE = {
  info: 'note',
  warning: 'note',
  danger: 'alert'
};

const SettingsNotice = ({
  tone = 'info',
  role,
  actions = null,
  className = '',
  testId,
  ariaLabel,
  children
}) => (
  <div
    className={['mg-v2-settings-notice', `mg-v2-settings-notice--${tone}`, className].filter(Boolean).join(' ')}
    role={role || TONE_ROLE[tone]}
    aria-label={ariaLabel}
    data-testid={testId}
  >
    <div className="mg-v2-settings-notice__body">{children}</div>
    {actions ? <div className="mg-v2-settings-notice__actions">{actions}</div> : null}
  </div>
);

SettingsNotice.propTypes = {
  tone: PropTypes.oneOf(['info', 'warning', 'danger']),
  role: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
  testId: PropTypes.string,
  ariaLabel: PropTypes.string,
  children: PropTypes.node.isRequired
};

export default SettingsNotice;
