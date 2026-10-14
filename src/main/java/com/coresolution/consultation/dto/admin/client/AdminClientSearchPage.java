package com.coresolution.consultation.dto.admin.client;

import java.util.List;

/**
 * 관리자 내담자 검색 페이지.
 *
 * @param items 결과
 * @param page 0부터 시작하는 페이지
 * @param size 페이지 크기
 * @param totalElements 전체 일치 건수
 * @author CoreSolution
 * @since 2026-10-12
 */
public record AdminClientSearchPage(List<AdminClientSearchItem> items, int page, int size, long totalElements) {
}
