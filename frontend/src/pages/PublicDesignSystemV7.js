import React from 'react';
import MindGardenDesignSystemV7 from '../components/v0-results/mindgarden-design-system (7)/app/page.jsx';
import '../components/v0-results/mindgarden-design-system (7)/app/globals.css';

// 공개 경로용 컴포넌트 - 세션 체크 없이 바로 렌더링
const PublicDesignSystemV7 = () => {
  return (
    <div className="mindgarden-design-system">
      <MindGardenDesignSystemV7 />
    </div>
  );
};

export default PublicDesignSystemV7;