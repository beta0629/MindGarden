/**
 * 상담일지 조회 페이지 - AdminCommonLayout 래퍼
 * 매칭관리와 동일 레이아웃 사용. Phase 1: 목록 뷰만.
 * G-14 P0: ACL title 생략, ContentHeader SSOT는 ConsultationLogViewPage.
 *
 * @author Core Solution
 * @since 2025-03-02
 */

import React, { useState } from 'react';
import ConsultationLogViewPage from './consultation-log-view/ConsultationLogViewPage';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import './AdminDashboard/AdminDashboardB0KlA.css';
import '../../styles/main.css';
import '../../styles/unified-design-tokens.css';
import '../../styles/responsive-layout-tokens.css';
import '../../styles/themes/admin-theme.css';

const ConsultationLogView = () => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <AdminCommonLayout
      searchValue={searchValue}
      onSearchChange={setSearchValue}
    >
      <div className="mg-v2-ad-b0kla">
        <div className="mg-v2-ad-b0kla__container">
          <ConsultationLogViewPage />
        </div>
      </div>
    </AdminCommonLayout>
  );
};

export default ConsultationLogView;
