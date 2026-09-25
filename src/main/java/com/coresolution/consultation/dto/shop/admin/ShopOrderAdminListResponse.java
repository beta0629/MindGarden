package com.coresolution.consultation.dto.shop.admin;

import java.util.Collections;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 온라인 주문 목록 페이징 응답.
 *
 * @author MindGarden
 * @since 2026-09-25
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderAdminListResponse {

    /** 현재 페이지 주문 요약 */
    @Builder.Default
    private List<ShopOrderAdminSummaryItem> orders = Collections.emptyList();

    /** 전체 건수 (페이지 길이 아님) */
    private long totalElements;

    /** 0-based 페이지 번호 */
    private int page;

    /** 페이지 크기 */
    private int size;
}
