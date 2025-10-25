/**
 * 디자인 토큰 유틸리티
 * JSON 토큰을 CSS Variables와 JavaScript 상수로 변환
 */

import colors from './colors.json';
import spacing from './spacing.json';
import typography from './typography.json';

/**
 * CSS Variables 생성
 */
export const generateCSSVariables = () => {const cssVars = [];
  
  // 색상 변수
  Object.entries(colors.tokens).forEach(([category, tokens]) => {if (typeof tokens === 'object' && tokens.value) {cssVars.push(`  --mg-v2-${category}: ${tokens.value};`);} else if (typeof tokens === 'object') {Object.entries(tokens).forEach(([key, value]) => {if (typeof value === 'object' && value.value) {cssVars.push(`  --mg-v2-${category}-${key}: ${value.value};`);}});}});
  
  // 간격 변수
  Object.entries(spacing.tokens).forEach(([key, value]) => {if (typeof value === 'object' && value.value) {cssVars.push(`  --mg-v2-spacing-${key}: ${value.value};`);}});
  
  // 타이포그래피 변수
  Object.entries(typography.tokens).forEach(([category, tokens]) => {if (typeof tokens === 'object' && tokens.value) {cssVars.push(`  --mg-v2-${category}: ${tokens.value};`);} else if (typeof tokens === 'object') {Object.entries(tokens).forEach(([key, value]) => {if (typeof value === 'object' && value.value) {cssVars.push(`  --mg-v2-${category}-${key}: ${value.value};`);}});}});
  
  return cssVars.join('\n');};

/**
 * JavaScript 상수 생성
 */
export const TOKENS = {colors: colors.tokens,
  spacing: spacing.tokens,
  typography: typography.tokens};

/**
 * 테마별 색상 가져오기
 */
export const getThemeColors = (theme) => {return TOKENS.colors.themes[theme] || TOKENS.colors.themes.admin;};

/**
 * 반응형 간격 가져오기
 */
export const getResponsiveSpacing = (breakpoint, type) => {return TOKENS.spacing.responsive[breakpoint][type];};

/**
 * CSS 클래스 생성 헬퍼
 */
export const createCSSClass = (component, variant = '', state = '') => {const parts = ['mg-v2', component];
  if (variant) parts.push(variant);
  if (state) parts.push(state);
  return parts.join('-');};

/**
 * 토큰 검증
 */
export const validateToken = (category, key, value) => {const token = TOKENS[category]?.[key];
  if (!token) {console.warn(`Token not found: ${category}.${key}`);
    return false;}
  
  if (token.value !== value) {console.warn(`Token value mismatch: expected ${token.value}, got ${value}`);
    return false;}
  
  return true;};

export default TOKENS;
