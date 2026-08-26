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
 * @param {string} [props.className]
 * @param {boolean} [props.disabled]
 */
const HeaderMenuRow = ({
  onClick,
  children,
  danger = false,
  role = 'menuitem',
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

  const roleProps = role == null ? {} : { role };

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
  className: PropTypes.string,
  disabled: PropTypes.bool
};

export default HeaderMenuRow;
