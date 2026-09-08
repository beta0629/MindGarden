/**
 * 통합 스케줄 페이지 — AdminCommonLayout 래퍼 (G-14 Pilot 3)
 * App.js 인라인 AdminCommonLayout 제거, MappingManagement와 동일 패턴.
 * G-14 P0: ACL title 생략, ContentHeader SSOT는 IntegratedMatchingSchedule.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import IntegratedMatchingSchedule from './mapping-management/IntegratedMatchingSchedule';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/responsive-layout-tokens.css';
import '../../styles/themes/admin-theme.css';

const IntegratedMatchingScheduleManagement = () => (
  <AdminCommonLayout>
    <IntegratedMatchingSchedule />
  </AdminCommonLayout>
);

export default IntegratedMatchingScheduleManagement;
