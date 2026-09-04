package com.coresolution.consultation.constant;

import java.util.Collections;
import java.util.Set;

/**
 * STAFF 역할 ERP(운영재무) 영역 차단 권한 코드 집합.
 *
 * <p>STAFF == ADMIN 동등 정책에서 STAFF 가 ADMIN 자동 통과 분기에 포함될 때
 * 운영재무(돈) 영역만 통과하지 않도록 제외 집합을 정의한다. STAFF 에 대해
 * 본 집합 권한은 DB role_permissions 시드가 있어도 fail-closed 한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-03
 */
public final class ErpRestrictedPermissions {

    /** ERP 접근 권한 — Settlement/Accounting/Ledger/FinancialStatement/Erp 컨트롤러 전용 게이트 */
    public static final String ERP_ACCESS = "ERP_ACCESS";

    /** ERP 대시보드 접근 권한 (레거시 ACCESS_* / FE ERP_DASHBOARD_VIEW) */
    public static final String ACCESS_ERP_DASHBOARD = "ACCESS_ERP_DASHBOARD";

    public static final String ERP_DASHBOARD_VIEW = "ERP_DASHBOARD_VIEW";

    /** 통합 회계·재무 조회 */
    public static final String ACCESS_INTEGRATED_FINANCE = "ACCESS_INTEGRATED_FINANCE";

    public static final String INTEGRATED_FINANCE_VIEW = "INTEGRATED_FINANCE_VIEW";

    /** 급여 관리 권한 — SalaryBatch/SalaryConfig/SalaryManagement 컨트롤러 게이트 */
    public static final String SALARY_MANAGE = "SALARY_MANAGE";

    public static final String SALARY_VIEW = "SALARY_VIEW";

    public static final String SALARY_CALCULATE = "SALARY_CALCULATE";

    /** 재무 통계·거래 */
    public static final String FINANCIAL_VIEW = "FINANCIAL_VIEW";

    public static final String FINANCIAL_MANAGE = "FINANCIAL_MANAGE";

    public static final String FINANCIAL_TRANSACTION_DELETE = "FINANCIAL_TRANSACTION_DELETE";

    public static final String ANNUAL_FINANCIAL_REPORT_VIEW = "ANNUAL_FINANCIAL_REPORT_VIEW";

    /** ERP 하위 메뉴 권한 */
    public static final String TAX_MANAGE = "TAX_MANAGE";

    public static final String REFUND_MANAGE = "REFUND_MANAGE";

    public static final String PURCHASE_REQUEST_VIEW = "PURCHASE_REQUEST_VIEW";

    public static final String PURCHASE_REQUEST_MANAGE = "PURCHASE_REQUEST_MANAGE";

    public static final String APPROVAL_MANAGE = "APPROVAL_MANAGE";

    public static final String ITEM_MANAGE = "ITEM_MANAGE";

    public static final String BUDGET_MANAGE = "BUDGET_MANAGE";

    /** STAFF 단락 통과·DB 우회에서 제외할 ERP 권한 코드 집합 */
    public static final Set<String> CODES = Set.of(
            ERP_ACCESS,
            ACCESS_ERP_DASHBOARD,
            ERP_DASHBOARD_VIEW,
            ACCESS_INTEGRATED_FINANCE,
            INTEGRATED_FINANCE_VIEW,
            SALARY_MANAGE,
            SALARY_VIEW,
            SALARY_CALCULATE,
            FINANCIAL_VIEW,
            FINANCIAL_MANAGE,
            FINANCIAL_TRANSACTION_DELETE,
            ANNUAL_FINANCIAL_REPORT_VIEW,
            TAX_MANAGE,
            REFUND_MANAGE,
            PURCHASE_REQUEST_VIEW,
            PURCHASE_REQUEST_MANAGE,
            APPROVAL_MANAGE,
            ITEM_MANAGE,
            BUDGET_MANAGE
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
