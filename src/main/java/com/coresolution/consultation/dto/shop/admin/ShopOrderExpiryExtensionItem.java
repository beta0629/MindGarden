package com.coresolution.consultation.dto.shop.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 어드민 주문 사용 기한 연장 이력 한 줄.
 *
 * @author MindGarden
 * @since 2026-09-29
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderExpiryExtensionItem {

    private Long id;
    private LocalDateTime extendedAt;
    private LocalDate previousExpireDate;
    private LocalDate newExpireDate;
    private String reason;
    private Long extendedByUserId;
    /** 처리자 이름 (마스킹은 화면에서) */
    private String extendedByName;
}
