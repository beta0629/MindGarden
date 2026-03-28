/**
 * 유효성 검증 유틸리티 함수
/**
 * 폼 입력값 검증을 위한 공통 함수들
/**
 * 
/**
 * @author CoreSolution
/**
 * @version 1.0.0
/**
 * @since 2025-11-29
 */

/**
 * 이메일 주소 유효성 검증
/**
 * @param {string} email - 검증할 이메일 주소
/**
 * @returns {boolean} 유효한 이메일이면 true, 그렇지 않으면 false
/**
 * 
/**
 * @example
/**
 * validateEmail('user@example.com') // true
/**
 * validateEmail('invalid-email') // false
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // RFC 5322 기준 이메일 정규식 (간소화 버전)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email.trim());
};

/**
 * 전화번호 유효성 검증 (한국 형식)
/**
 * @param {string} phone - 검증할 전화번호
/**
 * @returns {boolean} 유효한 전화번호면 true, 그렇지 않으면 false
/**
 * 
/**
 * @example
/**
 * validatePhone('010-1234-5678') // true
/**
 * validatePhone('010 1234 5678') // true
/**
 * validatePhone('01012345678') // true
/**
 * validatePhone('02-123-4567') // true
/**
 * validatePhone('1234') // false
 */
export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // 공백, 하이픈 제거 후 숫자만 추출
  const cleanPhone = phone.replace(/[\s-()]/g, '');
  
  // 한국 전화번호 패턴 검증
  const phoneRegex = /^(01[016789]\d{7,8}|02\d{7,8}|0[3-9]\d{7,9})$/;
  
  return phoneRegex.test(cleanPhone);
};

/**
 * 이름 유효성 검증 (한글, 영문)
/**
 * @param {string} name - 검증할 이름
/**
 * @param {Object} options - 검증 옵션
/**
 * @param {number} options.minLength - 최소 길이 (기본: 2)
/**
 * @param {number} options.maxLength - 최대 길이 (기본: 50)
/**
 * @returns {boolean} 유효한 이름이면 true, 그렇지 않으면 false
 */
export const validateName = (name, options = {}) => {
  const { minLength = 2, maxLength = 50 } = options;
  
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const trimmedName = name.trim();
  
  // 길이 검증
  if (trimmedName.length < minLength || trimmedName.length > maxLength) {
    return false;
  }
  
  // 한글, 영문, 공백만 허용
  const nameRegex = /^[가-힣a-zA-Z\s]+$/;
  
  return nameRegex.test(trimmedName);
};

/**
 * 비밀번호 유효성 검증
/**
 * @param {string} password - 검증할 비밀번호
/**
 * @param {Object} options - 검증 옵션
/**
 * @param {number} options.minLength - 최소 길이 (기본: 8)
/**
 * @param {boolean} options.requireUppercase - 대문자 필수 (기본: true)
/**
 * @param {boolean} options.requireLowercase - 소문자 필수 (기본: true)
/**
 * @param {boolean} options.requireNumber - 숫자 필수 (기본: true)
/**
 * @param {boolean} options.requireSpecial - 특수문자 필수 (기본: true)
/**
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = true
  } = options;
  
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('비밀번호를 입력해주세요.');
    return { isValid: false, errors };
  }
  
  // 길이 검증
  if (password.length < minLength) {
    errors.push(`비밀번호는 최소 ${minLength}자 이상이어야 합니다.`);
  }
  
  // 대문자 검증
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('대문자를 최소 1개 포함해야 합니다.');
  }
  
  // 소문자 검증
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('소문자를 최소 1개 포함해야 합니다.');
  }
  
  // 숫자 검증
  if (requireNumber && !/[0-9]/.test(password)) {
    errors.push('숫자를 최소 1개 포함해야 합니다.');
  }
  
  // 특수문자 검증
  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('특수문자를 최소 1개 포함해야 합니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 주소 유효성 검증
/**
 * @param {string} address - 검증할 주소
/**
 * @param {Object} options - 검증 옵션
/**
 * @param {number} options.minLength - 최소 길이 (기본: 5)
/**
 * @param {number} options.maxLength - 최대 길이 (기본: 100)
/**
 * @returns {boolean} 유효한 주소면 true, 그렇지 않으면 false
 */
export const validateAddress = (address, options = {}) => {
  const { minLength = 5, maxLength = 100 } = options;
  
  if (!address || typeof address !== 'string') {
    return false;
  }
  
  const trimmedAddress = address.trim();
  
  // 길이 검증
  if (trimmedAddress.length < minLength || trimmedAddress.length > maxLength) {
    return false;
  }
  
  return true;
};

/**
 * 우편번호 유효성 검증 (한국 우편번호 5자리)
/**
 * @param {string} postalCode - 검증할 우편번호
/**
 * @returns {boolean} 유효한 우편번호면 true, 그렇지 않으면 false
 */
export const validatePostalCode = (postalCode) => {
  if (!postalCode || typeof postalCode !== 'string') {
    return false;
  }
  
  // 한국 우편번호: 5자리 숫자
  const postalCodeRegex = /^\d{5}$/;
  
  return postalCodeRegex.test(postalCode.replace(/\s/g, ''));
};

/**
 * 나이 유효성 검증
/**
 * @param {number|string} age - 검증할 나이
/**
 * @param {Object} options - 검증 옵션
/**
 * @param {number} options.minAge - 최소 나이 (기본: 1)
/**
 * @param {number} options.maxAge - 최대 나이 (기본: 150)
/**
 * @returns {boolean} 유효한 나이면 true, 그렇지 않으면 false
 */
export const validateAge = (age, options = {}) => {
  const { minAge = 1, maxAge = 150 } = options;
  
  const ageNumber = parseInt(age, 10);
  
  if (isNaN(ageNumber)) {
    return false;
  }
  
  return ageNumber >= minAge && ageNumber <= maxAge;
};

/**
 * 필수 필드 검증
/**
 * @param {*} value - 검증할 값
/**
 * @returns {boolean} 값이 존재하면 true, 그렇지 않으면 false
 */
export const validateRequired = (value) => {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  return true;
};

/**
 * 사용자 ID 유효성 검증 (영문, 숫자, 언더스코어)
/**
 * @param {string} userId - 검증할 사용자 ID
/**
 * @param {Object} options - 검증 옵션
/**
 * @param {number} options.minLength - 최소 길이 (기본: 3)
/**
 * @param {number} options.maxLength - 최대 길이 (기본: 20)
/**
 * @returns {boolean} 유효한 사용자 ID이면 true, 그렇지 않으면 false
 */
export const validateUsername = (userId, options = {}) => {
  const { minLength = 3, maxLength = 20 } = options;
  
  if (!userId || typeof userId !== 'string') {
    return false;
  }
  
  const trimmedUsername = userId.trim();
  
  // 길이 검증
  if (trimmedUsername.length < minLength || trimmedUsername.length > maxLength) {
    return false;
  }
  
  // 영문, 숫자, 언더스코어만 허용, 숫자로 시작할 수 없음
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  
  return usernameRegex.test(trimmedUsername);
};

/**
 * 다중 필드 검증
 * @param {Object} formData - 검증할 폼 데이터
 * @param {Object} rules - 검증 규칙
/**
 * @returns {Object} { isValid: boolean, errors: Object }
/**
 * 
/**
 * @example
/**
 * const formData = { email: 'test@example.com', name: '홍길동' };
/**
 * const rules = {
/**
 *   email: { required: true, type: 'email' },
/**
 *   name: { required: true, type: 'name', minLength: 2 }
/**
 * };
/**
 * validateForm(formData, rules);
 */
export const validateForm = (formData, rules) => {
  const errors = {};
  let isValid = true;
  
  for (const [fieldName, rule] of Object.entries(rules)) {
    const value = formData[fieldName];
    const fieldErrors = [];
    
    // 필수 필드 검증
    if (rule.required && !validateRequired(value)) {
      fieldErrors.push(`${rule.label || fieldName}은(는) 필수 입력 항목입니다.`);
      isValid = false;
      continue;
    }
    
    // 값이 없고 필수가 아닌 경우 스킵
    if (!validateRequired(value) && !rule.required) {
      continue;
    }
    
    // 타입별 검증
    switch (rule.type) {
      case 'email':
        if (!validateEmail(value)) {
          fieldErrors.push('올바른 이메일 형식을 입력해주세요.');
          isValid = false;
        }
        break;
        
      case 'phone':
        if (!validatePhone(value)) {
          fieldErrors.push('올바른 전화번호 형식을 입력해주세요.');
          isValid = false;
        }
        break;
        
      case 'name':
        if (!validateName(value, { minLength: rule.minLength, maxLength: rule.maxLength })) {
          fieldErrors.push('올바른 이름을 입력해주세요.');
          isValid = false;
        }
        break;
        
      case 'userId':
        if (!validateUsername(value, { minLength: rule.minLength, maxLength: rule.maxLength })) {
          fieldErrors.push('올바른 사용자 ID을 입력해주세요.');
          isValid = false;
        }
        break;
        
      case 'password':
        const passwordValidation = validatePassword(value, rule);
        if (!passwordValidation.isValid) {
          fieldErrors.push(...passwordValidation.errors);
          isValid = false;
        }
        break;
        
      case 'age':
        if (!validateAge(value, { minAge: rule.minAge, maxAge: rule.maxAge })) {
          fieldErrors.push('올바른 나이를 입력해주세요.');
          isValid = false;
        }
        break;
        
      case 'address':
        if (!validateAddress(value, { minLength: rule.minLength, maxLength: rule.maxLength })) {
          fieldErrors.push('올바른 주소를 입력해주세요.');
          isValid = false;
        }
        break;
        
      case 'postalCode':
        if (!validatePostalCode(value)) {
          fieldErrors.push('올바른 우편번호를 입력해주세요.');
          isValid = false;
        }
        break;
    }
    
    if (fieldErrors.length > 0) {
      errors[fieldName] = fieldErrors;
    }
  }
  
  return {
    isValid,
    errors
  };
};

/**
 * 차량번호(선택) 정규화: trim, 연속 공백 축소, 영문 대문자
 *
 * @param {string|null|undefined} raw 입력
 * @returns {string} 정규화 문자열(비어 있으면 '')
 */
export const normalizeVehiclePlateInput = (raw) => {
  if (raw == null || typeof raw !== 'string') {
    return '';
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return '';
  }
  const collapsed = trimmed.replace(/\s+/g, ' ');
  return collapsed.replace(/[a-z]/g, (ch) => ch.toUpperCase());
};

/**
 * 차량번호(선택) MVP 검증: 숫자·한글·영문·하이픈·공백, 최대 32자
 *
 * @param {string|null|undefined} raw 입력
 * @returns {boolean} 비어 있으면 true
 */
export const isValidVehiclePlateOptional = (raw) => {
  if (raw == null || String(raw).trim() === '') {
    return true;
  }
  const n = normalizeVehiclePlateInput(raw);
  if (n.length > 32) {
    return false;
  }
  return /^[0-9A-Z가-힣\- ]+$/u.test(n);
};

