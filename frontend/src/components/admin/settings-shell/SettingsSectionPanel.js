/**
 * SettingsSectionPanel — 설정 화면 단일 섹션 패널 (r12 · neutral-100 · 1px neutral-300 · 그림자 없음)
 * body="form"이면 내부를 흰 표면(r8)으로 감싼다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import PropTypes from 'prop-types';
import './SettingsSuite.css';

const SettingsSectionPanel = ({
  title,
  description,
  actions = null,
  body = 'form',
  headingLevel = 2,
  className = '',
  bodyClassName = '',
  id,
  testId,
  ariaLabel,
  children
}) => {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const hasHeader = Boolean(title || description || actions);
  return (
    <section
      id={id}
      className={['mg-v2-settings-panel', className].filter(Boolean).join(' ')}
      aria-label={ariaLabel || (typeof title === 'string' ? title : undefined)}
      data-testid={testId}
    >
      {hasHeader ? (
        <div className="mg-v2-settings-panel__header">
          <div className="mg-v2-settings-panel__heading">
            {title ? <Heading className="mg-v2-settings-panel__title">{title}</Heading> : null}
            {description ? <p className="mg-v2-settings-panel__description">{description}</p> : null}
          </div>
          {actions ? <div className="mg-v2-settings-panel__actions">{actions}</div> : null}
        </div>
      ) : null}
      <div
        className={[
          'mg-v2-settings-panel__body',
          body === 'form' ? 'mg-v2-settings-panel__body--form' : 'mg-v2-settings-panel__body--plain',
          bodyClassName
        ].filter(Boolean).join(' ')}
      >
        {children}
      </div>
    </section>
  );
};

SettingsSectionPanel.propTypes = {
  title: PropTypes.node,
  description: PropTypes.node,
  actions: PropTypes.node,
  body: PropTypes.oneOf(['form', 'plain']),
  headingLevel: PropTypes.oneOf([2, 3]),
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  id: PropTypes.string,
  testId: PropTypes.string,
  ariaLabel: PropTypes.string,
  children: PropTypes.node
};

export default SettingsSectionPanel;
