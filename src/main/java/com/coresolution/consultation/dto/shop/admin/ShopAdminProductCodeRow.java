package com.coresolution.consultation.dto.shop.admin;

/**
 * 상품 행의 공통코드 원본 (가격·회기·홈 공개·판매 사용).
 *
 * @param id              공통코드 id
 * @param codeValue       패키지 코드
 * @param codeLabel       코드 라벨
 * @param koreanName      한글명
 * @param codeDescription 설명
 * @param isActive        판매 사용
 * @param extraData       extraData JSON
 * @param sortOrder       정렬
 * @author MindGarden
 * @since 2026-09-29
 */
public record ShopAdminProductCodeRow(
        Long id,
        String codeValue,
        String codeLabel,
        String koreanName,
        String codeDescription,
        Boolean isActive,
        String extraData,
        Integer sortOrder
) {
}
