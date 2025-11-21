import { 
  API_BASE_URL, 
  AUTH_API, 
  USER_API, 
  CONSULTATION_API,
  ADMIN_API,
  API_STATUS,
  API_ERROR_MESSAGES
} from '../constants/api';
import csrfTokenManager from './csrfTokenManager';

/**
 * 공통 AJAX 유틸리티
 * API 호출을 위한 표준화된 함수들
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

// 기본 헤더 설정
const getDefaultHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
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
  // 현재 페이지가 로그인 페이지인지 확인
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login/');
  
  // 401, 403, 500 오류 시 세션 체크
  if (response.status === 401 || response.status === 403 || response.status >= 500) {
    // 이미 로그인 페이지에 있으면 리다이렉트하지 않음
    if (isLoginPage) {
      console.log('🔐 이미 로그인 페이지에 있음 - 리다이렉트 스킵');
      return false;
    }
    
    try {
      // 세션 체크 API 호출
      const sessionResponse = await fetch(`${API_BASE_URL}/api/auth/current-user`, {
        credentials: 'include',
        method: 'GET'
      });
      
      // 세션이 없으면 로그인 페이지로 리다이렉트
      if (!sessionResponse.ok) {
        console.log('🔐 세션 없음 - 로그인 페이지로 리다이렉트');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return true; // 리다이렉트됨
      }
    } catch (sessionError) {
      console.log('🔐 세션 체크 실패 - 로그인 페이지로 리다이렉트');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return true; // 리다이렉트됨
    }
  }
  return false; // 리다이렉트되지 않음
};

// 에러 처리
const handleError = (error, status) => {
  if (status === API_STATUS.UNAUTHORIZED) {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // 로그인 페이지로 리다이렉트 (홈이 아닌)
    window.location.href = '/login';
  }
  throw new Error(getErrorMessage(status));
};

// GET 요청
export const apiGet = async (endpoint, params = {}, options = {}) => {
  try {
    // 쿼리 파라미터 생성
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_BASE_URL}${endpoint}?${queryString}` : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { ...getDefaultHeaders(), ...options.headers },
      credentials: 'include', // 세션 쿠키 포함
      ...options
    });

    if (!response.ok) {
      // 세션 체크 및 리다이렉트
      const redirected = await checkSessionAndRedirect(response);
      if (redirected) {
      return null; // 리다이렉트됨
      }
      
      // 401 오류는 로그인되지 않은 상태로 정상적인 상황이므로 조용히 처리
      if (response.status === 401) {
        return null;
      }
      // 500 오류도 서버 오류이므로 에러 처리
      if (response.status >= 500) {
        handleError(new Error('서버 오류'), response.status);
      }
      // 4xx 오류는 클라이언트 오류이므로 에러 처리
      if (response.status >= 400) {
        handleError(new Error('요청 오류'), response.status);
      }
    }

    return await response.json();
  } catch (error) {
    console.error('GET 요청 오류:', error);
    
    // 네트워크 오류 시에도 세션 체크
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      // 현재 페이지가 로그인 페이지인지 확인
      const currentPath = window.location.pathname;
      const isLoginPage = currentPath === '/login' || currentPath.startsWith('/login/');
      
      // 이미 로그인 페이지에 있으면 리다이렉트하지 않음
      if (isLoginPage) {
        console.log('🔐 네트워크 오류 - 이미 로그인 페이지에 있음 - 리다이렉트 스킵');
        return null;
      }
      
      try {
        const sessionResponse = await fetch(`${API_BASE_URL}/api/auth/current-user`, {
          credentials: 'include',
          method: 'GET'
        });
        
        if (!sessionResponse.ok) {
          console.log('🔐 네트워크 오류 시 세션 없음 - 로그인 페이지로 리다이렉트');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return null;
        }
      } catch (sessionError) {
        console.log('🔐 네트워크 오류 시 세션 체크 실패 - 로그인 페이지로 리다이렉트');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return null;
      }
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

    if (!response.ok) {
      // 세션 체크 및 리다이렉트
      const redirected = await checkSessionAndRedirect(response);
      if (redirected) {
        return null; // 리다이렉트됨
      }
      
      handleError(new Error('POST 요청 실패'), response.status);
    }

    return await response.json();
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

    if (!response.ok) {
      // 세션 체크 및 리다이렉트
      const redirected = await checkSessionAndRedirect(response);
      if (redirected) {
        return null; // 리다이렉트됨
      }
      
      handleError(new Error('PUT 요청 실패'), response.status);
    }

    return await response.json();
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

    if (!response.ok) {
      // 세션 체크 및 리다이렉트
      const redirected = await checkSessionAndRedirect(response);
      if (redirected) {
        return null; // 리다이렉트됨
      }
      
      handleError(new Error('DELETE 요청 실패'), response.status);
    }

    return await response.json();
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
    const response = await fetch(`${API_BASE_URL}/api/auth/test-login`, {
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
