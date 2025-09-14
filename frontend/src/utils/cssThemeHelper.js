/**
 * CSS 테마 동적 관리 유틸리티
 * 테마별 색상 설정을 동적으로 로드하고 관리하는 유틸리티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */

import { apiGet } from './ajax';

// 테마 색상 캐시 (5분간 유지)
let themeColorCache = new Map();
let cacheTimestamp = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

/**
 * 캐시된 데이터가 유효한지 확인
 * @param {string} key 캐시 키
 * @returns {boolean} 유효 여부
 */
const isCacheValid = (key) => {
    const timestamp = cacheTimestamp.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < CACHE_DURATION;
};

/**
 * 캐시에서 데이터 조회
 * @param {string} key 캐시 키
 * @returns {any} 캐시된 데이터 또는 null
 */
const getFromCache = (key) => {
    if (isCacheValid(key)) {
        console.log(`🎨 CSS 테마 캐시 히트: ${key}`);
        return themeColorCache.get(key);
    }
    return null;
};

/**
 * 캐시에 데이터 저장
 * @param {string} key 캐시 키
 * @param {any} data 저장할 데이터
 */
const setToCache = (key, data) => {
    themeColorCache.set(key, data);
    cacheTimestamp.set(key, Date.now());
    console.log(`🎨 CSS 테마 캐시 저장: ${key}`);
};

/**
 * 모든 활성화된 테마 목록 조회
 * @returns {Promise<Array>} 테마 목록
 */
export const getAllActiveThemes = async () => {
    try {
        const cacheKey = 'all-active-themes';
        const cached = getFromCache(cacheKey);
        if (cached) return cached;

        const response = await apiGet('/api/admin/css-themes/themes');
        if (response.success && response.data) {
            setToCache(cacheKey, response.data);
            return response.data;
        }
        return [];
    } catch (error) {
        console.error('🎨 테마 목록 조회 실패:', error);
        return [];
    }
};

/**
 * 기본 테마 조회
 * @returns {Promise<Object|null>} 기본 테마 정보
 */
export const getDefaultTheme = async () => {
    try {
        const cacheKey = 'default-theme';
        const cached = getFromCache(cacheKey);
        if (cached) return cached;

        const response = await apiGet('/api/admin/css-themes/themes/default');
        if (response.success && response.data) {
            setToCache(cacheKey, response.data);
            return response.data;
        }
        return null;
    } catch (error) {
        console.error('🎨 기본 테마 조회 실패:', error);
        return null;
    }
};

/**
 * 특정 테마의 모든 색상 설정 조회
 * @param {string} themeName 테마명
 * @returns {Promise<Object>} 색상 설정 객체 (colorKey -> colorValue)
 */
export const getThemeColors = async (themeName) => {
    try {
        const cacheKey = `theme-colors-${themeName}`;
        const cached = getFromCache(cacheKey);
        if (cached) return cached;

        const response = await apiGet(`/api/admin/css-themes/themes/${themeName}/colors`);
        if (response.success && response.data) {
            setToCache(cacheKey, response.data);
            return response.data;
        }
        return {};
    } catch (error) {
        console.error(`🎨 테마 색상 조회 실패: ${themeName}`, error);
        return {};
    }
};

/**
 * 특정 테마의 특정 색상 값 조회
 * @param {string} themeName 테마명
 * @param {string} colorKey 색상 키
 * @returns {Promise<string|null>} 색상 값
 */
export const getThemeColor = async (themeName, colorKey) => {
    try {
        const cacheKey = `theme-color-${themeName}-${colorKey}`;
        const cached = getFromCache(cacheKey);
        if (cached) return cached;

        const response = await apiGet(`/api/admin/css-themes/themes/${themeName}/colors/${colorKey}`);
        if (response.success && response.colorValue) {
            setToCache(cacheKey, response.colorValue);
            return response.colorValue;
        }
        return null;
    } catch (error) {
        console.error(`🎨 특정 테마 색상 조회 실패: ${themeName} - ${colorKey}`, error);
        return null;
    }
};

/**
 * 특정 테마의 특정 카테고리 색상들 조회
 * @param {string} themeName 테마명
 * @param {string} category 색상 카테고리
 * @returns {Promise<Array>} 색상 설정 목록
 */
export const getThemeColorsByCategory = async (themeName, category) => {
    try {
        const cacheKey = `theme-category-${themeName}-${category}`;
        const cached = getFromCache(cacheKey);
        if (cached) return cached;

        const response = await apiGet(`/api/admin/css-themes/themes/${themeName}/categories/${category}`);
        if (response.success && response.data) {
            setToCache(cacheKey, response.data);
            return response.data;
        }
        return [];
    } catch (error) {
        console.error(`🎨 카테고리별 색상 조회 실패: ${themeName} - ${category}`, error);
        return [];
    }
};

/**
 * 테마 존재 여부 확인
 * @param {string} themeName 테마명
 * @returns {Promise<boolean>} 존재 여부
 */
export const isThemeExists = async (themeName) => {
    try {
        const response = await apiGet(`/api/admin/css-themes/themes/${themeName}/exists`);
        return response.success && response.exists;
    } catch (error) {
        console.error(`🎨 테마 존재 여부 확인 실패: ${themeName}`, error);
        return false;
    }
};

/**
 * 동적 CSS 변수 객체 생성
 * @param {string} themeName 테마명 (기본값: 'default')
 * @returns {Promise<Object>} CSS 변수 객체
 */
export const getDynamicCSSVariables = async (themeName = 'default') => {
    try {
        console.log(`🎨 동적 CSS 변수 생성: ${themeName}`);
        
        // 테마 색상 조회
        const colors = await getThemeColors(themeName);
        
        // CSS 변수 객체 생성
        const cssVariables = {
            COLORS: {
                // Primary Colors
                PRIMARY: colors.PRIMARY || '#667eea',
                PRIMARY_DARK: colors.PRIMARY_DARK || '#764ba2',
                PRIMARY_GRADIENT: colors.PRIMARY_GRADIENT || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                
                // Secondary Colors
                SECONDARY: colors.SECONDARY || '#6c757d',
                SECONDARY_LIGHT: colors.SECONDARY_LIGHT || '#e9ecef',
                
                // Status Colors
                SUCCESS: colors.SUCCESS || '#00b894',
                SUCCESS_LIGHT: colors.SUCCESS_LIGHT || '#d4edda',
                SUCCESS_DARK: colors.SUCCESS_DARK || '#00a085',
                SUCCESS_GRADIENT: colors.SUCCESS_GRADIENT || 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                
                DANGER: colors.DANGER || '#ff6b6b',
                DANGER_LIGHT: colors.DANGER_LIGHT || '#f8d7da',
                DANGER_DARK: colors.DANGER_DARK || '#ee5a24',
                DANGER_GRADIENT: colors.DANGER_GRADIENT || 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                
                INFO: colors.INFO || '#74b9ff',
                INFO_LIGHT: colors.INFO_LIGHT || '#d1ecf1',
                INFO_DARK: colors.INFO_DARK || '#0984e3',
                INFO_GRADIENT: colors.INFO_GRADIENT || 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                
                WARNING: colors.WARNING || '#f093fb',
                WARNING_LIGHT: colors.WARNING_LIGHT || '#fff3cd',
                WARNING_DARK: colors.WARNING_DARK || '#f5576c',
                WARNING_GRADIENT: colors.WARNING_GRADIENT || 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                
                // Functional Colors
                CONSULTANT: colors.CONSULTANT || '#a29bfe',
                CONSULTANT_DARK: colors.CONSULTANT_DARK || '#6c5ce7',
                CONSULTANT_GRADIENT: colors.CONSULTANT_GRADIENT || 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
                
                CLIENT: colors.CLIENT || '#00b894',
                CLIENT_DARK: colors.CLIENT_DARK || '#00a085',
                CLIENT_GRADIENT: colors.CLIENT_GRADIENT || 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
                
                FINANCE: colors.FINANCE || '#f39c12',
                FINANCE_DARK: colors.FINANCE_DARK || '#e67e22',
                FINANCE_GRADIENT: colors.FINANCE_GRADIENT || 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
            }
        };
        
        console.log(`🎨 동적 CSS 변수 생성 완료: ${themeName}`, cssVariables);
        return cssVariables;
        
    } catch (error) {
        console.error(`🎨 동적 CSS 변수 생성 실패: ${themeName}`, error);
        
        // 오류 시 기본값 반환
        return {
            COLORS: {
                PRIMARY: '#667eea',
                PRIMARY_DARK: '#764ba2',
                PRIMARY_GRADIENT: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                SECONDARY: '#6c757d',
                SECONDARY_LIGHT: '#e9ecef',
                SUCCESS: '#00b894',
                SUCCESS_LIGHT: '#d4edda',
                SUCCESS_DARK: '#00a085',
                SUCCESS_GRADIENT: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                DANGER: '#ff6b6b',
                DANGER_LIGHT: '#f8d7da',
                DANGER_DARK: '#ee5a24',
                DANGER_GRADIENT: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                INFO: '#74b9ff',
                INFO_LIGHT: '#d1ecf1',
                INFO_DARK: '#0984e3',
                INFO_GRADIENT: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                WARNING: '#f093fb',
                WARNING_LIGHT: '#fff3cd',
                WARNING_DARK: '#f5576c',
                WARNING_GRADIENT: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                CONSULTANT: '#a29bfe',
                CONSULTANT_DARK: '#6c5ce7',
                CONSULTANT_GRADIENT: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
                CLIENT: '#00b894',
                CLIENT_DARK: '#00a085',
                CLIENT_GRADIENT: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
                FINANCE: '#f39c12',
                FINANCE_DARK: '#e67e22',
                FINANCE_GRADIENT: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
            }
        };
    }
};

/**
 * 캐시 초기화
 */
export const clearThemeCache = () => {
    themeColorCache.clear();
    cacheTimestamp.clear();
    console.log('🎨 CSS 테마 캐시 초기화 완료');
};

/**
 * 특정 테마 캐시만 초기화
 * @param {string} themeName 테마명
 */
export const clearThemeCacheByName = (themeName) => {
    const keysToDelete = [];
    for (const key of themeColorCache.keys()) {
        if (key.includes(themeName)) {
            keysToDelete.push(key);
        }
    }
    
    keysToDelete.forEach(key => {
        themeColorCache.delete(key);
        cacheTimestamp.delete(key);
    });
    
    console.log(`🎨 ${themeName} 테마 캐시 초기화 완료: ${keysToDelete.length}개 항목`);
};
