/**
 * ERP 공통 빈 상태 Molecule
 *
 * @author CoreSolution
 * @since 2026-04-09
 */

import React from 'react';
import PropTypes from 'prop-types';
import ErpSafeText from '../atoms/ErpSafeText';
import './ErpEmptyState.css';

/**
 * @param {object} props
 * @param {unknown} props.title
 * @param {unknown} [props.description]
 * @param {import('react').ReactNode} [props.actionSlot]
 */
export default function ErpEmptyState({ title, description, actionSlot }) {
  return (
    <section
      className="mg-v2-erp-empty-state"
      role="status"
      aria-live="polite"
    >
      <h3 className="mg-v2-erp-empty-state__title">
        <ErpSafeText value={title} fallback="데이터 없음" />
      </h3>
      {description != null && description !== '' && (
        <p className="mg-v2-erp-empty-state__description">
          <ErpSafeText value={description} />
        </p>
      )}
      {actionSlot ? (
        <div className="mg-v2-erp-empty-state__actions">{actionSlot}</div>
      ) : null}
    </section>
  );
}

ErpEmptyState.propTypes = {
  title: PropTypes.any.isRequired,
  description: PropTypes.any,
  actionSlot: PropTypes.node
};
