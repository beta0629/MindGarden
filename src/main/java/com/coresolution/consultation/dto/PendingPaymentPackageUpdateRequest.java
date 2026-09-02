package com.coresolution.consultation.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 가계약(PENDING_PAYMENT) 매칭 패키지·가격 수정 요청.
 *
 * <p>동일 매핑 write SSOT — cancel+recreate 금지. remaining/used 회기는 변경하지 않는다.
 * ERP UpdateMappingInfo·스케줄 생성/변경·ScheduleSlotGuard 와 무관하다.</p>
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingPaymentPackageUpdateRequest {

    @NotBlank(message = "패키지명은 필수입니다.")
    private String packageName;

    @NotNull(message = "패키지 가격은 필수입니다.")
    @Min(value = 0, message = "패키지 가격은 0 이상이어야 합니다.")
    private Long packagePrice;

    @NotNull(message = "회기 수는 필수입니다.")
    @Min(value = 0, message = "회기 수는 0 이상이어야 합니다.")
    private Integer totalSessions;
}
