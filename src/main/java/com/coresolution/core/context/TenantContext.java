package com.coresolution.core.context;

/**
 * Tenant Context
 * 현재 요청의 테넌트 정보를 ThreadLocal로 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public class TenantContext {
    
    private static final ThreadLocal<String> tenantId = new ThreadLocal<>();
    private static final ThreadLocal<String> branchId = new ThreadLocal<>();
    private static final ThreadLocal<String> businessType = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> bypassTenantFilter = new ThreadLocal<>();
    
    /**
     * 현재 요청의 테넌트 ID 설정
     * 
     * @param tenantId 테넌트 UUID
     */
    public static void setTenantId(String tenantId) {
        TenantContext.tenantId.set(tenantId);
    }
    
    /**
     * 현재 요청의 테넌트 ID 조회
     * 
     * @return 테넌트 UUID (없으면 null)
     */
    public static String getTenantId() {
        return tenantId.get();
    }
    
    /**
     * 현재 요청의 지점 ID 설정
     * 
     * @param branchId 지점 ID
     */
    public static void setBranchId(String branchId) {
        TenantContext.branchId.set(branchId);
    }
    
    /**
     * 현재 요청의 지점 ID 조회
     * 
     * @return 지점 ID (없으면 null)
     */
    public static String getBranchId() {
        return branchId.get();
    }
    
    /**
     * 테넌트 ID 존재 여부 확인
     * 
     * @return 테넌트 ID가 설정되어 있으면 true
     */
    public static boolean hasTenantId() {
        return tenantId.get() != null;
    }
    
    /**
     * 지점 ID 존재 여부 확인
     * 
     * @return 지점 ID가 설정되어 있으면 true
     */
    public static boolean hasBranchId() {
        return branchId.get() != null;
    }
    
    /**
     * 현재 요청의 비즈니스 타입 설정
     * 
     * @param businessType 비즈니스 타입 (CONSULTATION, ACADEMY, RESTAURANT 등)
     */
    public static void setBusinessType(String businessType) {
        TenantContext.businessType.set(businessType);
    }
    
    /**
     * 현재 요청의 비즈니스 타입 조회
     * 
     * @return 비즈니스 타입 (없으면 null)
     */
    public static String getBusinessType() {
        return businessType.get();
    }
    
    /**
     * 비즈니스 타입 존재 여부 확인
     * 
     * @return 비즈니스 타입이 설정되어 있으면 true
     */
    public static boolean hasBusinessType() {
        return businessType.get() != null;
    }
    
    /**
     * 슈퍼 어드민 필터 우회 설정
     * 
     * <p>HQ_MASTER, HQ_SUPER_ADMIN 등 본사 관리자가 전체 테넌트 데이터를 
     * 조회해야 할 때 사용합니다.</p>
     * 
     * <p>⚠️ 주의: 보안상 매우 민감한 설정이므로 신중하게 사용해야 합니다.</p>
     * 
     * @param bypass true면 tenantId 필터링을 우회
     */
    public static void setBypassTenantFilter(boolean bypass) {
        bypassTenantFilter.set(bypass);
    }
    
    /**
     * 슈퍼 어드민 필터 우회 여부 확인
     * 
     * @return true면 tenantId 필터링을 우회해야 함
     */
    public static boolean shouldBypassTenantFilter() {
        Boolean bypass = bypassTenantFilter.get();
        return bypass != null && bypass;
    }
    
    /**
     * ThreadLocal 정리 (요청 종료 시 호출)
     * 메모리 누수 방지를 위해 반드시 호출해야 함
     */
    public static void clear() {
        tenantId.remove();
        branchId.remove();
        businessType.remove();
        bypassTenantFilter.remove();
    }
    
    /**
     * 모든 컨텍스트 정보 초기화 및 설정
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID
     */
    public static void set(String tenantId, String branchId) {
        setTenantId(tenantId);
        setBranchId(branchId);
    }
    
    /**
     * 모든 컨텍스트 정보 초기화 및 설정 (비즈니스 타입 포함)
     * 
     * @param tenantId 테넌트 UUID
     * @param branchId 지점 ID
     * @param businessType 비즈니스 타입
     */
    public static void set(String tenantId, String branchId, String businessType) {
        setTenantId(tenantId);
        setBranchId(branchId);
        setBusinessType(businessType);
    }
}

