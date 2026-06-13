package com.coresolution.consultation.entity;

import java.lang.reflect.Field;

import jakarta.persistence.Column;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * PR-A — User.branch ManyToOne 매핑 제거 회귀 테스트.
 *
 * <p>PR-7 (#284) 의 {@code branches → branches_dropped_20260612} RENAME 후
 * 06-13 자정 배치·로그인 회귀가 발생한 근본 원인이 User.branch LAZY proxy 였다.
 * 본 테스트는 다음을 보장한다:
 *
 * <ul>
 *   <li>User 엔티티에 Branch 타입 필드가 더 이상 존재하지 않는다 (ManyToOne 제거)</li>
 *   <li>대신 {@code Long branchId} 단순 컬럼 매핑이 존재한다 (운영 DB users.branch_id 보존)</li>
 *   <li>Lombok 이 생성하는 getBranchId / setBranchId 가 정상 동작한다</li>
 *   <li>UserBuilder.branchId(Long) 가 존재한다 (DTO/Service 호출처 호환)</li>
 *   <li>레거시 getBranch / setBranch / branch 빌더 메서드는 더 이상 존재하지 않는다</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-13
 */
@DisplayName("PR-A — User.branch ManyToOne 매핑 제거 회귀 테스트")
class UserBranchMappingRemovalTest {

    @Test
    @DisplayName("User 엔티티에 Branch 타입 필드가 존재하지 않는다 (ManyToOne 제거)")
    void userEntity_doesNotDeclareBranchManyToOneField() {
        for (Field field : User.class.getDeclaredFields()) {
            assertThat(field.getType())
                    .as("User 필드 %s 가 Branch 타입을 보유 — ManyToOne 매핑이 제거되지 않음", field.getName())
                    .isNotEqualTo(Branch.class);
        }
    }

    @Test
    @DisplayName("User 엔티티는 Long branchId 단순 컬럼 매핑을 보유한다 (DB 컬럼 보존)")
    void userEntity_declaresBranchIdLongColumn() throws Exception {
        Field branchIdField = User.class.getDeclaredField("branchId");
        assertThat(branchIdField.getType())
                .as("branchId 필드 타입은 Long 이어야 함 (단순 값 매핑)")
                .isEqualTo(Long.class);
        assertThat(branchIdField.isAnnotationPresent(Column.class))
                .as("branchId 필드는 @Column 매핑")
                .isTrue();
        assertThat(branchIdField.getAnnotation(Column.class).name())
                .as("branchId 필드 컬럼명은 운영 DB 컬럼 'branch_id' 와 일치")
                .isEqualTo("branch_id");
        assertThat(branchIdField.isAnnotationPresent(ManyToOne.class))
                .as("branchId 필드에 ManyToOne 매핑이 있으면 안 됨 (단순 값)")
                .isFalse();
        assertThat(branchIdField.isAnnotationPresent(JoinColumn.class))
                .as("branchId 필드에 JoinColumn 이 있으면 안 됨 (단순 값)")
                .isFalse();
    }

    @Test
    @DisplayName("getBranchId / setBranchId 가 동작하고, 레거시 getBranch / setBranch 는 제거됐다")
    void userEntity_exposesBranchIdAccessors_andRemovesLegacyBranchAccessors() throws Exception {
        User user = new User();
        user.setBranchId(123L);
        assertThat(user.getBranchId()).isEqualTo(123L);
        user.setBranchId(null);
        assertThat(user.getBranchId()).isNull();

        assertThat(hasMethod(User.class, "getBranch"))
                .as("레거시 getBranch() 메서드는 제거되어야 함 (Lombok @Data 생성 차단 확인)")
                .isFalse();
        assertThat(hasMethod(User.class, "setBranch", Branch.class))
                .as("레거시 setBranch(Branch) 메서드는 제거되어야 함")
                .isFalse();
    }

    @Test
    @DisplayName("UserBuilder 는 branchId(Long) 만 노출하고 branch(Branch) 는 제거된다")
    void userBuilder_exposesBranchIdOnly() {
        Class<?> builderClass = User.builder().getClass();

        assertThat(hasMethod(builderClass, "branchId", Long.class))
                .as("UserBuilder.branchId(Long) 메서드 존재")
                .isTrue();
        assertThat(hasMethod(builderClass, "branch", Branch.class))
                .as("UserBuilder.branch(Branch) 는 제거되어야 함 (PR-7 회귀 차단)")
                .isFalse();
    }

    private static boolean hasMethod(Class<?> clazz, String name, Class<?>... parameterTypes) {
        try {
            clazz.getMethod(name, parameterTypes);
            return true;
        } catch (NoSuchMethodException e) {
            return false;
        }
    }
}
