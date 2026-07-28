package com.coresolution.consultation.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 내담자별 패키지 결제 이력 API 응답.
 *
 * @author MindGarden
 * @since 2026-07-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientPackagePaymentHistoryResponse {

    /** 합산 요약 */
    private PackagePaymentHistorySummaryResponse summary;

    /** 최신순 타임라인 */
    @Builder.Default
    private List<PackagePaymentHistoryItemResponse> items = new ArrayList<>();
}
