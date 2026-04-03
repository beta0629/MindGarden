import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../../utils/session';
import UnifiedLoading from '../common/UnifiedLoading';

/**
 * 레거시 단일 페이지 편집 진입 — 역할별 마이페이지로 단일 리다이렉트
 * (프로필 편집은 MyPage 프로필 탭에서 수행)
 */
const ProfileEdit = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/login', { replace: true });
      return;
    }
    const rolePath = String(currentUser.role || 'client').toLowerCase();
    navigate(`/${rolePath}/mypage`, { replace: true });
  }, [navigate]);

  return <UnifiedLoading type="page" text="마이페이지로 이동 중..." />;
};

export default ProfileEdit;
