/**
 * MallEmptyState — 빈 상태 카드 (제목 + 한 줄 + 선택 액션)
 *
 * @author MindGarden
 * @since 2026-09-29
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * @param {{ title: string, body?: string, action?: import('react').ReactNode, testId?: string }} props
 */
const MallEmptyState = ({ title, body = '', action = null, testId }) => (
  <div className="client-mall-empty" data-testid={testId} role="status">
    <p className="client-mall-empty__title">{title}</p>
    {body ? <p className="client-mall-empty__body">{body}</p> : null}
    {action}
  </div>
);

MallEmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  body: PropTypes.string,
  action: PropTypes.node,
  testId: PropTypes.string
};

export default MallEmptyState;
