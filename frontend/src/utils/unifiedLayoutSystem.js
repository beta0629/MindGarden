/**
 * 통합 레이아웃 시스템
/**
 * 헤더, 드롭다운, z-index 등 모든 레이아웃 요소를 구조적으로 관리
 */

// 전역 레이아웃 관리자
class UnifiedLayoutManager {
  constructor() {
    this.isInitialized = false;
    this.headerHeight = 64; // 기본 헤더 높이
    this.dropdownInstances = new Map();
    this.scrollHandlers = new Set();
  }

/**
   * 통합 레이아웃 시스템 초기화
   */
  init() {
    if (this.isInitialized) return;
    
    console.log('🏗️ 통합 레이아웃 시스템 초기화 시작');
    
    // 1. 헤더 시스템 초기화
    this.initHeaderSystem();
    
    // 2. 드롭다운 시스템 초기화
    this.initDropdownSystem();
    
    // 3. 스크롤 이벤트 시스템 초기화
    this.initScrollSystem();
    
    // 4. 리사이즈 이벤트 시스템 초기화
    this.initResizeSystem();
    
    // 5. DOM 변경 감지 시스템 초기화
    this.initMutationObserver();
    
    this.isInitialized = true;
    console.log('✅ 통합 레이아웃 시스템 초기화 완료');
  }

/**
   * 헤더 시스템 초기화
   */
  initHeaderSystem() {
    // 헤더 요소 찾기
    const headers = document.querySelectorAll('.mg-header, .simple-header');
    
    headers.forEach(header => {
      // 헤더 높이 업데이트
      this.updateHeaderHeight(header);
      
      // 헤더 z-index 강제 적용
      header.style.zIndex = 'var(--z-header-sticky)';
      header.style.position = 'sticky';
      header.style.top = '0';
      header.style.isolation = 'isolate';
      
      console.log('🎯 헤더 시스템 적용:', header.className);
    });
  }

/**
   * 드롭다운 시스템 초기화
   */
  initDropdownSystem() {
    // 모든 드롭다운 요소 찾기
    const dropdownSelectors = [
      'select',
      '.custom-select',
      '.dropdown',
      '[role="listbox"]',
      '[role="menu"]',
      '.dropdown-menu',
      '.select-dropdown'
    ];

    dropdownSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        this.registerDropdown(element);
      });
    });
  }

/**
   * 드롭다운 등록 및 고정
   */
  registerDropdown(element) {
    if (!element || this.dropdownInstances.has(element)) return;

    // 드롭다운 고정 설정
    element.style.position = 'relative';
    element.style.zIndex = 'var(--z-dropdown)';
    element.style.isolation = 'isolate';

    // 이벤트 리스너 추가
    element.addEventListener('focus', () => this.handleDropdownFocus(element));
    element.addEventListener('blur', () => this.handleDropdownBlur(element));
    element.addEventListener('change', () => this.handleDropdownChange(element));

    this.dropdownInstances.set(element, {
      isOpen: false,
      position: null
    });

    console.log('📋 드롭다운 등록:', element.tagName, element.className);
  }

/**
   * 드롭다운 포커스 핸들러
   */
  handleDropdownFocus(element) {
    const instance = this.dropdownInstances.get(element);
    if (instance) {
      instance.isOpen = true;
      this.fixDropdownPosition(element);
    }
  }

/**
   * 드롭다운 블러 핸들러
   */
  handleDropdownBlur(element) {
    const instance = this.dropdownInstances.get(element);
    if (instance) {
      instance.isOpen = false;
    }
  }

/**
   * 드롭다운 변경 핸들러
   */
  handleDropdownChange(element) {
    this.fixDropdownPosition(element);
  }

/**
   * 드롭다운 위치 고정
   */
  fixDropdownPosition(element) {
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const options = element.querySelectorAll('option');
    
    if (options.length > 0) {
      // select 요소의 경우 option들을 fixed 위치로 설정
      options.forEach(option => {
        option.style.position = 'fixed';
        option.style.zIndex = 'var(--z-dropdown-fixed)';
        option.style.isolation = 'isolate';
      });
    }

    // 드롭다운 메뉴가 있다면 위치 조정
    const dropdown = element.querySelector('.dropdown-menu, .custom-select__dropdown');
    if (dropdown) {
      dropdown.style.position = 'fixed';
      dropdown.style.zIndex = 'var(--z-dropdown-fixed)';
      dropdown.style.top = `${rect.bottom + 4}px`;
      dropdown.style.left = `${rect.left}px`;
      dropdown.style.width = `${rect.width}px`;
      dropdown.style.isolation = 'isolate';
    }
  }

/**
   * 스크롤 시스템 초기화
   */
  initScrollSystem() {
    const scrollHandler = () => {
      // 헤더 높이 업데이트
      this.updateAllHeaderHeights();
      
      // 모든 드롭다운 위치 재조정
      this.dropdownInstances.forEach((instance, element) => {
        if (instance.isOpen) {
          this.fixDropdownPosition(element);
        }
      });
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
    this.scrollHandlers.add(scrollHandler);
  }

/**
   * 리사이즈 시스템 초기화
   */
  initResizeSystem() {
    const resizeHandler = () => {
      // 헤더 높이 업데이트
      this.updateAllHeaderHeights();
      
      // 모든 드롭다운 위치 재조정
      this.dropdownInstances.forEach((instance, element) => {
        this.fixDropdownPosition(element);
      });
    };

    window.addEventListener('resize', resizeHandler, { passive: true });
    this.scrollHandlers.add(resizeHandler);
  }

/**
   * DOM 변경 감지 시스템 초기화
   */
  initMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 새로 추가된 헤더 처리
            if (node.classList.contains('mg-header') || node.classList.contains('simple-header')) {
              this.initHeaderSystem();
            }
            
            // 새로 추가된 드롭다운 처리
            const dropdownSelectors = [
              'select',
              '.custom-select',
              '.dropdown',
              '[role="listbox"]',
              '[role="menu"]'
            ];
            
            dropdownSelectors.forEach(selector => {
              if (node.matches && node.matches(selector)) {
                this.registerDropdown(node);
              }
              
              const childDropdowns = node.querySelectorAll(selector);
              childDropdowns.forEach(this.registerDropdown.bind(this));
            });
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

/**
   * 헤더 높이 업데이트
   */
  updateHeaderHeight(header) {
    if (header) {
      const rect = header.getBoundingClientRect();
      this.headerHeight = rect.height;
    }
  }

/**
   * 모든 헤더 높이 업데이트
   */
  updateAllHeaderHeights() {
    const headers = document.querySelectorAll('.mg-header, .simple-header');
    headers.forEach(header => this.updateHeaderHeight(header));
  }

/**
   * 시스템 정리
   */
  cleanup() {
    this.scrollHandlers.forEach(handler => {
      window.removeEventListener('scroll', handler);
      window.removeEventListener('resize', handler);
    });
    this.scrollHandlers.clear();
    this.dropdownInstances.clear();
    this.isInitialized = false;
  }
}

// 전역 인스턴스 생성
const unifiedLayoutManager = new UnifiedLayoutManager();

// 자동 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    unifiedLayoutManager.init();
  });
} else {
  unifiedLayoutManager.init();
}

export default unifiedLayoutManager;
