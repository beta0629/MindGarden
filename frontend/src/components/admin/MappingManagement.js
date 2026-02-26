/**
 * 매칭 관리 페이지 - 아토믹 구조 래퍼
 * AdminDashboardV2와 동일한 레이아웃(GNB+LNB) 사용
 *
 * @author Core Solution
 * @since 2024-12-19
 * @updated 2025-02-22 - AdminDashboardV2 레이아웃 적용
 */

import React, { useState } from 'react';
import { MappingManagementPage } from './mapping-management';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/responsive-layout-tokens.css';
import '../../styles/dashboard-common-v3.css';
import '../../styles/themes/admin-theme.css';

const MappingManagement = () => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <AdminCommonLayout
      title="매칭 관리"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
    >
      <MappingManagementPage />
    </AdminCommonLayout>
  );
};

export default MappingManagement;
