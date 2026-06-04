package com.coresolution.consultation.constant;

import java.util.Collections;
import java.util.Set;

/**
 * STAFF 역할 ERP 영역 차단 권한 코드 집합.
 *
 * <p>STAFF == ADMIN 동등 정책(1.0.5)에서, STAFF 가 ADMIN 자동 통과 분기에 포함될 때
 * ERP 영역만 통과하지 않도록 제외 집합을 정의한다. ERP 영역 컨트롤러는 별도로
 * {@code ERP_ACCESS} 등 동적 권한을 명시적으로 검사하므로, 본 상수는 권한 단락
 * (short-circuit) 분기에서만 사용한다.</p>
 *
 * <p>해당 권한들은 ERP 영역(Settlement, Accounting, Ledger, FinancialStatement,
 * Erp, FinancialTransaction*, SalaryBatch* 등) 게이트에서 사용되며 ADMIN 전용으로 유지한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-03
 */
public final class ErpRestrictedPermissions {

    /** ERP 접근 권한 — Settlement/Accounting/Ledger/FinancialStatement/Erp 컨트롤러 전용 게이트 */
    public static final String ERP_ACCESS = "ERP_ACCESS";

    /** ERP 대시보드 접근 권한 */
    public static final String ACCESS_ERP_DASHBOARD = "ACCESS_ERP_DASHBOARD";

    /** 통합 회계 시스템 접근 권한 */
    public static final String ACCESS_INTEGRATED_FINANCE = "ACCESS_INTEGRATED_FINANCE";

    /** 급여 관리 권한 — SalaryBatch/SalaryConfig/SalaryManagement 컨트롤러 게이트 */
    public static final String SALARY_MANAGE = "SALARY_MANAGE";

    /** 재무 거래 삭제 권한 — ADMIN 전용 */
    public static final String FINANCIAL_TRANSACTION_DELETE = "FINANCIAL_TRANSACTION_DELETE";

    /** STAFF 단락 통과에서 제외할 ERP 권한 코드 집합 */
    public static final Set<String> CODES = Set.of(
            ERP_ACCESS,
            ACCESS_ERP_DASHBOARD,
            ACCESS_INTEGRATED_FINANCE,
            SALARY_MANAGE,
            FINANCIAL_TRANSACTION_DELETE
    );

    private ErpRestrictedPermissions() {
        // 상수 클래스
    }

    /**
     * 주어진 권한 코드가 ERP 영역에 속해 STAFF 자동 통과에서 제외되어야 하는지 여부.
     *
     * @param permissionCode 권한 코드 (null 허용)
     * @return ERP 영역 권한이면 true
     */
    public static boolean isErpRestricted(String permissionCode) {
        if (permissionCode == null) {
            return false;
        }
        return CODES.contains(permissionCode);
    }

    /**
     * ERP 영역 권한 코드 집합 (불변).
     *
     * @return 불변 Set
     */
    public static Set<String> getCodes() {
        return Collections.unmodifiableSet(CODES);
    }
}
