import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
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
  '/test/notifications',
  '/test/payment',
  '/test/integration',
  '/test/ios-cards',
  '/test/design-sample',
  '/test/premium-sample',
  '/test/advanced-sample'
];

// 현재 경로가 공개 경로인지 확인
const isPublicPath = publicPaths.includes(window.location.pathname);

root.render(
  <React.StrictMode>
    {isPublicPath ? <AppPublic /> : <App />}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
