/**
 * 심리검사 리포트 관리 (관리자 페이지)
 *
 * 요구사항:
 * - 위젯이 아니라 관리자 대시보드에서 접근 가능한 "페이지"로 제공
 * - 표준화 원칙 준수(토큰 CSS, 공통 컴포넌트 재사용)
 */

import React from 'react';
import AdminCommonLayout from '../layout/AdminCommonLayout';
import { useSession } from '../../contexts/SessionContext';
import { RoleUtils } from '../../constants/roles';
import ComingSoon from '../common/ComingSoon';
import PsychAssessmentAdminWidget from '../dashboard/widgets/admin/PsychAssessmentAdminWidget';

const PsychAssessmentManagement = ({ user: propUser }) => {
  const { user: sessionUser } = useSession();
  const user = propUser || sessionUser;

  // 권한 체크(관리자만)
  if (!RoleUtils.isAdmin(user) && !RoleUtils.hasRole(user, 'HQ_MASTER')) {
    return (
      <AdminCommonLayout>
        <ComingSoon
          title="접근 권한이 없습니다"
          description="관리자 권한이 필요합니다."
        />
      </AdminCommonLayout>
    );
  }

  // 현재는 위젯 컴포넌트를 페이지에 재사용(중복 구현 방지)
  // 추후 페이지 전용 레이아웃/필터/상세 화면을 추가 가능
  const widget = {
    type: 'psych-assessment-admin',
    config: {
      title: '심리검사 리포트(AI)',
      subtitle: 'TCI/MMPI 업로드 · 처리상태 · 리포트 생성'
    }
  };

  return (
    <AdminCommonLayout>
      <div className="mg-v2-ad-b0kla__container">
        <PsychAssessmentAdminWidget widget={widget} user={user} />
      </div>
    </AdminCommonLayout>
  );
};

export default PsychAssessmentManagement;


