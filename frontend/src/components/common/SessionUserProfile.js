import React, { useState, useEffect } from 'react';
import { useSession } from '../../hooks/useSession';

const SessionUserProfile = ({ onProfileClick, showRole = true }) => {
  const { user: sessionUser } = useSession();
  const [imageLoadError, setImageLoadError] = useState(false);
  
  // 세션 사용자가 변경될 때 이미지 로드 에러 상태 초기화
  useEffect(() => {
    setImageLoadError(false);
  }, [sessionUser?.id, sessionUser?.profileImageUrl, sessionUser?.socialProfileImage]);
  
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
    if (sessionUser?.username) {
      return sessionUser.username;
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

  // 사용자 역할 표시명 변환
  const getUserRoleDisplay = (role, branchName = null) => {
    const roleDisplayMap = {
      'HQ_ADMIN': '관리자 (본사)',
      'SUPER_HQ_ADMIN': '수퍼관리자 (본사)',
      'BRANCH_SUPER_ADMIN': branchName ? `수퍼관리자 (${branchName})` : '수퍼관리자 (지점)',
      'ADMIN': branchName ? `관리자 (${branchName})` : '관리자 (지점)',
      'BRANCH_MANAGER': branchName ? `지점장 (${branchName})` : '지점장',
      'CONSULTANT': '상담사',
      'CLIENT': '내담자',
      // 기존 호환성
      'SUPER_ADMIN': '수퍼관리자 (본사)'
    };
    return roleDisplayMap[role] || role;
  };

  // 사용자 역할 영문 표시명 변환
  const getUserRoleDisplayEn = (role, branchName = null) => {
    const roleDisplayMap = {
      'HQ_ADMIN': 'HQ Admin',
      'SUPER_HQ_ADMIN': 'Super HQ Admin',
      'BRANCH_SUPER_ADMIN': branchName ? `Branch Super Admin (${branchName})` : 'Branch Super Admin',
      'ADMIN': branchName ? `Admin (${branchName})` : 'Admin',
      'BRANCH_MANAGER': branchName ? `Branch Manager (${branchName})` : 'Branch Manager',
      'CONSULTANT': 'Consultant',
      'CLIENT': 'Client',
      // 기존 호환성
      'SUPER_ADMIN': 'Super HQ Admin'
    };
    return roleDisplayMap[role] || role;
  };

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
        style={{ cursor: 'pointer' }}
      >
        <div className="user-avatar">
          {profileImageUrl ? (
            <img 
              src={profileImageUrl} 
              alt="프로필 이미지" 
              className="profile-image"
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                display: 'block'
              }}
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
          {showRole && <div className="user-role">{getUserRoleDisplay(sessionUser.role, sessionUser.branchName)}</div>}
          {showRole && <div className="user-role-en">{getUserRoleDisplayEn(sessionUser.role, sessionUser.branchName)}</div>}
        </div>
      </div>
    </div>
  );
};

export default SessionUserProfile;
