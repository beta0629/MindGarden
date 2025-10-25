/**
 * 역할별 색상 테마 상수
 * 사용자 역할에 따른 동적 테마 시스템
 */

/**
 * 테마 타입 정의
 */
export const THEME_TYPES = {CLIENT: 'client',
  CONSULTANT: 'consultant',
  ADMIN: 'admin'};

/**
 * 역할별 색상 테마
 */
export const COLOR_THEMES = {CLIENT: {name: '내담자 테마',
    description: '화사한 분위기 (핑크 계열)',
    type: THEME_TYPES.CLIENT,
    colors: {primary: 'var(--client-primary)',
      primaryLight: 'var(--client-primary-light)',
      primaryDark: 'var(--client-primary-dark)',
      secondary: 'var(--client-secondary)',
      accent: 'var(--client-accent)',
      background: 'var(--client-background)',
      text: 'var(--client-text)',
      surface: 'var(--client-background)',
      border: 'var(--client-primary-light)',
      shadow: 'rgba(CONSTANTS.FORM_CONSTANTS.MAX_FILE_NAME_LENGTH, 182, 193, COLOR_CONSTANTS.ALPHA_TRANSPARENT.FORM_CONSTANTS.MIN_INPUT_LENGTH)'},
    cssVariables: {'--mg-v2-primary': 'var(--client-primary)',
      '--mg-v2-primary-light': 'var(--client-primary-light)',
      '--mg-v2-primary-dark': 'var(--client-primary-dark)',
      '--mg-v2-secondary': 'var(--client-secondary)',
      '--mg-v2-accent': 'var(--client-accent)',
      '--mg-v2-background': 'var(--client-background)',
      '--mg-v2-text': 'var(--client-text)'}},
  
  CONSULTANT: {name: '상담사 테마',
    description: '활력 충만 분위기 (민트 그린 계열)',
    type: THEME_TYPES.CONSULTANT,
    colors: {primary: 'var(--consultant-primary)',
      primaryLight: 'var(--consultant-primary-light)',
      primaryDark: 'var(--consultant-primary-dark)',
      secondary: 'var(--consultant-secondary)',
      accent: 'var(--consultant-accent)',
      background: 'var(--consultant-background)',
      text: 'var(--consultant-text)',
      surface: 'var(--consultant-background)',
      border: 'var(--consultant-primary-light)',
      shadow: 'rgba(152, 251, 152, COLOR_CONSTANTS.ALPHA_TRANSPARENT.FORM_CONSTANTS.MIN_INPUT_LENGTH)'},
    cssVariables: {'--mg-v2-primary': 'var(--consultant-primary)',
      '--mg-v2-primary-light': 'var(--consultant-primary-light)',
      '--mg-v2-primary-dark': 'var(--consultant-primary-dark)',
      '--mg-v2-secondary': 'var(--consultant-secondary)',
      '--mg-v2-accent': 'var(--consultant-accent)',
      '--mg-v2-background': 'var(--consultant-background)',
      '--mg-v2-text': 'var(--consultant-text)'}},
  
  ADMIN: {name: '관리자 테마',
    description: '간결하고 깔끔한 분위기 (블루 계열)',
    type: THEME_TYPES.ADMIN,
    colors: {primary: 'var(--admin-primary)',
      primaryLight: 'var(--admin-primary-light)',
      primaryDark: 'var(--admin-primary-dark)',
      secondary: 'var(--admin-secondary)',
      accent: 'var(--admin-accent)',
      background: 'var(--admin-background)',
      text: 'var(--admin-text)',
      surface: 'var(--admin-background)',
      border: 'var(--admin-primary-light)',
      shadow: 'rgba(135, 206, 235, COLOR_CONSTANTS.ALPHA_TRANSPARENT.FORM_CONSTANTS.MIN_INPUT_LENGTH)'},
    cssVariables: {'--mg-v2-primary': 'var(--admin-primary)',
      '--mg-v2-primary-light': 'var(--admin-primary-light)',
      '--mg-v2-primary-dark': 'var(--admin-primary-dark)',
      '--mg-v2-secondary': 'var(--admin-secondary)',
      '--mg-v2-accent': 'var(--admin-accent)',
      '--mg-v2-background': 'var(--admin-background)',
      '--mg-v2-text': 'var(--admin-text)'}}};

/**
 * 기본 테마 (관리자)
 */
export const DEFAULT_THEME = COLOR_THEMES.ADMIN;

/**
 * 테마별 컴포넌트 스타일
 */
export const THEME_COMPONENT_STYLES = {CLIENT: {card: {background: 'var(--client-background)',
      border: '1px solid var(--client-primary-light)',
      shadow: 'COLOR_CONSTANTS.ALPHA_TRANSPARENT 2px 8px rgba(CONSTANTS.FORM_CONSTANTS.MAX_FILE_NAME_LENGTH, 182, 193, COLOR_CONSTANTS.ALPHA_TRANSPARENT.SECURITY_CONSTANTS.LOCKOUT_DURATION)'},
    button: {primary: {background: 'var(--client-primary)',
        color: 'var(--color-white)',
        border: 'none'},
      secondary: {background: 'var(--client-secondary)',
        color: 'var(--client-text)',
        border: '1px solid var(--client-primary)'}},
    icon: {primary: {background: 'var(--client-primary)',
        color: 'var(--color-white)'},
      secondary: {background: 'var(--client-secondary)',
        color: 'var(--client-text)'}}},
  
  CONSULTANT: {card: {background: 'var(--consultant-background)',
      border: '1px solid var(--consultant-primary-light)',
      shadow: 'COLOR_CONSTANTS.ALPHA_TRANSPARENT 2px 8px rgba(152, 251, 152, COLOR_CONSTANTS.ALPHA_TRANSPARENT.SECURITY_CONSTANTS.LOCKOUT_DURATION)'},
    button: {primary: {background: 'var(--consultant-primary)',
        color: 'var(--color-white)',
        border: 'none'},
      secondary: {background: 'var(--consultant-secondary)',
        color: 'var(--consultant-text)',
        border: '1px solid var(--consultant-primary)'}},
    icon: {primary: {background: 'var(--consultant-primary)',
        color: 'var(--color-white)'},
      secondary: {background: 'var(--consultant-secondary)',
        color: 'var(--consultant-text)'}}},
  
  ADMIN: {card: {background: 'var(--admin-background)',
      border: '1px solid var(--admin-primary-light)',
      shadow: 'COLOR_CONSTANTS.ALPHA_TRANSPARENT 2px 8px rgba(135, 206, 235, COLOR_CONSTANTS.ALPHA_TRANSPARENT.SECURITY_CONSTANTS.LOCKOUT_DURATION)'},
    button: {primary: {background: 'var(--admin-primary)',
        color: 'var(--color-white)',
        border: 'none'},
      secondary: {background: 'var(--admin-secondary)',
        color: 'var(--admin-text)',
        border: '1px solid var(--admin-primary)'}},
    icon: {primary: {background: 'var(--admin-primary)',
        color: 'var(--color-white)'},
      secondary: {background: 'var(--admin-secondary)',
        color: 'var(--admin-text)'}}}};

/**
 * 테마 적용 헬퍼 함수
 */
export const getThemeByRole = (userRole) => {const roleMap = {'CLIENT': COLOR_THEMES.CLIENT,
    'CONSULTANT': COLOR_THEMES.CONSULTANT,
    'ADMIN': COLOR_THEMES.ADMIN,
    'ROLE_ADMIN': COLOR_THEMES.ADMIN,
    'ROLE_CONSULTANT': COLOR_THEMES.CONSULTANT,
    'ROLE_CLIENT': COLOR_THEMES.CLIENT};
  
  return roleMap[userRole] || DEFAULT_THEME;};

export const getThemeByName = (themeName) => {return COLOR_THEMES[themeName.toUpperCase()] || DEFAULT_THEME;};

export const applyThemeToElement = (element, theme) => {if (!element || !theme) return;
  
  // data-theme 속성 설정
  element.setAttribute('data-theme', theme.type);
  
  // CSS 변수 적용
  Object.entries(theme.cssVariables).forEach(([property, value]) => {element.style.setProperty(property, value);});};

export const applyThemeToDocument = (theme) => {const root = document.documentElement;
  applyThemeToElement(root, theme);};

export const getThemeColors = (themeType) => {const theme = COLOR_THEMES[themeType];
  return theme ? theme.colors : DEFAULT_THEME.colors;};

export const getComponentStyles = (themeType, component) => {const styles = THEME_COMPONENT_STYLES[themeType];
  return styles ? styles[component] : THEME_COMPONENT_STYLES.ADMIN[component];};

/**
 * 테마 검증 함수
 */
export const validateTheme = (theme) => {if (!theme || !theme.type) {console.warn('Invalid theme: missing type');
    return false;}
  
  if (!COLOR_THEMES[theme.type]) {console.warn(`Theme not found: ${theme.type}`);
    return false;}
  
  return true;};

/**
 * 커스텀 테마 생성 함수
 */
export const createCustomTheme = (baseTheme, customColors) => {const theme = {...baseTheme};
  
  if (customColors) {theme.colors = {...theme.colors, ...customColors};
    
    // CSS 변수 업데이트
    Object.entries(customColors).forEach(([key, value]) => {const cssVar = `--mg-v2-${key}`;
      theme.cssVariables[cssVar] = value;});}
  
  return theme;};

/**
 * 테마 목록 가져오기
 */
export const getAvailableThemes = () => {return Object.values(COLOR_THEMES).map(theme => ({id: theme.type,
    name: theme.name,
    description: theme.description,
    preview: theme.colors.primary}));};

export default COLOR_THEMES;
