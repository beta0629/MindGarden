package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 옵션 B R4 — 디러티 PENDING_PAYMENT 매핑 일괄 수동 정리 요청 DTO.
 *
 * <p>합의서: {@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md}.
 * 최대 50건 상한. 각 매핑은 REQUIRES_NEW 트랜잭션으로 독립 처리되어 일부 실패해도
 * 다른 매핑 정리는 진행된다.
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingPaymentBulkCleanupRequest {

    @NotEmpty(message = "정리 대상 매칭 ID는 1건 이상이어야 합니다.")
    @Size(max = 50, message = "일괄 정리는 최대 50건까지 가능합니다.")
    private List<Long> mappingIds;

    @NotBlank(message = "정리 사유는 필수입니다.")
    @Size(min = 10, max = 500, message = "정리 사유는 10자 이상 500자 이하여야 합니다.")
    private String reason;

    /**
     * 내담자에게 정리 사실을 알림으로 발송할지 여부 (기본 true).
     */
    private Boolean notifyClient;
}
