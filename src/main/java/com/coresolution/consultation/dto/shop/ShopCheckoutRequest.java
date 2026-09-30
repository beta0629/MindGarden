package com.coresolution.consultation.dto.shop;

import java.util.List;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 체크아웃 요청 (멱등 키·포인트 사용 원·바로 구매 라인).
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

    /**
     * 바로 구매 라인 (선택). 비어 있지 않으면 장바구니를 읽거나 바꾸지 않고 이 SKU 로만 주문을 만든다.
     * 한 상품만 허용한다.
     */
    @Valid
    @Size(max = ShopCheckoutConstants.MAX_BUY_NOW_LINES)
    private List<ShopCartLineRequest> lines;
}
