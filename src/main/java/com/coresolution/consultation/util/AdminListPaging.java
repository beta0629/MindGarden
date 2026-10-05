package com.coresolution.consultation.util;

import java.util.Collections;
import java.util.List;

import com.coresolution.consultation.dto.AdminListPageResult;
import com.coresolution.core.util.PaginationUtils;

/**
 * 어드민 목록 API page/size 공통 규칙 (FE {@code adminListFetch.js} 와 정합).
 *
 * <p>page/size 가 없으면 기본값(0 / {@link PaginationUtils#DEFAULT_PAGE_SIZE})으로 강제하고,
 * size 는 {@link #MAX_PAGE_SIZE} 로 캡한다. 전체 dump 응답은 만들지 않는다.</p>
 *
 * <p>{@link #slice} 는 필터 후 메모리 목록을 페이지로 자를 때 쓴다. {@code count} 는 필터 후 전체 건수다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
public final class AdminListPaging {

    /** 어드민 목록 최대 페이지 크기 — FE {@code ADMIN_LIST_DRAIN_PAGE_SIZE} 와 동일. */
    public static final int MAX_PAGE_SIZE = 200;

    private AdminListPaging() {
    }

    /**
     * @param page 요청 page (0-based), null → 0
     * @param size 요청 size, null → {@link PaginationUtils#DEFAULT_PAGE_SIZE}, 상한 {@link #MAX_PAGE_SIZE}
     * @return 정규화된 [page, size]
     */
    public static int[] resolve(Integer page, Integer size) {
        int validPage = Math.max(0, page != null ? page : 0);
        int requested = size != null ? size : PaginationUtils.DEFAULT_PAGE_SIZE;
        int validSize = Math.min(Math.max(1, requested), MAX_PAGE_SIZE);
        return new int[] {validPage, validSize};
    }

    /**
     * 전체 목록을 page/size 로 자른다.
     *
     * @param all  필터 적용된 전체 목록 (null → empty)
     * @param page 요청 page
     * @param size 요청 size
     * @param <T>  항목 타입
     * @return 현재 페이지 + 전체 건수
     */
    public static <T> AdminListPageResult<T> slice(List<T> all, Integer page, Integer size) {
        List<T> source = all != null ? all : Collections.emptyList();
        int[] resolved = resolve(page, size);
        long from = (long) resolved[0] * resolved[1];
        if (from >= source.size()) {
            return new AdminListPageResult<>(Collections.emptyList(), source.size());
        }
        int to = (int) Math.min(source.size(), from + resolved[1]);
        return new AdminListPageResult<>(source.subList((int) from, to), source.size());
    }
}
