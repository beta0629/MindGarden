import React, { useState, useEffect } from 'react';
import './SessionUserProfile.css';
import { useSession } from '../../hooks/useSession';
import { getRoleDisplayName, getRoleDisplayNameEn } from '../../utils/roleHelper';

const SessionUserProfile = ({ onProfileClick, showRole = true }) => {
  const { user: sessionUser } = useSession();
  const [imageLoadError, setImageLoadError] = useState(false);
  const [roleDisplayName, setRoleDisplayName] = useState('');
  const [roleDisplayNameEn, setRoleDisplayNameEn] = useState('');
  
  // 세션 사용자가 변경될 때 이미지 로드 에러 상태 초기화
  useEffect(() => {
    setImageLoadError(false);
  }, [sessionUser?.id, sessionUser?.profileImageUrl, sessionUser?.socialProfileImage]);

  // 사용자 역할 표시명 동적 로드
  useEffect(() => {
    const loadRoleDisplayNames = async () => {
      if (sessionUser?.role) {
        try {
          const koreanName = await getRoleDisplayName(sessionUser.role, sessionUser.branchName);
          const englishName = await getRoleDisplayNameEn(sessionUser.role, sessionUser.branchName);
          setRoleDisplayName(koreanName);
          setRoleDisplayNameEn(englishName);
        } catch (error) {
          console.error('❌ 역할 표시명 로드 실패:', error);
          setRoleDisplayName(sessionUser.role);
          setRoleDisplayNameEn(sessionUser.role);
        }
      }
    };

    loadRoleDisplayNames();
  }, [sessionUser?.role, sessionUser?.branchName]);
  
  // 디버깅: 세션 데이터 확인
  console.log('🔍 SessionUserProfile - 세션 데이터:', sessionUser);
  
  // 프로필 이미지 우선순위: 사용자 업로드 > 소셜 > 기본 아이콘
  const getProfileImageUrl = () => {
    if (sessionUser?.profileImageUrl && !imageLoadError) {
      console.log('🖼️ 사용자 업로드 이미지 사용:', sessionUser.profileImageUrl);
      return sessionUser.profileImageUrl;
    }
    if (sessionUser?.socialProfileImage && !imageLoadError) {
      console.log('🖼️ 소셜 이미지 사용:', sessionUser.socialProfileImage);
      return sessionUser.socialProfileImage;
    }
    console.log('🖼️ 기본 아이콘 사용');
    return null;
  };

  // 프로필 이미지 타입 텍스트
  const getProfileImageTypeText = () => {
    if (sessionUser?.profileImageUrl && !imageLoadError) {
      return '프로필';
    }
    if (sessionUser?.socialProfileImage && !imageLoadError) {
      return sessionUser.socialProvider || '소셜';
    }
    return '기본';
  };

  // 사용자 이름 (복호화된 세션 데이터 사용)
  const getUserDisplayName = () => {
    // 세션에서 복호화된 이름 우선 사용
    if (sessionUser?.name && !sessionUser.name.includes('==')) {
      return sessionUser.name;
    }
    if (sessionUser?.nickname && !sessionUser.nickname.includes('==')) {
      return sessionUser.nickname;
    }
    if (sessionUser?.userId) {
      return sessionUser.userId;
    }
    return '사용자';
  };

  // 이미지 로드 실패 처리
  const handleImageError = () => {
    console.log('🖼️ 프로필 이미지 로드 실패, 기본 아이콘으로 대체');
    setImageLoadError(true);
  };

  const handleImageLoad = () => {
    console.log('🖼️ 프로필 이미지 로드 성공');
  };

  // 하드코딩된 역할 매핑 함수 제거 - 동적 로딩 사용

  if (!sessionUser) {
    return null;
  }

  const profileImageUrl = getProfileImageUrl();
  console.log('🔍 SessionUserProfile 렌더링:', {
    sessionUser: sessionUser?.id,
    profileImageUrl,
    imageLoadError,
    hasImage: !!profileImageUrl
  });

  return (
    <div className="tablet-user-profile">
      <div 
        className="user-info" 
        onClick={onProfileClick}
        className="user-info-clickable"
      >
        <div className="user-avatar">
          {profileImageUrl ? (
            <img 
              src={profileImageUrl} 
              alt="프로필 이미지" 
              className="profile-image"
              onError={handleImageError}
              onLoad={handleImageLoad}
              className="profile-image-loaded"
            />
          ) : (
            <i className="bi bi-person-circle profile-icon"></i>
          )}
          {/* 이미지 타입 배지 */}
          <div className="image-type-badge">
            {getProfileImageTypeText()}
          </div>
        </div>
        <div className="user-details">
          <div className="user-name">{getUserDisplayName()}</div>
          {showRole && <div className="user-role">{roleDisplayName || sessionUser.role}</div>}
          {showRole && <div className="user-role-en">{roleDisplayNameEn || sessionUser.role}</div>}
        </div>
      </div>
    </div>
  );
};

export default SessionUserProfile;
