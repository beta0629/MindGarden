package com.coresolution.consultation.dto;

import java.util.Collections;
import java.util.List;

/**
 * 어드민 목록 API용 DB 페이징 결과 (content + totalCount).
 *
 * <p>Controller envelope {@code count} 에 {@link #getTotalCount()} 를 넣고,
 * 본문 배열에는 {@link #getContent()} 만 넣는다.</p>
 *
 * @param <T> 목록 항목 타입
 * @author CoreSolution
 * @since 2026-09-23
 */
public final class AdminListPageResult<T> {

    private final List<T> content;
    private final long totalCount;

    /**
     * @param content    현재 페이지 항목 (null → empty)
     * @param totalCount 필터 적용 후 전체 건수
     */
    public AdminListPageResult(List<T> content, long totalCount) {
        this.content = content != null ? List.copyOf(content) : Collections.emptyList();
        this.totalCount = Math.max(0L, totalCount);
    }

    /**
     * @return 현재 페이지 항목 (불변)
     */
    public List<T> getContent() {
        return content;
    }

    /**
     * @return DB 기준 전체 건수
     */
    public long getTotalCount() {
        return totalCount;
    }
}
