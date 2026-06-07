package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.PushMonitoringChannelFilter;
import com.coresolution.consultation.dto.PushMonitoringFailureItem;
import com.coresolution.consultation.dto.PushMonitoringRange;
import com.coresolution.consultation.dto.PushMonitoringSnapshotResponse;
import com.coresolution.consultation.dto.TestNotificationResponse;
import com.coresolution.consultation.entity.User;

/**
 * BW-1 「푸시 설정 모니터링」서비스.
 *
 * <p>본 서비스는 60s 폴링 단일 엔드포인트({@code GET /api/v1/admin/notifications/monitoring/snapshot})
 * 를 위한 응답 합성과, 어드민 수동 재발송 액션을 제공한다. 모든 메서드는 호출자
 * ({@code AdminPushMonitoringController}) 가 사전에 인증·테넌트 컨텍스트를 확보한 상태에서만
 * 호출된다. 멀티테넌트 격리는 {@code tenantId} 파라미터로 강제한다(/core-solution-multi-tenant).
 *
 * <p>구현 기준:
 * <ul>
 *   <li>{@code notification_batch_send_log} 와 {@code admin_test_notification_logs} 를 합산
 *       (Service 레벨 union — Native query 대신 Repository 호출 2회 후 메모리 합산).</li>
 *   <li>4분류 화이트리스트는 {@link com.coresolution.consultation.constant.PushMonitoringErrorCategorization}
 *       이 정의한다.</li>
 *   <li>운영 토글({@code notification.batch.alimtalk-enabled}, {@code kakao.alimtalk.enabled},
 *       Expo {@code access-token}) 은 {@link PushMonitoringSnapshotResponse#getOperationalToggle()}
 *       와 {@link PushMonitoringSnapshotResponse#getTenantSnapshot()} 두 곳에서 노출한다.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
public interface AdminPushMonitoringService {

    /**
     * 60s 폴링 단일 응답 — KPI + 운영상태 + 추이 + 스냅샷 + 실패 사례 Top N.
     *
     * @param tenantId 테넌트 ID (멀티테넌트 격리 키)
     * @param range    조회 범위
     * @param channel  채널 필터
     * @return 합성 응답
     */
    PushMonitoringSnapshotResponse buildSnapshot(String tenantId,
            PushMonitoringRange range,
            PushMonitoringChannelFilter channel);

    /**
     * 어드민 수동 재발송. {@code source} 에 따라 {@code notification_batch_send_log} 또는
     * {@code admin_test_notification_logs} 의 row 를 조회하여 동일 채널·수신자로 재발송한다.
     *
     * <p>재발송 경로는 기존 {@link AdminTestNotificationService#sendSms(String, User,
     * com.coresolution.consultation.dto.TestSmsRequest)} 또는 {@code sendAlimtalk} 을 재사용한다 —
     * Rate limit 풀 공유, 감사로그 자동 적재.
     *
     * @param tenantId    테넌트 ID
     * @param currentUser 발송 수행자(요청자)
     * @param logId       원본 로그 PK
     * @param source      원본 로그 출처
     * @return 재발송 결과
     */
    TestNotificationResponse resend(String tenantId, User currentUser, Long logId,
            PushMonitoringFailureItem.Source source);
}
