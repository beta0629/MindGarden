import { useState, useEffect, useCallback } from 'react';

export const useTheme = () => {
    const [theme, setTheme] = useState('light');
    const [systemTheme, setSystemTheme] = useState('light');

    // 시스템 테마 감지
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        
        const handleChange = (e) => {
            setSystemTheme(e.matches ? 'dark' : 'light');
        };

        // 초기값 설정
        setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
        
        // 리스너 등록
        mediaQuery.addEventListener('change', handleChange);
        
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, []);

    // 로컬 스토리지에서 테마 불러오기
    useEffect(() => {
        const savedTheme = localStorage.getItem('mindgarden-theme');
        if (savedTheme) {
            setTheme(savedTheme);
        } else {
            setTheme(systemTheme);
        }
    }, [systemTheme]);

    // 테마 변경 함수
    const toggleTheme = useCallback(() => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('mindgarden-theme', newTheme);
    }, [theme]);

    // 특정 테마로 설정
    const setThemeMode = useCallback((newTheme) => {
        if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'system') {
            if (newTheme === 'system') {
                setTheme(systemTheme);
                localStorage.setItem('mindgarden-theme', 'system');
            } else {
                setTheme(newTheme);
                localStorage.setItem('mindgarden-theme', newTheme);
            }
        }
    }, [systemTheme]);

    // CSS 변수 업데이트
    useEffect(() => {
        const root = document.documentElement;
        const currentTheme = theme === 'system' ? systemTheme : theme;
        
        if (currentTheme === 'dark') {
            root.classList.add('dark-theme');
            root.classList.remove('light-theme');
        } else {
            root.classList.add('light-theme');
            root.classList.remove('dark-theme');
        }
    }, [theme, systemTheme]);

    // 테마별 CSS 변수 설정
    useEffect(() => {
        const root = document.documentElement;
        const currentTheme = theme === 'system' ? systemTheme : theme;
        
        if (currentTheme === 'dark') {
            // 다크 테마 색상
            root.style.setProperty('--theme-bg-primary', 'var(--cs-gray-900)');
            root.style.setProperty('--theme-bg-secondary', 'var(--cs-gray-800)');
            root.style.setProperty('--theme-bg-tertiary', 'var(--cs-gray-700)');
            root.style.setProperty('--theme-text-primary', 'var(--mg-white)');
            root.style.setProperty('--theme-text-secondary', 'var(--cs-gray-400)');
            root.style.setProperty('--theme-text-tertiary', 'var(--mg-gray-600)');
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(255, 255, 255, 0.1) -> var(--mg-custom-color)
            root.style.setProperty('--theme-border', 'rgba(255, 255, 255, 0.1)');
            root.style.setProperty('--theme-shadow', 'var(--mg-overlay)');
        } else {
            // 라이트 테마 색상
            root.style.setProperty('--theme-bg-primary', 'var(--mg-white)');
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #f2f2f7 -> var(--mg-custom-f2f2f7)
            root.style.setProperty('--theme-bg-secondary', '#f2f2f7');
            root.style.setProperty('--theme-bg-tertiary', 'var(--mg-white)');
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #1d1d1f -> var(--mg-custom-1d1d1f)
            root.style.setProperty('--theme-text-primary', '#1d1d1f');
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #86868b -> var(--mg-custom-86868b)
            root.style.setProperty('--theme-text-secondary', '#86868b');
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #c7c7cc -> var(--mg-custom-c7c7cc)
            root.style.setProperty('--theme-text-tertiary', '#c7c7cc');
            // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: rgba(0, 0, 0, 0.05) -> var(--mg-custom-color)
            root.style.setProperty('--theme-border', 'rgba(0, 0, 0, 0.05)');
            root.style.setProperty('--theme-shadow', 'var(--mg-shadow-light)');
        }
    }, [theme, systemTheme]);

    const resolvedTheme = theme === 'system' ? systemTheme : theme;
    let themeDisplayName = '라이트 모드';
    if (theme === 'system') {
        themeDisplayName = `시스템 (${resolvedTheme === 'dark' ? '다크' : '라이트'})`;
    } else if (resolvedTheme === 'dark') {
        themeDisplayName = '다크 모드';
    }
    const currentTheme = {
        type: theme,
        name: themeDisplayName,
        description:
            resolvedTheme === 'dark'
                ? '어두운 배경으로 눈의 피로를 줄입니다.'
                : '밝은 배경의 기본 화면 테마입니다.'
    };

    const themeColors = {
        primary:
            resolvedTheme === 'dark'
                ? 'var(--theme-text-primary)'
                : 'var(--mg-primary-500)'
    };

    const changeToTheme = useCallback(
        async(themeType) => {
            setThemeMode(themeType);
            return { success: true, theme: { type: themeType } };
        },
        [setThemeMode]
    );

    const applyCustomTheme = useCallback(
        async(baseThemeType, _customColors) => {
            if (baseThemeType === 'light' || baseThemeType === 'dark' || baseThemeType === 'system') {
                setThemeMode(baseThemeType);
            }
            return { success: true, theme: { type: baseThemeType } };
        },
        [setThemeMode]
    );

    const resetToDefault = useCallback(async() => {
        setThemeMode('light');
        return { success: true, theme: { type: 'light' } };
    }, [setThemeMode]);

    return {
        theme,
        systemTheme,
        toggleTheme,
        setThemeMode,
        isDark: theme === 'system' ? systemTheme === 'dark' : theme === 'dark',
        isLight: theme === 'system' ? systemTheme === 'light' : theme === 'light',
        currentTheme,
        themeColors,
        changeToTheme,
        applyCustomTheme,
        resetToDefault,
        isLoading: false,
        error: null
    };
};
