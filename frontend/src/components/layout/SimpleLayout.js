import React from 'react';
import SimpleHeader from './SimpleHeader';

/**
 * 간단한 레이아웃 컴포넌트
 * 복잡한 로직 없이 기본적인 레이아웃만 제공
 */
const SimpleLayout = ({ children }) => {
  return (
    <div className="simple-layout">
      <SimpleHeader />
      
      <main className="simple-main">
        <div className="simple-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default SimpleLayout;
