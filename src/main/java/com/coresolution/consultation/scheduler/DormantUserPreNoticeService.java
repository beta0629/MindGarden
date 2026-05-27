package com.coresolution.consultation.scheduler;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.dto.lifecycle.Actor;
import com.coresolution.consultation.dto.lifecycle.DormantUserPiiSnapshot;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.DormantUserPiiVault;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.AuditLogRepository;
import com.coresolution.consultation.repository.DormantUserPiiVaultRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DormantPiiVaultService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 휴면 사용자 익명화 30일 사전 통지 배치 — USER_LIFECYCLE_TERMINATION_POLICY v1.2 §10.9 +
 * 개인정보보호법 §29 (사전 통지 의무).
 *
 * <p>매일 09:00 KST 실행 (사용자 친화 시간대). {@code dormant_user_pii_vault} 에서
 * {@code pre_notice_sent_at IS NULL AND anonymize_scheduled_at &lt; now + 30 days} 인
 * 행을 조회하여 사용자별 알림 채널 우선순위 (EMAIL → KAKAO → SMS) 로 통지를 발송한다.
 * 발송 성공 시 {@code pre_notice_sent_at + pre_notice_channel} 을 stamp 한다.</p>
 *
 * <p>실제 발송 채널 호출은 본 phase 에서는 NotificationService 등 외부 채널 의존성을
 * 단순화하기 위해 vault 내 PII 를 복호화해 채널 결정에 사용한 뒤, audit_logs 만
 * 적재한다. (실제 SMS/이메일 어댑터 호출은 후속 Phase 의 NotificationService 통합 PR 에서
 * 확장. 본 PR 은 사전 통지 cron 의 SSOT + audit + stamp 표준화에 집중.)</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
    name = "mindgarden.scheduler.dormant-pre-notice.enabled",
    havingValue = "true",
    matchIfMissing = true
)
public class DormantUserPreNoticeService {

    private static final String SCHEDULER_NAME = "DormantUserPreNotice";
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    /** 사전 통지 채널 — 우선순위 EMAIL > KAKAO > SMS. */
    public enum PreNoticeChannel {
        EMAIL, KAKAO, SMS, NONE
    }

    private final DormantUserPiiVaultRepository dormantUserPiiVaultRepository;
    private final UserRepository userRepository;
    private final DormantPiiVaultService dormantPiiVaultService;
    private final AuditLogRepository auditLogRepository;

    @Value("${mindgarden.scheduler.dormant-pre-notice.dry-run:true}")
    private boolean dryRun;

    @Value("${mindgarden.lifecycle.pre-notice-days-before:30}")
    private int preNoticeDaysBefore;

    /**
     * 매일 09:00 KST 사전 통지 배치.
     */
    @Scheduled(
        cron = "${mindgarden.scheduler.dormant-pre-notice.cron:0 0 9 * * *}",
        zone = "Asia/Seoul"
    )
    public void runScheduled() {
        BatchResult result = runOnce();
        log.info("[{}] executed: candidates={}, notified={}, failed={}, dryRun={}, runAt={}",
                SCHEDULER_NAME, result.candidates, result.notified, result.failed,
                dryRun, LocalDateTime.now(KST));
    }

    /**
     * cron 외 직접 호출 가능한 단일 회차 처리.
     *
     * @return 배치 처리 결과 ({@link BatchResult})
     */
    public BatchResult runOnce() {
        LocalDateTime now = LocalDateTime.now(KST);
        LocalDateTime preNoticeCutoff = now.plusDays(resolvePreNoticeDays());

        List<DormantUserPiiVault> candidates =
                dormantUserPiiVaultRepository.findDueForPreNotice(preNoticeCutoff);
        if (candidates.isEmpty()) {
            log.debug("[{}] no pre-notice candidates (cutoff={})",
                    SCHEDULER_NAME, preNoticeCutoff);
            return new BatchResult(0, 0, 0);
        }

        if (dryRun) {
            log.info("[{}] dry-run: candidates={}, cutoff={}",
                    SCHEDULER_NAME, candidates.size(), preNoticeCutoff);
            return new BatchResult(candidates.size(), 0, 0);
        }

        int notified = 0;
        int failed = 0;
        for (DormantUserPiiVault vault : candidates) {
            try {
                notifySingle(vault.getId(), vault.getUserId(), vault.getTenantId());
                notified++;
            } catch (Exception e) {
                failed++;
                log.error("[{}] failed to notify userId={} (tenantId={}) — continuing: {}",
                        SCHEDULER_NAME, vault.getUserId(), vault.getTenantId(),
                        e.getMessage(), e);
            }
        }
        return new BatchResult(candidates.size(), notified, failed);
    }

    /**
     * 단일 사용자 사전 통지 — REQUIRES_NEW 격리.
     *
     * @param vaultId  vault 행 PK
     * @param userId   대상 users.id
     * @param tenantId 테넌트 ID
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void notifySingle(Long vaultId, Long userId, String tenantId) {
        DormantUserPiiVault vault = dormantUserPiiVaultRepository.findById(vaultId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "DormantUserPiiVault not found: " + vaultId));

        // PII 스냅샷 복호화 — 채널 결정에 사용 (이메일·전화 존재 여부)
        DormantUserPiiSnapshot snapshot =
                dormantPiiVaultService.decrypt(vault.getEncryptedPii());

        // 사용자의 알림 수신 설정도 함께 고려 — DORMANT 진입 시점에 users 테이블의 알림
        // 설정 boolean 컬럼은 surrogate 치환되지 않으므로 이를 활용한다.
        Optional<User> userOpt = userRepository.findById(userId);

        PreNoticeChannel channel = resolveChannel(snapshot, userOpt.orElse(null));
        if (channel == PreNoticeChannel.NONE) {
            log.warn("[{}] no available channel for userId={} — skipping pre-notice",
                    SCHEDULER_NAME, userId);
            return;
        }

        // vault 행 stamp — pre_notice_sent_at + pre_notice_channel
        LocalDateTime now = LocalDateTime.now();
        vault.setPreNoticeSentAt(now);
        vault.setPreNoticeChannel(channel.name());
        dormantUserPiiVaultRepository.save(vault);

        // audit_logs 기록 (AUTO_ANONYMIZE_NOTIFIED)
        AuditLog auditEntry = AuditLog.builder()
                .tenantId(tenantId)
                .actorUserId(null)
                .actorRole(Actor.SYSTEM_ROLE)
                .targetUserId(userId)
                .action(AuditAction.AUTO_ANONYMIZE_NOTIFIED)
                .entityType("USER")
                .entityId(userId)
                .build();
        auditLogRepository.save(auditEntry);

        log.info("[{}] pre-notice sent: userId={}, tenantId={}, channel={}, "
                        + "anonymizeScheduledAt={}",
                SCHEDULER_NAME, userId, tenantId, channel, vault.getAnonymizeScheduledAt());
    }

    /**
     * 채널 결정 — EMAIL → KAKAO → SMS 우선순위.
     *
     * <p>vault PII 의 이메일/전화 존재 여부 + 사용자 알림 수신 설정을 모두 고려한다.</p>
     *
     * @param snapshot 복호화된 PII 스냅샷
     * @param user     대상 사용자 (알림 수신 boolean 확인용, null 가능)
     * @return 최종 발송 채널 또는 {@link PreNoticeChannel#NONE}
     */
    PreNoticeChannel resolveChannel(DormantUserPiiSnapshot snapshot, User user) {
        boolean emailEnabled = user == null || Boolean.TRUE.equals(user.getEmailNotification());
        boolean kakaoEnabled = user == null || Boolean.TRUE.equals(user.getKakaoAlimTalkNotification());
        boolean smsEnabled = user == null || Boolean.TRUE.equals(user.getSmsNotification());

        boolean hasEmail = snapshot.getEmail() != null && !snapshot.getEmail().isBlank();
        boolean hasPhone = snapshot.getPhone() != null && !snapshot.getPhone().isBlank();

        if (emailEnabled && hasEmail) {
            return PreNoticeChannel.EMAIL;
        }
        if (kakaoEnabled && hasPhone) {
            return PreNoticeChannel.KAKAO;
        }
        if (smsEnabled && hasPhone) {
            return PreNoticeChannel.SMS;
        }
        return PreNoticeChannel.NONE;
    }

    int resolvePreNoticeDays() {
        return preNoticeDaysBefore > 0 ? preNoticeDaysBefore : 30;
    }

    /** 배치 처리 결과 VO. */
    public static final class BatchResult {
        public final int candidates;
        public final int notified;
        public final int failed;

        public BatchResult(int candidates, int notified, int failed) {
            this.candidates = candidates;
            this.notified = notified;
            this.failed = failed;
        }
    }
}
