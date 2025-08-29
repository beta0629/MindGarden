/**
 * 공통 유틸리티 함수들
 * React에서 자주 사용하는 헬퍼 함수들
 */

// 날짜 포맷팅
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// 상대적 시간 표시 (예: 2시간 전, 1일 전)
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const target = new Date(date);
  const diffMs = now - target;
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffWeeks < 4) return `${diffWeeks}주 전`;
  if (diffMonths < 12) return `${diffMonths}개월 전`;
  return `${diffYears}년 전`;
};

// 전화번호 포맷팅 (010-1234-5678)
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
  
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  
  return phone;
};

// 이메일 유효성 검사
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 비밀번호 유효성 검사 (8자 이상, 영문+숫자+특수문자 조합)
export const isValidPassword = (password) => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
  return passwordRegex.test(password);
};

// 문자열 길이 제한 및 말줄임표 추가
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 숫자에 천 단위 콤마 추가
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '0';
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// 파일 크기 포맷팅 (KB, MB, GB)
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 파일 확장자 검사
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.split('.').pop().toLowerCase();
};

// 이미지 파일인지 확인
export const isImageFile = (filename) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const extension = getFileExtension(filename);
  return imageExtensions.includes(extension);
};

// 로컬 스토리지 유틸리티
export const storage = {
  // 데이터 저장
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('로컬 스토리지 저장 실패:', error);
    }
  },
  
  // JWT 토큰 등 raw string 데이터 저장
  setRaw: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('로컬 스토리지 raw 저장 실패:', error);
    }
  },
  
  // 데이터 가져오기
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      // JWT 토큰인 경우 JSON 파싱하지 않음
      if (key.includes('TOKEN') || key.includes('token')) {
        return item;
      }
      
      return JSON.parse(item);
    } catch (error) {
      console.error('로컬 스토리지 읽기 실패:', error);
      return defaultValue;
    }
  },
  
  // 데이터 삭제
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('로컬 스토리지 삭제 실패:', error);
    }
  },
  
  // 모든 데이터 삭제
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('로컬 스토리지 초기화 실패:', error);
    }
  }
};

// 세션 스토리지 유틸리티
export const sessionStorage = {
  // 데이터 저장
  set: (key, value) => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('세션 스토리지 저장 실패:', error);
    }
  },
  
  // 데이터 가져오기
  get: (key, defaultValue = null) => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('세션 스토리지 읽기 실패:', error);
      return defaultValue;
    }
  },
  
  // 데이터 삭제
  remove: (key) => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.error('세션 스토리지 삭제 실패:', error);
    }
  },
  
  // 모든 데이터 삭제
  clear: () => {
    try {
      window.sessionStorage.clear();
    } catch (error) {
      console.error('세션 스토리지 초기화 실패:', error);
    }
  }
};

// 디바운스 함수 (연속 호출 방지)
export const debounce = (func, delay) => {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// 쓰로틀 함수 (호출 빈도 제한)
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 랜덤 ID 생성
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

// 객체 깊은 복사
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  return obj;
};

// URL 파라미터 파싱
export const parseQueryParams = (url) => {
  const params = {};
  const queryString = url.split('?')[1];
  
  if (queryString) {
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    });
  }
  
  return params;
};

// 쿠키 유틸리티
export const cookies = {
  // 쿠키 설정
  set: (name, value, days = 7) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  },
  
  // 쿠키 가져오기
  get: (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    
    return null;
  },
  
  // 쿠키 삭제
  remove: (name) => {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
};

export default {
  formatDate,
  getRelativeTime,
  formatPhoneNumber,
  isValidEmail,
  isValidPassword,
  truncateText,
  formatNumber,
  formatFileSize,
  getFileExtension,
  isImageFile,
  storage,
  sessionStorage,
  debounce,
  throttle,
  generateId,
  deepClone,
  parseQueryParams,
  cookies
};
