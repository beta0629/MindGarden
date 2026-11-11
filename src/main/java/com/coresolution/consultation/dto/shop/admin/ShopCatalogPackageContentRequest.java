package com.coresolution.consultation.dto.shop.admin;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * 온라인 상품 내용 저장. 상품명·단가·회기·카테고리는 받지 않는다.
 *
 * @param descriptionText 카탈로그 설명
 * @param catalogVisible 온라인 노출
 * @param sortOrder 정렬 순서
 * @param catalogCategory CONSULTATION 또는 ASSESSMENT
 * @param fieldCode 분야 공통코드. CONSULTATION 은 SPECIALTY, ASSESSMENT 는 ASSESSMENT_TYPE
 * @param consultantId 상담사 users.id. CONSULTATION 필수, ASSESSMENT 는 무시
 * @param validityMonths 사용 기한(개월). 1 이상 정수, 상한 없음, null 이면 기한 없음
 * @param eventPriceMinor 이벤트 단가(원). null 이면 이벤트 가격 없음
 * @param eventStartDate 이벤트 시작일
 * @param eventEndDate 이벤트 종료일
 * @param eventOnly 이벤트 기간에만 공개
 * @param sessionMinutes 회기당 분. null 이면 미지정
 * @author MindGarden
 * @since 2026-09-24
 */
public record ShopCatalogPackageContentRequest(
        @Size(max = 4000) String descriptionText,
        boolean catalogVisible,
        @PositiveOrZero int sortOrder,
        @Size(max = 32) String catalogCategory,
        @Size(max = 50) String fieldCode,
        Long consultantId,
        @Positive Integer validityMonths,
        Long eventPriceMinor,
        LocalDate eventStartDate,
        LocalDate eventEndDate,
        boolean eventOnly,
        Integer sessionMinutes
) {
}
