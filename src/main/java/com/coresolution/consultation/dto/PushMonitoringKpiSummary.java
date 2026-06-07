package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * BW-1 「푸시 설정 모니터링」 KPI 4 카드 요약.
 *
 * <p>디자이너 핸드오프 §1.D2/D3, §4.3 의 4 KPI 카드(최근 5분 발송량+PENDING / 성공 / 실패 /
 * Skip) 1:1 매핑. 수치 단위는 모두 정수 건수, 비율은 0~1 사이 {@code double} (UI 에서 % 변환).
 *
 * <ul>
 *   <li>{@link #recentFiveMinuteCount} — 최근 5분 발송 시도 건수 (성공+실패+skip+PENDING 합산).</li>
 *   <li>{@link #pendingCount} — 채널 미확정({@code channel_used='PENDING'}) 누적 건수 (윈도 무관, 현재 시점).</li>
 *   <li>{@link #successCount} — 윈도(range) 내 성공 건수.</li>
 *   <li>{@link #externalFailureCount} — 윈도 내 외부발송 실패 건수.</li>
 *   <li>{@link #failureRate} — externalFailureCount / (successCount + externalFailureCount).</li>
 *   <li>{@link #validationSkipCount} — 사전검증 skip.</li>
 *   <li>{@link #policySkipCount} — 정책 skip.</li>
 *   <li>{@link #skipTotalCount} — Skip 합계(검증 + 정책).</li>
 * </ul>
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
public class PushMonitoringKpiSummary {

    private long recentFiveMinuteCount;
    private long pendingCount;

    private long successCount;
    private long externalFailureCount;
    private double failureRate;

    private long validationSkipCount;
    private long policySkipCount;
    private long skipTotalCount;
}
