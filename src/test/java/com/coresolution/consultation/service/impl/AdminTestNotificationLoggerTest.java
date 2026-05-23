package com.coresolution.consultation.service.impl;

import java.util.Map;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationRecipientMode;
import com.coresolution.consultation.entity.AdminTestNotificationLog;
import com.coresolution.consultation.repository.AdminTestNotificationLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * {@link AdminTestNotificationLogger} 단위 테스트 — {@code sent_by_username} NOT NULL 핫픽스 회귀 보호.
 *
 * <p>운영 회귀(2026-05-23) 재현: 일부 어드민 계정의 {@code users.user_id} 가 NULL 인 케이스에서
 * {@code admin_test_notification_logs.sent_by_username} (NOT NULL VARCHAR(100)) 에 직접 NULL
 * 을 넣어 INSERT 실패 → HTTP 400. {@code AdminTestNotificationLogger} 단일 지점에서 fallback
 * 식별자(user-{id} 또는 "system")로 sanitize 한다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminTestNotificationLogger — sentByUsername NOT NULL 핫픽스")
class AdminTestNotificationLoggerTest {

    private static final String TENANT_ID = "tenant-incheon-counseling-001";
    private static final String PHONE_MASKED = "010****5678";
    private static final String REASON = "운영 검수 — 발송 도구 회귀 테스트";

    @Mock
    private AdminTestNotificationLogRepository repository;

    private AdminTestNotificationLogger logger;

    @BeforeEach
    void setUp() {
        logger = new AdminTestNotificationLogger(repository, new ObjectMapper());
        when(repository.save(any(AdminTestNotificationLog.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("정상 케이스 — sentByUsername 원본 유지(회귀 보호)")
    void logAttempt_whenUsernamePresent_keepsOriginal() {
        AdminTestNotificationLog saved = logger.logAttempt(
            TENANT_ID, 7L, "admin",
            TestNotificationRecipientMode.SELF, 7L, PHONE_MASKED,
            TestNotificationChannel.SMS, null, null, "본문", REASON);

        assertThat(saved.getSentByUsername()).isEqualTo("admin");
        assertThat(saved.getSentByUserId()).isEqualTo(7L);
        assertThat(saved.getTenantId()).isEqualTo(TENANT_ID);
        assertThat(saved.getSuccess()).isFalse();
    }

    @Test
    @DisplayName("운영 회귀 — sentByUsername=null + sentByUserId 존재 시 'user-{id}' fallback")
    void logAttempt_whenUsernameNull_usesUserIdFallback() {
        AdminTestNotificationLog saved = logger.logAttempt(
            TENANT_ID, 42L, null,
            TestNotificationRecipientMode.SELF, 42L, PHONE_MASKED,
            TestNotificationChannel.SMS, null, null, "본문", REASON);

        assertThat(saved.getSentByUsername()).isEqualTo("user-42");
        assertThat(saved.getSentByUserId()).isEqualTo(42L);
    }

    @Test
    @DisplayName("극단 케이스 — sentByUsername='' + sentByUserId=null 시 'system' fallback")
    void logAttempt_whenBothBlankAndNullId_usesSystemFallback() {
        AdminTestNotificationLog saved = logger.logAttempt(
            TENANT_ID, null, "",
            TestNotificationRecipientMode.SELF, null, PHONE_MASKED,
            TestNotificationChannel.SMS, null, null, "본문", REASON);

        assertThat(saved.getSentByUsername()).isEqualTo("system");
        assertThat(saved.getSentByUserId()).isNull();
    }

    @Test
    @DisplayName("whitespace-only — '   ' 도 blank 로 처리 → 'user-{id}' fallback")
    void logAttempt_whenUsernameWhitespaceOnly_usesUserIdFallback() {
        AdminTestNotificationLog saved = logger.logAttempt(
            TENANT_ID, 99L, "   ",
            TestNotificationRecipientMode.SELF, 99L, PHONE_MASKED,
            TestNotificationChannel.SMS, null, null, "본문", REASON);

        assertThat(saved.getSentByUsername()).isEqualTo("user-99");
    }

    @Test
    @DisplayName("batchId 포함 오버로드 — batch 발송에서도 fallback 적용")
    void logAttempt_withBatchId_appliesFallback() {
        String batchId = "batch-uuid-001";
        AdminTestNotificationLog saved = logger.logAttempt(
            TENANT_ID, 55L, null,
            TestNotificationRecipientMode.USER, 60L, PHONE_MASKED,
            TestNotificationChannel.ALIMTALK, "TPL_001",
            Map.of("name", "홍길동"), null, REASON, batchId);

        assertThat(saved.getSentByUsername()).isEqualTo("user-55");
        assertThat(saved.getBatchId()).isEqualTo(batchId);
        assertThat(saved.getTemplateCode()).isEqualTo("TPL_001");
    }

    @Test
    @DisplayName("save 호출 시 sanitize 된 username 이 영속화 인자로 전달됨")
    void logAttempt_passesSanitizedUsernameToRepository() {
        logger.logAttempt(
            TENANT_ID, 42L, "  ",
            TestNotificationRecipientMode.SELF, 42L, PHONE_MASKED,
            TestNotificationChannel.SMS, null, null, "본문", REASON);

        ArgumentCaptor<AdminTestNotificationLog> captor =
            ArgumentCaptor.forClass(AdminTestNotificationLog.class);
        org.mockito.Mockito.verify(repository).save(captor.capture());
        assertThat(captor.getValue().getSentByUsername()).isEqualTo("user-42");
    }
}
