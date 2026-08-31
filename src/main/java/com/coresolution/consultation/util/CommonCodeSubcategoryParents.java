package com.coresolution.consultation.util;

import java.util.Collections;
import java.util.Map;
import java.util.function.BiPredicate;

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

    /** 상위 카테고리가 대상 그룹에 없을 때 fail-closed 메시지. */
    public static final String MSG_PARENT_NOT_FOUND =
            "상위 카테고리 코드가 존재하지 않습니다. EXPENSE_CATEGORY/INCOME_CATEGORY에 등록된 코드값을 선택하세요.";

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
     * 상위 그룹·값 형식 검증 후, 부모가 대상 그룹에 실제 존재하는지 fail-closed 검증.
     *
     * @param codeGroup     편집 중인 코드의 그룹
     * @param parentGroup   요청 상위 그룹
     * @param parentValue   요청 상위 코드값
     * @param parentExists  tenant 또는 core 폴백에 활성 부모가 있으면 true
     */
    public static void requireValidParent(
            String codeGroup,
            String parentGroup,
            String parentValue,
            boolean parentExists) {
        requireValidParent(codeGroup, parentGroup, parentValue);
        if (!isSubcategoryGroup(codeGroup)) {
            return;
        }
        if (!parentExists) {
            throw new IllegalArgumentException(MSG_PARENT_NOT_FOUND);
        }
    }

    /**
     * 상위 존재 여부를 {@code parentExistsCheck(parentGroup, parentValue)} 로 확인한다.
     *
     * @param codeGroup          편집 중인 코드의 그룹
     * @param parentGroup        요청 상위 그룹
     * @param parentValue        요청 상위 코드값
     * @param parentExistsCheck  (parentGroup, parentValue) → 존재 여부
     */
    public static void requireValidParent(
            String codeGroup,
            String parentGroup,
            String parentValue,
            BiPredicate<String, String> parentExistsCheck) {
        requireValidParent(codeGroup, parentGroup, parentValue);
        if (!isSubcategoryGroup(codeGroup)) {
            return;
        }
        boolean exists = parentExistsCheck != null
                && parentExistsCheck.test(parentGroup, parentValue);
        if (!exists) {
            throw new IllegalArgumentException(MSG_PARENT_NOT_FOUND);
        }
    }

    /**
     * 읽기 전용 매핑 (테스트·참조용).
     */
    public static Map<String, String> subcategoryToParentGroupView() {
        return Collections.unmodifiableMap(SUB_TO_PARENT);
    }
}
