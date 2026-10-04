package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import com.coresolution.consultation.constant.admin.AdminBulkMappingConstants;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link BulkMappingIdsParser} — JSON 숫자 형식 차이로 인한 캐스팅 500 회귀와 형식 거부(400) 경계.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("BulkMappingIdsParser — mappingIds 안전 변환")
class BulkMappingIdsParserTest {

    private static final int MAX = AdminBulkMappingConstants.MAX_MAPPING_IDS_PER_REQUEST;

    @Test
    @DisplayName("Integer·Long·BigInteger·숫자 문자열(앞뒤 공백) 모두 Long 으로 변환")
    void acceptsNumericVariants() {
        List<Long> ids = BulkMappingIdsParser.parse(
                List.of(1, 2L, BigInteger.valueOf(3), " 4 ", (short) 5, (byte) 6, "9223372036854775"), MAX);
        assertThat(ids).containsExactly(1L, 2L, 3L, 4L, 5L, 6L, 9223372036854775L);
    }

    @Test
    @DisplayName("같은 id 가 다른 형식으로 중복돼도 처음 순서대로 한 번만")
    void dedupesPreservingOrder() {
        assertThat(BulkMappingIdsParser.parse(List.of(7, "3", 7L, 3, BigInteger.valueOf(7)), MAX))
                .containsExactly(7L, 3L);
    }

    @Test
    @DisplayName("목록 아님·빈 목록 거부")
    void rejectsMissingOrEmpty() {
        for (Object raw : new Object[] {null, "1", 1, java.util.Map.of("a", 1), List.of()}) {
            assertThatThrownBy(() -> BulkMappingIdsParser.parse(raw, MAX)).as(String.valueOf(raw))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test
    @DisplayName("소수·불리언·null 원소·숫자 아닌 문자열·0 이하·long 초과 거부")
    void rejectsInvalidElements() {
        Object[] invalid = {1.0, 1.5f, true, null, "x", "", "1e3", "-1", "+1", "1.0", 0, -1, -5L, "0",
            new BigInteger("9223372036854775808"), "1234567890123456789", new java.math.BigDecimal("1")};
        for (Object element : invalid) {
            List<Object> raw = new ArrayList<>(Arrays.asList(1L, element));
            assertThatThrownBy(() -> BulkMappingIdsParser.parse(raw, MAX)).as(String.valueOf(element))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Test
    @DisplayName("최대 개수는 중복 제거 전 원본 개수 기준 — 경계값 허용, 초과 거부")
    void enforcesMaxSizeOnRawList() {
        List<Object> atMax = new ArrayList<>();
        for (int i = 0; i < MAX; i++) {
            atMax.add(1);
        }
        assertThat(BulkMappingIdsParser.parse(atMax, MAX)).containsExactly(1L);
        atMax.add(1);
        assertThatThrownBy(() -> BulkMappingIdsParser.parse(atMax, MAX))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(String.valueOf(MAX));
    }
}
