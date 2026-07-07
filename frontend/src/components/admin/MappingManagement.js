/**
 * 매칭 관리 페이지 — AdminCommonLayout 래퍼 (G-14)
 * IntegratedMatchingScheduleManagement와 동일 패턴.
 *
 * @author Core Solution
 * @since 2024-12-19
 * @updated 2026-07-07 — G-14 Pilot: App.js 인라인 ACL 제거·래퍼 SSOT
 */

import React from 'react';
import { MappingManagementPage } from './mapping-management';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import './AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/responsive-layout-tokens.css';
import '../../styles/themes/admin-theme.css';

const MappingManagement = () => {
  return (
    <AdminCommonLayout>
      <MappingManagementPage />
    </AdminCommonLayout>
  );
};

export default MappingManagement;
