package com.coresolution.consultation.constant;

import java.util.Set;

/**
 * 비용·수입 카테고리 공통코드 운영 SSOT 상수.
 * <p>
 * 테넌트에 해당 그룹 행이 있으면 tenant-only 로 list/read/write/delete 한다.
 * core 는 부트스트랩·미시드 폴백 원천이며 hybrid 동시 노출 금지.
 * </p>
 *
 * @author MindGarden
 * @since 2026-08-31
 */
public final class ExpenseCommonCodeSsotConstants {

    public static final String GROUP_EXPENSE_CATEGORY = "EXPENSE_CATEGORY";
    public static final String GROUP_EXPENSE_SUBCATEGORY = "EXPENSE_SUBCATEGORY";
    public static final String GROUP_INCOME_CATEGORY = "INCOME_CATEGORY";
    public static final String GROUP_INCOME_SUBCATEGORY = "INCOME_SUBCATEGORY";

    /**
     * 테넌트 행이 있으면 hybrid(core∪tenant) 대신 tenant-only.
     * 0건이면 core 읽기 전용 폴백.
     */
    public static final Set<String> TENANT_OPERATIONAL_SSOT_GROUPS = Set.of(
            GROUP_EXPENSE_CATEGORY,
            GROUP_EXPENSE_SUBCATEGORY,
            GROUP_INCOME_CATEGORY,
            GROUP_INCOME_SUBCATEGORY
    );

    /** 재무 거래 category 컬럼에 매핑되는 루트 그룹. */
    public static final Set<String> LEDGER_CATEGORY_GROUPS = Set.of(
            GROUP_EXPENSE_CATEGORY,
            GROUP_INCOME_CATEGORY
    );

    /** 재무 거래 subcategory 컬럼에 매핑되는 자식 그룹. */
    public static final Set<String> LEDGER_SUBCATEGORY_GROUPS = Set.of(
            GROUP_EXPENSE_SUBCATEGORY,
            GROUP_INCOME_SUBCATEGORY
    );

    public static final String MSG_CODE_IN_USE_BY_LEDGER =
            "재무 거래에서 사용 중인 코드입니다. 삭제할 수 없습니다.";

    public static final String MSG_CODE_HAS_CHILD_SUBCATEGORIES =
            "하위 카테고리가 있어 삭제할 수 없습니다. 하위 코드를 먼저 삭제해 주세요.";

    private ExpenseCommonCodeSsotConstants() {
    }

    /**
     * @param codeGroup 코드 그룹
     * @return 운영 SSOT(tenant-first) 그룹이면 true
     */
    public static boolean isTenantOperationalSsotGroup(String codeGroup) {
        return codeGroup != null && TENANT_OPERATIONAL_SSOT_GROUPS.contains(codeGroup);
    }
}
