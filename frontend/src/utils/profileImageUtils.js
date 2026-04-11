/**
 * 프로필 이미지 우선순위 관리 유틸리티
/**
 * 
/**
 * 우선순위:
/**
 * 1. 사용자 지정 프로필 이미지 (직접 업로드/변경)
/**
 * 2. 연동된 소셜 계정 프로필 이미지 (카카오/네이버)
/**
 * 3. 기본 프로필 아이콘
 */

/**
 * 사용자와 소셜 계정 정보를 바탕으로 최적의 프로필 이미지를 반환
/**
 * 
/**
 * @param {Object} user - 사용자 정보
/**
 * @param {Array} socialAccounts - 연동된 소셜 계정 목록
/**
 * @returns {Object} 프로필 이미지 정보 { src, type, fallback, allImages }
 */
export const getProfileImage = (user, socialAccounts = []) => {
  console.log('🔍 getProfileImage 호출:', { user, socialAccounts });
  
  // 모든 이미지 정보 수집
  const allImages = {
    custom: user?.profileImage || null,
    social: socialAccounts && socialAccounts.length > 0 ? socialAccounts[0]?.providerProfileImage : null,
    socialProvider: socialAccounts && socialAccounts.length > 0 ? socialAccounts[0]?.provider : null
  };
  
  console.log('🔍 수집된 이미지 정보:', allImages);
  
  // 1순위: 사용자 지정 프로필 이미지
  if (allImages.custom) {
    console.log('✅ 1순위: 사용자 지정 프로필 이미지 사용');
    return {
      src: allImages.custom,
      type: 'custom',
      fallback: false,
      allImages: allImages
    };
  }

  // 2순위: 연동된 소셜 계정 프로필 이미지 (상위 계정 우선)
  if (allImages.social) {
    console.log('✅ 2순위: 소셜 계정 프로필 이미지 사용:', allImages.socialProvider);
    return {
      src: allImages.social,
      type: 'social',
      provider: allImages.socialProvider,
      fallback: false,
      allImages: allImages
    };
  }

  // 3순위: 기본 프로필 아이콘
  console.log('✅ 3순위: 기본 프로필 아이콘 사용');
  return {
    src: null,
    type: 'default',
    fallback: true,
    allImages: allImages
  };
};

/**
 * 프로필 이미지 URL에 캐시 버스팅 파라미터 추가
/**
 * 
/**
 * @param {string} imageUrl - 이미지 URL
/**
 * @param {number} timestamp - 타임스탬프 (기본값: 현재 시간)
/**
 * @returns {string} 캐시 버스팅이 적용된 이미지 URL
 */
export const addCacheBusting = (imageUrl, timestamp = Date.now()) => {
  if (!imageUrl) return imageUrl;
  
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}t=${timestamp}`;
};

/**
 * 프로필 이미지 로딩 실패 시 처리
/**
 * 
/**
 * @param {Event} event - 이미지 로딩 에러 이벤트
/**
 * @param {Function} onFallback - 폴백 처리 함수
 */
export const handleImageError = (event, onFallback) => {
  if (onFallback) {
    onFallback();
  } else {
    // 기본 폴백: 이미지 숨기고 아이콘 표시
    event.target.style.display = 'none';
    const { nextSibling } = event.target;
    if (nextSibling) {
      nextSibling.style.display = 'block';
    }
  }
};

/**
 * 프로필 이미지 타입에 따른 CSS 클래스 반환
/**
 * 
/**
 * @param {string} type - 이미지 타입 ('custom', 'social', 'default')
/**
 * @returns {string} CSS 클래스명
 */
export const getProfileImageClass = (type) => {
  switch (type) {
    case 'custom':
      return 'profile-image profile-image-custom';
    case 'social':
      return 'profile-image profile-image-social';
    case 'default':
      return 'profile-image profile-image-default';
    default:
      return 'profile-image';
  }
};
