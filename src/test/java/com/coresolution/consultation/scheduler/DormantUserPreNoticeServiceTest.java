package com.coresolution.consultation.scheduler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.dto.lifecycle.DormantUserPiiSnapshot;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.DormantUserPiiVault;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AuditLogRepository;
import com.coresolution.consultation.repository.DormantUserPiiVaultRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DormantPiiVaultService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link DormantUserPreNoticeService} 단위 테스트 — Phase 3 30일 사전 통지 cron.
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("DormantUserPreNoticeService — 30일 사전 통지 배치")
class DormantUserPreNoticeServiceTest {

    private static final String TENANT_A = "tenant-a";

    @Mock private DormantUserPiiVaultRepository dormantUserPiiVaultRepository;
    @Mock private UserRepository userRepository;
    @Mock private DormantPiiVaultService dormantPiiVaultService;
    @Mock private AuditLogRepository auditLogRepository;

    @InjectMocks
    private DormantUserPreNoticeService service;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(service, "dryRun", false);
        ReflectionTestUtils.setField(service, "preNoticeDaysBefore", 30);
    }

    @Test
    @DisplayName("runOnce: 30일 이내 익명화 + 미발송 vault 0건 — 호출 없음")
    void runOnce_noCandidates_skips() {
        when(dormantUserPiiVaultRepository.findDueForPreNotice(any(LocalDateTime.class)))
                .thenReturn(List.of());

        DormantUserPreNoticeService.BatchResult result = service.runOnce();

        assertThat(result.candidates).isZero();
        verify(auditLogRepository, never()).save(any());
        verify(dormantUserPiiVaultRepository, never()).save(any());
    }

    @Test
    @DisplayName("runOnce: cutoff 는 now + 30일 (preNoticeDaysBefore 정합)")
    void runOnce_cutoff_is_now_plus_30days() {
        when(dormantUserPiiVaultRepository.findDueForPreNotice(any(LocalDateTime.class)))
                .thenReturn(List.of());

        service.runOnce();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(dormantUserPiiVaultRepository).findDueForPreNotice(captor.capture());
        LocalDateTime cutoff = captor.getValue();
        LocalDateTime expected = LocalDateTime.now().plusDays(30);
        assertThat(java.time.Duration.between(cutoff, expected).abs().toMinutes())
                .isLessThanOrEqualTo(1L);
    }

    @Test
    @DisplayName("runOnce: 2명 vault → pre_notice_sent_at + channel stamp + audit_logs AUTO_ANONYMIZE_NOTIFIED")
    void runOnce_notifies_eachCandidate() {
        DormantUserPiiVault v1 = vault(11L, 101L);
        DormantUserPiiVault v2 = vault(12L, 102L);
        when(dormantUserPiiVaultRepository.findDueForPreNotice(any(LocalDateTime.class)))
                .thenReturn(List.of(v1, v2));
        when(dormantUserPiiVaultRepository.findById(11L)).thenReturn(Optional.of(v1));
        when(dormantUserPiiVaultRepository.findById(12L)).thenReturn(Optional.of(v2));
        when(dormantPiiVaultService.decrypt(any())).thenReturn(snapshotWithEmail("u@x.com"));
        when(userRepository.findById(anyLong())).thenReturn(Optional.of(userWithChannels(true, true, true)));

        DormantUserPreNoticeService.BatchResult result = service.runOnce();

        assertThat(result.candidates).isEqualTo(2);
        assertThat(result.notified).isEqualTo(2);
        assertThat(v1.getPreNoticeSentAt()).isNotNull();
        assertThat(v1.getPreNoticeChannel())
                .isEqualTo(DormantUserPreNoticeService.PreNoticeChannel.EMAIL.name());

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(2)).save(auditCaptor.capture());
        assertThat(auditCaptor.getAllValues())
                .allMatch(a -> a.getAction() == AuditAction.AUTO_ANONYMIZE_NOTIFIED);
    }

    @Test
    @DisplayName("runOnce: 채널 우선순위 — 이메일 차단 → KAKAO → SMS fallback")
    void runOnce_channel_priority_fallback() {
        DormantUserPiiVault v = vault(21L, 201L);
        when(dormantUserPiiVaultRepository.findDueForPreNotice(any(LocalDateTime.class)))
                .thenReturn(List.of(v));
        when(dormantUserPiiVaultRepository.findById(21L)).thenReturn(Optional.of(v));
        when(dormantPiiVaultService.decrypt(any()))
                .thenReturn(snapshotEmailAndPhone(null, "010-1234-5678"));
        when(userRepository.findById(201L))
                .thenReturn(Optional.of(userWithChannels(false, true, true)));

        service.runOnce();

        assertThat(v.getPreNoticeChannel())
                .as("이메일 PII 없음 + 카톡 활성 + 전화번호 존재 → KAKAO")
                .isEqualTo(DormantUserPreNoticeService.PreNoticeChannel.KAKAO.name());
    }

    @Test
    @DisplayName("runOnce: 채널 모두 차단 → NONE — vault stamp 없음 + audit_logs 없음")
    void runOnce_noAvailableChannel_skips() {
        DormantUserPiiVault v = vault(31L, 301L);
        when(dormantUserPiiVaultRepository.findDueForPreNotice(any(LocalDateTime.class)))
                .thenReturn(List.of(v));
        when(dormantUserPiiVaultRepository.findById(31L)).thenReturn(Optional.of(v));
        when(dormantPiiVaultService.decrypt(any()))
                .thenReturn(snapshotEmailAndPhone(null, null));
        when(userRepository.findById(301L))
                .thenReturn(Optional.of(userWithChannels(false, false, false)));

        service.runOnce();

        assertThat(v.getPreNoticeSentAt())
                .as("발송 가능한 채널 없음 → stamp 되지 않아야 함")
                .isNull();
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("runOnce: 1명 실패해도 다음 후보 계속 처리 — 격리")
    void runOnce_failure_isolation() {
        DormantUserPiiVault v1 = vault(41L, 401L);
        DormantUserPiiVault v2 = vault(42L, 402L);
        DormantUserPiiVault v3 = vault(43L, 403L);
        when(dormantUserPiiVaultRepository.findDueForPreNotice(any(LocalDateTime.class)))
                .thenReturn(List.of(v1, v2, v3));
        when(dormantUserPiiVaultRepository.findById(41L)).thenReturn(Optional.of(v1));
        when(dormantUserPiiVaultRepository.findById(42L))
                .thenThrow(new RuntimeException("simulated DB read error"));
        when(dormantUserPiiVaultRepository.findById(43L)).thenReturn(Optional.of(v3));
        when(dormantPiiVaultService.decrypt(any())).thenReturn(snapshotWithEmail("u@x.com"));
        when(userRepository.findById(anyLong()))
                .thenReturn(Optional.of(userWithChannels(true, true, true)));

        DormantUserPreNoticeService.BatchResult result = service.runOnce();

        assertThat(result.candidates).isEqualTo(3);
        assertThat(result.notified).isEqualTo(2);
        assertThat(result.failed).isEqualTo(1);
    }

    @Test
    @DisplayName("runOnce: dryRun=true — 후보 조회만, stamp/audit 호출 없음")
    void runOnce_dryRun_skipsMutations() {
        ReflectionTestUtils.setField(service, "dryRun", true);
        when(dormantUserPiiVaultRepository.findDueForPreNotice(any(LocalDateTime.class)))
                .thenReturn(List.of(vault(51L, 501L)));

        DormantUserPreNoticeService.BatchResult result = service.runOnce();

        assertThat(result.candidates).isEqualTo(1);
        assertThat(result.notified).isZero();
        verify(auditLogRepository, never()).save(any());
        verify(dormantUserPiiVaultRepository, never()).save(any());
    }

    private DormantUserPiiVault vault(Long id, Long userId) {
        DormantUserPiiVault v = DormantUserPiiVault.builder()
                .userId(userId)
                .encryptedPii("{\"v\":1}")
                .dormantEnteredAt(LocalDateTime.now().minusYears(4))
                .anonymizeScheduledAt(LocalDateTime.now().plusDays(10))
                .build();
        v.setId(id);
        v.setTenantId(TENANT_A);
        return v;
    }

    private DormantUserPiiSnapshot snapshotWithEmail(String email) {
        return DormantUserPiiSnapshot.builder().email(email).name("이름").build();
    }

    private DormantUserPiiSnapshot snapshotEmailAndPhone(String email, String phone) {
        return DormantUserPiiSnapshot.builder()
                .email(email).phone(phone).name("이름").build();
    }

    private User userWithChannels(boolean email, boolean kakao, boolean sms) {
        User u = new User();
        u.setId(999L);
        u.setTenantId(TENANT_A);
        u.setEmailNotification(email);
        u.setKakaoAlimTalkNotification(kakao);
        u.setSmsNotification(sms);
        return u;
    }
}
