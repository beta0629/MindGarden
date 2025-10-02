/**
 * 전역 드롭다운 고정 시스템
 * 모든 드롭다운이 스크롤과 독립적으로 동작하도록 보장
 */

// 전역 드롭다운 옵저버
let dropdownObserver = null;
let scrollHandler = null;

/**
 * 드롭다운 요소를 강제로 고정 위치로 설정
 * @param {HTMLElement} element - 드롭다운 요소
 */
const forceFixedPosition = (element) => {
  if (!element) return;
  
  // 모든 가능한 드롭다운 셀렉터
  const selectors = [
    'select option',
    '.custom-select__dropdown',
    '.dropdown-menu',
    '[role="listbox"]',
    '[role="menu"]',
    '.select-dropdown',
    '.ant-select-dropdown',
    '.react-select__menu',
    'option',
    '.dropdown',
    '.select-wrapper',
    '.dropdown-toggle'
  ];
  
  // 요소가 드롭다운인지 확인
  const isDropdown = selectors.some(selector => {
    try {
      return element.matches && element.matches(selector);
    } catch (e) {
      return false;
    }
  });
  
  if (isDropdown) {
    // 강제로 fixed 위치 설정
    element.style.position = 'fixed !important';
    element.style.zIndex = 'var(--z-dropdown) !important';
    element.style.transform = 'translateZ(0)';
    element.style.willChange = 'transform';
    
    // 스크롤 이벤트 리스너 추가
    if (!element._scrollHandler) {
      element._scrollHandler = () => {
        const rect = element.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          element.style.top = 'auto';
          element.style.bottom = 'auto';
        }
      };
      window.addEventListener('scroll', element._scrollHandler, { passive: true });
    }
  }
};

/**
 * 모든 드롭다운 요소를 찾아서 고정 위치 설정
 */
const fixAllDropdowns = () => {
  const allElements = document.querySelectorAll('*');
  
  allElements.forEach(element => {
    // 드롭다운 관련 클래스나 속성을 가진 요소들
    if (element.classList.contains('dropdown') ||
        element.classList.contains('select') ||
        element.classList.contains('custom-select') ||
        element.getAttribute('role') === 'listbox' ||
        element.getAttribute('role') === 'menu' ||
        element.tagName === 'SELECT' ||
        element.tagName === 'OPTION') {
      forceFixedPosition(element);
    }
  });
};

/**
 * 스크롤 이벤트 핸들러
 */
const handleScroll = () => {
  // 스크롤 시 모든 드롭다운 위치 재계산
  const dropdowns = document.querySelectorAll(
    'select option, .custom-select__dropdown, .dropdown-menu, [role="listbox"], [role="menu"], .select-dropdown, .ant-select-dropdown, .react-select__menu'
  );
  
  dropdowns.forEach(dropdown => {
    if (dropdown.offsetParent !== null) { // 보이는 드롭다운만
      forceFixedPosition(dropdown);
    }
  });
};

/**
 * DOM 변경 감지 및 드롭다운 고정
 */
const initDropdownObserver = () => {
  if (dropdownObserver) {
    dropdownObserver.disconnect();
  }
  
  dropdownObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 새로 추가된 요소가 드롭다운인지 확인
          forceFixedPosition(node);
          
          // 자식 요소들도 확인
          const childDropdowns = node.querySelectorAll(
            'select option, .custom-select__dropdown, .dropdown-menu, [role="listbox"], [role="menu"], .select-dropdown, .ant-select-dropdown, .react-select__menu'
          );
          childDropdowns.forEach(forceFixedPosition);
        }
      });
    });
  });
  
  dropdownObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style']
  });
};

/**
 * 전역 드롭다운 고정 시스템 초기화
 */
export const initGlobalDropdownFix = () => {
  console.log('🔧 전역 드롭다운 고정 시스템 초기화');
  
  // 기존 핸들러 제거
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
    window.removeEventListener('resize', scrollHandler);
  }
  
  // 스크롤 핸들러 설정
  scrollHandler = handleScroll;
  window.addEventListener('scroll', scrollHandler, { passive: true });
  window.addEventListener('resize', scrollHandler, { passive: true });
  
  // DOM 변경 감지 시작
  initDropdownObserver();
  
  // 초기 드롭다운 고정
  setTimeout(() => {
    fixAllDropdowns();
  }, 100);
  
  // 주기적으로 드롭다운 상태 확인
  setInterval(() => {
    fixAllDropdowns();
  }, 1000);
};

/**
 * 전역 드롭다운 고정 시스템 정리
 */
export const cleanupGlobalDropdownFix = () => {
  if (dropdownObserver) {
    dropdownObserver.disconnect();
    dropdownObserver = null;
  }
  
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler);
    window.removeEventListener('resize', scrollHandler);
    scrollHandler = null;
  }
};

// 자동 초기화 (DOM이 준비되면)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGlobalDropdownFix);
} else {
  initGlobalDropdownFix();
}
