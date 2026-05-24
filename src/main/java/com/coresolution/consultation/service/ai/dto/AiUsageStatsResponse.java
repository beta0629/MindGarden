package com.coresolution.consultation.service.ai.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * AI 사용 통계 응답 DTO (어드민 AI 프로바이더 관리 페이지).
 *
 * <p>트랙 B PR-4 (2026-05-24): 디자이너 핸드오프 §6 — 통계 대시보드 데이터 제공.
 * 멀티테넌트 격리 — {@code tenantId} 필수.</p>
 *
 * @author CoreSolution
 * @since 2026-05-24
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiUsageStatsResponse {

    /** 테넌트 ID */
    private String tenantId;

    /**
     * 요청 기간 라벨 (today | week | month — 응답에 그대로 echo).
     *
     * @deprecated 2026-05-24: 의미를 명확히 하기 위해 {@link #requestedPeriod} 도입.
     *     하위 호환을 위해 동일한 값으로 유지하되 신규 클라이언트는 {@code requestedPeriod} 사용 권장.
     */
    @Deprecated
    private String period;

    /**
     * 요청 기간 라벨 echo (today | week | month).
     *
     * <p>현재 통계 응답은 period 와 무관하게 callsToday / callsThisWeek / callsThisMonth 3종을
     * 모두 반환한다. 클라이언트는 본 필드로 자신이 요청한 기간 라벨을 식별한다.
     * 후속 PR 에서 period 별 분기를 추가할 때도 backward-compatible 하게 동작한다.</p>
     */
    private String requestedPeriod;

    /** 오늘 호출 수 */
    private long callsToday;

    /** 이번 주 호출 수 */
    private long callsThisWeek;

    /** 이번 달 호출 수 */
    private long callsThisMonth;

    /**
     * provider 별 호출 수 (OPENAI / GEMINI / CLAUDE / REPLICATE / UNKNOWN).
     * 키는 대문자 provider 라벨. 값은 호출 수.
     */
    private Map<String, Long> callsByProvider;

    /**
     * caller 별 호출 수 (wellness / healing / psych_ai / etc).
     * 키는 caller 라벨 (requestType). 값은 호출 수.
     */
    private Map<String, Long> callsByCaller;

    /** 성공률 (0~100). 호출 수 0 일 때는 0. */
    private double successRate;

    /** 실패율 (0~100). 호출 수 0 일 때는 0. */
    private double failureRate;

    /**
     * fallback 사용 비율 (0~100).
     * 트랙 A 회전 풀이 별도 추적되기 전까지는 보정값(0.0) 반환 — 미지원시 -1 로 신호.
     */
    private double fallbackUsageRate;

    /** 평균 응답 시간(ms). 데이터 없을 때 0. */
    private long averageDurationMs;

    /** 토큰 총합 (이번 달 기준). */
    private long totalTokens;

    /** 최근 30일 일별 호출 수 (차트용). */
    private List<DailyCount> dailyCalls30d;

    /**
     * 일자별 호출 수 항목.
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyCount {

        /** 날짜 (yyyy-MM-dd) */
        private LocalDate date;

        /** 호출 수 */
        private long count;
    }
}
