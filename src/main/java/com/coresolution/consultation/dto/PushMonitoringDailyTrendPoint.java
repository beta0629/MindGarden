package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * BW-1 「푸시 설정 모니터링」 일별 발송 추이 1점.
 *
 * <p>디자이너 핸드오프 §4.6 PushTrendPoint 와 동일. CSS-driven stacked bar 차트(§6.2)
 * 의 X축 일자 단위로 누적된다. 채널별 + 결과별 동시 분해를 모두 보유해 Tooltip 텍스트를
 * 단일 점에서 합성할 수 있다.
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
public class PushMonitoringDailyTrendPoint {

    /** 일자 (Asia/Seoul, {@code YYYY-MM-DD}). */
    private String dateIso;

    /** 알림톡 채널 발송 건수 합계. */
    @Builder.Default
    private long alimtalkCount = 0L;

    /** SMS 채널 발송 건수 합계. */
    @Builder.Default
    private long smsCount = 0L;

    /** PUSH 채널 발송 건수 합계. */
    @Builder.Default
    private long pushCount = 0L;

    /** 결과 — 성공. */
    @Builder.Default
    private long successCount = 0L;

    /** 결과 — 외부발송 실패 (화이트리스트). */
    @Builder.Default
    private long failureCount = 0L;

    /** 결과 — 검증·정책 skip. */
    @Builder.Default
    private long skipCount = 0L;

    /** 결과 — PENDING (channel_used='PENDING'). */
    @Builder.Default
    private long pendingCount = 0L;
}
