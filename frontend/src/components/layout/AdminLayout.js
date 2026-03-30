/**
 * 관리자 레이아웃 컨테이너 (Outlet만 렌더)
 * GNB·LNB는 각 페이지의 AdminCommonLayout에서 제공. 여기서는 사이드바 없이 메인만 표시.
 *
 * @author Core Solution
 * @version 2.1.0
 * @since 2025-12-03
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
  return (
    <div className="mg-admin-layout">
      <main className="mg-admin-layout__main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;

