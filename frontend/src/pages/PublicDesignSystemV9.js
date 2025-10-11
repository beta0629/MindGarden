import React from 'react';
import MindGardenDesignSystemV9 from '../components/v0-results/mindgarden-design-system (9)/src/App.jsx';
import '../components/v0-results/mindgarden-design-system (9)/src/styles.css';
import '../components/v0-results/mindgarden-design-system (9)/app/globals.css';

// 공개 경로용 컴포넌트 - 세션 체크 없이 바로 렌더링
const PublicDesignSystemV9 = () => {
  return (
    <div className="mindgarden-design-system">
      <MindGardenDesignSystemV9 />
    </div>
  );
};

export default PublicDesignSystemV9;
