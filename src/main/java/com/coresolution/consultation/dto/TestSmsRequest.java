package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 테스트 SMS 발송 요청 DTO.
 *
 * <p>{@link TestNotificationRecipientMode#SELF}인 경우 {@code userId}는 무시되며 현재 로그인 사용자의 전화번호로 발송한다.
 * {@link TestNotificationRecipientMode#USER}인 경우 {@code userId}는 필수이며 현재 테넌트 사용자만 허용한다.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
public class TestSmsRequest {

    @NotNull(message = "수신자 모드는 필수입니다.")
    private TestNotificationRecipientMode recipientMode;

    /** {@code recipientMode=USER}일 때 필수. */
    private Long userId;

    @NotBlank(message = "메시지 본문은 필수입니다.")
    @Size(max = 2000, message = "메시지 본문은 2000자 이하여야 합니다.")
    private String message;

    @NotBlank(message = "발송 사유는 필수입니다.")
    @Size(max = 500, message = "발송 사유는 500자 이하여야 합니다.")
    private String reason;

    /**
     * Lombok {@link Builder}와 {@link NoArgsConstructor} 공존을 위한 명시적 생성자.
     */
    public TestSmsRequest(TestNotificationRecipientMode recipientMode, Long userId,
            String message, String reason) {
        this.recipientMode = recipientMode;
        this.userId = userId;
        this.message = message;
        this.reason = reason;
    }
}
