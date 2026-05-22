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
     * 템플릿 출처 — {@code COMMON_CODE}(기본) 또는 {@code SOLAPI}.
     *
     * <p>{@code COMMON_CODE}이면 백엔드가 {@code templateCode}(codeValue) 를
     * 공통코드 그룹 {@code ALIMTALK_BIZ_TEMPLATE_CODE} 에서 실제 Solapi
     * {@code templateId}(codeLabel) 로 매핑한 뒤 송신한다. 매핑이 없으면 발송 차단.
     *
     * <p>{@code SOLAPI}이면 어드민 UI 의 "솔라피 전체 보기" 토글 ON 으로 사용자가 이미
     * 실 templateId 를 선택한 상태이므로 매핑 lookup 을 건너뛴다.
     *
     * <p>null/blank 는 기존 호출자 호환을 위해 {@code COMMON_CODE} 로 간주한다.
     */
    @Size(max = 20, message = "templateSource 는 20자 이하여야 합니다.")
    private String templateSource;

    /**
     * Lombok {@link Builder}와 {@link NoArgsConstructor} 공존을 위한 명시적 생성자.
     */
    public TestAlimtalkRequest(TestNotificationRecipientMode recipientMode, Long userId,
            String templateCode, Map<String, String> templateParams, String reason,
            boolean fallbackToSms, String templateSource) {
        this.recipientMode = recipientMode;
        this.userId = userId;
        this.templateCode = templateCode;
        this.templateParams = templateParams;
        this.reason = reason;
        this.fallbackToSms = fallbackToSms;
        this.templateSource = templateSource;
    }
}
