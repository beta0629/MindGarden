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

export default AppPublic;
