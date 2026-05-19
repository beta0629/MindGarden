package com.coresolution.consultation.dto.shop;

import com.coresolution.consultation.constant.PointLedgerEntryLabels;
import com.coresolution.consultation.constant.PointLedgerEntryType;
import com.coresolution.consultation.entity.ClientPointLedgerEntry;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 포인트 원장 목록 항목.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopPointLedgerEntryResponse {

    private PointLedgerEntryType type;
    private long amountMinor;
    private String orderPublicId;
    private LocalDateTime createdAt;
    private String labelKey;

    /**
     * 엔티티 → 응답 DTO.
     *
     * @param entry 원장 엔티티
     * @return 응답 DTO
     */
    public static ShopPointLedgerEntryResponse fromEntity(ClientPointLedgerEntry entry) {
        return ShopPointLedgerEntryResponse.builder()
                .type(entry.getEntryType())
                .amountMinor(entry.getAmountMinor())
                .orderPublicId(entry.getOrderPublicId())
                .createdAt(entry.getCreatedAt())
                .labelKey(PointLedgerEntryLabels.labelKeyFor(entry.getEntryType()))
                .build();
    }
}
