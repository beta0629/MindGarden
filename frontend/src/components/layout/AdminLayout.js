/**
 * 관리자 레이아웃 — Operator Desktop 영속 셸
 * AdminCommonLayout이 GNB+LNB를 소유하고 Outlet(페이지)만 교체한다.
 * 페이지가 다시 AdminCommonLayout을 써도 AdminShellContext passthrough로 이중 셸 없음.
 * lazy() 자식 suspend 시 본 Suspense가 nearest boundary가 되어 chrome(GNB+LNB)을 유지한다.
 *
 * @author Core Solution
 * @version 3.1.0
 * @since 2025-12-03
 */

import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import UnifiedLoading from '../common/UnifiedLoading';
import AdminCommonLayout from './AdminCommonLayout';

/** stage(Outlet) Suspense fallback — 전체 viewport 덮지 않음 */
const ADMIN_LAYOUT_STAGE_LOADING_CLASS = 'mg-v2-loading-container';
const ADMIN_LAYOUT_STAGE_LOADING_TEXT = '페이지를 불러오는 중...';
const ADMIN_LAYOUT_LOADING_TYPE = 'inline';

const AdminLayoutStageFallback = () => (
  <div
    className={ADMIN_LAYOUT_STAGE_LOADING_CLASS}
    data-testid="admin-layout-stage-fallback"
    aria-busy="true"
    aria-live="polite"
  >
    <UnifiedLoading type={ADMIN_LAYOUT_LOADING_TYPE} text={ADMIN_LAYOUT_STAGE_LOADING_TEXT} />
  </div>
);

const AdminLayout = () => (
  <AdminCommonLayout>
    <Suspense fallback={<AdminLayoutStageFallback />}>
      <Outlet />
    </Suspense>
  </AdminCommonLayout>
);

export default AdminLayout;
