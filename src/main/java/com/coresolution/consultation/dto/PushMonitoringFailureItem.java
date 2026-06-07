package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * BW-1 「푸시 설정 모니터링」 최근 실패 사례 1행.
 *
 * <p>디자이너 핸드오프 §4.8 PushFailureEntry / §10.PII 가드 그대로 매핑. 백엔드는
 * {@code recipient_phone_masked} 컬럼 값을 그대로 통과시키며 FE 는 재마스킹하지 않는다.
 * {@code error_message} 도 한국어 prefix 가 이미 백엔드 단계에서 부여되어 있어 프론트는
 * 추가 가공 없이 노출한다.
 *
 * <p>{@link #source} 는 재발송 라우팅에 사용된다 — {@code BATCH} 면
 * {@code notification_batch_send_log}, {@code ADMIN_TEST} 면
 * {@code admin_test_notification_logs} 행을 가리킨다.
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

    /** 행 PK ({@code notification_batch_send_log.id} 또는 {@code admin_test_notification_logs.id}). */
    private Long id;

    /** 재발송 라우팅 — {@code BATCH} / {@code ADMIN_TEST}. */
    private String source;

    /** 발송 시각 (Asia/Seoul). */
    private LocalDateTime occurredAt;

    /** 채널 — ALIMTALK / SMS / PUSH. */
    private String channel;

    /** 템플릿 코드 (예: {@code RESERVATION_REMINDER_D2}). */
    private String templateCode;

    /** 마스킹된 수신자 번호({@code recipient_phone_masked} 컬럼 그대로). */
    private String recipientPhoneMasked;

    /**
     * 4분류 카테고리 — {@code EXTERNAL_FAILURE} / {@code VALIDATION_SKIP}
     * / {@code POLICY_SKIP} / {@code PENDING}. FE 가 행에 카테고리 뱃지를 표시한다.
     */
    private String errorCategory;

    /** 백엔드 {@code error_code} 컬럼 값. */
    private String errorCode;

    /** 백엔드 {@code error_message} 컬럼 값(한국어 prefix 포함). */
    private String errorMessage;

    /**
     * 재발송 가능 여부.
     *
     * <p>화이트리스트:
     * <ul>
     *   <li>EXTERNAL_FAILURE 카테고리만 재발송 가능</li>
     *   <li>VALIDATION_SKIP / POLICY_SKIP 은 재발송 비활성(원인 데이터 정리 후 재시도)</li>
     *   <li>PENDING 은 결과 미반영 상태이므로 재발송 비활성</li>
     * </ul>
     */
    @Builder.Default
    private boolean retryable = false;
}
