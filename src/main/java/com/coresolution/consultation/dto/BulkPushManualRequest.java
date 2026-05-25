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
 * 어드민 수동 다중 푸시 broadcast 요청 DTO.
 *
 * <p>{@code AdminManualNotificationService.sendBulkPush(...)} 가 사용하며, SMS·알림톡 채널과
 * 동일하게 50명 상한 + 발송 사유 필수 정책을 적용한다. 푸시는 본문 1000자 / 제목 50자까지 허용
 * (Expo Push API 메시지 페이로드 한도 내).
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkPushManualRequest {

    /** 현재 테넌트 사용자 PK 목록 (중복 허용 안 함, 1~50명). */
    @NotEmpty(message = "수신자 목록은 1명 이상이어야 합니다.")
    @Size(max = 50, message = "한 번에 최대 50명까지 발송할 수 있습니다.")
    private List<Long> userIds;

    /** 푸시 제목 — Expo title. */
    @NotBlank(message = "푸시 제목은 필수입니다.")
    @Size(max = 50, message = "푸시 제목은 50자 이하여야 합니다.")
    private String title;

    /** 푸시 본문 — Expo body. */
    @NotBlank(message = "푸시 본문은 필수입니다.")
    @Size(max = 1000, message = "푸시 본문은 1000자 이하여야 합니다.")
    private String body;

    /** 발송 사유(감사로그 영구 보존). */
    @NotBlank(message = "발송 사유는 필수입니다.")
    @Size(max = 500, message = "발송 사유는 500자 이하여야 합니다.")
    private String reason;
}
