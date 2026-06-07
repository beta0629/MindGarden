package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * BW-1 「푸시 설정 모니터링」 채널별 분포 1행.
 *
 * <p>KPI #2 (성공) 의 채널 분포 inline pill list 와 비용 placeholder 의 채널별 발송 건수에
 * 동시 사용된다(디자이너 핸드오프 §6.3 / §10 비용 placeholder).
 *
 * <p>{@link #ratio} 는 0~1 비율 — FE 가 {@code Math.round(ratio*1000)/10}% 로 표기한다.
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
public class PushMonitoringChannelBreakdown {

    /** 채널 키 (ALIMTALK / SMS / PUSH). */
    private String channel;

    /** 성공 건수 (윈도 합계). */
    @Builder.Default
    private long successCount = 0L;

    /** 채널 전체 건수 (성공 + 실패 + skip 모두 포함). */
    @Builder.Default
    private long totalCount = 0L;

    /**
     * 성공 비율 (0~1) — {@code successCount / totalSuccessCount(전체 채널 합)}.
     *
     * <p>분모가 0 이면 {@code 0.0}.
     */
    @Builder.Default
    private double ratio = 0.0d;
}
