import { 
  API_BASE_URL, 
  AUTH_API, 
  USER_API, 
  CONSULTATION_API,
  ADMIN_API,
  API_STATUS,
  API_ERROR_MESSAGES
} from '../constants/api';

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
export const apiGet = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: { ...getDefaultHeaders(), ...options.headers },
      credentials: 'include', // 세션 쿠키 포함
      ...options
    });

    if (!response.ok) {
      handleError(new Error('GET 요청 실패'), response.status);
    }

    return await response.json();
  } catch (error) {
    console.error('GET 요청 오류:', error);
    throw error;
  }
};

// POST 요청
export const apiPost = async (endpoint, data = {}, options = {}) => {
  try {
    console.log('📤 POST 요청:', {
      url: `${API_BASE_URL}${endpoint}`,
      data: data,
      headers: { ...getDefaultHeaders(), ...options.headers }
    });
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { ...getDefaultHeaders(), ...options.headers },
      body: JSON.stringify(data),
      // credentials 제거 - 세션 쿠키 없이 요청
      ...options
    });

    if (!response.ok) {
      handleError(new Error('POST 요청 실패'), response.status);
    }

    return await response.json();
  } catch (error) {
    console.error('POST 요청 오류:', error);
    throw error;
  }
};

// PUT 요청
export const apiPut = async (endpoint, data = {}, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: { ...getDefaultHeaders(), ...options.headers },
      body: JSON.stringify(data),
      ...options
    });

    if (!response.ok) {
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
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { ...getDefaultHeaders(), ...headers },
      body: formData,
      ...options
    });

    if (!response.ok) {
      handleError(new Error('POST FormData 요청 실패'), response.status);
    }

    return await response.json();
  } catch (error) {
    console.error('POST FormData 요청 오류:', error);
    throw error;
  }
};

// DELETE 요청
export const apiDelete = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: { ...getDefaultHeaders(), ...options.headers },
      ...options
    });

    if (!response.ok) {
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

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { ...headers, ...options.headers },
      body: formData,
      ...options
    });

    if (!response.ok) {
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
    // curl과 동일한 방식으로 직접 요청
    try {
      console.log('🔐 직접 fetch 로그인 시도:', data);
      const response = await fetch(`${API_BASE_URL}${AUTH_API.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('로그인 실패 응답:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
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
