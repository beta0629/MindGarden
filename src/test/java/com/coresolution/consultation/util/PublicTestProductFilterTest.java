package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 공개 상품에서 테스트·샘플을 빼는지.
 *
 * @author CoreSolution
 * @since 2026-10-01
 */
@DisplayName("PublicTestProductFilter")
class PublicTestProductFilterTest {

    @Test
    @DisplayName("테스트·샘플·TEST_·SAMPLE·isTest·publicVisible false 는 제외하고 정상 상품은 남긴다")
    void excludesTestLikeProducts() {
        assertThat(PublicTestProductFilter.isExcluded("테스트 상품", "PKG", Map.of())).isTrue();
        assertThat(PublicTestProductFilter.isExcluded("샘플 상담", "PKG", Map.of())).isTrue();
        assertThat(PublicTestProductFilter.isExcluded("단회기", "TEST_ONCE", Map.of())).isTrue();
        assertThat(PublicTestProductFilter.isExcluded("단회기", "SAMPLE-1", Map.of())).isTrue();
        assertThat(PublicTestProductFilter.isExcluded("단회기", "PKG", Map.of("isTest", true))).isTrue();
        assertThat(PublicTestProductFilter.isExcluded("단회기", "PKG", Map.of("publicVisible", false))).isTrue();
        assertThat(PublicTestProductFilter.isExcluded("10회 패키지", "PKG10", Map.of("publicVisible", true))).isFalse();
    }
}
