/**
 * 관리자 메시지 관리 페이지
 * 단독 라우트는 /admin/notifications로 리다이렉트됨.
 * AdminMessageListBlock 재사용. contentOnly 시 블록만 렌더.
 * @author CoreSolution
 * @since 2026-03-17
 */

import React from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import ContentHeader from '../dashboard-v2/content/ContentHeader';
import AdminMessageListBlock from './organisms/AdminMessageListBlock';
import '../../styles/unified-design-tokens.css';

const AdminMessages = ({ contentOnly = false }) => {
  if (contentOnly) {
    return <AdminMessageListBlock />;
  }

  return (
    <AdminCommonLayout title="메시지 관리">
      <main className="mg-v2-dashboard-layout">
        <ContentHeader
          title="메시지 관리"
          subtitle="전체 메시지를 조회하고 관리합니다."
        />
        <AdminMessageListBlock />
      </main>
    </AdminCommonLayout>
  );
};

export default AdminMessages;
