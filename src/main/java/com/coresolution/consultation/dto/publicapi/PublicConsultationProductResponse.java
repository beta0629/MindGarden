package com.coresolution.consultation.dto.publicapi;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 센터 홈페이지용 공개 상담 상품(ShopCatalogSku SSOT) 응답 항목.
 * <p>DB PK·consultantId·개인정보·원가 등은 노출하지 않는다.</p>
 *
 * @param skuCode SKU 코드
 * @param name 상품명({@code title})
 * @param price 정상 단가(원, unitPriceMinor)
 * @param eventPrice 이벤트 단가(기간 내일 때만). 없으면 null
 * @param eventStartDate 이벤트 시작일(기간 내일 때만). 없으면 null
 * @param eventEndDate 이벤트 종료일(기간 내일 때만). 없으면 null
 * @param sessionCount 회기 수
 * @param sessionMinutes 회기당 분. 없으면 null
 * @param displayOrder 정렬 순서({@code sortOrder})
 * @param updatedAt 최종 수정 시각
 * @author MindGarden
 * @since 2026-11-11
 */
public record PublicConsultationProductResponse(
        String skuCode,
        String name,
        long price,
        Long eventPrice,
        LocalDate eventStartDate,
        LocalDate eventEndDate,
        int sessionCount,
        Integer sessionMinutes,
        int displayOrder,
        LocalDateTime updatedAt
) {
}
