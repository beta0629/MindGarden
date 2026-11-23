/**
 * SCT Playwright 뷰포트 하네스 — App 라우터와 분리된 CRA 엔트리
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/fonts/pretendard/pretendard-variable-dynamic-subset.css';
import '../styles/unified-design-tokens.css';
import '../index.css';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { SessionProvider } from '../contexts/SessionContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ToastProvider } from '../contexts/ToastContext';
import SctViewportHarnessPage from './SctViewportHarnessPage';

const rootEl = document.getElementById('root');

if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <SessionProvider>
          <NotificationProvider>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="*" element={<SctViewportHarnessPage />} />
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </NotificationProvider>
        </SessionProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}