package com.coresolution.consultation.dto.shop.admin;

import java.util.List;
import java.util.Map;

/**
 * 어드민 「상품」 통합 목록 (서버 page/size).
 *
 * @param products      현재 페이지 행
 * @param totalElements 세그먼트·검색 적용 후 전체 건수
 * @param page          0-based 페이지
 * @param size          페이지 크기
 * @param counts        세그먼트별 건수 (검색 적용, 세그먼트 미적용)
 * @author MindGarden
 * @since 2026-09-29
 */
public record ShopAdminProductListResponse(
        List<ShopAdminProductItem> products,
        long totalElements,
        int page,
        int size,
        Map<String, Long> counts
) {
}
