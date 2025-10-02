/**
 * 드롭다운 위치 계산 및 고정 유틸리티
 * 전체 애플리케이션의 모든 드롭다운이 스크롤과 독립적으로 동작하도록 도움
 * CustomSelect는 자체 위치 관리를 사용하므로 제외됨
 */

/**
 * 드롭다운 메뉴의 최적 위치를 계산하고 설정
 * @param {HTMLElement} triggerElement - 드롭다운 트리거 요소
 * @param {HTMLElement} dropdownElement - 드롭다운 메뉴 요소
 * @param {Object} options - 옵션 설정
 */
export const calculateDropdownPosition = (triggerElement, dropdownElement, options = {}) => {
  if (!triggerElement || !dropdownElement) return;

  const {
    maxHeight = 300,
    offset = 4,
    viewportPadding = 16,
    headerHeight = 64
  } = options;

  // 트리거 요소의 위치 정보
  const triggerRect = triggerElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // 드롭다운 메뉴를 fixed 위치로 설정
  dropdownElement.style.position = 'fixed';
  dropdownElement.style.left = `${triggerRect.left}px`;
  dropdownElement.style.width = `${triggerRect.width}px`;
  dropdownElement.style.zIndex = 'var(--z-dropdown)';

  // 사용 가능한 공간 계산
  const spaceBelow = viewportHeight - triggerRect.bottom - viewportPadding;
  const spaceAbove = triggerRect.top - headerHeight - viewportPadding;

  // 드롭다운이 화면을 벗어나지 않도록 위치 조정
  if (spaceBelow >= maxHeight || spaceBelow > spaceAbove) {
    // 아래쪽에 표시
    dropdownElement.style.top = `${triggerRect.bottom + offset}px`;
    dropdownElement.style.bottom = 'auto';
    dropdownElement.style.maxHeight = `${Math.min(maxHeight, spaceBelow)}px`;
  } else if (spaceAbove >= maxHeight) {
    // 위쪽에 표시
    dropdownElement.style.top = 'auto';
    dropdownElement.style.bottom = `${viewportHeight - triggerRect.top + offset}px`;
    dropdownElement.style.maxHeight = `${Math.min(maxHeight, spaceAbove)}px`;
  } else {
    // 화면 중앙에 맞춰서 표시
    const centerSpace = Math.max(spaceAbove, spaceBelow);
    dropdownElement.style.top = `${Math.max(headerHeight + viewportPadding, triggerRect.top - centerSpace)}px`;
    dropdownElement.style.bottom = 'auto';
    dropdownElement.style.maxHeight = `${Math.min(maxHeight, centerSpace)}px`;
  }

  // 화면 좌우 경계 확인 및 조정
  if (triggerRect.left + triggerRect.width > viewportWidth - viewportPadding) {
    dropdownElement.style.left = `${viewportWidth - triggerRect.width - viewportPadding}px`;
  }
  if (triggerRect.left < viewportPadding) {
    dropdownElement.style.left = `${viewportPadding}px`;
    dropdownElement.style.width = `${Math.min(triggerRect.width, viewportWidth - viewportPadding * 2)}px`;
  }
};

/**
 * 개별 드롭다운 요소 초기화
 * @param {HTMLElement} dropdown - 드롭다운 컨테이너 요소
 */
export const initSingleDropdown = (dropdown) => {
  if (!dropdown || !dropdown.nodeType) return;
  
  // CustomSelect는 제외 (자체 위치 관리 사용)
  if (dropdown.classList.contains('custom-select')) {
    console.log('🚫 CustomSelect는 자체 위치 관리를 사용하므로 제외');
    return;
  }
  
  const trigger = dropdown.querySelector('.custom-select__trigger, [data-dropdown-trigger]');
  const menu = dropdown.querySelector('.custom-select__dropdown, [data-dropdown-menu]');
  
  if (!trigger || !menu) return;

  // 드롭다운 열림/닫힘 상태 변경 감지
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const isOpen = dropdown.classList.contains('open') || 
                      dropdown.classList.contains('active') ||
                      menu.style.display !== 'none';
        
        if (isOpen) {
          calculateDropdownPosition(trigger, menu);
        }
      }
    });
  });

  observer.observe(dropdown, { attributes: true, attributeFilter: ['class'] });
  
  // 수동으로 드롭다운 열기 이벤트 처리
  const handleDropdownOpen = () => {
    setTimeout(() => {
      calculateDropdownPosition(trigger, menu);
    }, 10);
  };

  trigger.addEventListener('click', handleDropdownOpen);
  
  // 창 크기 변경 시 위치 재계산
  const handleResize = () => {
    if (dropdown.classList.contains('open')) {
      calculateDropdownPosition(trigger, menu);
    }
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleResize);

  // 정리 함수 반환
  return () => {
    observer.disconnect();
    trigger.removeEventListener('click', handleDropdownOpen);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('scroll', handleResize);
  };
};

/**
 * 모든 드롭다운에 공통 이벤트 리스너 추가
 * @param {string} selector - 드롭다운 컨테이너 선택자
 */
export const initDropdownPositioning = (selector = '.dropdown, .custom-dropdown') => {
  // CustomSelect는 제외 (자체 위치 관리)
  const dropdowns = document.querySelectorAll(selector);
  
  dropdowns.forEach(dropdown => {
    initSingleDropdown(dropdown);
  });
};

/**
 * 페이지 로드 시 모든 드롭다운 초기화
 */
export const initAllDropdowns = () => {
  // DOM이 완전히 로드된 후 실행 (CustomSelect 제외)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => initDropdownPositioning('.dropdown, .custom-dropdown'), 100);
    });
  } else {
    setTimeout(() => initDropdownPositioning('.dropdown, .custom-dropdown'), 100);
  }

  // 동적으로 추가된 드롭다운도 감지 (CustomSelect 제외)
  const dynamicObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // CustomSelect가 아닌 일반 드롭다운만 처리
          if (node.classList && (node.classList.contains('dropdown') || node.classList.contains('custom-dropdown'))) {
            setTimeout(() => {
              if (typeof initSingleDropdown === 'function') {
                initSingleDropdown(node);
              }
            }, 10);
          }
          // 하위 요소에서 일반 드롭다운 찾기 (CustomSelect 제외)
          const childDropdowns = node.querySelectorAll && node.querySelectorAll('.dropdown, .custom-dropdown');
          if (childDropdowns) {
            childDropdowns.forEach(child => {
              setTimeout(() => {
                if (typeof initSingleDropdown === 'function') {
                  initSingleDropdown(child);
                }
              }, 10);
            });
          }
        }
      });
    });
  });

  dynamicObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
};

/**
 * 헤더 내 드롭다운 특별 처리
 */
export const initHeaderDropdowns = () => {
  const headerDropdowns = document.querySelectorAll('.mg-header .dropdown, .mg-header .custom-dropdown, .simple-header .dropdown, .simple-header .custom-dropdown');
  
  headerDropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('.custom-select__trigger');
    const menu = dropdown.querySelector('.custom-select__dropdown');
    
    if (!trigger || !menu) return;

    // 헤더 높이 고려한 위치 계산
    const handleHeaderDropdownOpen = () => {
      setTimeout(() => {
        calculateDropdownPosition(trigger, menu, { headerHeight: 64 });
      }, 10);
    };

    trigger.addEventListener('click', handleHeaderDropdownOpen);
  });
};

// 자동 초기화
if (typeof window !== 'undefined') {
  initAllDropdowns();
  initHeaderDropdowns();
}
