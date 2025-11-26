/**
 * 브랜딩 관리 페이지
 * SimpleLayout으로 감싸진 브랜딩 관리 컴포넌트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */

import React from 'react';
import SimpleLayout from '../components/layout/SimpleLayout';
import BrandingManagement from '../components/admin/BrandingManagement';

const BrandingManagementPage = () => {
  return (
    <SimpleLayout 
      title="브랜딩 관리"
      loading={false}
    >
      <BrandingManagement />
    </SimpleLayout>
  );
};

export default BrandingManagementPage;
