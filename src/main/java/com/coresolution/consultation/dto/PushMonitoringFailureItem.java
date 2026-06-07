package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * BW-1 「푸시 설정 모니터링」 최근 실패 사례 행.
 *
 * <p>디자이너 핸드오프 §4.8 (PushMonitoringFailureList) 1:1 매핑. {@code recipient_phone_masked}
 * 는 백엔드가 마스킹한 값을 그대로 노출(PII 가드 §10.PII). {@code error_message} 는 한국어
 * prefix 가 백엔드에서 이미 붙어 있으며 프론트는 추가 가공하지 않는다.
 *
 * <p>{@code source} 는 데이터 출처를 식별하기 위한 enum:
 * <ul>
 *   <li>{@link Source#BATCH} — {@code notification_batch_send_log} (배치/이벤트 발송).</li>
 *   <li>{@link Source#ADMIN_TEST} — {@code admin_test_notification_logs} (어드민 수동 발송).</li>
 * </ul>
 *
 * <p>재발송 액션이 가능한지 여부({@link #retryable})는 서비스 레이어가 판정한다 —
 * 외부발송 실패만 재발송 허용, sync skip / pending 은 차단(디자인 §10).
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PushMonitoringFailureItem {

    /** 출처 식별. 재발송 endpoint 는 본 값을 query param 으로 받아 분기한다. */
    public enum Source {
        /** notification_batch_send_log. */
        BATCH,
        /** admin_test_notification_logs. */
        ADMIN_TEST
    }

    /** 행 PK (BIGINT). 재발송 endpoint 의 path variable. */
    private Long id;

    /** 출처. */
    private Source source;

    /** 발송 시도 시각(Asia/Seoul). */
    private LocalDateTime occurredAt;

    /** 채널 — ALIMTALK / SMS / PUSH. */
    private String channel;

    /** 템플릿 코드 (예: RESERVATION_REMINDER_D2). */
    private String templateCode;

    /** 마스킹된 수신자 (백엔드 가공값 그대로 노출). */
    private String recipientPhoneMasked;

    /** 분류된 카테고리 (EXTERNAL_FAILURE / VALIDATION_SKIP / POLICY_SKIP / PENDING). */
    private String errorCategory;

    /** 원본 error_code. */
    private String errorCode;

    /** 한국어 prefix 가 붙은 error_message (FE 재가공 금지). */
    private String errorMessage;

    /** 재발송 가능 여부. */
    private boolean retryable;

    /** SOLAPI group/message id (선택). */
    private String solapiGroupId;
    private String solapiMessageId;
}
