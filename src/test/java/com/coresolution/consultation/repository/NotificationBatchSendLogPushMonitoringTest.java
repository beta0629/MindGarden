package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.coresolution.consultation.constant.BatchNotificationTemplateCodes;
import com.coresolution.consultation.entity.NotificationBatchSendLog;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * BW-1 Repository 신규 메서드 (윈도/PENDING/단건) SSOT 검증.
 *
 * <p>{@link NotificationBatchSendLogRepository} 의 다음 신규 메서드:
 * <ul>
 *   <li>{@code countPendingByTenantId} — channel_used='PENDING' 행 수</li>
 *   <li>{@code countWindowByTenant} — 윈도 카운트</li>
 *   <li>{@code findWindowByTenantAndChannel} — 윈도 + 채널 필터 조회</li>
 *   <li>{@code findByIdAndTenantId} — 테넌트 격리 단건 조회</li>
 * </ul>
 *
 * <p>실 DB 쿼리(JPQL) 정합성을 SpringBootTest 로 검증한다.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@Transactional
@ActiveProfiles("test")
@DisplayName("NotificationBatchSendLogRepository — BW-1 푸시 모니터링 메서드")
class NotificationBatchSendLogPushMonitoringTest {

    @Autowired
    private NotificationBatchSendLogRepository repository;

    @Test
    @DisplayName("countPendingByTenantId — 테넌트 PENDING 행만 카운트, 다른 채널/테넌트 제외")
    void countPendingByTenantId_isolatesPendingAndTenant() {
        String tenantId = UUID.randomUUID().toString();
        String otherTenant = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        repository.save(buildLog(tenantId, "PENDING", now, false, null, 100L));
        repository.save(buildLog(tenantId, "PENDING", now, false, null, 101L));
        repository.save(buildLog(tenantId,
            BatchNotificationTemplateCodes.CHANNEL_ALIMTALK, now, true, null, 102L));
        repository.save(buildLog(otherTenant, "PENDING", now, false, null, 200L));

        long pending = repository.countPendingByTenantId(tenantId);
        assertThat(pending).isEqualTo(2L);
    }

    @Test
    @DisplayName("countWindowByTenant — 윈도 내 행만 카운트, 윈도 외 제외")
    void countWindowByTenant_filtersByWindow() {
        String tenantId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        repository.save(buildLog(tenantId,
            BatchNotificationTemplateCodes.CHANNEL_ALIMTALK, now, true, null, 1L));
        repository.save(buildLog(tenantId,
            BatchNotificationTemplateCodes.CHANNEL_SMS, now.minusMinutes(2L), true, null, 2L));
        // 윈도 외
        repository.save(buildLog(tenantId,
            BatchNotificationTemplateCodes.CHANNEL_SMS, now.minusHours(2L), true, null, 3L));

        long count = repository.countWindowByTenant(tenantId, now.minusMinutes(5L), now);
        assertThat(count).isEqualTo(2L);
    }

    @Test
    @DisplayName("findWindowByTenantAndChannel — 채널 필터 null = 전체, 특정 채널 = 정확 일치")
    void findWindowByTenantAndChannel_filtersChannel() {
        String tenantId = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        repository.save(buildLog(tenantId,
            BatchNotificationTemplateCodes.CHANNEL_ALIMTALK, now, true, null, 1L));
        repository.save(buildLog(tenantId,
            BatchNotificationTemplateCodes.CHANNEL_SMS, now.minusMinutes(1L), false,
            BatchNotificationTemplateCodes.ERROR_CODE_SEND_FAILED, 2L));
        repository.save(buildLog(tenantId, "PENDING", now.minusMinutes(2L), false, null, 3L));

        List<NotificationBatchSendLog> all = repository.findWindowByTenantAndChannel(
            tenantId, now.minusHours(1L), now, null);
        assertThat(all).hasSize(3);

        List<NotificationBatchSendLog> alimtalk = repository.findWindowByTenantAndChannel(
            tenantId, now.minusHours(1L), now,
            BatchNotificationTemplateCodes.CHANNEL_ALIMTALK);
        assertThat(alimtalk).hasSize(1);
        assertThat(alimtalk.get(0).getChannelUsed())
            .isEqualTo(BatchNotificationTemplateCodes.CHANNEL_ALIMTALK);
    }

    @Test
    @DisplayName("findByIdAndTenantId — 다른 테넌트의 같은 id 행은 반환하지 않음")
    void findByIdAndTenantId_isolatesTenant() {
        String tenantId = UUID.randomUUID().toString();
        String otherTenant = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();

        NotificationBatchSendLog mine = repository.save(buildLog(tenantId,
            BatchNotificationTemplateCodes.CHANNEL_ALIMTALK, now, true, null, 1L));
        repository.save(buildLog(otherTenant,
            BatchNotificationTemplateCodes.CHANNEL_ALIMTALK, now, true, null, 1L));

        assertThat(repository.findByIdAndTenantId(mine.getId(), tenantId)).isPresent();
        assertThat(repository.findByIdAndTenantId(mine.getId(), otherTenant)).isEmpty();
    }

    private NotificationBatchSendLog buildLog(String tenantId, String channelUsed,
            LocalDateTime sentAt, boolean success, String errorCode, long targetId) {
        NotificationBatchSendLog row = NotificationBatchSendLog.builder()
            .templateCode(BatchNotificationTemplateCodes.RESERVATION_REMINDER_D2)
            .targetType(BatchNotificationTemplateCodes.TARGET_TYPE_SCHEDULE)
            .targetId(targetId)
            .recipientUserId(1L)
            .recipientPhoneMasked("010-***-1234")
            .channelUsed(channelUsed)
            .fallbackToSms(false)
            .success(success)
            .errorCode(errorCode)
            .errorMessage(success ? null : "발송 실패: " + errorCode)
            .sentAt(sentAt)
            .build();
        row.setTenantId(tenantId);
        row.setIsDeleted(Boolean.FALSE);
        return row;
    }
}
