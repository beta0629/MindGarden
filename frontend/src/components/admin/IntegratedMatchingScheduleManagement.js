/**
 * 통합 스케줄 페이지 — AdminCommonLayout 래퍼 (G-14 Pilot 3)
 * App.js 인라인 AdminCommonLayout 제거, MappingManagement와 동일 패턴.
 *
 * @author Core Solution
 * @since 2026-07-07
 */

import React from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import IntegratedMatchingSchedule from './mapping-management/IntegratedMatchingSchedule';
import './AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/responsive-layout-tokens.css';
import '../../styles/themes/admin-theme.css';
import { useTranslation } from 'react-i18next';

const IntegratedMatchingScheduleManagement = () => {
  const { t } = useTranslation();

  return (
    <AdminCommonLayout title={t('common:misc.App.t_d67bbae4')}>
      <IntegratedMatchingSchedule />
    </AdminCommonLayout>
  );
};

export default IntegratedMatchingScheduleManagement;
