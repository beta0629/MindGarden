package com.coresolution.core.domain.ops;

/**
 * Feature Flag 상태
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public enum FeatureFlagState {
    DISABLED,  // 비활성화
    SHADOW,    // 섀도우 모드 (테스트)
    ENABLED    // 활성화
}

