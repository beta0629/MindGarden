package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * BW-1 「푸시 설정 모니터링」 채널 분포(KPI #2 성공 카드 보조).
 *
 * <p>디자이너 핸드오프 §4.3 의 KPI #2 (성공) 카드 분포 inline pill list 데이터 — 채널별
 * 성공 건수 + 비율(0~1). 합산은 윈도(range) 기준 성공만 집계한다.
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

    /** 윈도 내 성공 건수. */
    private long successCount;

    /** 윈도 내 발송 시도 건수(성공+실패+skip+pending). */
    private long totalCount;

    /** 비율(성공 / 윈도 전체 성공) — UI 에서 % 변환. */
    private double ratio;
}
