/**
 * 공통 스크립트 유틸리티
 * React에서 자주 사용하는 스크립트 기능들
 */

import { debounce, throttle } from './common';

// 디바이스 타입 감지
export const deviceType = {
  isMobile: () => window.innerWidth < 768,
  isTablet: () => window.innerWidth >= 768 && window.innerWidth < 1024,
  isDesktop: () => window.innerWidth >= 1024,
  isTouch: () => 'ontouchstart' in window || navigator.maxTouchPoints > 0
};

// 뷰포트 크기 변경 감지
export const viewport = {
  width: window.innerWidth,
  height: window.innerHeight,
  
  // 리사이즈 이벤트 리스너 등록
  onResize: (callback) => {
    const handleResize = debounce(() => {
      viewport.width = window.innerWidth;
      viewport.height = window.innerHeight;
      callback(viewport);
    }, 100);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  },
  
  // 특정 브레이크포인트에서 실행
  onBreakpoint: (breakpoint, callback) => {
    const handleResize = debounce(() => {
      const currentWidth = window.innerWidth;
      if (breakpoint === 'mobile' && currentWidth < 768) callback();
      if (breakpoint === 'tablet' && currentWidth >= 768 && currentWidth < 1024) callback();
      if (breakpoint === 'desktop' && currentWidth >= 1024) callback();
    }, 100);
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }
};

// 스크롤 관련 유틸리티
export const scroll = {
  // 부드러운 스크롤
  smoothTo: (target, offset = 0) => {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (element) {
      const targetPosition = element.offsetTop - offset;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  },
  
  // 스크롤 위치 가져오기
  getPosition: () => ({
    top: window.pageYOffset || document.documentElement.scrollTop,
    left: window.pageXOffset || document.documentElement.scrollLeft
  }),
  
  // 스크롤 이벤트 리스너
  onScroll: (callback) => {
    const handleScroll = throttle(callback, 16); // 60fps
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  },
  
  // 무한 스크롤 감지
  onInfiniteScroll: (callback, threshold = 100) => {
    const handleScroll = throttle(() => {
      const { top } = scroll.getPosition();
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (top + windowHeight >= documentHeight - threshold) {
        callback();
      }
    }, 100);
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }
};

// 키보드 이벤트 유틸리티
export const keyboard = {
  // 특정 키 조합 감지
  onKeyCombo: (keys, callback) => {
    const pressedKeys = new Set();
    
    const handleKeyDown = (e) => {
      pressedKeys.add(e.key.toLowerCase());
      
      if (keys.every(key => pressedKeys.has(key.toLowerCase()))) {
        e.preventDefault();
        callback(e);
      }
    };
    
    const handleKeyUp = (e) => {
      pressedKeys.delete(e.key.toLowerCase());
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  },
  
  // ESC 키 감지
  onEscape: (callback) => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        callback(e);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  },
  
  // Enter 키 감지
  onEnter: (callback) => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        callback(e);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }
};

// 클립보드 유틸리티
export const clipboard = {
  // 텍스트 복사
  copyText: async (text) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // 폴백: 구형 브라우저 지원
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      return false;
    }
  },
  
  // 텍스트 붙여넣기
  pasteText: async () => {
    try {
      if (navigator.clipboard) {
        return await navigator.clipboard.readText();
      } else {
        throw new Error('클립보드 읽기가 지원되지 않습니다.');
      }
    } catch (error) {
      console.error('클립보드 읽기 실패:', error);
      return null;
    }
  }
};

// 파일 관련 유틸리티
export const file = {
  // 파일 선택 다이얼로그
  selectFile: (options = {}) => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      
      if (options.accept) input.accept = options.accept;
      if (options.multiple) input.multiple = true;
      
      input.onchange = (e) => {
        const files = Array.from(e.target.files);
        resolve(options.multiple ? files : files[0]);
      };
      
      input.click();
    });
  },
  
  // 파일을 Base64로 변환
  toBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },
  
  // 파일 다운로드
  download: (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// 애니메이션 유틸리티
export const animation = {
  // 페이드 인
  fadeIn: (element, duration = 300) => {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    
    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  },
  
  // 페이드 아웃
  fadeOut: (element, duration = 300) => {
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    element.style.opacity = '0';
    
    setTimeout(() => {
      element.style.display = 'none';
    }, duration);
  },
  
  // 슬라이드 다운
  slideDown: (element, duration = 300) => {
    element.style.height = '0';
    element.style.overflow = 'hidden';
    element.style.transition = `height ${duration}ms ease-in-out`;
    
    const targetHeight = element.scrollHeight;
    element.style.height = targetHeight + 'px';
    
    setTimeout(() => {
      element.style.height = 'auto';
    }, duration);
  },
  
  // 슬라이드 업
  slideUp: (element, duration = 300) => {
    element.style.height = element.scrollHeight + 'px';
    element.style.overflow = 'hidden';
    element.style.transition = `height ${duration}ms ease-in-out`;
    
    requestAnimationFrame(() => {
      element.style.height = '0';
    });
    
    setTimeout(() => {
      element.style.display = 'none';
    }, duration);
  }
};

// 알림 시스템은 notification.js의 NotificationManager 사용
// scripts.js의 notification 객체는 제거됨 - 통일된 알림 시스템 사용

// 유효성 검사 유틸리티
export const validation = {
  // 폼 유효성 검사
  validateForm: (formData, rules) => {
    const errors = {};
    
    Object.keys(rules).forEach(field => {
      const value = formData[field];
      const fieldRules = rules[field];
      
      // 필수 필드 검사
      if (fieldRules.required && (!value || value.trim() === '')) {
        errors[field] = fieldRules.required;
        return;
      }
      
      // 패턴 검사
      if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
        errors[field] = fieldRules.message || '형식이 올바르지 않습니다.';
        return;
      }
      
      // 최소 길이 검사
      if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
        errors[field] = `${fieldRules.minLength}자 이상 입력해주세요.`;
        return;
      }
      
      // 최대 길이 검사
      if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
        errors[field] = `${fieldRules.maxLength}자 이하로 입력해주세요.`;
        return;
      }
      
      // 커스텀 검사
      if (fieldRules.custom && typeof fieldRules.custom === 'function') {
        const customError = fieldRules.custom(value, formData);
        if (customError) {
          errors[field] = customError;
        }
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};

export default {
  deviceType,
  viewport,
  scroll,
  keyboard,
  clipboard,
  file,
  animation,
  validation
};
