package com.coresolution.consultation.dto.shop;

import java.util.List;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 장바구니 전체 교체 요청.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopCartReplaceRequest {

    @NotNull
    @Valid
    @Size(max = ShopCheckoutConstants.MAX_CART_LINES)
    private List<ShopCartLineRequest> lines;
}
