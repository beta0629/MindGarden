/**
 * SettingsQuietHeader — 설정 화면 헤더 (SalaryQuietHeader 계약: h1 + small 버튼 그룹)
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import PropTypes from 'prop-types';

const SettingsQuietHeader = ({ title, titleId, actions = null, actionsAriaLabel }) => (
  <header className="mg-v2-settings-header" aria-label={typeof title === 'string' ? title : undefined}>
    <h1 id={titleId} className="mg-v2-settings-header__title">
      {title}
    </h1>
    {actions ? (
      <div className="mg-v2-settings-header__controls">
        <nav className="mg-v2-settings-header__links" aria-label={actionsAriaLabel} role="group">
          {actions}
        </nav>
      </div>
    ) : null}
  </header>
);

SettingsQuietHeader.propTypes = {
  title: PropTypes.node.isRequired,
  titleId: PropTypes.string,
  actions: PropTypes.node,
  actionsAriaLabel: PropTypes.string
};

export default SettingsQuietHeader;
