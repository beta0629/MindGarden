package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.PushMonitoringChannelFilter;
import com.coresolution.consultation.dto.PushMonitoringRange;
import com.coresolution.consultation.dto.PushMonitoringResendResponse;
import com.coresolution.consultation.dto.PushMonitoringSnapshotResponse;
import com.coresolution.consultation.entity.User;

/**
 * BW-1 「푸시 설정 모니터링」 어드민 서비스 인터페이스.
 *
 * <p>본인 테넌트 한정 발송 지표를 단일 응답으로 모은다(60s 폴링 단일 진입 — 디자이너 핸드오프
 * §7.3). 재발송은 {@code AdminTestNotificationRateLimiter} 공유 풀을 재사용하며 본 인터페이스
 * 를 통해 단일 진입한다.
 *
 * <p>호출자({@code AdminPushMonitoringController}) 가 인증·테넌트 컨텍스트·RBAC 를 사전에
 * 확보한 상태에서만 호출된다.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public interface AdminPushMonitoringService {

    /**
     * 페이지 단일 응답(KPI + 채널 분포 + 일별 추이 + 테넌트 스냅샷 + 최근 실패 사례).
     *
     * @param tenantId      테넌트 ID
     * @param range         조회 범위 (기본 D7)
     * @param channel       채널 필터 (기본 ALL)
     * @param failuresLimit 실패 사례 최대 행 수 (기본 20)
     * @return 페이지 응답
     */
    PushMonitoringSnapshotResponse loadSnapshot(
        String tenantId,
        PushMonitoringRange range,
        PushMonitoringChannelFilter channel,
        int failuresLimit);

    /**
     * 어드민 수동 재발송. 사전 차단(rate-limit / source 미지원 / 행 없음 등) 시
     * {@code success=false} + 한국어 errorMessage 로 응답한다.
     *
     * @param tenantId    테넌트 ID
     * @param currentUser 발송자 (rate-limit 카운터 분리)
     * @param logId       대상 행 PK
     * @param source      {@code BATCH} / {@code ADMIN_TEST}
     * @param reason      어드민 입력 사유 메모(선택)
     * @return 재발송 결과
     */
    PushMonitoringResendResponse resendFailure(
        String tenantId,
        User currentUser,
        Long logId,
        String source,
        String reason);
}
