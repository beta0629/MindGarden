package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link CommonCodeSubcategoryParents} — orphan 부모 fail-closed.
 *
 * @author CoreSolution
 * @since 2026-08-31
 */
@DisplayName("CommonCodeSubcategoryParents 검증")
class CommonCodeSubcategoryParentsTest {

    @Test
    @DisplayName("하위 카테고리: 부모 값 없으면 예외")
    void requireValidParent_blankParentValue_throws() {
        assertThatThrownBy(() ->
                CommonCodeSubcategoryParents.requireValidParent(
                        "EXPENSE_SUBCATEGORY", "EXPENSE_CATEGORY", "  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("상위 카테고리");
    }

    @Test
    @DisplayName("하위 카테고리: 부모 그룹 불일치면 예외")
    void requireValidParent_wrongParentGroup_throws() {
        assertThatThrownBy(() ->
                CommonCodeSubcategoryParents.requireValidParent(
                        "EXPENSE_SUBCATEGORY", "INCOME_CATEGORY", "OTHER"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("상위 코드 그룹");
    }

    @Test
    @DisplayName("하위 카테고리: 부모 미존재(orphan)면 fail-closed")
    void requireValidParent_orphanParent_throws() {
        assertThatThrownBy(() ->
                CommonCodeSubcategoryParents.requireValidParent(
                        "EXPENSE_SUBCATEGORY", "EXPENSE_CATEGORY", "상담료", false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(CommonCodeSubcategoryParents.MSG_PARENT_NOT_FOUND);
    }

    @Test
    @DisplayName("하위 카테고리: 부모 존재하면 통과")
    void requireValidParent_existingParent_ok() {
        CommonCodeSubcategoryParents.requireValidParent(
                "EXPENSE_SUBCATEGORY", "EXPENSE_CATEGORY", "OTHER", true);
        CommonCodeSubcategoryParents.requireValidParent(
                "EXPENSE_SUBCATEGORY",
                "EXPENSE_CATEGORY",
                "OTHER",
                (pg, pv) -> "EXPENSE_CATEGORY".equals(pg) && "OTHER".equals(pv));
    }

    @Test
    @DisplayName("EXPENSE_SUBCATEGORY 기대 부모 그룹은 EXPENSE_CATEGORY")
    void expectedParentGroup_expenseSub() {
        assertThat(CommonCodeSubcategoryParents.expectedParentGroup("EXPENSE_SUBCATEGORY"))
                .isEqualTo("EXPENSE_CATEGORY");
        assertThat(CommonCodeSubcategoryParents.isSubcategoryGroup("EXPENSE_CATEGORY")).isFalse();
    }
}
