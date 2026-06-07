package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * BW-1 「푸시 설정 모니터링」 어드민 수동 재발송 응답.
 *
 * <p>FE 는 {@link #success} 가 {@code false} 일 때 {@link #errorMessage} 를 토스트에 노출한다.
 * 사전 차단(rate-limit / source mismatch / 멱등 row 못찾음 등) 은 모두 200 OK + body
 * {@code success=false} 로 응답한다(컨트롤러 내부에서 {@code AdminTestNotificationRateLimiter}
 * 차단도 동일 패턴으로 매핑).
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
public class PushMonitoringResendResponse {

    /** 재발송 큐 적재 성공 여부. */
    @Builder.Default
    private boolean success = false;

    /** 에러 코드 (실패 시). */
    private String errorCode;

    /** 한국어 에러 메시지 (실패 시 — FE 가 토스트로 노출). */
    private String errorMessage;

    /** 새 발송 row id (성공 시). 동일 source 내에서 추적 가능. */
    private Long resentLogId;
}
