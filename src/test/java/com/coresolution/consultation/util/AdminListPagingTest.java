package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import com.coresolution.consultation.dto.AdminListPageResult;
import com.coresolution.core.util.PaginationUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link AdminListPaging} — page/size 강제·상한·경계.
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
class AdminListPagingTest {

    private static final List<Integer> ALL = IntStream.range(0, 45).boxed().collect(Collectors.toList());

    @Test
    @DisplayName("page/size 없으면 기본값으로 강제 — 전체 dump 금지")
    void defaultsWhenMissing() {
        AdminListPageResult<Integer> result = AdminListPaging.slice(ALL, null, null);
        assertThat(result.getContent()).hasSize(PaginationUtils.DEFAULT_PAGE_SIZE);
        assertThat(result.getTotalCount()).isEqualTo(45);
    }

    @Test
    @DisplayName("size 상한 200, 음수 page/size 는 보정")
    void capsAndClamps() {
        assertThat(AdminListPaging.resolve(-3, 100_000)).containsExactly(0, AdminListPaging.MAX_PAGE_SIZE);
        assertThat(AdminListPaging.resolve(2, 0)).containsExactly(2, 1);
    }

    @Test
    @DisplayName("마지막 페이지·범위 밖 페이지")
    void lastAndBeyond() {
        assertThat(AdminListPaging.slice(ALL, 2, 20).getContent()).containsExactly(40, 41, 42, 43, 44);
        AdminListPageResult<Integer> beyond = AdminListPaging.slice(ALL, Integer.MAX_VALUE, 200);
        assertThat(beyond.getContent()).isEmpty();
        assertThat(beyond.getTotalCount()).isEqualTo(45);
        assertThat(AdminListPaging.slice(null, 0, 20).getTotalCount()).isZero();
    }
}
