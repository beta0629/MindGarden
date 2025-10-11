import React from 'react';
import MindGardenDesignSystemV8 from '../components/v0-results/mindgarden-design-system (8)/app/page.jsx';
import '../components/v0-results/mindgarden-design-system (8)/app/globals.css';

// 공개 경로용 컴포넌트 - 세션 체크 없이 바로 렌더링
const PublicDesignSystemV8 = () => {
  return (
    <div className="mindgarden-design-system">
      <MindGardenDesignSystemV8 />
    </div>
  );
};

export default PublicDesignSystemV8;
