import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MindGardenDesignSystemShowcase from './pages/MindGardenDesignSystemShowcase';

// 공개 경로만을 위한 별도 앱 - 세션 체크 없음
function AppPublic() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/design-system" element={<MindGardenDesignSystemShowcase />} />
          <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppPublic;
