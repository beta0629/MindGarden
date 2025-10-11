import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PublicDesignSystemV9 from './pages/PublicDesignSystemV9';

// 공개 경로만을 위한 별도 앱 - 세션 체크 없음
function AppPublic() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/design-system-v9" element={<PublicDesignSystemV9 />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppPublic;
