package com.coresolution.consultation.dto.shop.admin;

import java.time.LocalDate;

/**
 * 어드민 온라인 주문 목록 조회 조건.
 *
 * @param page    0-based 페이지
 * @param size    페이지 크기
 * @param segment 세그먼트 ({@code ALL} 또는 상태, null 이면 전체)
 * @param from    주문 일시 시작일 (포함, null 이면 제한 없음)
 * @param to      주문 일시 종료일 (미포함, null 이면 제한 없음)
 * @param query   주문번호·내담자·상품 검색어 (null 가능)
 * @author MindGarden
 * @since 2026-09-29
 */
public record ShopOrderAdminListQuery(
        int page,
        int size,
        String segment,
        LocalDate from,
        LocalDate to,
        String query
) {
}
