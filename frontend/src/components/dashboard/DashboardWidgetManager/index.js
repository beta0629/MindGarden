/**
 * DashboardWidgetManager Index
 * 
 * 목적: Container 컴포넌트를 기본 export로 제공
/**
 * 표준: DESIGN_CENTRALIZATION_STANDARD.md 준수
/**
 * 
/**
 * ✅ 표준화:
/**
 * - Container 컴포넌트를 기본으로 export
/**
 * - 외부에서는 Container만 사용
/**
 * - Presentation은 내부에서만 사용
/**
 * 
/**
 * @author CoreSolution Team
/**
 * @since 2025-12-02
 */

export { default } from './DashboardWidgetManagerContainer';
export { default as DashboardWidgetManagerContainer } from './DashboardWidgetManagerContainer';
export { default as DashboardWidgetManagerPresentation } from './DashboardWidgetManagerPresentation';

