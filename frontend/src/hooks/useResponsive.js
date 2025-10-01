import { useState, useEffect, useCallback } from 'react';

// 브레이크포인트 정의
const breakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400
};

export const useResponsive = () => {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    const [breakpoint, setBreakpoint] = useState('lg');

    // 윈도우 크기 업데이트
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // 초기값 설정

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 브레이크포인트 계산
    useEffect(() => {
        const width = windowSize.width;
        
        if (width >= breakpoints.xxl) {
            setBreakpoint('xxl');
        } else if (width >= breakpoints.xl) {
            setBreakpoint('xl');
        } else if (width >= breakpoints.lg) {
            setBreakpoint('lg');
        } else if (width >= breakpoints.md) {
            setBreakpoint('md');
        } else if (width >= breakpoints.sm) {
            setBreakpoint('sm');
        } else {
            setBreakpoint('xs');
        }
    }, [windowSize.width]);

    // 디바이스 타입 판단
    const isMobile = breakpoint === 'xs' || breakpoint === 'sm';
    const isTablet = breakpoint === 'md';
    const isDesktop = breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === 'xxl';
    const isTouchDevice = isMobile || isTablet;

    // 특정 브레이크포인트 체크
    const isBreakpoint = useCallback((bp) => {
        return breakpoint === bp;
    }, [breakpoint]);

    // 브레이크포인트 이상 체크
    const isBreakpointUp = useCallback((bp) => {
        const currentIndex = Object.keys(breakpoints).indexOf(breakpoint);
        const targetIndex = Object.keys(breakpoints).indexOf(bp);
        return currentIndex >= targetIndex;
    }, [breakpoint]);

    // 브레이크포인트 이하 체크
    const isBreakpointDown = useCallback((bp) => {
        const currentIndex = Object.keys(breakpoints).indexOf(breakpoint);
        const targetIndex = Object.keys(breakpoints).indexOf(bp);
        return currentIndex <= targetIndex;
    }, [breakpoint]);

    // 반응형 클래스 생성
    const getResponsiveClasses = useCallback((classes) => {
        const responsiveClasses = [];
        
        Object.entries(classes).forEach(([bp, className]) => {
            if (breakpoints.hasOwnProperty(bp)) {
                const currentIndex = Object.keys(breakpoints).indexOf(breakpoint);
                const targetIndex = Object.keys(breakpoints).indexOf(bp);
                
                if (currentIndex >= targetIndex) {
                    responsiveClasses.push(className);
                }
            }
        });
        
        return responsiveClasses.join(' ');
    }, [breakpoint]);

    // 반응형 스타일 생성
    const getResponsiveStyles = useCallback((styles) => {
        const currentStyles = {};
        
        Object.entries(styles).forEach(([bp, style]) => {
            if (breakpoints.hasOwnProperty(bp)) {
                const currentIndex = Object.keys(breakpoints).indexOf(breakpoint);
                const targetIndex = Object.keys(breakpoints).indexOf(bp);
                
                if (currentIndex >= targetIndex) {
                    Object.assign(currentStyles, style);
                }
            }
        });
        
        return currentStyles;
    }, [breakpoint]);

    // 터치 이벤트 지원 여부
    const isTouchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // CSS 미디어 쿼리 체크
    const matchesMediaQuery = useCallback((query) => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    }, []);

    // 반응형 이미지 소스 생성
    const getResponsiveImageSrc = useCallback((sources) => {
        const sortedBreakpoints = Object.entries(breakpoints)
            .sort(([,a], [,b]) => b - a);
        
        for (const [bp, width] of sortedBreakpoints) {
            if (windowSize.width >= width && sources[bp]) {
                return sources[bp];
            }
        }
        
        return sources.default || sources.xs || '';
    }, [windowSize.width]);

    // 반응형 그리드 컬럼 수 계산
    const getGridColumns = useCallback(() => {
        switch (breakpoint) {
            case 'xs':
            case 'sm':
                return 1;
            case 'md':
                return 2;
            case 'lg':
                return 3;
            case 'xl':
                return 4;
            case 'xxl':
                return 5;
            default:
                return 3;
        }
    }, [breakpoint]);

    // 반응형 간격 계산
    const getResponsiveSpacing = useCallback((spacing) => {
        const spacingMap = {
            xs: spacing.xs || spacing.sm || spacing.md || spacing.lg || spacing.xl || spacing.xxl,
            sm: spacing.sm || spacing.md || spacing.lg || spacing.xl || spacing.xxl,
            md: spacing.md || spacing.lg || spacing.xl || spacing.xxl,
            lg: spacing.lg || spacing.xl || spacing.xxl,
            xl: spacing.xl || spacing.xxl,
            xxl: spacing.xxl
        };
        
        return spacingMap[breakpoint] || spacingMap.lg;
    }, [breakpoint]);

    return {
        // 상태
        windowSize,
        breakpoint,
        
        // 디바이스 타입
        isMobile,
        isTablet,
        isDesktop,
        isTouchDevice,
        
        // 브레이크포인트 체크
        isBreakpoint,
        isBreakpointUp,
        isBreakpointDown,
        
        // 반응형 유틸리티
        getResponsiveClasses,
        getResponsiveStyles,
        getResponsiveImageSrc,
        getGridColumns,
        getResponsiveSpacing,
        
        // 기타
        isTouchSupported,
        matchesMediaQuery,
        
        // 브레이크포인트 상수
        breakpoints
    };
};
