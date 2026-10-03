/**
 * SettingsRowControl — ListTableView onRowClick 행 안의 토글·버튼·메뉴 감싸개.
 * 클릭·Enter/Space 가 행 클릭으로 번지지 않게 막는다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import PropTypes from 'prop-types';

const stop = (event) => event.stopPropagation();

const SettingsRowControl = ({ className = '', children }) => (
  <span
    className={['mg-v2-settings-row-control', className].filter(Boolean).join(' ')}
    onClick={stop}
    onKeyDown={stop}
  >
    {children}
  </span>
);

SettingsRowControl.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node
};

export default SettingsRowControl;
