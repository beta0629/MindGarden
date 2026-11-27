package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.coresolution.consultation.config.ManualNotificationProperties;
import com.coresolution.consultation.constant.ManualNotificationDeliveryStatus;
import com.coresolution.consultation.constant.ManualNotificationJobConstants;
import com.coresolution.consultation.constant.ManualNotificationJobStatus;
import com.coresolution.consultation.constant.ManualNotificationProviderMode;
import com.coresolution.consultation.dto.TestNotificationAlimtalkTemplateSource;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.entity.ManualNotificationJob;
import com.coresolution.consultation.entity.ManualNotificationJobRecipient;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ManualNotificationJobRecipientRepository;
import com.coresolution.consultation.repository.ManualNotificationJobRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 수동 발송 작업 실행기.
 *
 * <p>순서: 조건부 UPDATE 로 점유(claim) → 이전 실행이 프로바이더 호출 중 멈춘 수신자는 결과 미상 FAILED 로 닫고
 * 다시 보내지 않음 → 남은 PENDING 만 순번 청크로 처리. 수신자마다 「DISPATCHING 기록(짧은 트랜잭션) → 프로바이더 호출
 * (트랜잭션 밖) → 결과 기록(짧은 트랜잭션)」. 같은 작업·수신자 발송 기록은 DB 유니크 키로 1건만 생긴다.
 * 이 클래스는 트랜잭션을 열지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ManualNotificationJobWorker {

    private static final String CHUNK_LOG_EVENT = "manual_notification_dispatch_chunk";
    private static final int LEASE_RENEW_FRACTION = 3;

    private final ManualNotificationJobRepository jobRepository;
    private final ManualNotificationJobRecipientRepository recipientRepository;
    private final ManualNotificationJobStore store;
    private final ManualNotificationDispatchGateway gateway;
    private final ManualNotificationDispatchPacer pacer;
    private final ManualNotificationRecipientResolver recipientResolver;
    private final ManualNotificationProperties properties;
    private final UserRepository userRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final AlimtalkTemplateMappingResolver templateMappingResolver;
    private final ObjectMapper objectMapper;

    @Value("${app.instance.id:default}")
    private String instanceId;

    /**
     * 작업 1회 실행. 점유 실패(다른 실행자가 진행 중·이미 종료)면 아무것도 하지 않는다.
     *
     * @param jobId 작업 PK
     * @return 점유해서 실행했으면 true
     */
    public boolean run(Long jobId) {
        String owner = instanceId + ManualNotificationJobConstants.DISPATCH_KEY_SEPARATOR + UUID.randomUUID();
        LocalDateTime now = ManualNotificationJobConstants.nowKst();
        if (!store.claim(jobId, owner, now, leaseUntil(now))) {
            return false;
        }
        ManualNotificationJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            return false;
        }
        String previousTenant = TenantContextHolder.peekTenantId();
        TenantContextHolder.setTenantId(job.getTenantId());
        try {
            execute(job, new Lease(job.getId(), owner, now));
        } catch (RuntimeException e) {
            log.error("manual_notification_job_error jobId={} errorType={}", job.getJobUuid(),
                e.getClass().getSimpleName());
        } finally {
            TenantContextHolder.setTenantIdOrClear(previousTenant);
        }
        return true;
    }

    private void execute(ManualNotificationJob job, Lease lease) {
        String owner = lease.owner;
        int attemptNo = job.getExecutionAttempts() == null ? 1 : job.getExecutionAttempts();
        int interrupted = store.closeInterruptedDispatches(job.getId(), ManualNotificationJobConstants.nowKst());
        if (interrupted > 0) {
            log.warn("manual_notification_job_resume jobId={} attempt={} closedUnknown={}", job.getJobUuid(),
                attemptNo, interrupted);
        }

        String alimtalkTemplateId = null;
        if (job.getChannel() == TestNotificationChannel.ALIMTALK) {
            alimtalkTemplateId = resolveTemplateId(job);
            if (alimtalkTemplateId == null) {
                LocalDateTime now = ManualNotificationJobConstants.nowKst();
                store.failRemaining(job.getId(), ManualNotificationJobConstants.ERROR_TEMPLATE_NOT_MAPPED, now);
                store.finish(job.getId(), owner, ManualNotificationJobStatus.FAILED,
                    ManualNotificationJobConstants.ERROR_TEMPLATE_NOT_MAPPED, now);
                return;
            }
        }

        ManualNotificationProviderMode providerMode = gateway.mode();
        int chunkSize = job.getChunkSize();
        int chunkCount = job.getChunkCount();
        for (int chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
            if (!keepLease(lease, true)) {
                log.warn("manual_notification_job_lease_lost jobId={} chunkIndex={}", job.getJobUuid(), chunkIndex);
                return;
            }
            int seqFrom = chunkIndex * chunkSize + 1;
            int seqTo = seqFrom + chunkSize - 1;
            List<ManualNotificationJobRecipient> pending = recipientRepository
                .findByJobIdAndStatusAndSeqBetweenOrderBySeqAsc(job.getId(), ManualNotificationDeliveryStatus.PENDING,
                    seqFrom, seqTo);
            if (pending.isEmpty()) {
                continue;
            }
            logChunk(job, chunkIndex, attemptNo, providerMode, pending);
            try {
                boolean leaseHeld = job.getChannel() == TestNotificationChannel.PUSH
                    ? processPushChunk(job, chunkIndex, attemptNo, providerMode, pending)
                    : processMessageChunk(job, chunkIndex, attemptNo, providerMode, pending, alimtalkTemplateId, lease);
                if (!leaseHeld) {
                    log.warn("manual_notification_job_lease_lost jobId={} chunkIndex={}", job.getJobUuid(),
                        chunkIndex);
                    return;
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("manual_notification_job_interrupted jobId={} chunkIndex={}", job.getJobUuid(), chunkIndex);
                return;
            }
        }
        store.finish(job.getId(), owner, ManualNotificationJobStatus.COMPLETED, null,
            ManualNotificationJobConstants.nowKst());
    }

    private boolean processMessageChunk(ManualNotificationJob job, int chunkIndex, int attemptNo,
            ManualNotificationProviderMode providerMode, List<ManualNotificationJobRecipient> pending,
            String alimtalkTemplateId, Lease lease) throws InterruptedException {
        Map<Long, User> users = loadUsers(job.getTenantId(), pending);
        Map<Long, Boolean> consent = Boolean.TRUE.equals(job.getMarketing())
            ? recipientResolver.loadMarketingConsent(job.getTenantId(), users.keySet())
            : Collections.emptyMap();
        Map<String, String> params = parseParams(job.getTemplateParams());
        for (ManualNotificationJobRecipient r : pending) {
            if (!keepLease(lease, false)) {
                return false;
            }
            String phone = resolveSendPhone(job, r, users, consent);
            if (phone == null) {
                store.completeWithoutDispatch(job.getId(), r.getId(), ManualNotificationDeliveryStatus.SKIPPED,
                    ManualNotificationJobConstants.RESULT_RECIPIENT_NO_LONGER_ELIGIBLE,
                    ManualNotificationJobConstants.nowKst());
                continue;
            }
            if (!beginDispatch(job, r, chunkIndex, attemptNo, providerMode)) {
                continue;
            }
            pacer.acquire(job.getChannel(), 1);
            ManualNotificationDispatchGateway.Outcome outcome;
            try {
                outcome = job.getChannel() == TestNotificationChannel.SMS
                    ? gateway.sendSms(phone, job.getMessageContent())
                    : gateway.sendAlimtalk(phone, alimtalkTemplateId, new HashMap<>(params));
            } catch (RuntimeException e) {
                outcome = ManualNotificationDispatchGateway.Outcome.error(e);
            }
            complete(job, r, outcome);
        }
        return true;
    }

    private boolean processPushChunk(ManualNotificationJob job, int chunkIndex, int attemptNo,
            ManualNotificationProviderMode providerMode, List<ManualNotificationJobRecipient> pending)
            throws InterruptedException {
        Map<Long, User> users = loadUsers(job.getTenantId(), pending);
        Map<Long, Boolean> consent = Boolean.TRUE.equals(job.getMarketing())
            ? recipientResolver.loadMarketingConsent(job.getTenantId(), users.keySet())
            : Collections.emptyMap();
        List<ManualNotificationJobRecipient> dispatching = new ArrayList<>();
        List<Long> userIds = new ArrayList<>();
        for (ManualNotificationJobRecipient r : pending) {
            User user = users.get(r.getUserId());
            if (!stillEligible(user, consent, Boolean.TRUE.equals(job.getMarketing()))) {
                store.completeWithoutDispatch(job.getId(), r.getId(), ManualNotificationDeliveryStatus.SKIPPED,
                    ManualNotificationJobConstants.RESULT_RECIPIENT_NO_LONGER_ELIGIBLE,
                    ManualNotificationJobConstants.nowKst());
                continue;
            }
            if (beginDispatch(job, r, chunkIndex, attemptNo, providerMode)) {
                dispatching.add(r);
                userIds.add(r.getUserId());
            }
        }
        if (dispatching.isEmpty()) {
            return true;
        }
        pacer.acquire(job.getChannel(), dispatching.size());
        Map<Long, ManualNotificationDispatchGateway.Outcome> results;
        try {
            results = gateway.sendPush(job.getTenantId(), userIds, job.getPushTitle(), job.getMessageContent(),
                job.getJobUuid());
        } catch (RuntimeException e) {
            results = new HashMap<>();
            for (Long id : userIds) {
                results.put(id, ManualNotificationDispatchGateway.Outcome.error(e));
            }
        }
        for (ManualNotificationJobRecipient r : dispatching) {
            ManualNotificationDispatchGateway.Outcome outcome = results.get(r.getUserId());
            complete(job, r, outcome == null ? ManualNotificationDispatchGateway.Outcome.missing() : outcome);
        }
        return true;
    }

    private boolean beginDispatch(ManualNotificationJob job, ManualNotificationJobRecipient r, int chunkIndex,
            int attemptNo, ManualNotificationProviderMode providerMode) {
        try {
            return store.beginDispatch(job, r, chunkIndex, attemptNo, providerMode, dispatchKey(job, r),
                ManualNotificationJobConstants.nowKst());
        } catch (DataIntegrityViolationException e) {
            log.warn("manual_notification_dispatch_blocked jobId={} recipientKey={} code={}", job.getJobUuid(),
                r.getRecipientKey(), ManualNotificationJobConstants.RESULT_DUPLICATE_DISPATCH_BLOCKED);
            return false;
        }
    }

    private void complete(ManualNotificationJob job, ManualNotificationJobRecipient r,
            ManualNotificationDispatchGateway.Outcome outcome) {
        String errorCode = outcome.status() == ManualNotificationDeliveryStatus.SENT ? null : outcome.resultCode();
        store.completeDispatch(job.getId(), r.getId(), outcome.status(), outcome.resultCode(), errorCode,
            outcome.errorMessage(), ManualNotificationJobConstants.nowKst());
    }

    private String resolveSendPhone(ManualNotificationJob job, ManualNotificationJobRecipient r, Map<Long, User> users,
            Map<Long, Boolean> consent) {
        if (r.getUserId() == null) {
            if (Boolean.TRUE.equals(job.getMarketing()) || !StringUtils.hasText(r.getPhoneEncrypted())) {
                return null;
            }
            return encryptionUtil.decrypt(r.getPhoneEncrypted());
        }
        User user = users.get(r.getUserId());
        if (!stillEligible(user, consent, Boolean.TRUE.equals(job.getMarketing()))) {
            return null;
        }
        return recipientResolver.resolvePhone(user);
    }

    private static boolean stillEligible(User user, Map<Long, Boolean> consent, boolean marketing) {
        if (user == null || !Boolean.TRUE.equals(user.getIsActive()) || Boolean.TRUE.equals(user.getIsDeleted())) {
            return false;
        }
        return !marketing || Boolean.TRUE.equals(consent.get(user.getId()));
    }

    private Map<Long, User> loadUsers(String tenantId, List<ManualNotificationJobRecipient> recipients) {
        List<Long> ids = new ArrayList<>();
        for (ManualNotificationJobRecipient r : recipients) {
            if (r.getUserId() != null) {
                ids.add(r.getUserId());
            }
        }
        Map<Long, User> users = new HashMap<>();
        if (ids.isEmpty()) {
            return users;
        }
        for (User u : userRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, ids)) {
            users.put(u.getId(), u);
        }
        return users;
    }

    private String resolveTemplateId(ManualNotificationJob job) {
        if (job.getTemplateSource() == TestNotificationAlimtalkTemplateSource.SOLAPI) {
            return job.getTemplateCode();
        }
        return templateMappingResolver.resolveSolapiTemplateId(job.getTenantId(), job.getTemplateCode());
    }

    private Map<String, String> parseParams(String json) {
        if (!StringUtils.hasText(json)) {
            return new HashMap<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, String>>() { });
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private void logChunk(ManualNotificationJob job, int chunkIndex, int attemptNo,
            ManualNotificationProviderMode providerMode, List<ManualNotificationJobRecipient> pending) {
        List<String> recipientKeys = new ArrayList<>(pending.size());
        List<String> dispatchKeys = new ArrayList<>(pending.size());
        for (ManualNotificationJobRecipient r : pending) {
            recipientKeys.add(r.getRecipientKey());
            dispatchKeys.add(dispatchKey(job, r));
        }
        log.info("{} jobId={} tenantId={} channel={} chunkIndex={} attempt={} recipientCount={} providerMode={}"
                + " realCall={} recipientIds={} dispatchKeys={}",
            CHUNK_LOG_EVENT, job.getJobUuid(), job.getTenantId(), job.getChannel(), chunkIndex, attemptNo,
            pending.size(), providerMode, providerMode == ManualNotificationProviderMode.REAL, recipientKeys,
            dispatchKeys);
    }

    private static String dispatchKey(ManualNotificationJob job, ManualNotificationJobRecipient r) {
        return job.getJobUuid() + ManualNotificationJobConstants.DISPATCH_KEY_SEPARATOR + r.getRecipientKey();
    }

    private LocalDateTime leaseUntil(LocalDateTime now) {
        return now.plusSeconds(properties.getJob().getLeaseSeconds());
    }

    /**
     * 점유 연장. 만료까지 남은 시간이 1/{@value #LEASE_RENEW_FRACTION} 이하로 줄면(또는 강제 시) 연장한다.
     */
    private boolean keepLease(Lease lease, boolean force) {
        LocalDateTime now = ManualNotificationJobConstants.nowKst();
        long renewAfterSeconds = properties.getJob().getLeaseSeconds() / LEASE_RENEW_FRACTION;
        if (!force && now.isBefore(lease.renewedAt.plusSeconds(renewAfterSeconds))) {
            return true;
        }
        if (!store.renewLease(lease.jobId, lease.owner, leaseUntil(now))) {
            return false;
        }
        lease.renewedAt = now;
        return true;
    }

    /**
     * 실행 점유 상태.
     */
    private static final class Lease {
        private final Long jobId;
        private final String owner;
        private LocalDateTime renewedAt;

        private Lease(Long jobId, String owner, LocalDateTime renewedAt) {
            this.jobId = jobId;
            this.owner = owner;
            this.renewedAt = renewedAt;
        }
    }
}
