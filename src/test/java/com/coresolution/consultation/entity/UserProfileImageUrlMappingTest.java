package com.coresolution.consultation.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Field;

import jakarta.persistence.Column;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link User#profileImageUrl} 컬럼 매핑 회귀 — V20260609_002 Flyway 마이그레이션 정합.
 *
 * <p>P0 base64 핫픽스 (PR #166/#167/#168) 후속 구조적 가드. profile_image_url 컬럼이
 * 다시 LONGTEXT 등으로 확장되지 않도록 entity 매핑을 리플렉션으로 잠근다.</p>
 *
 * <p>관련 마이그레이션: V20260609_002__users_profile_image_url_varchar500.sql.
 * 관련 가이드: docs/project-management/2026-06-09/PROFILE_IMAGE_UPLOAD_OPS_GUIDE.md §5.</p>
 *
 * @author CoreSolution
 * @since 2026-06-09
 */
@DisplayName("User.profileImageUrl — varchar(500) 매핑 회귀 (P0 base64 후속 구조적 가드)")
class UserProfileImageUrlMappingTest {

    @Test
    @DisplayName("@Column(name=profile_image_url, length=500) 이며 columnDefinition 빈값 (LONGTEXT 회귀 방지)")
    void profileImageUrl_mapping_locked_to_varchar500() throws Exception {
        Field field = User.class.getDeclaredField("profileImageUrl");
        assertThat(field.getType()).isEqualTo(String.class);

        Column column = field.getAnnotation(Column.class);
        assertThat(column).as("@Column 어노테이션 필요").isNotNull();
        assertThat(column.name()).isEqualTo("profile_image_url");
        assertThat(column.length())
                .as("V20260609_002 로 longtext → varchar(500) 축소. 다시 늘리려면 별도 운영 합의·마이그레이션 필요.")
                .isEqualTo(500);
        assertThat(column.columnDefinition())
                .as("columnDefinition 이 비어 있어야 length 가 실제 DDL 에 반영됨. LONGTEXT/TEXT 등으로 우회 금지.")
                .isEmpty();
    }
}
