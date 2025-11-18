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
     * ThreadLocal 정리 (요청 종료 시 호출)
     * 메모리 누수 방지를 위해 반드시 호출해야 함
     */
    public static void clear() {
        tenantId.remove();
        branchId.remove();
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
}

