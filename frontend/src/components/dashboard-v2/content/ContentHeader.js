/**
 * ContentHeader - B0KlA 헤더 (대시보드 개요 영역)
 * mindgarden-design-system.pen B0KlA headerRow 스펙
 * title, subtitle만 표시
 *
 * @author CoreSolution
 * @since 2025-02-22
 */

import React from 'react';
import './ContentHeader.css';

const ContentHeader = ({
  title = '대시보드 개요',
  subtitle = '오늘의 주요 지표와 현황을 한눈에 확인하세요.',
  actions
}) => {
  return (
    <header className="mg-v2-content-header">
      <div className="mg-v2-content-header__left">
        {title ? <h1 className="mg-v2-content-header__title">{title}</h1> : null}
        {subtitle && <p className="mg-v2-content-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="mg-v2-content-header__right">{actions}</div>}
    </header>
  );
};

export default ContentHeader;
