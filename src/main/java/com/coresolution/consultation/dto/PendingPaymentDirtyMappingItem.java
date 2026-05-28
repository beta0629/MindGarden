package com.coresolution.consultation.dto;

import java.time.Duration;
import java.time.LocalDateTime;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 옵션 B R4 — 디러티 PENDING_PAYMENT 매핑 응답 항목 DTO.
 *
 * <p>합의서: {@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md}.
 * 어드민 수동 정리 화면 목록에 노출되는 컬럼만 담는 경량 DTO. 개인정보(이메일/전화)는
 * 노출하지 않는다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingPaymentDirtyMappingItem {

    private Long mappingId;
    private Long consultantId;
    private String consultantName;
    private Long clientId;
    private String clientName;
    private String packageName;
    private Long packagePrice;
    private Integer totalSessions;
    private LocalDateTime createdAt;
    private Long elapsedHours;
    private String status;
    private String paymentStatus;

    /**
     * 엔티티를 응답 항목 DTO로 변환한다. 경과 시간은 createdAt 기준으로 계산한다.
     *
     * @param mapping 매핑 엔티티 (consultant/client 초기화 필요)
     * @param now     기준 시각 (보통 LocalDateTime.now())
     * @return 응답 DTO
     */
    public static PendingPaymentDirtyMappingItem fromEntity(ConsultantClientMapping mapping, LocalDateTime now) {
        if (mapping == null) {
            return null;
        }
        long elapsed = mapping.getCreatedAt() != null
                ? Duration.between(mapping.getCreatedAt(), now != null ? now : LocalDateTime.now()).toHours()
                : 0L;
        return PendingPaymentDirtyMappingItem.builder()
                .mappingId(mapping.getId())
                .consultantId(mapping.getConsultant() != null ? mapping.getConsultant().getId() : null)
                .consultantName(mapping.getConsultant() != null ? mapping.getConsultant().getName() : null)
                .clientId(mapping.getClient() != null ? mapping.getClient().getId() : null)
                .clientName(mapping.getClient() != null ? mapping.getClient().getName() : null)
                .packageName(mapping.getPackageName())
                .packagePrice(mapping.getPackagePrice())
                .totalSessions(mapping.getTotalSessions())
                .createdAt(mapping.getCreatedAt())
                .elapsedHours(elapsed)
                .status(mapping.getStatus() != null ? mapping.getStatus().name() : null)
                .paymentStatus(mapping.getPaymentStatus() != null ? mapping.getPaymentStatus().name() : null)
                .build();
    }
}
