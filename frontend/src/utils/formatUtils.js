/**
 * 포맷 유틸리티 함수
 * ERP 및 재무 관련 컴포넌트에서 공통으로 사용하는 포맷팅 함수
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-22
 */

/**
 * 통화 포맷팅 (한국 원화)
 * @param {number|string} amount - 포맷팅할 금액
 * @param {Object} options - 포맷팅 옵션
 * @param {boolean} options.showCurrency - 통화 기호 표시 여부 (기본: true)
 * @param {string} options.currency - 통화 코드 (기본: 'KRW')
 * @returns {string} 포맷팅된 통화 문자열
 * 
 * @example
 * formatCurrency(1234567) // "₩1,234,567"
 * formatCurrency(1234567, { showCurrency: false }) // "1,234,567"
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    showCurrency = true,
    currency = 'KRW'
  } = options;

  if (amount === null || amount === undefined || amount === '') {
    return showCurrency ? '₩0' : '0';
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return showCurrency ? '₩0' : '0';
  }

  if (showCurrency) {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: currency
    }).format(numAmount);
  } else {
    return new Intl.NumberFormat('ko-KR').format(numAmount) + (currency === 'KRW' ? '원' : '');
  }
};

/**
 * 날짜 포맷팅
 * @param {string|Date} dateString - 포맷팅할 날짜
 * @param {Object} options - 포맷팅 옵션
 * @param {string} options.format - 포맷 타입 ('date'|'datetime'|'time'|'relative')
 * @param {string} options.locale - 로케일 (기본: 'ko-KR')
 * @returns {string} 포맷팅된 날짜 문자열
 * 
 * @example
 * formatDate('2025-11-22T10:30:00') // "2025. 11. 22."
 * formatDate('2025-11-22T10:30:00', { format: 'datetime' }) // "2025. 11. 22. 오후 10:30"
 * formatDate('2025-11-22T10:30:00', { format: 'relative' }) // "방금 전" 또는 "2시간 전"
 */
export const formatDate = (dateString, options = {}) => {
  const {
    format = 'date',
    locale = 'ko-KR'
  } = options;

  if (!dateString) {
    return '';
  }

  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  if (isNaN(date.getTime())) {
    return '';
  }

  switch (format) {
    case 'datetime':
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);

    case 'time':
      return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);

    case 'relative':
      return formatRelativeDate(date);

    case 'date':
    default:
      return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
  }
};

/**
 * 상대적 날짜 포맷팅 (방금 전, 2시간 전 등)
 * @param {Date} date - 날짜 객체
 * @returns {string} 상대적 날짜 문자열
 */
const formatRelativeDate = (date) => {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return '방금 전';
  } else if (minutes < 60) {
    return `${minutes}분 전`;
  } else if (hours < 24) {
    return `${hours}시간 전`;
  } else if (days < 7) {
    return `${days}일 전`;
  } else if (weeks < 4) {
    return `${weeks}주 전`;
  } else if (months < 12) {
    return `${months}개월 전`;
  } else {
    return `${years}년 전`;
  }
};

/**
 * 숫자 포맷팅 (천 단위 구분)
 * @param {number|string} number - 포맷팅할 숫자
 * @returns {string} 포맷팅된 숫자 문자열
 * 
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined || number === '') {
    return '0';
  }

  const num = typeof number === 'string' ? parseFloat(number) : number;
  
  if (isNaN(num)) {
    return '0';
  }

  return new Intl.NumberFormat('ko-KR').format(num);
};

/**
 * 퍼센트 포맷팅
 * @param {number|string} value - 포맷팅할 값
 * @param {number} decimals - 소수점 자릿수 (기본: 1)
 * @returns {string} 포맷팅된 퍼센트 문자열
 * 
 * @example
 * formatPercent(0.1234) // "12.3%"
 * formatPercent(0.1234, 2) // "12.34%"
 */
export const formatPercent = (value, decimals = 1) => {
  if (value === null || value === undefined || value === '') {
    return '0%';
  }

  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '0%';
  }

  return `${(num * 100).toFixed(decimals)}%`;
};

/**
 * 파일 크기 포맷팅
 * @param {number|string} bytes - 바이트 크기
 * @returns {string} 포맷팅된 파일 크기 문자열
 * 
 * @example
 * formatFileSize(1024) // "1 KB"
 * formatFileSize(1048576) // "1 MB"
 */
export const formatFileSize = (bytes) => {
  if (bytes === null || bytes === undefined || bytes === '') {
    return '0 Bytes';
  }

  const num = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
  
  if (isNaN(num) || num < 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));

  return `${parseFloat((num / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};



