package com.coresolution.consultation.util;

import java.util.Collections;
import java.util.Map;

/**
 * 지출/수입 하위 카테고리와 상위 카테고리 그룹 매핑 및 검증.
 *
 * @author CoreSolution
 * @since 2026-04-08
 */
public final class CommonCodeSubcategoryParents {

    private static final Map<String, String> SUB_TO_PARENT = Map.of(
        "EXPENSE_SUBCATEGORY", "EXPENSE_CATEGORY",
        "INCOME_SUBCATEGORY", "INCOME_CATEGORY"
    );

    private CommonCodeSubcategoryParents() {
    }

    /**
     * @param codeGroup 코드 그룹
     * @return 하위 카테고리 그룹이면 상위 그룹명, 아니면 null
     */
    public static String expectedParentGroup(String codeGroup) {
        if (codeGroup == null) {
            return null;
        }
        return SUB_TO_PARENT.get(codeGroup);
    }

    /**
     * @param codeGroup 코드 그룹
     * @return 하위 카테고리형 그룹 여부
     */
    public static boolean isSubcategoryGroup(String codeGroup) {
        return codeGroup != null && SUB_TO_PARENT.containsKey(codeGroup);
    }

    /**
     * 하위 카테고리인 경우 상위 그룹·코드값 필수 및 그룹 일치 검증.
     *
     * @param codeGroup    편집 중인 코드의 그룹
     * @param parentGroup  요청 상위 그룹
     * @param parentValue  요청 상위 코드값
     */
    public static void requireValidParent(String codeGroup, String parentGroup, String parentValue) {
        if (!isSubcategoryGroup(codeGroup)) {
            return;
        }
        String expected = expectedParentGroup(codeGroup);
        if (parentValue == null || parentValue.isBlank()) {
            throw new IllegalArgumentException("하위 카테고리에는 상위 카테고리(코드값)가 필요합니다.");
        }
        if (parentGroup == null || parentGroup.isBlank() || !expected.equals(parentGroup)) {
            throw new IllegalArgumentException("상위 코드 그룹이 올바르지 않습니다. 기대: " + expected);
        }
    }

    /**
     * 읽기 전용 매핑 (테스트·참조용).
     */
    public static Map<String, String> subcategoryToParentGroupView() {
        return Collections.unmodifiableMap(SUB_TO_PARENT);
    }
}
