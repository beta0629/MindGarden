package com.coresolution.consultation.service.impl;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.dto.PendingPaymentCleanupResult;
import com.coresolution.consultation.dto.PendingPaymentDirtyMappingItem;
import com.coresolution.consultation.dto.PendingPaymentDirtyMappingPage;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.AdminMappingCleanupService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.core.context.TenantContextHolder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 옵션 B R4 — 디러티 PENDING_PAYMENT 매핑 어드민 수동 정리 서비스 구현.
 *
 * <p>합의서: {@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md}.
 *
 * <p>정리 동작 요약:
 * <ol>
 *   <li>매핑 상태 검증 (PENDING_PAYMENT 외 → 409/IllegalStateException)</li>
 *   <li>매핑 상태 TERMINATED 전이 + 정리 사유 / 종료자 / 종료시각 기록</li>
 *   <li>연관 schedules(TENTATIVE_PENDING_PAYMENT/BOOKED/CONFIRMED) 일괄 CANCELLED 전이</li>
 *   <li>{@code notifyClient=true} 면 NotificationService.sendConsultationCancelled() 호출</li>
 *   <li>tenantId 격리 (모든 조회·저장에 필수)</li>
 * </ol>
 *
 * <p>일괄 정리는 REQUIRES_NEW 트랜잭션으로 항목별 분리하여 부분 실패가 다른 항목에
 * 전파되지 않도록 한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminMappingCleanupServiceImpl implements AdminMappingCleanupService {

    /** 일괄 정리 최대 상한 (스펙: 50건). */
    public static final int BULK_CLEANUP_MAX_SIZE = 50;

    /** 기본 경과 기준 (24시간). */
    public static final long DEFAULT_AGE_HOURS = 24L;

    /** 정리 사유 메타 마커 — terminationReason 컬럼에 식별용 prefix. */
    static final String CLEANUP_REASON_PREFIX = "PENDING_PAYMENT_CLEANUP";

    /** 정리 시 함께 CANCELLED로 전환할 스케줄 상태 목록 (tentative + booked + confirmed). */
    private static final List<ScheduleStatus> CANCELLABLE_SCHEDULE_STATUSES = Arrays.asList(
            ScheduleStatus.TENTATIVE_PENDING_PAYMENT,
            ScheduleStatus.BOOKED,
            ScheduleStatus.CONFIRMED
    );

    private final ConsultantClientMappingRepository mappingRepository;
    private final ScheduleRepository scheduleRepository;
    private final NotificationService notificationService;
    private final PlatformTransactionManager transactionManager;

    @Override
    public PendingPaymentDirtyMappingPage getDirtyPendingPaymentMappings(long ageHours, int page, int size) {
        long effectiveAgeHours = ageHours > 0 ? ageHours : DEFAULT_AGE_HOURS;
        int effectiveSize = size > 0 ? Math.min(size, 100) : 20;
        int effectivePage = Math.max(page, 0);

        String tenantId = TenantContextHolder.getRequiredTenantId();
        LocalDateTime threshold = LocalDateTime.now().minus(Duration.ofHours(effectiveAgeHours));

        log.info("🔍 [R4] 디러티 PENDING_PAYMENT 매핑 조회: tenantId={}, ageHours={}, threshold={}, page={}, size={}",
                tenantId, effectiveAgeHours, threshold, effectivePage, effectiveSize);

        Page<ConsultantClientMapping> result = mappingRepository.findDirtyPendingPaymentMappings(
                tenantId, threshold, PageRequest.of(effectivePage, effectiveSize));

        LocalDateTime now = LocalDateTime.now();
        List<PendingPaymentDirtyMappingItem> items = result.getContent().stream()
                .map(mapping -> {
                    Hibernate.initialize(mapping.getConsultant());
                    Hibernate.initialize(mapping.getClient());
                    return PendingPaymentDirtyMappingItem.fromEntity(mapping, now);
                })
                .collect(Collectors.toList());

        return PendingPaymentDirtyMappingPage.builder()
                .items(items)
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .page(effectivePage)
                .size(effectiveSize)
                .ageHours(effectiveAgeHours)
                .build();
    }

    @Override
    public PendingPaymentCleanupResult cleanupPendingPaymentMapping(
            Long mappingId, String reason, Boolean notifyClient, String actor) {
        if (mappingId == null) {
            throw new IllegalArgumentException("mappingId는 필수입니다.");
        }
        validateReason(reason);

        String tenantId = TenantContextHolder.getRequiredTenantId();
        boolean shouldNotify = notifyClient == null || Boolean.TRUE.equals(notifyClient);

        log.info("🧹 [R4] PENDING_PAYMENT 매핑 단건 정리: mappingId={}, tenantId={}, notify={}, actor={}",
                mappingId, tenantId, shouldNotify, actor);

        CleanupSingleResult single = doCleanupSingle(tenantId, mappingId, reason, shouldNotify, actor);

        return PendingPaymentCleanupResult.builder()
                .mappingId(mappingId)
                .successMappingIds(List.of(mappingId))
                .failedMappingIds(List.of())
                .cancelledScheduleCount(single.cancelledScheduleCount)
                .notifiedClientCount(single.notified ? 1 : 0)
                .message("매칭이 정리되었습니다.")
                .build();
    }

    @Override
    public PendingPaymentCleanupResult bulkCleanupPendingPaymentMappings(
            List<Long> mappingIds, String reason, Boolean notifyClient, String actor) {
        if (mappingIds == null || mappingIds.isEmpty()) {
            throw new IllegalArgumentException("정리 대상 매칭 ID는 1건 이상이어야 합니다.");
        }
        if (mappingIds.size() > BULK_CLEANUP_MAX_SIZE) {
            throw new IllegalArgumentException(
                    "일괄 정리는 최대 " + BULK_CLEANUP_MAX_SIZE + "건까지 가능합니다. (요청: " + mappingIds.size() + "건)");
        }
        validateReason(reason);

        String tenantId = TenantContextHolder.getRequiredTenantId();
        boolean shouldNotify = notifyClient == null || Boolean.TRUE.equals(notifyClient);

        log.info("🧹 [R4] PENDING_PAYMENT 매핑 일괄 정리: count={}, tenantId={}, notify={}, actor={}",
                mappingIds.size(), tenantId, shouldNotify, actor);

        List<Long> successIds = new ArrayList<>();
        List<Long> failedIds = new ArrayList<>();
        int cancelledScheduleSum = 0;
        int notifiedSum = 0;

        for (Long id : mappingIds) {
            if (id == null) {
                continue;
            }
            try {
                CleanupSingleResult result = runInNewTransaction(tenantId,
                        () -> doCleanupSingle(tenantId, id, reason, shouldNotify, actor));
                successIds.add(id);
                cancelledScheduleSum += result.cancelledScheduleCount;
                if (result.notified) {
                    notifiedSum++;
                }
            } catch (RuntimeException ex) {
                log.warn("⚠️ [R4] 일괄 정리 항목 실패: mappingId={}, reason={}", id, ex.getMessage());
                failedIds.add(id);
            }
        }

        return PendingPaymentCleanupResult.builder()
                .mappingId(null)
                .successMappingIds(successIds)
                .failedMappingIds(failedIds)
                .cancelledScheduleCount(cancelledScheduleSum)
                .notifiedClientCount(notifiedSum)
                .message("총 " + successIds.size() + "건 정리, " + failedIds.size() + "건 실패")
                .build();
    }

    private CleanupSingleResult doCleanupSingle(
            String tenantId, Long mappingId, String reason, boolean notifyClient, String actor) {
        Optional<ConsultantClientMapping> opt = mappingRepository.findByTenantIdAndId(tenantId, mappingId);
        if (opt.isEmpty()) {
            throw new IllegalArgumentException("매칭을 찾을 수 없습니다. mappingId=" + mappingId);
        }
        ConsultantClientMapping mapping = opt.get();
        Hibernate.initialize(mapping.getConsultant());
        Hibernate.initialize(mapping.getClient());

        if (mapping.getStatus() != ConsultantClientMapping.MappingStatus.PENDING_PAYMENT) {
            throw new IllegalStateException(
                    "PENDING_PAYMENT 상태가 아닌 매칭은 정리할 수 없습니다. mappingId="
                            + mappingId + ", currentStatus=" + mapping.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        mapping.setStatus(ConsultantClientMapping.MappingStatus.TERMINATED);
        mapping.setTerminationReason(CLEANUP_REASON_PREFIX + ": " + reason);
        mapping.setTerminatedBy(actor != null ? actor : "ADMIN_CLEANUP");
        mapping.setTerminatedAt(now);
        mapping.setEndDate(now);

        String existingNotes = mapping.getNotes() != null ? mapping.getNotes() : "";
        String auditLine = String.format("[%s] R4 어드민 수동 정리: %s (by %s)",
                now.toString(),
                reason,
                actor != null ? actor : "ADMIN_CLEANUP");
        mapping.setNotes(existingNotes.isEmpty() ? auditLine : existingNotes + "\n" + auditLine);

        mappingRepository.save(mapping);

        int cancelled = cancelAssociatedSchedules(tenantId, mapping, reason);

        boolean notified = false;
        if (notifyClient) {
            notified = sendClientNotification(mapping);
        }

        log.info("✅ [R4] 단건 정리 완료: mappingId={}, cancelledSchedules={}, notified={}",
                mappingId, cancelled, notified);

        return new CleanupSingleResult(cancelled, notified);
    }

    private int cancelAssociatedSchedules(String tenantId, ConsultantClientMapping mapping, String reason) {
        Long mappingId = mapping.getId();
        if (mappingId == null) {
            return 0;
        }
        List<Schedule> schedules;
        try {
            schedules = scheduleRepository.findByTenantIdAndMappingIdAndStatusIn(
                    tenantId, mappingId, CANCELLABLE_SCHEDULE_STATUSES);
        } catch (RuntimeException ex) {
            log.warn("⚠️ [R4] 연관 스케줄 조회 실패: mappingId={}, error={}", mappingId, ex.getMessage());
            return 0;
        }

        if (schedules.isEmpty()) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();
        int count = 0;
        for (Schedule schedule : schedules) {
            schedule.setStatus(ScheduleStatus.CANCELLED);
            String prev = schedule.getNotes() != null ? schedule.getNotes() : "";
            String line = String.format("[%s] R4 정리 자동 취소: %s", now.toString(), reason);
            schedule.setNotes(prev.isEmpty() ? line : prev + "\n" + line);
            scheduleRepository.save(schedule);
            count++;
        }
        return count;
    }

    private boolean sendClientNotification(ConsultantClientMapping mapping) {
        try {
            User client = mapping.getClient();
            if (client == null) {
                return false;
            }
            String consultantName = mapping.getConsultant() != null
                    ? mapping.getConsultant().getName()
                    : "상담사";
            String createdAtStr = mapping.getCreatedAt() != null
                    ? mapping.getCreatedAt().toString()
                    : "";
            return notificationService.sendConsultationCancelled(client, consultantName, createdAtStr);
        } catch (RuntimeException ex) {
            log.warn("⚠️ [R4] 내담자 통지 실패: mappingId={}, error={}", mapping.getId(), ex.getMessage());
            return false;
        }
    }

    private void validateReason(String reason) {
        if (reason == null || reason.trim().length() < 10) {
            throw new IllegalArgumentException("정리 사유는 10자 이상이어야 합니다.");
        }
        if (reason.trim().length() > 500) {
            throw new IllegalArgumentException("정리 사유는 500자 이하여야 합니다.");
        }
    }

    /**
     * REQUIRES_NEW 트랜잭션에서 콜백을 실행하고 결과를 반환한다. TenantContextHolder 를 콜백 진입 시
     * 설정하고 종료 시 clear 한다 (별도 트랜잭션에서도 tenantId 격리를 유지).
     */
    <T> T runInNewTransaction(String tenantId, java.util.function.Supplier<T> action) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template.execute(status -> {
            String previous = TenantContextHolder.getTenantId();
            if (tenantId != null && !tenantId.isEmpty()) {
                TenantContextHolder.setTenantId(tenantId);
            }
            try {
                return action.get();
            } catch (RuntimeException ex) {
                status.setRollbackOnly();
                throw ex;
            } finally {
                if (previous != null) {
                    TenantContextHolder.setTenantId(previous);
                } else {
                    TenantContextHolder.clear();
                }
            }
        });
    }

    /** 단건 정리 내부 결과 컨테이너. */
    private static final class CleanupSingleResult {
        final int cancelledScheduleCount;
        final boolean notified;

        CleanupSingleResult(int cancelledScheduleCount, boolean notified) {
            this.cancelledScheduleCount = cancelledScheduleCount;
            this.notified = notified;
        }
    }
}
