package com.coresolution.consultation.dto.shop;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 체크아웃 요청 (멱등 키·포인트 사용 원).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopCheckoutRequest {

    @NotBlank
    @Size(max = 128)
    private String idempotencyKey;

    @Min(0)
    @Builder.Default
    private long pointsToRedeemMinor = 0L;

    /**
     * CONSULTATION 주문 라인용 {@code consultant_client_mapping_id} 오버라이드 (선택).
     * 미지정 시 서버가 내담자 활성 매핑 1건을 조회한다.
     */
    private Long consultantClientMappingId;
}
