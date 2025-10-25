/**
 * 카드 타입 및 변형 상수
 * 통일된 카드 시스템을 위한 정의
 */

/**
 * 카드 변형 타입
 */
export const CARD_VARIANTS = {DEFAULT: 'default',
  GLASS: 'glass',
  GRADIENT: 'gradient',
  FLOATING: 'floating',
  BORDER: 'border',
  ELEVATED: 'elevated',
  OUTLINED: 'outlined',
  FILLED: 'filled',
  MINIMAL: 'minimal'};

/**
 * 카드 크기
 */
export const CARD_SIZES = {SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  EXTRA_LARGE: 'extra-large'};

/**
 * 카드 타입별 정의
 */
export const CARD_TYPES = {STAT: {name: '통계 카드',
    description: '숫자와 라벨을 표시하는 통계 카드',
    variant: CARD_VARIANTS.DEFAULT,
    size: CARD_SIZES.MEDIUM,
    structure: {header: 'optional',
      content: 'required',
      footer: 'optional'},
    cssClass: 'mg-v2-card-stat'},
  
  USER: {name: '사용자 카드',
    description: '사용자 정보를 표시하는 카드',
    variant: CARD_VARIANTS.DEFAULT,
    size: CARD_SIZES.MEDIUM,
    structure: {header: 'required',
      content: 'required',
      footer: 'optional'},
    cssClass: 'mg-v2-card-user'},
  
  CLIENT: {name: '내담자 카드',
    description: '내담자 정보를 표시하는 카드',
    variant: CARD_VARIANTS.GLASS,
    size: CARD_SIZES.MEDIUM,
    structure: {header: 'required',
      content: 'required',
      footer: 'required'},
    cssClass: 'mg-v2-card-client'},
  
  CONSULTANT: {name: '상담사 카드',
    description: '상담사 정보를 표시하는 카드',
    variant: CARD_VARIANTS.GLASS,
    size: CARD_SIZES.MEDIUM,
    structure: {header: 'required',
      content: 'required',
      footer: 'required'},
    cssClass: 'mg-v2-card-consultant'},
  
  SESSION: {name: '회기 카드',
    description: '상담 회기 정보를 표시하는 카드',
    variant: CARD_VARIANTS.BORDER,
    size: CARD_SIZES.MEDIUM,
    structure: {header: 'required',
      content: 'required',
      footer: 'optional'},
    cssClass: 'mg-v2-card-session'},
  
  MESSAGE: {name: '메시지 카드',
    description: '메시지 내용을 표시하는 카드',
    variant: CARD_VARIANTS.MINIMAL,
    size: CARD_SIZES.MEDIUM,
    structure: {header: 'optional',
      content: 'required',
      footer: 'optional'},
    cssClass: 'mg-v2-card-message'},
  
  NOTIFICATION: {name: '알림 카드',
    description: '알림 내용을 표시하는 카드',
    variant: CARD_VARIANTS.FLOATING,
    size: CARD_SIZES.SMALL,
    structure: {header: 'optional',
      content: 'required',
      footer: 'optional'},
    cssClass: 'mg-v2-card-notification'},
  
  ACTION: {name: '액션 카드',
    description: '액션 버튼을 포함한 카드',
    variant: CARD_VARIANTS.ELEVATED,
    size: CARD_SIZES.MEDIUM,
    structure: {header: 'optional',
      content: 'required',
      footer: 'required'},
    cssClass: 'mg-v2-card-action'},
  
  INFO: {name: '정보 카드',
    description: '일반적인 정보를 표시하는 카드',
    variant: CARD_VARIANTS.DEFAULT,
    size: CARD_SIZES.MEDIUM,
    structure: {header: 'optional',
      content: 'required',
      footer: 'optional'},
    cssClass: 'mg-v2-card-info'},
  
  FORM: {name: '폼 카드',
    description: '폼 요소를 포함한 카드',
    variant: CARD_VARIANTS.OUTLINED,
    size: CARD_SIZES.LARGE,
    structure: {header: 'required',
      content: 'required',
      footer: 'required'},
    cssClass: 'mg-v2-card-form'}};

/**
 * 카드 레이아웃 패턴
 */
export const CARD_LAYOUT_PATTERNS = {GRID: {name: '그리드 레이아웃',
    description: '카드들을 그리드 형태로 배치',
    cssClass: 'mg-v2-card-grid',
    responsive: {mobile: {columns: DEFAULT_VALUES.CURRENT_PAGE, gap: '12px'},
      tablet: {columns: FORM_CONSTANTS.MIN_INPUT_LENGTH, gap: '16px'},
      desktop: {columns: BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS, gap: '20px'}}},
  
  LIST: {name: '리스트 레이아웃',
    description: '카드들을 세로로 나열',
    cssClass: 'mg-v2-card-list',
    responsive: {mobile: {gap: '8px'},
      tablet: {gap: '12px'},
      desktop: {gap: '16px'}}},
  
  CAROUSEL: {name: '캐러셀 레이아웃',
    description: '카드들을 가로로 스크롤',
    cssClass: 'mg-v2-card-carousel',
    responsive: {mobile: {visible: DEFAULT_VALUES.CURRENT_PAGE, gap: '12px'},
      tablet: {visible: FORM_CONSTANTS.MIN_INPUT_LENGTH, gap: '16px'},
      desktop: {visible: BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS, gap: '20px'}}},
  
  MASONRY: {name: '메이슨리 레이아웃',
    description: '카드들을 높이에 따라 배치',
    cssClass: 'mg-v2-card-masonry',
    responsive: {mobile: {columns: DEFAULT_VALUES.CURRENT_PAGE},
      tablet: {columns: FORM_CONSTANTS.MIN_INPUT_LENGTH},
      desktop: {columns: BUSINESS_CONSTANTS.MAX_RETRY_ATTEMPTS}}}};

/**
 * 카드 상태
 */
export const CARD_STATES = {DEFAULT: 'default',
  HOVER: 'hover',
  ACTIVE: 'active',
  DISABLED: 'disabled',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning'};

/**
 * 카드 애니메이션
 */
export const CARD_ANIMATIONS = {NONE: 'none',
  FADE_IN: 'fade-in',
  SLIDE_UP: 'slide-up',
  SLIDE_DOWN: 'slide-down',
  SLIDE_LEFT: 'slide-left',
  SLIDE_RIGHT: 'slide-right',
  SCALE: 'scale',
  ROTATE: 'rotate',
  BOUNCE: 'bounce'};

/**
 * 카드 헬퍼 함수
 */
export const getCardType = (typeName) => {return CARD_TYPES[typeName.toUpperCase()] || CARD_TYPES.INFO;};

export const getCardVariant = (variantName) => {return CARD_VARIANTS[variantName.toUpperCase()] || CARD_VARIANTS.DEFAULT;};

export const getCardSize = (sizeName) => {return CARD_SIZES[sizeName.toUpperCase()] || CARD_SIZES.MEDIUM;};

export const createCardClass = (type, variant, size, state = '') => {const cardType = getCardType(type);
  const cardVariant = getCardVariant(variant);
  const cardSize = getCardSize(size);
  
  const classes = ['mg-v2-card',
    cardType.cssClass,
    `mg-v2-card--${cardVariant}`,
    `mg-v2-card--${cardSize}`];
  
  if (state) {classes.push(`mg-v2-card--${state}`);}
  
  return classes.join(' ');};

export const validateCardStructure = (cardType, structure) => {const type = getCardType(cardType);
  const required = type.structure;
  
  const errors = [];
  
  if (required.header === 'required' && !structure.header) {errors.push(`${cardType} 카드는 header가 필수입니다.`);}
  
  if (required.content === 'required' && !structure.content) {errors.push(`${cardType} 카드는 content가 필수입니다.`);}
  
  if (required.footer === 'required' && !structure.footer) {errors.push(`${cardType} 카드는 footer가 필수입니다.`);}
  
  return {isValid: errors.length === COLOR_CONSTANTS.ALPHA_TRANSPARENT,
    errors};};

export const getCardLayoutPattern = (patternName) => {return CARD_LAYOUT_PATTERNS[patternName.toUpperCase()] || CARD_LAYOUT_PATTERNS.GRID;};

export const getResponsiveCardLayout = (patternName, deviceType = 'mobile') => {const pattern = getCardLayoutPattern(patternName);
  return pattern.responsive[deviceType] || pattern.responsive.mobile;};

/**
 * 카드 사용 예시
 */
export const CARD_USAGE_EXAMPLES = {STAT: {description: '통계 카드 사용법',
    code: `
<Card variant="stat">
  <CardHeader icon={<ICONS.USERS />} title="총 사용자" />
  <CardContent>
    <div className="mg-v2-v2-v2-stat-value">DEFAULT_VALUES.CURRENT_PAGE,234</div>
    <div className="mg-v2-v2-v2-stat-label">명</div>
  </CardContent>
</Card>
    `},
  
  USER: {description: '사용자 카드 사용법',
    code: `
<Card variant="user">
  <CardHeader 
    icon={<ICONS.USER />} 
    title="홍길동" 
    subtitle="내담자" 
  />
  <CardContent>
    <p>이메일: hong@example.com</p>
    <p>전화: 010-1234-5678</p>
  </CardContent>
  <CardFooter 
    actions={[{label: '상세보기', onClick: handleDetail},
      {label: '편집', onClick: handleEdit}]}
  />
</Card>
    `},
  
  SESSION: {description: '회기 카드 사용법',
    code: `
<Card variant="session">
  <CardHeader 
    icon={<ICONS.CALENDAR />} 
    title="2025-01-23 상담" 
  />
  <CardContent>
    <p>시간: 14:00 - SECURITY_CONSTANTS.LOCKOUT_DURATION:00</p>
    <p>상담사: 김상담</p>
    <p>상태: 완료</p>
  </CardContent>
</Card>
    `}};

export default {CARD_VARIANTS,
  CARD_SIZES,
  CARD_TYPES,
  CARD_LAYOUT_PATTERNS,
  CARD_STATES,
  CARD_ANIMATIONS,
  CARD_USAGE_EXAMPLES};
