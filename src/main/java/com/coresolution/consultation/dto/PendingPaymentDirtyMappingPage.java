package com.coresolution.consultation.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 옵션 B R4 — 디러티 PENDING_PAYMENT 매핑 페이지 응답 DTO.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingPaymentDirtyMappingPage {

    private List<PendingPaymentDirtyMappingItem> items;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;
    private long ageHours;
}
