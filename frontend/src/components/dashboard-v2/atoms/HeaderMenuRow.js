/**
 * HeaderMenuRow — GNB 드롭다운 flush native menu row (Atom)
 * MGButton outline chrome 미사용. Portal 패널 내부 메뉴 행 전용.
 *
 * @author CoreSolution
 * @since 2026-08-26
 */

import React from 'react';
import PropTypes from 'prop-types';
import './HeaderMenuRow.css';

const HEADER_MENU_ROW_BASE = 'mg-v2-header-menu-row';

/**
 * @param {Object} props
 * @param {Function} [props.onClick]
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.danger]
 * @param {string|null} [props.role] — 기본 menuitem; null이면 role 미설정
 * @param {boolean} [props.omitRole] — true이면 role attribute를 DOM에 넣지 않음 (리스트 내 button 등)
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 */
const HeaderMenuRow = ({
  onClick,
  children,
  danger = false,
  role = 'menuitem',
  omitRole = false,
  className = '',
  disabled = false,
  ...rest
}) => {
  const classNames = [
    HEADER_MENU_ROW_BASE,
    danger ? `${HEADER_MENU_ROW_BASE}--danger` : '',
    className
  ]
    .filter(Boolean)
    .join(' ');

  // null/undefined 또는 omitRole — role attribute를 DOM에 넣지 않음 (jsx-a11y/aria-role 회피)
  const roleProps = omitRole || role == null ? {} : { role };

  return (
    <button
      type="button"
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      {...roleProps}
      {...rest}
    >
      {children}
    </button>
  );
};

HeaderMenuRow.propTypes = {
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  danger: PropTypes.bool,
  role: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
  omitRole: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool
};

export default HeaderMenuRow;
