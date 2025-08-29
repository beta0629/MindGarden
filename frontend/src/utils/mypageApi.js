import { API_BASE_URL, MYPAGE_API } from '../constants/api';

/**
 * 마이페이지 관련 API 호출 유틸리티
 */

const mypageApi = {
  // 마이페이지 정보 조회
  getMyPageInfo: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${MYPAGE_API.GET_INFO}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('마이페이지 정보 조회 실패:', error);
      throw error;
    }
  },

  // 마이페이지 정보 업데이트
  updateMyPageInfo: async (updateData) => {
    try {
      const response = await fetch(`${API_BASE_URL}${MYPAGE_API.UPDATE_INFO}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('마이페이지 정보 업데이트 실패:', error);
      throw error;
    }
  },

  // 비밀번호 변경
  changePassword: async (passwordData) => {
    try {
      const response = await fetch(`${API_BASE_URL}${MYPAGE_API.CHANGE_PASSWORD}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      return await response.text();
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      throw error;
    }
  },

  // 비밀번호 재설정 요청
  requestPasswordReset: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}${MYPAGE_API.RESET_PASSWORD}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      return await response.text();
    } catch (error) {
      console.error('비밀번호 재설정 요청 실패:', error);
      throw error;
    }
  },

  // 프로필 이미지 업로드
  uploadProfileImage: async (base64Image) => {
    try {
      const response = await fetch(`${API_BASE_URL}${MYPAGE_API.UPLOAD_IMAGE}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(base64Image),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error('프로필 이미지 업로드 실패:', error);
      throw error;
    }
  },

  // 소셜 계정 목록 조회
  getSocialAccounts: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}${MYPAGE_API.GET_SOCIAL_ACCOUNTS}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('소셜 계정 목록 조회 실패:', error);
      throw error;
    }
  },

  // OAuth2 인증 URL 생성 (계정 연동 모드)
  getOAuth2Url: async (provider) => {
    try {
      // 계정 연동 모드로 요청 - 올바른 엔드포인트 사용
      const response = await fetch(`${API_BASE_URL}/api/auth/oauth2/${provider.toLowerCase()}/authorize`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 응답이 JSON인지 문자열인지 확인
      const contentType = response.headers.get('content-type');
      console.log('🔍 OAuth2 응답 Content-Type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('📝 JSON 응답 데이터:', data);
        return data.redirectUrl || data;
      } else {
        // JSON이 아닌 경우 직접 URL 반환
        const url = await response.text();
        console.log('🔗 직접 반환된 URL:', url);
        return url;
      }
    } catch (error) {
      console.error('OAuth2 URL 생성 실패:', error);
      throw error;
    }
  },
  
  // OAuth2 인증 URL 생성 (소셜 로그인 모드)
  getOAuth2LoginUrl: async (provider) => {
    try {
      // 소셜 로그인 모드로 요청 - 올바른 엔드포인트 사용
      const response = await fetch(`${API_BASE_URL}/api/auth/oauth2/${provider.toLowerCase()}/authorize`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // 응답이 JSON인지 문자열인지 확인
      const contentType = response.headers.get('content-type');
      console.log('🔍 OAuth2 로그인 응답 Content-Type:', contentType);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('📝 JSON 응답 데이터:', data);
        return data.redirectUrl || data;
      } else {
        // JSON이 아닌 경우 직접 URL 반환
        const url = await response.text();
        console.log('🔗 직접 반환된 URL:', url);
        return url;
      }
    } catch (error) {
      console.error('OAuth2 로그인 URL 생성 실패:', error);
      throw error;
    }
  },

  // 소셜 계정 연동 해제
  unlinkSocialAccount: async (provider, accountId) => {
    try {
      const response = await fetch(`${API_BASE_URL}${MYPAGE_API.MANAGE_SOCIAL_ACCOUNT}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'UNLINK',
          provider: provider,
          accountId: accountId
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      return await response.text();
    } catch (error) {
      console.error('소셜 계정 연동 해제 실패:', error);
      throw error;
    }
  },
};

export default mypageApi;
