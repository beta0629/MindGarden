/**
 * Client Dashboard — B0KlA mg-v2-section-block 래퍼
 *
 * @author CoreSolution
 * @since 2026-07-09
 */

import React from 'react';
import PropTypes from 'prop-types';

const ClientDashboardSectionBlock = ({
  title,
  subtitle,
  accentVariant = 'primary',
  children,
  dataTestId,
  className = ''
}) => {
  const sectionClass = [
    'mg-v2-section-block',
    'client-dashboard__section-block',
    `client-dashboard__section-block--accent-${accentVariant}`,
    className
  ].filter(Boolean).join(' ');

  const testProps = dataTestId ? { 'data-testid': dataTestId } : {};

  return (
    <section className={sectionClass} {...testProps}>
      {(title || subtitle) ? (
        <header className="mg-v2-section-block__head client-dashboard__section-block-head">
          <span className="mg-v2-accent-bar client-dashboard__accent-bar" aria-hidden="true" />
          <div className="client-dashboard__section-block-titles">
            {title ? (
              <h2 className="mg-v2-section-block__title client-dashboard__section-block-title">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="client-dashboard__section-block-subtitle">{subtitle}</p>
            ) : null}
          </div>
        </header>
      ) : null}
      <div className="client-dashboard__section-block-body">{children}</div>
    </section>
  );
};

ClientDashboardSectionBlock.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  accentVariant: PropTypes.oneOf(['primary', 'accent', 'secondary']),
  children: PropTypes.node,
  dataTestId: PropTypes.string,
  className: PropTypes.string
};

export default ClientDashboardSectionBlock;
