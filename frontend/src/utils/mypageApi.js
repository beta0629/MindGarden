import { API_BASE_URL, MYPAGE_API, PROFILE_API, AUTH_API } from '../constants/api';
import { isConsultantUserProfileRole } from '../constants/mypageProfileRoles';
import StandardizedApi from './standardizedApi';
import i18n from '../i18n';

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

/**
 * OAuth2 authorize JSON: ApiResponse { success, data: { authUrl, redirectUrl } } 또는 평면 객체.
 * (최상위 data.authUrl 미사용 시 window.location에 객체가 들어가 빈 화면이 되는 것을 방지)
 */
function extractOAuthAuthorizeUrl(json) {
  if (!json || typeof json !== 'object') {
    return null;
  }
  const inner =
    Object.prototype.hasOwnProperty.call(json, 'data') &&
    json.data !== null &&
    typeof json.data === 'object'
      ? json.data
      : json;
  const u = inner.authUrl || inner.redirectUrl;
  return typeof u === 'string' && u.trim().length > 0 ? u.trim() : null;
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
        const json = await response.json();
        const url = extractOAuthAuthorizeUrl(json);
        if (url) {
          return url;
        }
        throw new Error(i18n.t('error:utils.mypageApi.t_12e87596'));
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
        const json = await response.json();
        const url = extractOAuthAuthorizeUrl(json);
        if (url) {
          return url;
        }
        throw new Error(i18n.t('error:utils.mypageApi.t_3eff5165'));
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
  },

  /**
   * 자발 회원 탈퇴 신청 — POST /api/v1/mypage/withdrawal/request
   * USER_LIFECYCLE_TERMINATION_POLICY v1.1 Q3(30일 유예) + Q12-b(본문 삭제 옵션).
   *
   * @param {string} password 비밀번호 재확인
   * @param {string} reason 사유 (선택)
   * @param {boolean} deleteCommunityBody Q12-b — true 면 본인 게시글/댓글 본문도 함께 삭제
   * @returns {Promise<any>} 신청 결과 (lifecycleState, withdrawalExpiresAt, graceDays 등)
   */
  requestWithdrawal: async(password, reason, deleteCommunityBody) => {
    return StandardizedApi.post(MYPAGE_API.WITHDRAWAL_REQUEST, {
      password,
      reason: reason || null,
      deleteCommunityBody: Boolean(deleteCommunityBody)
    });
  },

  /**
   * 자발 회원 탈퇴 취소 — POST /api/v1/mypage/withdrawal/cancel
   * 30일 유예 기간 내에만 호출 가능 (서버에서 409 가드).
   *
   * @returns {Promise<any>} 취소 결과 (lifecycleState=ACTIVE 등)
   */
  cancelWithdrawal: async() => {
    return StandardizedApi.post(MYPAGE_API.WITHDRAWAL_CANCEL, {});
  },

  /**
   * 자발 회원 탈퇴 현황 조회 — GET /api/v1/mypage/withdrawal/status
   * 위젯·배너 노출 판단의 SSOT.
   *
   * @returns {Promise<any>} { lifecycleState, withdrawalRequestedAt, withdrawalExpiresAt, cancellable }
   */
  getWithdrawalStatus: async() => {
    return StandardizedApi.get(MYPAGE_API.WITHDRAWAL_STATUS);
  }
};

export default mypageApi;
