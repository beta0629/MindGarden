import { API_BASE_URL, MYPAGE_API, PROFILE_API, AUTH_API } from '../constants/api';
import { isConsultantUserProfileRole } from '../constants/mypageProfileRoles';
import StandardizedApi from './standardizedApi';

/**
 * 마이페이지 관련 API 호출 유틸리티
 */

function resolveProfileGetEndpoint(userRole, userId) {
  if (isConsultantUserProfileRole(userRole)) {
    return PROFILE_API.CONSULTANT.GET_INFO(userId);
  }
  return PROFILE_API.ADMIN.GET_INFO();
}

function resolveProfilePutEndpoint(userRole, userId) {
  if (isConsultantUserProfileRole(userRole)) {
    return PROFILE_API.CONSULTANT.UPDATE_INFO(userId);
  }
  return PROFILE_API.ADMIN.UPDATE_INFO();
}

const mypageApi = {
  // 마이페이지 정보 조회
  getMyPageInfo: async() => {
    try {
      const response = await fetch(`${API_BASE_URL}${MYPAGE_API.GET_INFO}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
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
  updateMyPageInfo: async(updateData) => {
    try {
      const response = await fetch(`${API_BASE_URL}${MYPAGE_API.UPDATE_INFO}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
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

  // 비밀번호 변경 (PasswordManagementController — 세션 사용자)
  changePassword: async(passwordData) => {
    return StandardizedApi.post(AUTH_API.PASSWORD_CHANGE, {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
      confirmPassword: passwordData.confirmPassword
    });
  },

  // 비밀번호 재설정 요청
  requestPasswordReset: async(email) => {
    return StandardizedApi.post(AUTH_API.PASSWORD_RESET_REQUEST, { email });
  },

  // 프로필 이미지 업로드
  uploadProfileImage: async(base64Image) => {
    try {
      const response = await fetch(`${API_BASE_URL}${MYPAGE_API.UPLOAD_IMAGE}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(base64Image)
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

  // OAuth2 인증 URL 생성 (계정 연동 모드)
  getOAuth2Url: async(provider) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/oauth2/${provider.toLowerCase()}/authorize?mode=link`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data.authUrl || data.redirectUrl || data;
      }
      const url = await response.text();
      return url;
    } catch (error) {
      console.error('OAuth2 URL 생성 실패:', error);
      throw error;
    }
  },

  // OAuth2 인증 URL 생성 (소셜 로그인 모드)
  getOAuth2LoginUrl: async(provider) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/oauth2/${provider.toLowerCase()}/authorize`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        return data.redirectUrl || data;
      }
      const url = await response.text();
      return url;
    } catch (error) {
      console.error('OAuth2 로그인 URL 생성 실패:', error);
      throw error;
    }
  },

  // 소셜 계정 연동 해제
  unlinkSocialAccount: async(provider, accountId) => {
    return StandardizedApi.post(PROFILE_API.CLIENT.MANAGE_SOCIAL_ACCOUNT, {
      action: 'UNLINK',
      provider: provider,
      accountId: accountId
    });
  },

  // 역할별 프로필 정보 조회
  getProfileInfo: async(userRole, userId) => {
    const endpoint = resolveProfileGetEndpoint(userRole, userId);
    return StandardizedApi.get(endpoint);
  },

  // 역할별 프로필 정보 업데이트
  updateProfileInfo: async(userRole, userId, updateData) => {
    const endpoint = resolveProfilePutEndpoint(userRole, userId);
    return StandardizedApi.put(endpoint, updateData);
  },

  /**
   * 현재 세션 사용자 소셜 계정 목록 (역할 공통 — ClientProfileController 하위)
   * @param {string} _userRole 호환용 (무시)
   * @param {string|number} _userId 호환용 (무시)
   */
  getSocialAccounts: async(_userRole, _userId) => {
    return StandardizedApi.get(PROFILE_API.CLIENT.GET_SOCIAL_ACCOUNTS);
  }
};

export default mypageApi;
