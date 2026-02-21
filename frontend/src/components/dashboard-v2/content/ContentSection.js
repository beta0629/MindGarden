/**
 * ContentSection - B0KlA 스타일 섹션 래퍼
 * 카드 스타일, title/subtitle, 토큰 기반
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import './ContentSection.css';

const ContentSection = ({
  title,
  subtitle,
  actions,
  children,
  className = '',
  noCard = false
}) => {
  const content = (
    <>
      {(title || actions) && (
        <header className="mg-v2-content-section__header">
          <div className="mg-v2-content-section__title-wrap">
            <div>
              {title && <h2 className="mg-v2-content-section__title">{title}</h2>}
              {subtitle && <p className="mg-v2-content-section__subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="mg-v2-content-section__actions">{actions}</div>}
        </header>
      )}
      <div className="mg-v2-content-section__body">{children}</div>
    </>
  );

  if (noCard) {
    return (
      <section className={`mg-v2-content-section mg-v2-content-section--plain ${className}`.trim()}>
        {content}
      </section>
    );
  }

  return (
    <section className={`mg-v2-content-section mg-v2-content-section--card ${className}`.trim()}>
      {content}
    </section>
  );
};

export default ContentSection;
