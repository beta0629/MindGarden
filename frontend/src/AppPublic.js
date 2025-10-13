import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// 공개 경로만을 위한 별도 앱 - 세션 체크 없음
// PublicDesignSystemV9 파일이 삭제되어 임시로 비활성화
function AppPublic() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="*" element={<div>페이지를 찾을 수 없습니다.</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppPublic;
