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
 * <p>디자이너 핸드오프 §2 와이어프레임 KPI 행 + §4.3 PushMonitoringKpiCard 1:1 매핑.
 *
 * <ul>
 *   <li>queue (KPI #1) — {@link #recentFiveMinuteCount} + {@link #pendingCount}</li>
 *   <li>success (KPI #2) — {@link #successCount}, 채널 분포는 별도
 *       {@link PushMonitoringChannelBreakdown} 에서 산정</li>
 *   <li>failure (KPI #3) — {@link #externalFailureCount} + {@link #failureRate}</li>
 *   <li>skip (KPI #4) — {@link #validationSkipCount} + {@link #policySkipCount}
 *       + {@link #skipTotalCount}</li>
 * </ul>
 *
 * <p>Phase 1 explore 결론 「실패 4분류」 화이트리스트 기준으로 분류된다 —
 * {@link com.coresolution.consultation.constant.PushMonitoringErrorCodes}.
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

    /** 최근 5분 발송량 (KPI #1, 윈도 무관 고정 5분). */
    @Builder.Default
    private long recentFiveMinuteCount = 0L;

    /** PENDING 잔존 행 수 ({@code channel_used='PENDING'}, KPI #1 subtitle). */
    @Builder.Default
    private long pendingCount = 0L;

    /** 성공 합계 (윈도 + 채널 필터, KPI #2). */
    @Builder.Default
    private long successCount = 0L;

    /** 외부발송 실패 (SEND_FAILED 등 화이트리스트, KPI #3). */
    @Builder.Default
    private long externalFailureCount = 0L;

    /**
     * 실패율 (외부발송 실패 / (성공 + 외부발송 실패)).
     *
     * <p>분모가 0 이면 {@code 0.0}. 0~1 사이 비율값(소수점 4자리). FE 가
     * {@code Math.round(rate * 1000) / 10} 으로 % 표기한다.
     */
    @Builder.Default
    private double failureRate = 0.0d;

    /** 사전검증 skip (RECIPIENT_PHONE_MISSING / MARKETING_CONSENT_REQUIRED / TARGET_NOT_FOUND). */
    @Builder.Default
    private long validationSkipCount = 0L;

    /**
     * 정책 skip (MARKETING_NO_FALLBACK / DEPLOY_CUTOFF_BEFORE / NOT_FIRST_SCHEDULE
     * / TEMPLATE_NOT_MAPPED).
     */
    @Builder.Default
    private long policySkipCount = 0L;

    /** Skip 합계 ({@link #validationSkipCount} + {@link #policySkipCount}). */
    @Builder.Default
    private long skipTotalCount = 0L;
}
