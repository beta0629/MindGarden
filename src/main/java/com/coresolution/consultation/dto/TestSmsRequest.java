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
 * <p>모드별 필수 필드:
 * <ul>
 *   <li>{@link TestNotificationRecipientMode#SELF} — {@code userId}/{@code phoneNumber} 모두 무시되며
 *       현재 로그인 사용자의 전화번호로 발송한다.</li>
 *   <li>{@link TestNotificationRecipientMode#USER} — {@code userId} 필수. 현재 테넌트 사용자만 허용한다.</li>
 *   <li>{@link TestNotificationRecipientMode#PHONE} — {@code phoneNumber} 필수. 한국 휴대폰 11자리.
 *       모드 분기 검증은 서비스 레이어({@code AdminTestNotificationServiceImpl})에서 수행한다.</li>
 * </ul>
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

    /**
     * {@code recipientMode=PHONE}일 때 필수. 한국 휴대폰(예: {@code 01012345678}).
     *
     * <p>{@code @NotBlank} 는 사용하지 않는다(SELF/USER 모드에서는 무시). 형식 검증과 빈 값 분기는
     * 서비스 레이어에서 처리한다.
     */
    @Size(max = 20, message = "전화번호는 20자 이하여야 합니다.")
    private String phoneNumber;

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
            String phoneNumber, String message, String reason) {
        this.recipientMode = recipientMode;
        this.userId = userId;
        this.phoneNumber = phoneNumber;
        this.message = message;
        this.reason = reason;
    }
}
