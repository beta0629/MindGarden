package com.coresolution.consultation.dto.shop.admin;

import java.util.List;

/**
 * 구성 후보 목록. totalActive 가 0 이면 카탈로그가 비어 있고, items 만 비면 검색 결과가 없다.
 *
 * @param items 검색어에 맞는 후보
 * @param totalActive 검색어와 무관한 후보 전체 수
 * @author MindGarden
 * @since 2026-10-12
 */
public record ShopCompositionCandidateListResponse(List<ShopCompositionCandidateItem> items, int totalActive) {
}
