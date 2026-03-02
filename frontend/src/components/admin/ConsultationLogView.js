/**
 * 상담일지 조회 페이지 - AdminCommonLayout 래퍼
 * 매칭관리와 동일 레이아웃 사용. Phase 1: 목록 뷰만.
 *
 * @author Core Solution
 * @since 2025-03-02
 */

import React, { useState } from 'react';
import { ConsultationLogViewPage } from './consultation-log-view/ConsultationLogViewPage';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/responsive-layout-tokens.css';
import '../../styles/dashboard-common-v3.css';
import '../../styles/themes/admin-theme.css';

const ConsultationLogView = () => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <AdminCommonLayout
      title="상담일지 조회"
      searchValue={searchValue}
      onSearchChange={setSearchValue}
    >
      <ConsultationLogViewPage />
    </AdminCommonLayout>
  );
};

export default ConsultationLogView;
