import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/unified-design-tokens.css';
import './index.css';
import App from './App';
import AppPublic from './AppPublic';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

// 공개 경로 정의
const publicPaths = [
  '/design-system-v9',
  '/design-system',
  '/landing',
  '/admin-dashboard-sample',
  '/dashboard-design-guide-sample',
  '/test/notifications',
  '/test/payment',
  '/test/integration',
  '/test/ios-cards',
  '/test/design-sample',
  '/test/premium-sample',
  '/test/advanced-sample'
];

// 현재 경로가 공개 경로인지 확인
function checkPublicPath() {
  const currentPath = window.location.pathname;
  const isPublicPath = publicPaths.includes(currentPath);
  
  console.log('🔍 현재 경로:', currentPath);
  console.log('🔍 공개 경로 여부:', isPublicPath);
  console.log('🔍 공개 경로 목록:', publicPaths);
  
  return isPublicPath;
}

// 초기 렌더링
const isPublicPath = checkPublicPath();

root.render(
  <React.StrictMode>
    {isPublicPath ? <AppPublic /> : <App />}
  </React.StrictMode>
);

// 경로 변경 감지 (SPA 라우팅 대응)
window.addEventListener('popstate', () => {
  const newIsPublicPath = checkPublicPath();
  if (newIsPublicPath !== isPublicPath) {
    window.location.reload();
  }
});

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
