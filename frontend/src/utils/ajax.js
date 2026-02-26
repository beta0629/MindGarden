import { 
  getApiBaseUrl,
  AUTH_API, 
  USER_API, 
  CONSULTATION_API,
  ADMIN_API,
  API_STATUS,
  API_ERROR_MESSAGES
} from '../constants/api';
import csrfTokenManager from './csrfTokenManager';
import { getDefaultApiHeaders } from './apiHeaders';

/**
 * 공통 AJAX 유틸리티
/**
 * API 호출을 위한 표준화된 함수들
/**
 * 
/**
 * @author Core Solution
/**
 * @version 1.0.0
/**
 * @since 2024-12-19
 */

// 기본 헤더 설정 (공통 유틸리티 사용)
const getDefaultHeaders = () => {
  return getDefaultApiHeaders();
};

/** 401/403 등으로 로그인 리다이렉트가 이미 예약되었는지 여부. 동시 다발 401 시 한 번만 리다이렉트. */
let redirectScheduled = false;

/**
 * 로그인 페이지로 한 번만 리다이렉트. 이미 예약된 경우 스킵.
 * @returns {boolean} 리다이렉트를 수행했으면 true, 스킵했으면 false
 */
const redirectToLoginOnce = () => {
  if (redirectScheduled) {
    return false;
  }
  redirectScheduled = true;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = `${window.location.origin}/login`;
  return true;
};

// 에러 메시지 생성
const getErrorMessage = (status) => {
  switch (status) {
    case API_STATUS.UNAUTHORIZED:
      return API_ERROR_MESSAGES.UNAUTHORIZED;
    case API_STATUS.FORBIDDEN:
      return API_ERROR_MESSAGES.FORBIDDEN;
    case API_STATUS.NOT_FOUND:
      return API_ERROR_MESSAGES.NOT_FOUND;
    case API_STATUS.SERVER_ERROR:
      return API_ERROR_MESSAGES.SERVER_ERROR;
    default:
      return API_ERROR_MESSAGES.NETWORK_ERROR;
  }
};

// 세션 체크 및 리다이렉트 공통 함수
const checkSessionAndRedirect = async (response) => {
  const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalEnv) {
    return false;
  }

  // 현재 페이지가 로그인 페이지인지 확인
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login/');

  // 401, 403 오류 시에만 세션 체크 (500 오류는 서버 오류이므로 세션 체크하지 않음)
  if (response.status === 401 || response.status === 403) {
    // 이미 로그인 페이지에 있으면 리다이렉트하지 않음
    if (isLoginPage) {
      console.log('🔐 이미 로그인 페이지에 있음 - 리다이렉트 스킵');
      return false;
    }
    
    try {
      // 세션 체크 API 호출
      const sessionResponse = await fetch(`${getApiBaseUrl()}/api/v1/auth/current-user`, {
        credentials: 'include',
        method: 'GET'
      });
      
      // 세션이 없으면 로그인 페이지로 리다이렉트 (서브도메인 유지, 한 번만)
      if (!sessionResponse.ok) {
        console.log('🔐 세션 없음 - 로그인 페이지로 리다이렉트 (서브도메인 유지)');
        redirectToLoginOnce();
        return true;
      }
      
      // 세션이 있으면 리다이렉트하지 않음 (권한 문제일 수 있음)
      console.log('🔐 세션 있음 - 리다이렉트 스킵 (권한 문제일 수 있음)');
      return false;
    } catch (sessionError) {
      console.log('🔐 세션 체크 실패 - 로그인 페이지로 리다이렉트 (서브도메인 유지)');
      redirectToLoginOnce();
      return true;
    }
  }
  
  // 500 오류는 서버 오류이므로 세션 체크하지 않음
  if (response.status >= 500) {
    console.log('⚠️ 서버 오류 (500) - 세션 체크 스킵');
    return false;
  }
  
  return false; // 리다이렉트되지 않음
};

// 에러 처리
const handleError = (error, status) => {
  const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (status === API_STATUS.UNAUTHORIZED && !isLocalEnv) {
    redirectToLoginOnce();
  }
  throw new Error(getErrorMessage(status));
};

// GET 요청
export const apiGet = async (endpoint, params = {}, options = {}) => {
  try {
    // endpoint가 이미 전체 URL인지 확인 (http:// 또는 https://로 시작)
    const isFullUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://');
    
    // 쿼리 파라미터 생성
    const queryString = new URLSearchParams(params).toString();
    // 런타임에 API_BASE_URL 가져오기 (window.location 확인)
    const apiBaseUrl = getApiBaseUrl();
    const url = isFullUrl 
      ? (queryString ? `${endpoint}?${queryString}` : endpoint)
      : (queryString ? `${apiBaseUrl}${endpoint}?${queryString}` : `${apiBaseUrl}${endpoint}`);
    
    const headers = { ...getDefaultHeaders(), ...options.headers };
    console.log('📤 API GET 요청:', { url, headers: { ...headers, 'Authorization': headers['Authorization'] ? 'Bearer ***' : undefined, 'X-Tenant-Id': headers['X-Tenant-Id'] } });
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include', // 세션 쿠키 포함
      ...options
    });

    // 응답 본문이 비어있는 경우 처리
    let jsonData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          jsonData = JSON.parse(text);
        } catch (parseError) {
          console.error('JSON 파싱 오류:', parseError, 'Response text:', text);
          throw new Error('응답 데이터를 파싱할 수 없습니다.');
        }
      } else {
        // 빈 응답인 경우
        jsonData = {};
      }
    } else {
      // JSON이 아닌 경우
      jsonData = {};
    }
    
    if (!response.ok) {
      // 400 Bad Request는 tenantId 부족 등 클라이언트 오류이므로 로그인 페이지로 리다이렉트
      if (response.status === 400) {
        try {
          const errorData = jsonData || {};
          const errorCode = errorData.errorCode || errorData.error || '';
          const errorMessage = errorData.message || errorData.error || '';
          
          // TENANT_ID_REQUIRED 에러 코드 또는 관련 메시지 확인
          const isTenantIdError = errorCode === 'TENANT_ID_REQUIRED' ||
                                   errorMessage.includes('Tenant ID') ||
                                   errorMessage.includes('tenant') ||
                                   errorMessage.includes('세션') ||
                                   errorMessage.includes('로그인') ||
                                   errorMessage.includes('로그인이 필요');

          if (isTenantIdError) {
            const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            if (isLocalEnv) {
              return null;
            }
            const currentPath = window.location.pathname;
            const isPublicPage = currentPath === '/login' ||
                               currentPath.startsWith('/login/') ||
                               currentPath === '/landing' ||
                               currentPath === '/' ||
                               currentPath.startsWith('/register') ||
                               currentPath.startsWith('/forgot-password') ||
                               currentPath.startsWith('/reset-password') ||
                               currentPath.startsWith('/auth/oauth2/callback');

            if (!isPublicPage) {
              console.log('🔐 400 오류 (Tenant ID 부족) - 로그인 페이지로 리다이렉트 (서브도메인 유지)');
              redirectToLoginOnce();
              return null;
            }
          }
        } catch (e) {
          // JSON 파싱 실패 시 무시하고 계속 진행
          console.warn('400 에러 응답 파싱 실패:', e);
        }
      }
      
      // 세션 체크 및 리다이렉트
      const redirected = await checkSessionAndRedirect(response);
      if (redirected) {
      return null; // 리다이렉트됨
      }
      
      // 401 오류는 로그인되지 않은 상태로 정상적인 상황이므로 조용히 처리
      if (response.status === 401) {
        return null;
      }
      // 403 오류: 응답 body의 message가 있으면 그대로 전달, 없으면 기본 문구
      if (response.status === 403) {
        const serverMessage = (jsonData && typeof jsonData === 'object' && jsonData.message)
          ? String(jsonData.message)
          : '접근 권한이 없습니다.';
        const error = new Error(serverMessage);
        error.status = 403;
        error.response = { data: jsonData };
        throw error;
      }
      // 404 오류는 리소스가 없을 수 있으므로 조용히 null 반환 (에러 throw 안 함)
      if (response.status === 404) {
        return null;
      }
      // 500 오류도 서버 오류이므로 에러 처리
      if (response.status >= 500) {
        handleError(new Error('서버 오류'), response.status);
      }
      // 기타 4xx 오류는 클라이언트 오류이므로 에러 처리
      if (response.status >= 400) {
        handleError(new Error('요청 오류'), response.status);
      }
    }

    // ApiResponse 래퍼 처리: { success: true, data: T } 형태면 data 추출
    if (jsonData && typeof jsonData === 'object' && 'success' in jsonData && 'data' in jsonData) {
      return jsonData.data;
    }
    
    // ApiResponse 래퍼가 없으면 그대로 반환
    return jsonData;
  } catch (error) {
    // 400 Bad Request는 tenantId 부족 등 클라이언트 오류이므로 로그인 페이지로 리다이렉트
    if (error.status === 400) {
      const errorMessage = error.message || '';
      const errorResponse = error.response?.data || {};
      const errorCode = errorResponse.errorCode || errorResponse.error || '';
      
      // TENANT_ID_REQUIRED 에러 코드 또는 관련 메시지 확인
      const isTenantIdError = errorCode === 'TENANT_ID_REQUIRED' ||
                               errorMessage.includes('Tenant ID') ||
                               errorMessage.includes('tenant') ||
                               errorMessage.includes('세션') ||
                               errorMessage.includes('로그인') ||
                               errorMessage.includes('로그인이 필요');

      if (isTenantIdError) {
        const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalEnv) {
          throw error;
        }
        const currentPath = window.location.pathname;
        const isPublicPage = currentPath === '/login' ||
                           currentPath.startsWith('/login/') ||
                           currentPath === '/landing' ||
                           currentPath === '/' ||
                           currentPath.startsWith('/register') ||
                           currentPath.startsWith('/forgot-password') ||
                           currentPath.startsWith('/reset-password') ||
                           currentPath.startsWith('/auth/oauth2/callback');

        if (!isPublicPage) {
          console.log('🔐 400 오류 (Tenant ID 부족) - 로그인 페이지로 리다이렉트 (서브도메인 유지)');
          redirectToLoginOnce();
          return null;
        }
      }
    }

    // 403 오류는 권한 문제이므로 조용히 처리 (콘솔 오류 표시 안 함)
    if (error.status === 403 || error.message?.includes('접근 권한')) {
      // 조용히 에러를 다시 throw하여 호출자가 처리할 수 있도록 함
      throw error;
    }
    
    // 401 Unauthorized는 인증 문제이므로 로그인 페이지로 리다이렉트
    if (error.status === 401) {
      const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalEnv) {
        throw error;
      }
      const currentPath = window.location.pathname;
      const isPublicPage = currentPath === '/login' ||
                         currentPath.startsWith('/login/') ||
                         currentPath === '/landing' ||
                         currentPath === '/' ||
                         currentPath.startsWith('/register') ||
                         currentPath.startsWith('/forgot-password') ||
                         currentPath.startsWith('/reset-password') ||
                         currentPath.startsWith('/auth/oauth2/callback');

      if (!isPublicPage) {
        console.log('🔐 401 오류 - 로그인 페이지로 리다이렉트 (서브도메인 유지)');
        redirectToLoginOnce();
        return null;
      }
    }
    
    // 403이 아닌 오류만 콘솔에 표시
    console.error('GET 요청 오류:', error);
    
    // 네트워크 오류 시 재시도하지 않고 바로 로그인 페이지로 리다이렉트
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      const isLocalEnv = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalEnv) {
        throw error;
      }
      // 현재 페이지가 로그인 페이지인지 확인
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login/');
      const isPublicPage = currentPath === '/login' || 
                         currentPath.startsWith('/login/') || 
                         currentPath === '/landing' || 
                         currentPath === '/' ||
                         currentPath.startsWith('/register') ||
                         currentPath.startsWith('/forgot-password') ||
                         currentPath.startsWith('/reset-password') ||
                         currentPath.startsWith('/auth/oauth2/callback');
      
      // 이미 로그인 페이지에 있으면 리다이렉트하지 않음
      if (isLoginPage || isPublicPage) {
        console.log('🔐 네트워크 오류 - 이미 공개 페이지에 있음 - 리다이렉트 스킵');
        return null;
      }
      
      // 네트워크 오류 시 재시도 없이 바로 로그인 페이지로 리다이렉트 (서브도메인 유지)
      console.log('🔐 네트워크 오류 시 로그인 페이지로 리다이렉트 (재시도 없음, 서브도메인 유지)');
      redirectToLoginOnce();
      return null;
    }
    
    throw error;
  }
};

// POST 요청 (CSRF 토큰 자동 포함)
export const apiPost = async (endpoint, data = {}, options = {}) => {
  try {
    console.log('📤 POST 요청:', {
      url: endpoint,
      data: data
    });
    
    const response = await csrfTokenManager.post(endpoint, data, {
      ...options,
      headers: { ...getDefaultHeaders(), ...options.headers }
    });

    const jsonData = await response.json();
    
    if (!response.ok) {
      // 세션 체크 및 리다이렉트
      const redirected = await checkSessionAndRedirect(response);
      if (redirected) {
        return null; // 리다이렉트됨
      }
      
      // 표준화 2025-12-08: 에러 응답에서 메시지 추출
      let errorMessage = 'POST 요청 실패';
      if (jsonData && typeof jsonData === 'object') {
        if (jsonData.message) {
          errorMessage = jsonData.message;
        } else if (jsonData.error) {
          errorMessage = jsonData.error;
        } else if (jsonData.data && jsonData.data.message) {
          errorMessage = jsonData.data.message;
        }
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.response = { data: jsonData };
      throw error;
    }

    // ApiResponse 래퍼 처리: { success: true, data: T } 형태면 data 추출
    if (jsonData && typeof jsonData === 'object' && 'success' in jsonData && 'data' in jsonData) {
      return jsonData.data;
    }
    
    // ApiResponse 래퍼가 없으면 그대로 반환
    return jsonData;
  } catch (error) {
    console.error('POST 요청 오류:', error);
    throw error;
  }
};

// PUT 요청 (CSRF 토큰 자동 포함)
export const apiPut = async (endpoint, data = {}, options = {}) => {
  try {
    const response = await csrfTokenManager.put(endpoint, data, {
      ...options,
      headers: { ...getDefaultHeaders(), ...options.headers }
    });

    // 빈 응답(404, 204 등) 시 response.json()이 "Unexpected end of JSON input" 발생 방지
    let jsonData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          jsonData = JSON.parse(text);
        } catch (parseError) {
          console.error('JSON 파싱 오류:', parseError, 'Response text:', text);
          jsonData = {};
        }
      } else {
        jsonData = {};
      }
    } else {
      jsonData = {};
    }
    
    if (!response.ok) {
      // 세션 체크 및 리다이렉트
      const redirected = await checkSessionAndRedirect(response);
      if (redirected) {
        return null; // 리다이렉트됨
      }
      // 서버 응답 body의 message가 있으면 사용, 없으면 status 기반 메시지
      const serverMessage = (jsonData && typeof jsonData === 'object' && jsonData.message)
        ? String(jsonData.message)
        : getErrorMessage(response.status);
      throw new Error(serverMessage);
    }

    // ApiResponse 래퍼 처리: { success: true, data: T } 형태면 data 추출
    if (jsonData && typeof jsonData === 'object' && 'success' in jsonData && 'data' in jsonData) {
      return jsonData.data;
    }
    
    // ApiResponse 래퍼가 없으면 그대로 반환
    return jsonData;
  } catch (error) {
    console.error('PUT 요청 오류:', error);
    throw error;
  }
};

// POST 요청 (FormData)
export const apiPostFormData = async (endpoint, formData, options = {}) => {
  try {
    const headers = { ...options.headers };
    // FormData를 사용할 때는 Content-Type을 자동으로 설정하도록 제거
    delete headers['Content-Type'];
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { ...getDefaultHeaders(), ...headers },
      body: formData,
      credentials: 'include', // 세션 쿠키 포함
      ...options
    });

    if (!response.ok) {
      // 세션 체크 및 리다이렉트
      const redirected = await checkSessionAndRedirect(response);
      if (redirected) {
        return null; // 리다이렉트됨
      }
      
      handleError(new Error('POST FormData 요청 실패'), response.status);
    }

    return await response.json();
  } catch (error) {
    console.error('POST FormData 요청 오류:', error);
    throw error;
  }
};

// DELETE 요청 (CSRF 토큰 자동 포함)
export const apiDelete = async (endpoint, options = {}) => {
  try {
    const response = await csrfTokenManager.delete(endpoint, {
      ...options,
      headers: { ...getDefaultHeaders(), ...options.headers }
    });

    const jsonData = await response.json();
    
    if (!response.ok) {
      // 세션 체크 및 리다이렉트
      const redirected = await checkSessionAndRedirect(response);
      if (redirected) {
        return null; // 리다이렉트됨
      }
      
      handleError(new Error('DELETE 요청 실패'), response.status);
    }

    // ApiResponse 래퍼 처리: { success: true, data: T } 형태면 data 추출
    if (jsonData && typeof jsonData === 'object' && 'success' in jsonData && 'data' in jsonData) {
      return jsonData.data;
    }
    
    // ApiResponse 래퍼가 없으면 그대로 반환
    return jsonData;
  } catch (error) {
    console.error('DELETE 요청 오류:', error);
    throw error;
  }
};

// 파일 업로드 요청
export const apiUpload = async (endpoint, formData, options = {}) => {
  try {
    const headers = { ...getDefaultHeaders() };
    delete headers['Content-Type']; // multipart/form-data를 위해 제거

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { ...headers, ...options.headers },
      body: formData,
      credentials: 'include', // 세션 쿠키 포함
      ...options
    });

    if (!response.ok) {
      // 세션 체크 및 리다이렉트
      const redirected = await checkSessionAndRedirect(response);
      if (redirected) {
        return null; // 리다이렉트됨
      }
      
      handleError(new Error('파일 업로드 실패'), response.status);
    }

    return await response.json();
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    throw error;
  }
};

// 인증 관련 API
export const authAPI = {
  login: async (data) => {
    // CSRF 토큰을 포함한 로그인 요청
    try {
      console.log('🔐 CSRF 토큰 포함 로그인 시도:', data);
      
      // csrfTokenManager를 사용하여 CSRF 토큰 자동 포함
      const response = await csrfTokenManager.post(AUTH_API.LOGIN, data);
      
      const responseData = await response.json();
      console.log('🔐 로그인 응답 원본:', responseData);
      
      if (!response.ok) {
        // requiresConfirmation이 있는 경우는 정상 응답으로 처리
        // ApiResponse 래퍼 처리: responseData.data.requiresConfirmation 또는 responseData.requiresConfirmation
        const requiresConfirmation = (responseData.data && responseData.data.requiresConfirmation) || responseData.requiresConfirmation;
        if (requiresConfirmation) {
          console.log('🔔 중복 로그인 확인 요청 응답:', responseData);
          return responseData;
        }
        
        // 서브도메인 관련 오류인 경우 명확한 에러 메시지 설정
        const errorMessage = responseData.message || responseData.data?.message || '';
        const errorCode = responseData.errorCode || responseData.data?.errorCode || '';
        if (errorMessage.includes('테넌트 정보가 없습니다') || 
            errorMessage.includes('서브도메인') || 
            errorCode === 'TENANT_REQUIRED' ||
            errorCode === 'TENANT_ID_REQUIRED') {
          const host = window.location.hostname;
          const friendlyMessage = `서브도메인이 필요합니다.\n\n예: mindgarden.dev.core-solution.co.kr\n\n현재 도메인: ${host}\n\n올바른 서브도메인으로 접속 후 다시 시도해주세요.`;
          console.error('⚠️ 로그인 실패 - 서브도메인 없음:', friendlyMessage);
          const subdomainError = new Error(friendlyMessage);
          subdomainError.isSubdomainError = true;
          throw subdomainError;
        }
        
        console.error('로그인 실패 응답:', responseData);
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
      }
      
      return responseData;
    } catch (error) {
      console.error('로그인 요청 오류:', error);
      throw error;
    }
  },
  register: (data) => apiPost(AUTH_API.REGISTER, data),
  logout: () => apiPost(AUTH_API.LOGOUT),
  getOAuth2Config: () => apiGet(AUTH_API.GET_OAUTH2_CONFIG),
  refreshToken: (data) => apiPost(AUTH_API.REFRESH_TOKEN, data),
  getCurrentUser: () => apiGet(AUTH_API.GET_CURRENT_USER),
  confirmDuplicateLogin: (data) => apiPost(AUTH_API.CONFIRM_DUPLICATE_LOGIN, data),
  
  // 대시보드 관련 API
  getClientConsultations: (userId) => apiGet(`${CONSULTATION_API.GET_CONSULTATIONS}/client/${userId}`),
  getConsultantConsultations: (userId) => apiGet(`${CONSULTATION_API.GET_CONSULTATIONS}/consultant/${userId}`),
  getSystemStats: () => apiGet(ADMIN_API.GET_SYSTEM_STATS),
  getRecentActivities: (userId) => apiGet(`${USER_API.GET_RECENT_ACTIVITIES}/${userId}`)
};

// 사용자 관련 API
export const userAPI = {
  updateProfile: (data) => apiPut(USER_API.UPDATE_PROFILE, data),
  uploadProfileImage: (formData) => apiUpload(USER_API.UPLOAD_PROFILE_IMAGE, formData),
  getUserInfo: () => apiGet(USER_API.GET_PROFILE),
  socialSignup: (data) => apiPost(AUTH_API.SOCIAL_SIGNUP, data),
  // 프로필 관련 API
  updateProfile: (formData) => apiPostFormData(USER_API.UPDATE_PROFILE, formData),
  deleteAccount: () => apiPost(USER_API.DELETE_ACCOUNT),
  
  // 기존 API들...
  getClientConsultations: (userId) => apiGet(`${USER_API.GET_CLIENT_CONSULTATIONS}/${userId}`),
};

// 상담 관련 API
export const consultationAPI = {
  getConsultations: () => apiGet(CONSULTATION_API.GET_CONSULTATIONS),
  getConsultation: (id) => apiGet(`${CONSULTATION_API.GET_CONSULTATION}/${id}`),
  bookConsultation: (data) => apiPost(CONSULTATION_API.BOOK_CONSULTATION, data),
  cancelConsultation: (id) => apiPost(`${CONSULTATION_API.CANCEL_CONSULTATION}/${id}`)
};

// 테스트 로그인 함수 (개발 환경에서만 사용)
export const testLogin = async () => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/test-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('테스트 로그인 성공:', data);
    return data;
  } catch (error) {
    console.error('테스트 로그인 실패:', error);
    throw error;
  }
};

export default {
  get: apiGet,
  post: apiPost,
  put: apiPut,
  delete: apiDelete,
  upload: apiUpload,
  auth: authAPI,
  user: userAPI,
  consultation: consultationAPI
};
