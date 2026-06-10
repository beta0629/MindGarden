import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/unified-design-tokens.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { GOOGLE_WEB_CLIENT_ID, isGoogleWebClientIdConfigured } from './constants/oauth2';

const root = ReactDOM.createRoot(document.getElementById('root'));

// `<GoogleOAuthProvider>` 는 `clientId` 가 빈 문자열이면 GIS 스크립트 로드를 시도하지
// 않으므로 안전하지만, 미구성 환경에서는 명시적으로 래핑을 생략하여 콘솔 노이즈를 줄인다.
const AppTree = isGoogleWebClientIdConfigured ? (
  <GoogleOAuthProvider clientId={GOOGLE_WEB_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
) : (
  <App />
);

root.render(
  <React.StrictMode>
    {AppTree}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
