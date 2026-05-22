package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 테스트 발송 결과 응답 DTO.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestNotificationResponse {

    private boolean success;
    private String groupId;
    private String messageId;
    private LocalDateTime sentAt;
    private String errorCode;
    private String errorMessage;

    /** 알림톡 실패 후 SMS 폴백이 실제 발송됐는지 여부. */
    @Builder.Default
    private boolean fallbackUsed = false;

    /** 발송 로그 PK(이력 화면 새로고침 키). */
    private Long logId;
}
