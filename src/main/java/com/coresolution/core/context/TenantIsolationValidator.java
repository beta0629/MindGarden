package com.coresolution.core.context;

/**
 * ERP·회계 등 테넌트 격리 필수 영역에서 tenantId 검증용 유틸.
 * 조회·저장 전에 호출하여 tenantId가 null/빈값이면 예외를 던진다.
 *
 * @author CoreSolution
 * @since 2025-03-14
 */
public final class TenantIsolationValidator {

    private TenantIsolationValidator() {
    }

    /**
     * tenantId가 null이거나 빈 문자열이면 IllegalStateException 발생.
     * ERP 회계 서비스(Ledger, FinancialStatement, Accounting)에서
     * Repository 호출 전에 호출하여 WHERE tenant_id 조건 누락을 방지한다.
     *
     * @param tenantId 검증할 테넌트 ID
     * @throws IllegalStateException tenantId가 null이거나 빈 문자열일 때
     */
    public static void requireTenantId(String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            throw new IllegalStateException("tenantId는 필수입니다. 조회·저장 시 tenant_id 조건이 누락될 수 없습니다.");
        }
    }

    /**
     * 현재 컨텍스트의 tenantId와 인자 tenantId가 일치하는지 검증.
     * 일치하지 않으면 IllegalStateException 발생.
     *
     * @param tenantId 비즈니스 로직에 사용할 테넌트 ID
     * @throws IllegalStateException 컨텍스트 tenantId가 null이거나 인자와 다를 때
     */
    public static void requireTenantIdMatch(String tenantId) {
        requireTenantId(tenantId);
        String current = TenantContextHolder.getTenantId();
        if (current == null || !current.equals(tenantId)) {
            throw new IllegalStateException("테넌트 ID 불일치");
        }
    }
}
