import React from 'react';
import PageHeader from '../common/PageHeader';

/**
 * 간단한 레이아웃 컴포넌트
 * 복잡한 로직 없이 기본적인 레이아웃만 제공
 */
const SimpleLayout = ({ children, title, icon, showBackButton = true, showHamburger = true }) => {
  return (
    <div className="simple-layout">
      <PageHeader 
        title={title} 
        icon={icon}
        showBackButton={showBackButton}
        showHamburger={showHamburger}
      />
      
      <main className="simple-main">
        <div className="simple-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SimpleLayout;
