package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 옵션 B R4 — 디러티 PENDING_PAYMENT 매핑 단건 수동 정리 요청 DTO.
 *
 * <p>합의서: {@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md}.
 * 24시간 이상 결제가 들어오지 않은 PENDING_PAYMENT 매핑을 어드민이 수동으로 정리할 때 사용.
 * 본 DTO는 정리 사유(최소 10자)와 내담자 통지 여부를 받는다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingPaymentCleanupRequest {

    @NotBlank(message = "정리 사유는 필수입니다.")
    @Size(min = 10, max = 500, message = "정리 사유는 10자 이상 500자 이하여야 합니다.")
    private String reason;

    /**
     * 내담자에게 정리 사실을 알림으로 발송할지 여부 (기본 true).
     */
    private Boolean notifyClient;
}
