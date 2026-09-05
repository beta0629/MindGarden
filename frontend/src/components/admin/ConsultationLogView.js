/**
 * 상담일지 조회 페이지 - AdminCommonLayout 래퍼
 * 매칭관리와 동일 레이아웃 사용. Clinic-OS chrome (B0KlA 셸 제거).
 * G-14 P0: ACL title 생략, ContentHeader SSOT는 ConsultationLogViewPage.
 *
 * @author Core Solution
 * @since 2025-03-02
 * @updated 2026-09-05 — Clinic-OS chrome alignment
 */

import React, { useState } from 'react';
import ConsultationLogViewPage from './consultation-log-view/ConsultationLogViewPage';
import AdminCommonLayout from '../layout/AdminCommonLayout';
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
      <ConsultationLogViewPage />
    </AdminCommonLayout>
  );
};

export default ConsultationLogView;
