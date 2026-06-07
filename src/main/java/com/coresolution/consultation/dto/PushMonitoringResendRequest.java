package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * BW-1 「푸시 설정 모니터링」 어드민 수동 재발송 요청 DTO.
 *
 * <p>POST {@code /api/v1/admin/notifications/monitoring/resend/{logId}?source=BATCH|ADMIN_TEST}
 * 의 (옵션) body. 주 식별자는 path variable {@code logId} 와 query parameter {@code source}
 * 이며, body 는 향후 사유·메모 확장을 위해 둔다(현재는 모두 옵션).
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushMonitoringResendRequest {

    /**
     * 재발송 대상 행 라우팅.
     * <ul>
     *   <li>{@code BATCH} — {@code notification_batch_send_log}</li>
     *   <li>{@code ADMIN_TEST} — {@code admin_test_notification_logs}</li>
     * </ul>
     *
     * <p>컨트롤러는 query parameter {@code source} 와 본 필드 둘 다 허용하지만 query 가 우선한다.
     */
    @NotNull
    private String source;

    /** 어드민이 입력한 사유 메모(선택). 빈 값 허용. */
    private String reason;
}
