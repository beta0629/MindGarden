package com.coresolution.consultation.dto;

import java.util.Map;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 테스트 카카오 알림톡 발송 요청 DTO.
 *
 * <p>{@link #fallbackToSms}가 true이면 알림톡 발송 실패 시 SMS로 폴백한다.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
public class TestAlimtalkRequest {

    @NotNull(message = "수신자 모드는 필수입니다.")
    private TestNotificationRecipientMode recipientMode;

    /** {@code recipientMode=USER}일 때 필수. */
    private Long userId;

    @NotBlank(message = "템플릿 코드는 필수입니다.")
    @Size(max = 100, message = "템플릿 코드는 100자 이하여야 합니다.")
    private String templateCode;

    /** 알림톡 변수 (key=#{변수명}). null 허용. */
    private Map<String, String> templateParams;

    @NotBlank(message = "발송 사유는 필수입니다.")
    @Size(max = 500, message = "발송 사유는 500자 이하여야 합니다.")
    private String reason;

    /** 알림톡 실패 시 SMS 폴백 여부(기본 false). */
    @Builder.Default
    private boolean fallbackToSms = false;

    /**
     * Lombok {@link Builder}와 {@link NoArgsConstructor} 공존을 위한 명시적 생성자.
     */
    public TestAlimtalkRequest(TestNotificationRecipientMode recipientMode, Long userId,
            String templateCode, Map<String, String> templateParams, String reason,
            boolean fallbackToSms) {
        this.recipientMode = recipientMode;
        this.userId = userId;
        this.templateCode = templateCode;
        this.templateParams = templateParams;
        this.reason = reason;
        this.fallbackToSms = fallbackToSms;
    }
}
