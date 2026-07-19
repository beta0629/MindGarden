package com.coresolution.consultation.service.impl;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.config.ScheduleChangeNotificationProperties;
import com.coresolution.consultation.constant.ScheduleChangeNotificationPendingStatus;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.consultation.ConsultationServiceUserFacingMessages;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.ScheduleChangeNotificationPending;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ScheduleChangeNotificationPendingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import lombok.extern.slf4j.Slf4j;

/**
 * 일정 변경 SCHEDULE_CHANGED 외부 채널 디바운스 구현.
 *
 * <p>마지막 슬롯 변경 후 {@link ScheduleChangeNotificationProperties#getDebounceMinutes()} 분만
 * pending 을 유지하고, 스케줄러가 fire_at 경과 시 최신 슬롯으로 1회 발송한다.</p>
 *
 * @author MindGarden
 * @since 2026-07-19
 */
@Slf4j
@Service
public class ScheduleChangeNotificationDebounceServiceImpl
        implements ScheduleChangeNotificationDebounceService {

    private static final ZoneId ZONE_SEOUL = ZoneId.of("Asia/Seoul");
    private static final String SLOT_VERSION_SEPARATOR = "|";

    private final ScheduleChangeNotificationPendingRepository pendingRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final ConsultantRepository consultantRepository;
    private final UserPersonalDataCacheService userPersonalDataCacheService;
    private final NotificationService notificationService;
    private final ScheduleChangeNotificationProperties properties;
    private final Clock clock;

    /**
     * 운영용 생성자 (시스템 기본 시계).
     *
     * @param pendingRepository              pending 저장소
     * @param scheduleRepository             스케줄 저장소
     * @param userRepository                 사용자 저장소
     * @param consultantRepository           상담사 저장소
     * @param userPersonalDataCacheService   개인정보 캐시
     * @param notificationService            알림 서비스
     * @param properties                     디바운스·스케줄러 설정
     */
    @Autowired
    public ScheduleChangeNotificationDebounceServiceImpl(
            ScheduleChangeNotificationPendingRepository pendingRepository,
            ScheduleRepository scheduleRepository,
            UserRepository userRepository,
            ConsultantRepository consultantRepository,
            UserPersonalDataCacheService userPersonalDataCacheService,
            NotificationService notificationService,
            ScheduleChangeNotificationProperties properties) {
        this(
                pendingRepository,
                scheduleRepository,
                userRepository,
                consultantRepository,
                userPersonalDataCacheService,
                notificationService,
                properties,
                Clock.system(ZONE_SEOUL));
    }

    /**
     * 테스트용 시계 주입 생성자.
     *
     * @param clock 고정·가변 시계
     */
    ScheduleChangeNotificationDebounceServiceImpl(
            ScheduleChangeNotificationPendingRepository pendingRepository,
            ScheduleRepository scheduleRepository,
            UserRepository userRepository,
            ConsultantRepository consultantRepository,
            UserPersonalDataCacheService userPersonalDataCacheService,
            NotificationService notificationService,
            ScheduleChangeNotificationProperties properties,
            Clock clock) {
        this.pendingRepository = pendingRepository;
        this.scheduleRepository = scheduleRepository;
        this.userRepository = userRepository;
        this.consultantRepository = consultantRepository;
        this.userPersonalDataCacheService = userPersonalDataCacheService;
        this.notificationService = notificationService;
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void enqueueScheduleChanged(
            String tenantId, Schedule schedule, LocalDate previousDate, LocalTime previousStart) {
        if (schedule == null || schedule.getId() == null || schedule.getClientId() == null) {
            return;
        }
        if (!StringUtils.hasText(tenantId)) {
            log.warn("일정 변경 디바운스 enqueue 생략: tenantId 없음 scheduleId={}", schedule.getId());
            return;
        }
        if (schedule.getStatus() == ScheduleStatus.CANCELLED) {
            return;
        }
        if (previousDate == null) {
            log.warn("일정 변경 디바운스 enqueue 생략: previousDate 없음 scheduleId={}", schedule.getId());
            return;
        }

        String slotVersion = buildSlotVersion(schedule);
        if (pendingRepository.existsByTenantIdAndScheduleIdAndSlotVersionAndStatusAndIsDeletedFalse(
                tenantId,
                schedule.getId(),
                slotVersion,
                ScheduleChangeNotificationPendingStatus.SENT)) {
            log.info(
                    "일정 변경 디바운스 skip(이미 SENT): tenantId={}, scheduleId={}, slotVersion={}",
                    tenantId,
                    schedule.getId(),
                    slotVersion);
            return;
        }

        LocalDateTime fireAt = LocalDateTime.now(clock).plusMinutes(properties.getDebounceMinutes());
        Optional<ScheduleChangeNotificationPending> existingOpt =
                pendingRepository.findFirstByTenantIdAndScheduleIdAndStatusAndIsDeletedFalse(
                        tenantId, schedule.getId(), ScheduleChangeNotificationPendingStatus.PENDING);

        if (existingOpt.isPresent()) {
            ScheduleChangeNotificationPending existing = existingOpt.get();
            existing.setFireAt(fireAt);
            existing.setSlotVersion(slotVersion);
            pendingRepository.save(existing);
            log.info(
                    "일정 변경 디바운스 fire_at 연장: scheduleId={}, fireAt={}, slotVersion={}",
                    schedule.getId(),
                    fireAt,
                    slotVersion);
            return;
        }

        ScheduleChangeNotificationPending pending = ScheduleChangeNotificationPending.builder()
                .tenantId(tenantId)
                .scheduleId(schedule.getId())
                .fireAt(fireAt)
                .previousDate(previousDate)
                .previousStartTime(previousStart)
                .slotVersion(slotVersion)
                .status(ScheduleChangeNotificationPendingStatus.PENDING)
                .build();
        pendingRepository.save(pending);
        log.info(
                "일정 변경 디바운스 pending 등록: scheduleId={}, fireAt={}, slotVersion={}",
                schedule.getId(),
                fireAt,
                slotVersion);
    }

    @Override
    @Transactional
    public int processDuePending() {
        LocalDateTime now = LocalDateTime.now(clock);
        List<ScheduleChangeNotificationPending> due = pendingRepository.findDuePending(
                ScheduleChangeNotificationPendingStatus.PENDING, now);
        int processed = 0;
        for (ScheduleChangeNotificationPending pending : due) {
            try {
                if (processOne(pending)) {
                    processed++;
                }
            } catch (Exception e) {
                log.warn(
                        "일정 변경 디바운스 처리 실패(다음 폴링 재시도): pendingId={}, scheduleId={}, {}",
                        pending.getId(),
                        pending.getScheduleId(),
                        e.getMessage());
            }
        }
        return processed;
    }

    private boolean processOne(ScheduleChangeNotificationPending pending) {
        String tenantId = pending.getTenantId();
        if (!StringUtils.hasText(tenantId)) {
            mark(pending, ScheduleChangeNotificationPendingStatus.SKIPPED_CANCELLED);
            return true;
        }

        String previousTenant = TenantContextHolder.getTenantId();
        try {
            TenantContextHolder.setTenantId(tenantId);

            Optional<Schedule> scheduleOpt =
                    scheduleRepository.findByTenantIdAndId(tenantId, pending.getScheduleId());
            if (scheduleOpt.isEmpty()) {
                mark(pending, ScheduleChangeNotificationPendingStatus.SKIPPED_CANCELLED);
                return true;
            }
            Schedule schedule = scheduleOpt.get();
            if (schedule.getStatus() == ScheduleStatus.CANCELLED || schedule.isDeleted()) {
                mark(pending, ScheduleChangeNotificationPendingStatus.SKIPPED_CANCELLED);
                return true;
            }
            if (schedule.getClientId() == null) {
                mark(pending, ScheduleChangeNotificationPendingStatus.SKIPPED_CANCELLED);
                return true;
            }

            String latestSlotVersion = buildSlotVersion(schedule);
            if (pendingRepository.existsByTenantIdAndScheduleIdAndSlotVersionAndStatusAndIsDeletedFalse(
                    tenantId,
                    schedule.getId(),
                    latestSlotVersion,
                    ScheduleChangeNotificationPendingStatus.SENT)) {
                pending.setSlotVersion(latestSlotVersion);
                mark(pending, ScheduleChangeNotificationPendingStatus.SKIPPED_DUPLICATE);
                return true;
            }

            User client = userRepository.findByTenantIdAndId(tenantId, schedule.getClientId()).orElse(null);
            if (client == null) {
                log.warn(
                        "일정 변경 디바운스 발송 생략: 내담자 미조회 scheduleId={}, clientId={}",
                        schedule.getId(),
                        schedule.getClientId());
                mark(pending, ScheduleChangeNotificationPendingStatus.SKIPPED_CANCELLED);
                return true;
            }

            String consultantName = resolveConsultantDisplayName(tenantId, schedule.getConsultantId());
            String oldSlot = formatScheduleSlot(pending.getPreviousDate(), pending.getPreviousStartTime());
            String newSlot = formatScheduleSlot(schedule.getDate(), schedule.getStartTime());
            notificationService.sendScheduleChanged(client, consultantName, oldSlot, newSlot);

            pending.setSlotVersion(latestSlotVersion);
            mark(pending, ScheduleChangeNotificationPendingStatus.SENT);
            return true;
        } finally {
            if (StringUtils.hasText(previousTenant)) {
                TenantContextHolder.setTenantId(previousTenant);
            } else {
                TenantContextHolder.clear();
            }
        }
    }

    private void mark(ScheduleChangeNotificationPending pending, String status) {
        pending.setStatus(status);
        pending.setProcessedAt(LocalDateTime.now(clock));
        pendingRepository.save(pending);
    }

    /**
     * 슬롯 버전(멱등 키). date|start|end 스냅샷.
     *
     * @param schedule 스케줄
     * @return slot_version
     */
    static String buildSlotVersion(Schedule schedule) {
        StringBuilder sb = new StringBuilder();
        sb.append(schedule.getDate() != null ? schedule.getDate().toString() : "");
        sb.append(SLOT_VERSION_SEPARATOR);
        sb.append(schedule.getStartTime() != null ? schedule.getStartTime().toString() : "");
        sb.append(SLOT_VERSION_SEPARATOR);
        sb.append(schedule.getEndTime() != null ? schedule.getEndTime().toString() : "");
        return sb.toString();
    }

    private static String formatScheduleSlot(LocalDate date, LocalTime start) {
        if (date == null) {
            return "";
        }
        if (start == null) {
            return date.toString();
        }
        return date.toString() + " " + start;
    }

    private String resolveConsultantDisplayName(String tenantId, Long consultantId) {
        if (consultantId == null || !StringUtils.hasText(tenantId)) {
            return ConsultationServiceUserFacingMessages.DEFAULT_CONSULTANT_DISPLAY_NAME;
        }
        try {
            Optional<Consultant> consultantOpt = consultantRepository.findByTenantIdAndId(tenantId, consultantId);
            if (consultantOpt.isEmpty()) {
                return ConsultationServiceUserFacingMessages.DEFAULT_CONSULTANT_DISPLAY_NAME;
            }
            Consultant consultant = consultantOpt.get();
            try {
                Map<String, String> decrypted = userPersonalDataCacheService.getDecryptedUserData(consultant);
                if (decrypted != null && decrypted.get("name") != null && !decrypted.get("name").isEmpty()) {
                    return decrypted.get("name");
                }
            } catch (Exception e) {
                log.warn("상담사명 복호화 실패: consultantId={}, {}", consultantId, e.getMessage());
            }
            return consultant.getName() != null
                    ? consultant.getName()
                    : ConsultationServiceUserFacingMessages.DEFAULT_CONSULTANT_DISPLAY_NAME;
        } catch (Exception e) {
            log.warn("상담사 표시명 조회 실패: consultantId={}", consultantId, e);
            return ConsultationServiceUserFacingMessages.DEFAULT_CONSULTANT_DISPLAY_NAME;
        }
    }
}
