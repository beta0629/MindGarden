package com.coresolution.core.context;

import lombok.extern.slf4j.Slf4j;

/**
 * Tenant Context Holder
 * TenantContext의 래퍼 클래스로, 추가 유틸리티 메서드 제공
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
public class TenantContextHolder {
    
    /**
     * 현재 요청의 테넌트 ID 조회
     * 
     * @return 테넌트 UUID
     * @throws IllegalStateException 테넌트 ID가 설정되지 않은 경우
     */
    public static String getRequiredTenantId() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            throw new IllegalStateException("Tenant ID is not set in current context");
        }
        return tenantId;
    }
    
    /**
     * 현재 요청의 테넌트 ID 조회 (안전한 방식)
     * 
     * @return 테넌트 UUID (없으면 null)
     */
    public static String getTenantId() {
        return TenantContext.getTenantId();
    }
    
    /**
     * 현재 요청의 지점 ID 조회
     * 
     * @return 지점 ID
     * @throws IllegalStateException 지점 ID가 설정되지 않은 경우
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     */
    @Deprecated
    public static String getRequiredBranchId() {
        String branchId = TenantContext.getBranchId();
        if (branchId == null || branchId.isEmpty()) {
            throw new IllegalStateException("Branch ID is not set in current context");
        }
        return branchId;
    }
    
    /**
     * 현재 요청의 지점 ID 조회 (안전한 방식)
     * 
     * @return 지점 ID (없으면 null)
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     */
    @Deprecated
    public static String getBranchId() {
        return TenantContext.getBranchId();
    }
    
    /**
     * 테넌트 컨텍스트가 설정되어 있는지 확인
     * 
     * @return 테넌트 ID가 설정되어 있으면 true
     */
    public static boolean isTenantContextSet() {
        return TenantContext.hasTenantId();
    }
    
    /**
     * 지점 컨텍스트가 설정되어 있는지 확인
     * 
     * @return 지점 ID가 설정되어 있으면 true
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     */
    @Deprecated
    public static boolean isBranchContextSet() {
        return TenantContext.hasBranchId();
    }
    
    /**
     * 테넌트 컨텍스트 설정
     * 
     * @param tenantId 테넌트 UUID
     */
    public static void setTenantId(String tenantId) {
        if (tenantId != null && !tenantId.isEmpty()) {
            TenantContext.setTenantId(tenantId);
            log.debug("Tenant context set: {}", tenantId);
        } else {
            log.warn("Attempted to set empty tenant ID");
        }
    }
    
    /**
     * 지점 컨텍스트 설정
     * 
     * @param branchId 지점 ID
     * @deprecated 브랜치 개념 제거됨 (표준화 2025-12-05). 레거시 호환용으로 유지되지만 새로운 코드에서는 사용하지 마세요.
     */
    @Deprecated
    public static void setBranchId(String branchId) {
        if (branchId != null && !branchId.isEmpty()) {
            TenantContext.setBranchId(branchId);
            log.debug("Branch context set: {}", branchId);
        } else {
            log.warn("Attempted to set empty branch ID");
        }
    }
    
    /**
     * 비즈니스 타입 컨텍스트 설정
     * 
     * @param businessType 비즈니스 타입 (CONSULTATION, ACADEMY, RESTAURANT 등)
     */
    public static void setBusinessType(String businessType) {
        if (businessType != null && !businessType.isEmpty()) {
            TenantContext.setBusinessType(businessType);
            log.debug("Business type context set: {}", businessType);
        } else {
            log.warn("Attempted to set empty business type");
        }
    }
    
    /**
     * 현재 요청의 비즈니스 타입 조회
     * 
     * @return 비즈니스 타입 (없으면 null)
     */
    public static String getBusinessType() {
        return TenantContext.getBusinessType();
    }
    
    /**
     * 현재 요청의 비즈니스 타입 조회 (필수)
     * 
     * @return 비즈니스 타입
     * @throws IllegalStateException 비즈니스 타입이 설정되지 않은 경우
     */
    public static String getRequiredBusinessType() {
        String businessType = TenantContext.getBusinessType();
        if (businessType == null || businessType.isEmpty()) {
            throw new IllegalStateException("Business type is not set in current context");
        }
        return businessType;
    }
    
    /**
     * 비즈니스 타입 컨텍스트가 설정되어 있는지 확인
     * 
     * @return 비즈니스 타입이 설정되어 있으면 true
     */
    public static boolean isBusinessTypeSet() {
        return TenantContext.hasBusinessType();
    }
    
    /**
     * 모든 컨텍스트 정리
     */
    public static void clear() {
        TenantContext.clear();
        log.debug("Tenant context cleared");
    }
    
    /**
     * 컨텍스트 정보 로깅 (디버깅용)
     */
    public static void logContext() {
        if (log.isDebugEnabled()) {
            log.debug("Tenant Context - TenantId: {}, BusinessType: {}", 
                TenantContext.getTenantId(), 
                TenantContext.getBusinessType());
            // 브랜치 개념 제거: BranchId 로깅 제거됨 (표준화 2025-12-05)
        }
    }
}

