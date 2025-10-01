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
            root.style.setProperty('--theme-bg-primary', '#1a1a1a');
            root.style.setProperty('--theme-bg-secondary', '#2a2a2a');
            root.style.setProperty('--theme-bg-tertiary', '#3a3a3a');
            root.style.setProperty('--theme-text-primary', '#ffffff');
            root.style.setProperty('--theme-text-secondary', '#b3b3b3');
            root.style.setProperty('--theme-text-tertiary', '#666666');
            root.style.setProperty('--theme-border', 'rgba(255, 255, 255, 0.1)');
            root.style.setProperty('--theme-shadow', 'rgba(0, 0, 0, 0.5)');
        } else {
            // 라이트 테마 색상
            root.style.setProperty('--theme-bg-primary', '#ffffff');
            root.style.setProperty('--theme-bg-secondary', '#f2f2f7');
            root.style.setProperty('--theme-bg-tertiary', '#ffffff');
            root.style.setProperty('--theme-text-primary', '#1d1d1f');
            root.style.setProperty('--theme-text-secondary', '#86868b');
            root.style.setProperty('--theme-text-tertiary', '#c7c7cc');
            root.style.setProperty('--theme-border', 'rgba(0, 0, 0, 0.05)');
            root.style.setProperty('--theme-shadow', 'rgba(0, 0, 0, 0.1)');
        }
    }, [theme, systemTheme]);

    return {
        theme,
        systemTheme,
        toggleTheme,
        setThemeMode,
        isDark: theme === 'system' ? systemTheme === 'dark' : theme === 'dark',
        isLight: theme === 'system' ? systemTheme === 'light' : theme === 'light'
    };
};
