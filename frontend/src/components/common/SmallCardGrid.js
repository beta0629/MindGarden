/**
 * SmallCardGrid - 작은 카드 그리드 래퍼
 * 클래스: mg-v2-list-block__grid mg-v2-list-block__grid--small
 * 다열(3~4열 데스크톱, 2열 태블릿, 1열 모바일). 터치 44px 이상 유지.
 *
 * @author Core Solution
 * @since 2025-03-17
 * @see docs/project-management/USER_MANAGEMENT_VIEW_MODE_MEETING.md §2.1, §4.1
 */

import React from 'react';
import PropTypes from 'prop-types';
import './ListBlockView.css';

const SMALL_GRID_CLASS = 'mg-v2-list-block__grid mg-v2-list-block__grid--small';

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children - 카드 노드 배열 (각 타입별 카드 셀)
 * @param {string} [props.className] - 추가 클래스
 */
function SmallCardGrid({ children, className = '' }) {
  const containerClass = [SMALL_GRID_CLASS, className].filter(Boolean).join(' ');
  return <div className={containerClass}>{children}</div>;
}

SmallCardGrid.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

SmallCardGrid.defaultProps = {
  className: ''
};

export default SmallCardGrid;
