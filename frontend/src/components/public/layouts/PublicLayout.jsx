/**
 * PublicLayout — 공개 페이지 레이아웃 (Atom/Layout)
 *
 * PublicHeader (GNB) + PublicFooter wrapping.
 * AdminCommonLayout 오용 교체용 (§P 옵션 B 결정).
 * mg-v2-* 토큰 한정, 다크모드 + 모바일 반응형 (414×896 우선).
 *
 * @author MindGarden
 * @since 2026-06-15
 */

import React from 'react';
import PublicHeader from '../atoms/PublicHeader';
import PublicFooter from '../atoms/PublicFooter';
import './PublicLayout.css';

const PublicLayout = ({ children, className = '' }) => {
  const layoutClassName = [
    'mg-v2-public-layout',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClassName}>
      <PublicHeader />
      <main className="mg-v2-public-layout__content" role="main">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
