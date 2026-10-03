/**
 * TableActionCell — 테이블 작업 열을 한 줄(가로)·우측 정렬.
 * 높이·간격은 design-v2-tokens.css 의 --mg-v2-component-height-sm, --mg-v2-space-2.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import PropTypes from 'prop-types';
import './TableActionCell.css';

export const TABLE_ACTION_CELL_CLASS = 'mg-v2-table-action-cell';
export const TABLE_ACTION_CELL_LABEL_CLASS = 'mg-v2-table-action-cell__label';

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.className]
 * @param {string} [props.ariaLabel]
 */
function TableActionCell({ children, className = '', ariaLabel }) {
  const classes = [TABLE_ACTION_CELL_CLASS, className].filter(Boolean).join(' ');
  return (
    <div
      className={classes}
      role="group"
      aria-label={ariaLabel}
      data-testid="table-action-cell"
    >
      {children}
    </div>
  );
}

TableActionCell.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  ariaLabel: PropTypes.string
};

export default TableActionCell;
