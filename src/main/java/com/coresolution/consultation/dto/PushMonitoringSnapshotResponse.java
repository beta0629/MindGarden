package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * BW-1 「푸시 설정 모니터링」 60s 폴링 단일 응답 DTO.
 *
 * <p>FE 의 {@code usePushMonitoringSnapshot} hook 이 60초마다 1회 호출하여 페이지 전체
 * (KPI + 운영상태 + 추이 + 스냅샷 + 실패 사례 Top 20) 를 1 endpoint 로 받는다.
 *
 * <p>{@link #pushAutoTrackingAvailable} = {@code false} 는 「PUSH 자동 결과 추적 미지원」
 * 가드(디자인 §10) 의 BE 명시 플래그. 운영 OFF 배너는 {@link #operationalToggle} 의 값으로
 * 판단해 표시한다(디자인 §10.알림톡 OFF).
 *
 * <p>응답은 {@link com.coresolution.core.dto.ApiResponse} 으로 한 번 더 감싼다(컨트롤러).
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
public class PushMonitoringSnapshotResponse {

    /** 응답 생성 시각 (Asia/Seoul). FE 「마지막 갱신 …」 표기용. */
    private LocalDateTime generatedAt;

    /** 적용된 조회 범위. */
    private PushMonitoringRange range;

    /** 적용된 채널 필터. */
    private PushMonitoringChannelFilter channel;

    /** KPI 4 카드 요약. */
    private PushMonitoringKpiSummary kpi;

    /** 채널별 분포(KPI #2 보조). */
    private List<PushMonitoringChannelBreakdown> channelBreakdown;

    /** 일별 발송 추이(범위에 따른 일자 N개). */
    private List<PushMonitoringDailyTrendPoint> trendPoints;

    /** 테넌트 설정 스냅샷. */
    private PushMonitoringTenantSnapshot tenantSnapshot;

    /** 운영 토글 — 페이지 상단 운영 상태 안내 배너 분기에 사용. */
    private PushMonitoringTenantSnapshot.OperationalToggle operationalToggle;

    /** 최근 실패 사례 Top N (기본 20). */
    private List<PushMonitoringFailureItem> failures;

    /** 실패 사례 전체 건수(페이지네이션 hint). */
    private long failuresTotal;

    /**
     * PUSH 채널 자동 결과 추적 가능 여부.
     *
     * <p>Phase 1 explore 결론(D4) — PUSH 채널은 {@code mobile_push_dispatch_dedup} 멱등 키만
     * 적재하고 자동 푸시 결과(success/error) 를 별도 테이블에 적재하지 않는다. 따라서 본 페이지의
     * PUSH 데이터는 「어드민 수동 발송({@code admin_test_notification_logs})」만 반영하며
     * 본 플래그는 항상 {@code false} 로 응답한다(현 단계).
     */
    @Builder.Default
    private boolean pushAutoTrackingAvailable = false;

    /** 비용 placeholder 안내 — 단가 데이터 미등록(현 단계 항상 {@code false}). */
    @Builder.Default
    private boolean costAvailable = false;
}
