package com.coresolution.consultation.dto;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.ManualNotificationRecipientMode;
import com.coresolution.consultation.validation.WithinManualRecipientLimit;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 수동 발송 작업(미리보기·생성) 요청.
 *
 * <p>대상 집합은 서버가 확정한다. {@code ALL_CLIENTS} 는 {@link #excludeIds} 만 화면에서 받고,
 * {@code SELECTED} 는 {@link #userIds}·{@link #phoneNumbers} 를 받되 같은 서버 규칙으로 다시 거른다.
 * 생성 시에는 미리보기에서 받은 {@link #snapshotToken} 과 {@link #idempotencyKey} 가 필수다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualNotificationJobRequest {

    @NotNull(message = "발송 채널은 필수입니다.")
    private TestNotificationChannel channel;

    @NotNull(message = "수신자 모드는 필수입니다.")
    private ManualNotificationRecipientMode recipientMode;

    /** SELECTED — 직접 선택한 사용자 PK. */
    @WithinManualRecipientLimit
    private List<Long> userIds;

    /** SELECTED — 직접 입력 휴대전화(SMS·알림톡만). */
    @WithinManualRecipientLimit
    private List<@Size(max = 20) String> phoneNumbers;

    /** ALL_CLIENTS — 제외할 사용자 PK. 다른 테넌트·대상 밖 id 는 무시된다. */
    private List<Long> excludeIds;

    @Size(max = 1000, message = "메시지 본문은 1000자 이하여야 합니다.")
    private String content;

    @Size(max = 50, message = "푸시 제목은 50자 이하여야 합니다.")
    private String title;

    @Size(max = 1000, message = "푸시 본문은 1000자 이하여야 합니다.")
    private String body;

    @Size(max = 100, message = "템플릿 코드는 100자 이하여야 합니다.")
    private String templateCode;

    private TestNotificationAlimtalkTemplateSource templateSource;

    private Map<String, String> templateParams;

    /** 광고성 메시지 여부. true 면 마케팅 수신 동의자만 대상. */
    private Boolean marketing;

    @NotBlank(message = "발송 사유는 필수입니다.")
    @Size(max = 500, message = "발송 사유는 500자 이하여야 합니다.")
    private String reason;

    /** 생성 멱등 키(화면이 발송 확인 1회당 1개 생성). */
    @Size(max = 100, message = "idempotencyKey 는 100자 이하여야 합니다.")
    private String idempotencyKey;

    /** 미리보기 응답의 확정 집합 토큰. */
    @Size(max = 128, message = "snapshotToken 은 128자 이하여야 합니다.")
    private String snapshotToken;
}
