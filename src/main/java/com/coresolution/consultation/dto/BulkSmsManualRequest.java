package com.coresolution.consultation.dto;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 수동 다중 SMS 발송 요청 DTO.
 *
 * <p>P1.2 — 어드민 수동 알림 발송 도구. 기획 Q2 = 50명 상한, Q5 = rate-limit 부족 시 전체 차단.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkSmsManualRequest {

    /** 현재 테넌트 사용자 PK 목록(중복 허용 안 함, 1~50명). */
    @NotEmpty(message = "수신자 목록은 1명 이상이어야 합니다.")
    @Size(max = 50, message = "한 번에 최대 50명까지 발송할 수 있습니다.")
    private List<Long> userIds;

    @NotBlank(message = "메시지 본문은 필수입니다.")
    @Size(max = 1000, message = "메시지 본문은 1000자 이하여야 합니다.")
    private String content;

    @NotBlank(message = "발송 사유는 필수입니다.")
    @Size(max = 500, message = "발송 사유는 500자 이하여야 합니다.")
    private String reason;
}
