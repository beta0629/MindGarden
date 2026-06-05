package com.coresolution.consultation.scheduler;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.SessionRecoveryAlert;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.SessionRecoveryAlertRepository;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.core.context.TenantContextHolder;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 회기 차감 누락 보정 배치 (P1 #93 안전망).
 *
 * <p>{@code session_sequence IS NULL} + 처리 대상 상태 (BOOKED/CONFIRMED/IN_PROGRESS/COMPLETED)
 * + 상담사·내담자 모두 존재 + (COMPLETED 인 경우 ConsultationRecord 존재) 인 일정을 페이지 단위로
 * 순회하며 매핑 회기 차감을 시도한다. 결제 승인된 활성/입금대기 매핑이 없거나 잔여 회기가 0
 * 이면 {@link SessionRecoveryAlert} 를 적재하여 어드민이 인지할 수 있게 한다.</p>
 *
 * <p>운영 안전 가드: {@code mindgarden.batch.session-recovery.enabled=false} 로 즉시 비활성화 가능.</p>
 *
 * <p>관련 합의: 매핑 회기 차감 누락 P1 — mapping#93 운영 보정 후 영구 가드.
 * §1 패치 7.1 (즉시 보정), §4 배치 잡 (안전망), §5 알림 적재.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        name = "mindgarden.batch.session-recovery.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class SessionDeductionRecoveryBatch {

    /** 한 사이클 처리량 — 운영 안정성을 위해 페이지 단위로 제한. */
    private static final int DEFAULT_PAGE_SIZE = 200;
    /** 보정 대상 상태 — 결제 확정 *이전* 에 이미 이 상태로 전환된 일정이 모두 후보. */
    private static final List<ScheduleStatus> RECOVERY_STATUSES = List.of(
            ScheduleStatus.BOOKED,
            ScheduleStatus.CONFIRMED,
            ScheduleStatus.IN_PROGRESS,
            ScheduleStatus.COMPLETED);

    private final ScheduleRepository scheduleRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final ScheduleService scheduleService;
    private final SessionRecoveryAlertRepository alertRepository;

    @Value("${mindgarden.batch.session-recovery.page-size:200}")
    private int pageSize;

    /**
     * 매 30분마다 한 사이클 실행 (운영 안정성: 한 사이클 처리량은 페이지 크기로 제한).
     * Cron 은 {@code mindgarden.batch.session-recovery.cron} 으로 외부화.
     */
    @Scheduled(cron = "${mindgarden.batch.session-recovery.cron:0 0/30 * * * ?}", zone = "Asia/Seoul")
    @SchedulerLock(
            name = "SessionDeductionRecoveryBatch",
            lockAtMostFor = "PT10M",
            lockAtLeastFor = "PT30S"
    )
    public void runScheduledRecovery() {
        RecoveryResult result = runRecovery();
        log.info("session deduction recovery batch (scheduled): total={}, success={}, skipped={}, alerted={}",
                result.candidates(), result.success(), result.skipped(), result.alerted());
    }

    /**
     * 보정 1회 실행. 어드민 단건 트리거({@code all=true}) 에서도 동일 메서드 호출.
     *
     * @return 처리 결과 (candidates / success / skipped / alerted)
     */
    @Transactional
    public RecoveryResult runRecovery() {
        int effectivePageSize = pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
        List<Schedule> candidates = scheduleRepository.findRecoveryCandidates(
                RECOVERY_STATUSES, PageRequest.of(0, effectivePageSize));
        if (candidates.isEmpty()) {
            return new RecoveryResult(0, 0, 0, 0);
        }
        int success = 0;
        int skipped = 0;
        int alerted = 0;
        for (Schedule schedule : candidates) {
            String tenantId = schedule.getTenantId();
            if (tenantId == null || tenantId.isBlank()) {
                log.warn("session deduction recovery batch: tenantId 없음 - scheduleId={}", schedule.getId());
                skipped++;
                continue;
            }
            // 일정의 tenantId 로 컨텍스트 고정 (sessionSyncService 등 하위 컴포넌트가 컨텍스트 의존).
            String previousTenant = TenantContextHolder.getTenantId();
            try {
                TenantContextHolder.setTenantId(tenantId);
                RecoveryOutcome outcome = recoverOne(schedule);
                switch (outcome) {
                    case SUCCESS -> success++;
                    case ALERTED -> alerted++;
                    case SKIPPED -> skipped++;
                }
            } catch (Exception ex) {
                skipped++;
                log.warn("session deduction recovery batch: scheduleId={} skipped, reason={}",
                        schedule.getId(), ex.getMessage(), ex);
            } finally {
                if (previousTenant != null && !previousTenant.isBlank()) {
                    TenantContextHolder.setTenantId(previousTenant);
                } else {
                    TenantContextHolder.clear();
                }
            }
        }
        return new RecoveryResult(candidates.size(), success, skipped, alerted);
    }

    private RecoveryOutcome recoverOne(Schedule schedule) {
        String tenantId = schedule.getTenantId();
        Long consultantId = schedule.getConsultantId();
        Long clientId = schedule.getClientId();
        if (consultantId == null || clientId == null) {
            return RecoveryOutcome.SKIPPED;
        }
        // 멱등성 재확인: findRecoveryCandidates 가 sessionSequence IS NULL 만 반환하지만
        // 동시 차감 레이스 대응(같은 schedule 2회 호출 시 두 번째 skip).
        if (schedule.getSessionSequence() != null) {
            return RecoveryOutcome.SKIPPED;
        }
        Optional<ConsultantClientMapping> opt = mappingRepository
                .findActiveByConsultantAndClient(tenantId, consultantId, clientId);
        if (opt.isEmpty()) {
            saveAlertIfAbsent(tenantId, schedule.getId(), null,
                    SessionRecoveryAlert.REASON_ACTIVE_MAPPING_NOT_FOUND);
            return RecoveryOutcome.ALERTED;
        }
        ConsultantClientMapping mapping = opt.get();
        Integer remaining = mapping.getRemainingSessions();
        if (remaining == null || remaining <= 0) {
            saveAlertIfAbsent(tenantId, schedule.getId(), mapping.getId(),
                    SessionRecoveryAlert.REASON_REMAINING_SESSIONS_ZERO);
            return RecoveryOutcome.ALERTED;
        }
        try {
            scheduleService.useSessionForSpecificMapping(
                    tenantId, mapping.getId(), consultantId, clientId, schedule);
            log.info("session deduction recovery: scheduleId={}, mappingId={}, batch_recovery=true",
                    schedule.getId(), mapping.getId());
            return RecoveryOutcome.SUCCESS;
        } catch (IllegalStateException ex) {
            log.warn("session deduction recovery batch: scheduleId={} mapping guard skipped, reason={}",
                    schedule.getId(), ex.getMessage());
            saveAlertIfAbsent(tenantId, schedule.getId(), mapping.getId(),
                    SessionRecoveryAlert.REASON_MAPPING_STATUS_INVALID);
            return RecoveryOutcome.ALERTED;
        } catch (RuntimeException ex) {
            log.error("session deduction recovery batch: scheduleId={} unexpected error, reason={}",
                    schedule.getId(), ex.getMessage(), ex);
            saveAlertIfAbsent(tenantId, schedule.getId(), mapping.getId(),
                    SessionRecoveryAlert.REASON_UNEXPECTED_ERROR);
            return RecoveryOutcome.ALERTED;
        }
    }

    /**
     * 멱등 적재: 동일 일정에 대해 미해결 알림이 이미 있으면 중복 적재하지 않는다.
     */
    private void saveAlertIfAbsent(String tenantId, Long scheduleId, Long mappingId, String reason) {
        if (alertRepository.existsUnresolvedByTenantIdAndScheduleId(tenantId, scheduleId)) {
            return;
        }
        SessionRecoveryAlert alert = SessionRecoveryAlert.builder()
                .scheduleId(scheduleId)
                .mappingId(mappingId)
                .reason(reason)
                .build();
        alert.setTenantId(tenantId);
        alertRepository.save(alert);
    }

    /**
     * 배치 1 사이클 처리 결과.
     */
    public record RecoveryResult(int candidates, int success, int skipped, int alerted) {}

    /**
     * 일정 1건 처리 결과 분기.
     */
    private enum RecoveryOutcome {
        SUCCESS,
        SKIPPED,
        ALERTED
    }
}
