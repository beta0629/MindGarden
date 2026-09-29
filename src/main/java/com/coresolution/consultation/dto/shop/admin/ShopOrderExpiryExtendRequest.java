package com.coresolution.consultation.dto.shop.admin;

import com.coresolution.consultation.constant.ShopOrderExpiryConstants;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * 어드민 주문 사용 기한 연장 요청. 새 만료일과 사유 모두 필수.
 *
 * @param newExpireDate 새 만료일 (당일 포함)
 * @param reason        연장 사유
 * @author MindGarden
 * @since 2026-09-29
 */
public record ShopOrderExpiryExtendRequest(
        @NotNull(message = ShopOrderExpiryConstants.MSG_EXTEND_DATE_REQUIRED)
        LocalDate newExpireDate,
        @NotBlank(message = ShopOrderExpiryConstants.MSG_EXTEND_REASON_REQUIRED)
        @Size(max = ShopOrderExpiryConstants.EXTEND_REASON_MAX_LENGTH,
                message = ShopOrderExpiryConstants.MSG_EXTEND_REASON_TOO_LONG)
        String reason
) {
}
