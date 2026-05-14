package com.coresolution.consultation.dto.shop;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 장바구니 라인 요청.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopCartLineRequest {

    @NotBlank
    @Size(max = 64)
    private String skuCode;

    @Min(1)
    @Max(ShopCheckoutConstants.MAX_LINE_QUANTITY)
    private int quantity;
}
