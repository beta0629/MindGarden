/**
 * Trinity 홈페이지 CSS 변수 및 디자인 시스템 상수
 * MindGarden 구조를 따름
 */

export const CSS_VARIABLES = {
  // 색상 시스템
  COLORS: {
    PRIMARY: '#007aff',
    PRIMARY_LIGHT: '#66b3ff',
    PRIMARY_DARK: '#0056b3',
    
    SECONDARY: '#6c757d',
    SUCCESS: '#34c759',
    DANGER: '#ff3b30',
    WARNING: '#ff9500',
    
    // 에러/경고 색상
    ERROR: '#dc3545',
    ERROR_BG: '#fee2e2',
    ERROR_BORDER: '#fecaca',
    SUCCESS_TEXT: '#28a745',
    WARNING_TEXT: '#856404',
    INFO_TEXT: '#055160',
    
    // 텍스트 색상
    TEXT_PRIMARY: '#1d1d1f',
    TEXT_SECONDARY: '#86868b',
    TEXT_MUTED: '#666',
    TEXT_INVERSE: '#ffffff',
    
    // 배경 색상
    BG_PRIMARY: '#ffffff',
    BG_SECONDARY: '#f2f2f7',
    BG_DARK: '#1d1d1f',
  },
  
  // 간격 시스템
  SPACING: {
    XS: '0.25rem',
    SM: '0.5rem',
    MD: '1rem',
    LG: '1.5rem',
    XL: '2rem',
    XXL: '3rem',
  },
  
  // 폰트 크기
  FONT_SIZES: {
    XS: '0.75rem',
    SM: '0.875rem',
    MD: '1rem',
    LG: '1.125rem',
    XL: '1.25rem',
    XXL: '1.5rem',
    XXXL: '2rem',
    HUGE: '3rem',
  },
  
  // 폰트 두께
  FONT_WEIGHTS: {
    LIGHT: '300',
    NORMAL: '400',
    MEDIUM: '500',
    SEMIBOLD: '600',
    BOLD: '700',
  },
  
  // 보더 반경
  BORDER_RADIUS: {
    SM: '0.375rem',
    MD: '0.5rem',
    LG: '0.75rem',
    XL: '1rem',
  },
  
  // 그림자
  SHADOWS: {
    SM: '0 1px 2px rgba(0, 0, 0, 0.05)',
    MD: '0 4px 6px rgba(0, 0, 0, 0.1)',
    LG: '0 10px 15px rgba(0, 0, 0, 0.1)',
    XL: '0 20px 25px rgba(0, 0, 0, 0.1)',
  },
  
  // 전환 효과
  TRANSITIONS: {
    FAST: '0.2s ease',
    NORMAL: '0.3s ease',
    SLOW: '0.5s ease',
  },
  
  // Z-Index
  Z_INDEX: {
    HEADER: 50,
    MODAL: 1000,
    TOOLTIP: 1100,
  },
  
  // 브레이크포인트
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
  },
};

// 컴포넌트별 CSS 클래스 상수
export const COMPONENT_CSS = {
  HEADER: {
    CONTAINER: 'trinity-header',
    BRAND: 'trinity-header__brand',
    NAV: 'trinity-header__nav',
    LINK: 'trinity-header__link',
    BUTTON: 'trinity-header__button',
  },
  HERO: {
    SECTION: 'trinity-hero',
    TITLE: 'trinity-hero__title',
    SUBTITLE: 'trinity-hero__subtitle',
    BUTTONS: 'trinity-hero__buttons',
    BUTTON_PRIMARY: 'trinity-hero__button--primary',
    BUTTON_SECONDARY: 'trinity-hero__button--secondary',
  },
  SECTION: {
    CONTAINER: 'trinity-section',
    TITLE: 'trinity-section__title',
    CONTENT: 'trinity-section__content',
  },
  CARD: {
    CONTAINER: 'trinity-card',
    ICON: 'trinity-card__icon',
    TITLE: 'trinity-card__title',
    DESCRIPTION: 'trinity-card__description',
  },
  PRICING: {
    CONTAINER: 'trinity-pricing',
    CARD: 'trinity-pricing__card',
    CARD_POPULAR: 'trinity-pricing__card--popular',
    TITLE: 'trinity-pricing__title',
    PRICE: 'trinity-pricing__price',
    FEATURES: 'trinity-pricing__features',
    BUTTON: 'trinity-pricing__button',
    MESSAGE: 'trinity-pricing__message',
    MESSAGE_ERROR: 'trinity-pricing__message--error',
    MESSAGE_WARNING: 'trinity-pricing__message--warning',
    RETRY_BUTTON: 'trinity-pricing__retry-button',
  },
  FOOTER: {
    CONTAINER: 'trinity-footer',
    GRID: 'trinity-footer__grid',
    TITLE: 'trinity-footer__title',
    LINK: 'trinity-footer__link',
  },
  ONBOARDING: {
    CONTAINER: 'trinity-onboarding',
    FORM: 'trinity-onboarding__form',
    STEP: 'trinity-onboarding__step',
    TITLE: 'trinity-onboarding__title',
    PROGRESS: 'trinity-onboarding__progress',
    PROGRESS_ITEM: 'trinity-onboarding__progress-item',
    PROGRESS_ITEM_ACTIVE: 'trinity-onboarding__progress-item--active',
    FIELD: 'trinity-onboarding__field',
    LABEL: 'trinity-onboarding__label',
    INPUT: 'trinity-onboarding__input',
    INPUT_MONOSPACE: 'trinity-onboarding__input--monospace',
    BUTTON: 'trinity-onboarding__button',
    BUTTON_SECONDARY: 'trinity-onboarding__button--secondary',
    ERROR: 'trinity-onboarding__error',
    CATEGORY_SECTION: 'trinity-onboarding__category-section',
    TEXT_SECONDARY: 'trinity-onboarding__text-secondary',
    GRID: 'trinity-onboarding__grid',
    GRID_2COL: 'trinity-onboarding__grid-2col',
    MESSAGE: 'trinity-onboarding__message',
    MESSAGE_ERROR: 'trinity-onboarding__message--error',
    MESSAGE_WARNING: 'trinity-onboarding__message--warning',
    RETRY_BUTTON: 'trinity-onboarding__retry-button',
    SMALL_TEXT: 'trinity-onboarding__small-text',
    // 인라인 스타일 대체용 클래스
    FLEX_ROW: 'trinity-onboarding__flex-row',
    FLEX_COL: 'trinity-onboarding__flex-col',
    EMAIL_INPUT_WRAPPER: 'trinity-onboarding__email-input-wrapper',
    EMAIL_SEPARATOR: 'trinity-onboarding__email-separator',
    EMAIL_DOMAIN_SELECT: 'trinity-onboarding__email-domain-select',
    CUSTOM_DOMAIN_WRAPPER: 'trinity-onboarding__custom-domain-wrapper',
    CUSTOM_DOMAIN_HINT: 'trinity-onboarding__custom-domain-hint',
    ERROR_BOX: 'trinity-onboarding__error-box',
    ERROR_TEXT: 'trinity-onboarding__error-text',
    SUCCESS: 'trinity-onboarding__success',
    SUCCESS_TEXT: 'trinity-onboarding__success-text',
    SUCCESS_DETAIL: 'trinity-onboarding__success-detail',
    VERIFICATION_TIMER: 'trinity-onboarding__verification-timer',
    VERIFICATION_TIMER_WRAPPER: 'trinity-onboarding__verification-timer-wrapper',
    VERIFICATION_TIMER_WARNING: 'trinity-onboarding__verification-timer--warning',
    VERIFICATION_CODE_WRAPPER: 'trinity-onboarding__verification-code-wrapper',
    VERIFICATION_CODE_INPUT: 'trinity-onboarding__verification-code-input',
    VERIFICATION_SECTION: 'trinity-onboarding__verification-section',
    VERIFICATION_BUTTON_WRAPPER: 'trinity-onboarding__verification-button-wrapper',
    PAYMENT_OPTION_LABEL: 'trinity-onboarding__payment-option-label',
    PAYMENT_OPTION_ACTIVE: 'trinity-onboarding__payment-option-label--active',
    PAYMENT_INFO_BOX: 'trinity-onboarding__payment-info-box',
    PAYMENT_INFO_TEXT: 'trinity-onboarding__payment-info-text',
  },
};

