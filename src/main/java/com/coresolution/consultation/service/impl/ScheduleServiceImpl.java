package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.ConsultationType;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ScheduleResponse;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.Vacation;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.VacationRepository;
import com.coresolution.consultation.constant.ProfessionalProviderTypeConstants;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.util.ConsultationMessageTypeCodes;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.impl.BaseTenantEntityServiceImpl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 /**
 * 스케줄 관리 서비스 구현체
 /**
 * BaseTenantEntityServiceImpl을 상속하여 테넌트 필터링 및 접근 제어 지원
 /**
 * 
 /**
 * @author CoreSolution
 /**
 * @version 2.0.0
 /**
 * @since 2024-12-19
 */
@Slf4j
@Service
@Transactional
public class ScheduleServiceImpl extends BaseTenantEntityServiceImpl<Schedule, Long> 
        implements ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final ConsultantRepository consultantRepository;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final VacationRepository vacationRepository;
    private final BranchRepository branchRepository;
    private final CommonCodeService commonCodeService;
    private final ConsultantAvailabilityService consultantAvailabilityService;
    private final SessionSyncService sessionSyncService;
    private final StatisticsService statisticsService;
    private final ConsultationMessageService consultationMessageService;
    private final com.coresolution.core.service.DashboardIntegrationService dashboardIntegrationService;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final PlSqlScheduleValidationService plSqlScheduleValidationService;
    private final com.coresolution.consultation.service.UserPersonalDataCacheService userPersonalDataCacheService;
    private final NotificationService notificationService;
    private final ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    private final MobilePushDispatchService mobilePushDispatchService;
    private final ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;

    public ScheduleServiceImpl(
            ScheduleRepository scheduleRepository,
            TenantAccessControlService accessControlService,
            ConsultantClientMappingRepository mappingRepository,
            ConsultantRepository consultantRepository,
            ClientRepository clientRepository,
            UserRepository userRepository,
            VacationRepository vacationRepository,
            BranchRepository branchRepository,
            CommonCodeService commonCodeService,
            ConsultantAvailabilityService consultantAvailabilityService,
            SessionSyncService sessionSyncService,
            StatisticsService statisticsService,
            ConsultationMessageService consultationMessageService,
            com.coresolution.core.service.DashboardIntegrationService dashboardIntegrationService,
            ConsultationRecordRepository consultationRecordRepository,
            PlSqlScheduleValidationService plSqlScheduleValidationService,
            com.coresolution.consultation.service.UserPersonalDataCacheService userPersonalDataCacheService,
            NotificationService notificationService,
            ScheduleListUserFieldsResolver scheduleListUserFieldsResolver,
            MobilePushDispatchService mobilePushDispatchService,
            ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper) {
        super(scheduleRepository, accessControlService);
        this.scheduleRepository = scheduleRepository;
        this.mappingRepository = mappingRepository;
        this.consultantRepository = consultantRepository;
        this.clientRepository = clientRepository;
        this.userRepository = userRepository;
        this.vacationRepository = vacationRepository;
        this.branchRepository = branchRepository;
        this.commonCodeService = commonCodeService;
        this.consultantAvailabilityService = consultantAvailabilityService;
        this.sessionSyncService = sessionSyncService;
        this.statisticsService = statisticsService;
        this.consultationMessageService = consultationMessageService;
        this.dashboardIntegrationService = dashboardIntegrationService;
        this.consultationRecordRepository = consultationRecordRepository;
        this.plSqlScheduleValidationService = plSqlScheduleValidationService;
        this.userPersonalDataCacheService = userPersonalDataCacheService;
        this.notificationService = notificationService;
        this.scheduleListUserFieldsResolver = scheduleListUserFieldsResolver;
        this.mobilePushDispatchService = mobilePushDispatchService;
        this.scheduleCreatedNotificationHelper = scheduleCreatedNotificationHelper;
    }
    
    
    @Override
    protected Optional<Schedule> findEntityById(Long id) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("findEntityById: 테넌트 컨텍스트 없음, 스케줄 id={} 조회 생략", id);
            return Optional.empty();
        }
        return scheduleRepository.findByTenantIdAndId(tenantId, id);
    }

    /**
     * 엔티티에 담긴 tenantId(없으면 현재 컨텍스트)로 사용자를 테넌트 스코프 조회한다.
     * tenantId·userId가 없으면 빈 Optional (null tenant로 Repository 호출 금지).
     */
    private Optional<User> findUserByTenantContext(String primaryTenantId, Long userId) {
        String tenantId = primaryTenantId;
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = TenantContextHolder.getTenantId();
        }
        if (tenantId == null || tenantId.isEmpty() || userId == null) {
            return Optional.empty();
        }
        return userRepository.findByTenantIdAndId(tenantId, userId);
    }
    
    @Override
    protected List<Schedule> findEntitiesByTenantAndBranch(String tenantId, Long branchId) {
        // 표준화 2025-12-06: deprecated 메서드 대체 - branchId는 더 이상 사용하지 않음
        return scheduleRepository.findAllByTenantId(tenantId);
    }
    


    @Override
    public Schedule createSchedule(Schedule schedule) {
        log.info("📅 스케줄 생성: {}", schedule.getTitle());
        
        String tenantId = TenantContextHolder.getTenantId();
        Schedule createdSchedule;
        if (tenantId != null) {
            createdSchedule = create(tenantId, schedule);
        } else {
            createdSchedule = scheduleRepository.save(schedule);
        }
        
        notifyScheduleCreated(createdSchedule);
        
        try {
            if (tenantId != null) {
                Long mappingId = null;
                if (schedule.getConsultantId() != null && schedule.getClientId() != null) {
                }
                
                dashboardIntegrationService.handleScheduleCreated(
                    createdSchedule.getId(), 
                    tenantId, 
                    mappingId
                );
            }
        } catch (Exception e) {
            log.error("❌ 대시보드 통합 처리 실패: scheduleId={}", createdSchedule.getId(), e);
        }
        
        return createdSchedule;
    }

    @Override
    public Schedule updateSchedule(Long id, Schedule updateData) {
        log.info("📝 스케줄 수정: ID {}", id);
        Schedule existingSchedule = findById(id);
        
        if (existingSchedule.getTenantId() != null) {
            accessControlService.validateTenantAccess(existingSchedule.getTenantId());
        }
        
        ScheduleStatus previousStatus = existingSchedule.getStatus();
        Long consultantId = existingSchedule.getConsultantId();
        Long clientId = existingSchedule.getClientId();
        LocalDate previousDate = existingSchedule.getDate();
        LocalTime previousStartTime = existingSchedule.getStartTime();
        LocalTime previousEndTime = existingSchedule.getEndTime();
        
        copyScheduleFields(updateData, existingSchedule);
        
        // 완료(COMPLETED)로 변경 시 상담일지 작성 여부 검증: 미작성이면 완료 불가 + 상담사에게 리마인드
        if (existingSchedule.getStatus() == ScheduleStatus.COMPLETED) {
            String tenantIdForCheck = TenantContextHolder.getTenantId();
            if (tenantIdForCheck == null && existingSchedule.getTenantId() != null) {
                tenantIdForCheck = existingSchedule.getTenantId();
            }
            if (tenantIdForCheck != null) {
                boolean hasRecord = consultationRecordRepository.existsByTenantIdAndConsultationIdAndIsDeletedFalse(tenantIdForCheck, id);
                if (!hasRecord) {
                    try {
                        plSqlScheduleValidationService.createConsultationRecordReminder(
                            id, existingSchedule.getConsultantId(), existingSchedule.getClientId(),
                            existingSchedule.getDate(),
                            "상담일지 누락 안내"
                        );
                    } catch (Exception e) {
                        log.warn("상담일지 미작성 알림 생성 실패(무시): scheduleId={}, {}", id, e.getMessage());
                    }
                    try {
                        consultationMessageService.sendMessage(
                            existingSchedule.getConsultantId(),
                            existingSchedule.getClientId(),
                            id,
                            getRoleCodeFromCommonCode(UserRole.CONSULTANT.name()),
                            "상담일지 누락 안내",
                            "상담일지가 누락되었습니다. 상담일지를 작성한 후 완료 처리해 주세요.",
                            getMessageTypeFromCommonCode("COMPLETION"),
                            true,
                            false
                        );
                    } catch (Exception e) {
                        log.warn("상담일지 누락 리마인드 메시지 발송 실패(무시): scheduleId={}, {}", id, e.getMessage());
                    }
                    throw new IllegalStateException("상담일지를 작성한 후 완료 처리할 수 있습니다.");
                }
            }
        }
        
        Schedule saved;
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && existingSchedule.getTenantId() != null) {
            saved = update(tenantId, existingSchedule);
        } else {
            saved = scheduleRepository.save(existingSchedule);
        }
        
        // 상태가 CANCELLED로 바뀐 경우 회기 1회 복원 (예약·확정·진행 중이었을 때만)
        if (updateData.getStatus() == ScheduleStatus.CANCELLED
                && (previousStatus == ScheduleStatus.BOOKED || previousStatus == ScheduleStatus.CONFIRMED
                        || previousStatus == ScheduleStatus.IN_PROGRESS)
                && consultantId != null && clientId != null) {
            restoreSessionForMapping(consultantId, clientId);
        }

        boolean slotChanged = !Objects.equals(previousDate, saved.getDate())
                || !Objects.equals(previousStartTime, saved.getStartTime())
                || !Objects.equals(previousEndTime, saved.getEndTime());
        boolean cancellingNow = updateData.getStatus() == ScheduleStatus.CANCELLED;
        if (slotChanged && !cancellingNow && saved.getStatus() != ScheduleStatus.CANCELLED) {
            try {
                String pushTenantId = tenantId != null ? tenantId : saved.getTenantId();
                mobilePushDispatchService.dispatchBookingRescheduled(
                        pushTenantId, saved, previousDate, previousStartTime, previousEndTime);
            } catch (Exception ex) {
                log.warn("예약 일정 변경 푸시 실패: scheduleId={}", saved.getId(), ex);
            }
        }

        boolean wasOccupyingConsultation = previousStatus != null
                && previousStatus.occupiesTimeForConflictCheck()
                && previousStatus != ScheduleStatus.TENTATIVE_PENDING_PAYMENT;
        boolean nowOccupyingConsultation = saved.getStatus() != null
                && saved.getStatus().occupiesTimeForConflictCheck()
                && saved.getStatus() != ScheduleStatus.TENTATIVE_PENDING_PAYMENT;
        if (nowOccupyingConsultation && !wasOccupyingConsultation) {
            deductSessionForScheduleIfNeeded(saved);
        }

        return saved;
    }
    
     /**
     * Schedule 필드 복사 (부분 업데이트용)
     */
    private void copyScheduleFields(Schedule source, Schedule target) {
        if (source.getDate() != null) target.setDate(source.getDate());
        if (source.getStartTime() != null) target.setStartTime(source.getStartTime());
        if (source.getEndTime() != null) target.setEndTime(source.getEndTime());
        if (source.getTitle() != null) target.setTitle(source.getTitle());
        if (source.getDescription() != null) target.setDescription(source.getDescription());
        if (source.getStatus() != null) target.setStatus(source.getStatus());
    }
    
    @Override
    protected void copyNonNullFields(Schedule source, Schedule target) {
        copyScheduleFields(source, target);
    }

    @Override
    public void deleteSchedule(Long id) {
        log.info("🗑️ 스케줄 삭제: ID {}", id);
        Schedule schedule = findById(id);
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            delete(tenantId, id);
        } else {
            if (schedule.getTenantId() != null) {
                accessControlService.validateTenantAccess(schedule.getTenantId());
            }
            scheduleRepository.deleteById(id);
        }
    }

    @Override
    public Schedule findById(Long id) {
        // ⚠️ 보안: tenantId는 필수 (다른 테넌트 데이터 접근 방지)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return scheduleRepository.findByTenantIdAndId(tenantId, id)
                .orElseThrow(() -> new RuntimeException("스케줄을 찾을 수 없습니다: " + id));
    }

    @Override
    public List<Schedule> findAll() {
        // ⚠️ 보안: tenantId는 필수 (다른 테넌트 데이터 접근 방지)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return findAllByTenant(tenantId, null);
    }

    @Override
    public org.springframework.data.domain.Page<Schedule> findAll(org.springframework.data.domain.Pageable pageable) {
        // ⚠️ 보안: tenantId는 필수 (다른 테넌트 데이터 접근 방지)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return scheduleRepository.findAllByTenantId(tenantId, pageable);
    }


    @Override
    public Schedule createConsultantSchedule(Long consultantId, Long clientId, LocalDate date,
            LocalTime startTime, LocalTime endTime, String title, String description, boolean tentativeBeforeDeposit) {
        log.info("📅 상담사 스케줄 생성: 상담사 {}, 내담자 {}, 날짜 {}, 가예약={}", consultantId, clientId, date,
                tentativeBeforeDeposit);

        if (hasTimeConflict(consultantId, date, startTime, endTime, null)) {
            throw new RuntimeException("해당 시간대에 이미 스케줄이 존재합니다.");
        }

        if (tentativeBeforeDeposit) {
            if (!validateMappingForTentativeBeforeDepositSchedule(consultantId, clientId)) {
                throw new RuntimeException(
                        "상담사와 내담자 간 활성 또는 입금 대기 매칭이 없어 가예약을 등록할 수 없습니다.");
            }
        } else {
            if (!validateMappingForSchedule(consultantId, clientId)) {
                throw new RuntimeException("상담사와 내담자 간의 유효한 매칭이 없거나 승인되지 않았습니다.");
            }
            if (!validateRemainingSessions(consultantId, clientId)) {
                throw new RuntimeException("사용 가능한 회기가 없습니다.");
            }
        }

        Schedule schedule = new Schedule();
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(date);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setTitle(title);
        schedule.setDescription(description);
        schedule.setScheduleType("CONSULTATION");
        schedule.setStatus(tentativeBeforeDeposit ? ScheduleStatus.TENTATIVE_PENDING_PAYMENT : ScheduleStatus.BOOKED);
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            schedule.setTenantId(tenantId);
        }
        schedule.setIsDeleted(false);

        Schedule savedSchedule = scheduleRepository.save(schedule);

        if (!tentativeBeforeDeposit) {
            useSessionForMapping(consultantId, clientId, savedSchedule);
            notifyScheduleCreated(savedSchedule);
        }

        log.info("✅ 상담사 스케줄 생성 완료: ID {}", savedSchedule.getId());
        return savedSchedule;
    }

    /**
     * 상담사 스케줄 생성
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    public Schedule createConsultantSchedule(Long consultantId, Long clientId, LocalDate date,
            LocalTime startTime, LocalTime endTime, String title, String description, String consultationType,
            String branchCode, boolean tentativeBeforeDeposit) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        log.info("📅 상담사 스케줄 생성 (상담유형 포함): 상담사 {}, 내담자 {}, 날짜 {}, 상담유형 {}, tenantId={}, 가예약={}",
                consultantId, clientId, date, consultationType, tenantId, tentativeBeforeDeposit);

        if (hasTimeConflict(consultantId, date, startTime, endTime, null)) {
            throw new RuntimeException("해당 시간대에 이미 스케줄이 존재합니다.");
        }

        if (tentativeBeforeDeposit) {
            if (!validateMappingForTentativeBeforeDepositSchedule(consultantId, clientId)) {
                throw new RuntimeException(
                        "상담사와 내담자 간 활성 또는 입금 대기 매칭이 없어 가예약을 등록할 수 없습니다.");
            }
        } else {
            if (!validateMappingForSchedule(consultantId, clientId)) {
                throw new RuntimeException("상담사와 내담자 간의 유효한 매칭이 없거나 승인되지 않았습니다.");
            }
            if (!validateRemainingSessions(consultantId, clientId)) {
                throw new RuntimeException("사용 가능한 회기가 없습니다.");
            }
        }

        Schedule schedule = new Schedule();
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(date);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setTitle(title);
        schedule.setDescription(description);
        schedule.setScheduleType("CONSULTATION");
        schedule.setStatus(tentativeBeforeDeposit ? ScheduleStatus.TENTATIVE_PENDING_PAYMENT : ScheduleStatus.BOOKED);
        schedule.setConsultationType(consultationType);
        schedule.setBranchCode(null);

        schedule.setTenantId(tenantId);
        schedule.setIsDeleted(false);

        log.info("📅 스케줄 엔티티 생성: tenantId={}, isDeleted={}, consultantId={}, clientId={}, date={}",
                tenantId, schedule.getIsDeleted(), consultantId, clientId, date);

        Schedule savedSchedule = scheduleRepository.save(schedule);

        log.info("✅ 스케줄 저장 완료: id={}, tenantId={}, isDeleted={}",
                savedSchedule.getId(), savedSchedule.getTenantId(), savedSchedule.getIsDeleted());

        if (!tentativeBeforeDeposit) {
            useSessionForMapping(consultantId, clientId, savedSchedule);
            log.info("✅ 회기 사용 처리 완료: consultantId={}, clientId={}", consultantId, clientId);
            notifyScheduleCreated(savedSchedule);
        }

        log.info("✅ 상담사 스케줄 생성 완료 (상담유형 포함): ID {}, 상담유형: {}", savedSchedule.getId(), consultationType);
        return savedSchedule;
    }

    @Override
    public Schedule createConsultantScheduleWithType(Long consultantId, Long clientId, LocalDate date, 
                                                  LocalTime startTime, ConsultationType consultationType, 
                                                  String title, String description) {
        log.info("📅 상담사 스케줄 생성 (유형 기반): 상담사 {}, 내담자 {}, 날짜 {}, 유형 {}", 
                consultantId, clientId, date, consultationType.getDisplayName());
        
        if (!validateMappingForSchedule(consultantId, clientId)) {
            throw new RuntimeException("상담사와 내담자 간의 유효한 매칭이 없거나 승인되지 않았습니다.");
        }
        
        if (!validateRemainingSessions(consultantId, clientId)) {
            throw new RuntimeException("사용 가능한 회기가 없습니다.");
        }
        
        if (hasTimeConflictWithType(consultantId, date, startTime, consultationType, null)) {
            throw new RuntimeException("해당 시간대에 이미 스케줄이 존재하거나 시간이 충돌합니다.");
        }
        
        LocalTime endTime = calculateEndTime(startTime, consultationType);
        
        Schedule schedule = new Schedule();
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(date);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setTitle(title);
        schedule.setDescription(description);
        schedule.setScheduleType("CONSULTATION");
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setNotes("상담 유형: " + consultationType.getDisplayName() + " (" + consultationType.getDefaultDurationMinutes() + "분)");
        
        Schedule savedSchedule = scheduleRepository.save(schedule);
        
        useSessionForMapping(consultantId, clientId, savedSchedule);
        notifyScheduleCreated(savedSchedule);

        log.info("✅ 상담사 스케줄 생성 완료 (유형 기반): ID {}, 상담 유형: {}, 시간: {} - {}", 
                savedSchedule.getId(), consultationType.getDisplayName(), startTime, endTime);
        return savedSchedule;
    }

    /**
     * 입금 확인 후 가예약 일정 확정 및 지정 매핑에 대한 회기 차감·동기화.
     * {@link #useSessionForMapping}은 ACTIVE 매핑만 조회하므로, 입금 직후 {@code DEPOSIT_PENDING}인 매핑은
     * 본 메서드의 {@link #useSessionForSpecificMapping}으로 동일한 차감·동기화 경로를 탄다.
     */
    @Override
    public void finalizeTentativeSchedulesAfterDepositConfirmed(ConsultantClientMapping mapping) {
        if (mapping == null || mapping.getId() == null) {
            return;
        }
        if (mapping.getConsultant() == null || mapping.getClient() == null) {
            log.warn("finalizeTentativeSchedulesAfterDepositConfirmed: consultant/client 없음, mappingId={}",
                    mapping.getId());
            return;
        }
        String tenantId = mapping.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            tenantId = TenantContextHolder.getRequiredTenantId();
        }
        Long consultantUserId = mapping.getConsultant().getId();
        Long clientUserId = mapping.getClient().getId();
        List<Schedule> tentatives = scheduleRepository
                .findByTenantIdAndConsultantIdAndClientIdAndStatusAndIsDeletedFalse(
                        tenantId, consultantUserId, clientUserId, ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        if (tentatives.isEmpty()) {
            log.debug("finalizeTentativeSchedulesAfterDepositConfirmed: 가예약 일정 없음, mappingId={}",
                    mapping.getId());
            return;
        }
        tentatives.sort(Comparator.comparing(Schedule::getDate).thenComparing(Schedule::getStartTime));
        log.info("finalizeTentativeSchedulesAfterDepositConfirmed: 가예약 {}건 확정 처리, mappingId={}",
                tentatives.size(), mapping.getId());
        for (Schedule schedule : tentatives) {
            schedule.setStatus(ScheduleStatus.BOOKED);
            Schedule booked = scheduleRepository.save(schedule);
            useSessionForSpecificMapping(tenantId, mapping.getId(), consultantUserId, clientUserId, booked);
            notifyTentativeScheduleBookedAfterDeposit(booked, tenantId);
        }
    }

    /**
     * 가예약 입금 확정 후 BOOKED 전환 시 예약 확정 알림·푸시(멱등·본 트랜잭션 비차단).
     */
    private void notifyTentativeScheduleBookedAfterDeposit(Schedule schedule, String tenantId) {
        if (schedule == null || schedule.getClientId() == null) {
            return;
        }
        try {
            mobilePushDispatchService.dispatchBookingConfirmed(tenantId, schedule);
        } catch (Exception ex) {
            log.warn("가예약 확정 푸시 실패: scheduleId={}", schedule.getId(), ex);
        }
        String previousTenant = TenantContextHolder.getTenantId();
        try {
            if (tenantId != null && !tenantId.isBlank()) {
                TenantContextHolder.setTenantId(tenantId);
            }
            tryDispatchScheduleConfirmedExternalNotification(schedule);
        } catch (Exception ex) {
            log.warn("가예약 확정 외부 알림 실패: scheduleId={}", schedule.getId(), ex);
        } finally {
            if (previousTenant != null && !previousTenant.isBlank()) {
                TenantContextHolder.setTenantId(previousTenant);
            } else {
                TenantContextHolder.clear();
            }
        }
        try {
            notifyScheduleCreated(schedule, false);
        } catch (Exception ex) {
            log.warn("가예약 확정 인앱 알림 실패: scheduleId={}", schedule.getId(), ex);
        }
    }

    /**
     * 일정 등록(BOOKED) 시 내담자·상담사 인앱 메시지 및 내담자 예약 확정 푸시.
     * {@link #createSchedule(Schedule)}·{@link #createConsultantSchedule} 공통.
     */
    private void notifyScheduleCreated(Schedule schedule) {
        notifyScheduleCreated(schedule, true);
    }

    private void notifyScheduleCreated(Schedule schedule, boolean includeMobilePush) {
        scheduleCreatedNotificationHelper.notifyScheduleCreated(schedule, includeMobilePush);
    }

    /**
     * 지정 매핑 ID에 대해 회기 1회 사용 및 동기화 ({@link #useSessionForMapping} 내부와 동일 처리).
     * 입금 확인 직후 매핑이 DEPOSIT_PENDING인 경우에도 허용한다.
     */
    private void useSessionForSpecificMapping(String tenantId, Long mappingId, Long consultantUserId,
            Long clientUserId, Schedule scheduleForSequence) {
        log.debug("매핑 단건 회기 사용: mappingId={}, 상담사 {}, 내담자 {}", mappingId, consultantUserId, clientUserId);
        ConsultantClientMapping freshMapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
        if (freshMapping.getConsultant() == null || freshMapping.getClient() == null) {
            throw new IllegalStateException("매핑에 상담사 또는 내담자가 없습니다: " + mappingId);
        }
        if (!freshMapping.getConsultant().getId().equals(consultantUserId)
                || !freshMapping.getClient().getId().equals(clientUserId)) {
            throw new IllegalStateException(
                    "일정의 상담사·내담자와 매핑이 일치하지 않습니다. mappingId=" + mappingId);
        }
        MappingStatus mappingStatus = freshMapping.getStatus();
        if (mappingStatus != MappingStatus.ACTIVE && mappingStatus != MappingStatus.DEPOSIT_PENDING) {
            throw new IllegalStateException(
                    "가예약 확정 시 회기 차감은 활성·입금대기 매핑에서만 가능합니다. mappingId="
                            + mappingId + ", status=" + mappingStatus);
        }
        log.info("매핑 회기 차감: mappingId={}, totalSessions={}, usedSessions={}, remainingSessions={}",
                freshMapping.getId(), freshMapping.getTotalSessions(),
                freshMapping.getUsedSessions(), freshMapping.getRemainingSessions());
        persistSessionSequenceBeforeDeduction(scheduleForSequence, freshMapping);
        freshMapping.useSession();
        mappingRepository.save(freshMapping);
        try {
            sessionSyncService.syncAfterSessionUsage(mappingId, consultantUserId, clientUserId);
            log.info("회기 사용 후 동기화 완료: mappingId={}", mappingId);
        } catch (Exception syncError) {
            log.error("회기 사용 후 동기화 실패: mappingId={}, error={}",
                    mappingId, syncError.getMessage(), syncError);
        }
        try {
            Integer rem = freshMapping.getRemainingSessions();
            if (rem != null && rem > 0 && rem <= 2) {
                mobilePushDispatchService.dispatchSessionLow(tenantId, mappingId, clientUserId, rem);
            }
        } catch (Exception pushEx) {
            log.warn("회기 임박 푸시 실패: mappingId={}", mappingId, pushEx);
        }
    }

    @Override
    public List<Schedule> findByConsultantId(Long consultantId) {
        autoCompleteExpiredSchedules();
        // ⚠️ 보안: tenantId는 필수 (다른 테넌트 데이터 접근 방지)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return scheduleRepository.findByTenantIdAndConsultantId(tenantId, consultantId);
    }

    @Override
    public List<Schedule> findByConsultantIdAndDate(Long consultantId, LocalDate date) {
        autoCompleteExpiredSchedules();
        // ⚠️ 보안: tenantId는 필수 (다른 테넌트 데이터 접근 방지)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return scheduleRepository.findByTenantIdAndConsultantIdAndDate(tenantId, consultantId, date);
    }

    @Override
    public List<Schedule> findByConsultantIdAndDateBetween(Long consultantId, LocalDate startDate, LocalDate endDate) {
        autoCompleteExpiredSchedules();
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        return scheduleRepository.findByTenantIdAndConsultantIdAndDateBetween(tenantId, consultantId, startDate, endDate);
    }


    @Override
    public List<Schedule> findByClientId(Long clientId) {
        autoCompleteExpiredSchedules();
        // ⚠️ 보안: tenantId는 필수 (다른 테넌트 데이터 접근 방지)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return scheduleRepository.findByTenantIdAndClientId(tenantId, clientId);
    }

    @Override
    public List<Schedule> findByClientIdAndDate(Long clientId, LocalDate date) {
        autoCompleteExpiredSchedules();
        // ⚠️ 보안: tenantId는 필수 (다른 테넌트 데이터 접근 방지)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return scheduleRepository.findByTenantIdAndClientIdAndDate(tenantId, clientId, date);
    }

    @Override
    public List<Schedule> findByClientIdAndDateBetween(Long clientId, LocalDate startDate, LocalDate endDate) {
        autoCompleteExpiredSchedules();
        // ⚠️ 보안: tenantId는 필수 (다른 테넌트 데이터 접근 방지)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return scheduleRepository.findByTenantIdAndClientIdAndDateBetween(tenantId, clientId, startDate, endDate);
    }


    @Override
    public Schedule bookSchedule(Long scheduleId, Long consultationId, Long clientId) {
        log.info("📋 스케줄 예약: ID {}, 상담 {}, 내담자 {}", scheduleId, consultationId, clientId);
        Schedule schedule = findById(scheduleId);
        schedule.book(consultationId, clientId);
        return scheduleRepository.save(schedule);
    }

    @Override
    public Schedule cancelSchedule(Long scheduleId, String reason) {
        log.info("❌ 스케줄 취소: ID {}, 사유: {}", scheduleId, reason);
        Schedule schedule = findById(scheduleId);
        ScheduleStatus previousStatus = schedule.getStatus();
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        schedule.setStatus(ScheduleStatus.CANCELLED);
        schedule.setDescription(reason);
        Schedule saved = scheduleRepository.save(schedule);
        // 예약 취소 시 회기 1회 복원 (예약·확정·진행 중이었을 때만, 분쟁 방지)
        if ((previousStatus == ScheduleStatus.BOOKED || previousStatus == ScheduleStatus.CONFIRMED
                || previousStatus == ScheduleStatus.IN_PROGRESS)
                && schedule.getConsultantId() != null && schedule.getClientId() != null) {
            restoreSessionForMapping(schedule.getConsultantId(), schedule.getClientId());
        }
        try {
            mobilePushDispatchService.dispatchBookingCancelled(saved.getTenantId(), saved);
        } catch (Exception ex) {
            log.warn("예약 취소 푸시 실패: scheduleId={}", saved.getId(), ex);
        }
        return saved;
    }

    @Override
    public Schedule confirmSchedule(Long scheduleId, String adminNote) {
        log.info("✅ 예약 확정: ID {}, 관리자 메모: {}", scheduleId, adminNote);
        Schedule schedule = findById(scheduleId);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        schedule.setStatus(ScheduleStatus.CONFIRMED);
        
        String currentDescription = schedule.getDescription() != null ? schedule.getDescription() : "";
        String newDescription = currentDescription + 
            (currentDescription.isEmpty() ? "" : "\n") + 
            "[관리자 확정] " + adminNote;
        schedule.setDescription(newDescription);
        
        Schedule saved = scheduleRepository.save(schedule);
        deductSessionForScheduleIfNeeded(saved);
        tryDispatchScheduleConfirmedExternalNotification(saved);
        try {
            mobilePushDispatchService.dispatchBookingConfirmed(saved.getTenantId(), saved);
        } catch (Exception ex) {
            log.warn("예약 확정 푸시 실패: scheduleId={}", saved.getId(), ex);
        }
        return saved;
    }
    
    /**
     * 관리자 예약 확정 후 내담자에게 알림톡→SMS 폴백(비차단). 테넌트 컨텍스트가 없으면 생략.
     * TODO(§1 회의): 수신자 매트릭스·멱등 키·트랜잭션 커밋 후 비동기 발송 여부 확정.
     */
    private void tryDispatchScheduleConfirmedExternalNotification(Schedule schedule) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("예약 확정 알림: TenantContext 비어 있음, 발송 생략 scheduleId={}", schedule.getId());
            return;
        }
        if (schedule.getClientId() == null) {
            log.debug("예약 확정 알림: clientId 없음 scheduleId={}", schedule.getId());
            return;
        }
        try {
            User client = findUserByTenantContext(schedule.getTenantId(), schedule.getClientId()).orElse(null);
            if (client == null) {
                log.warn("예약 확정 알림: 내담자 User 미조회 scheduleId={}, clientId={}",
                    schedule.getId(), schedule.getClientId());
                return;
            }
            String consultantName = resolveConsultantDisplayNameForAlimTalk(schedule);
            String dateStr = schedule.getDate() != null ? schedule.getDate().toString() : "";
            String timeStr;
            if (schedule.getStartTime() != null && schedule.getEndTime() != null) {
                timeStr = schedule.getStartTime() + "-" + schedule.getEndTime();
            } else if (schedule.getStartTime() != null) {
                timeStr = schedule.getStartTime().toString();
            } else {
                timeStr = "";
            }
            // 제품 정책: 인앱·이메일 등 기존 안내와 병행될 수 있음(채널 단일화는 §1 정책 확정 후).
            notificationService.sendConsultationConfirmed(client, consultantName, dateStr, timeStr);
        } catch (Exception e) {
            log.warn("예약 확정 알림 발송 실패(본 처리 롤백 없음): scheduleId={}, {}", schedule.getId(), e.getMessage());
        }
    }
    
    private String resolveConsultantDisplayNameForAlimTalk(Schedule schedule) {
        if (schedule.getConsultantId() == null) {
            return "상담사";
        }
        try {
            User consultant = findUserByTenantContext(schedule.getTenantId(), schedule.getConsultantId()).orElse(null);
            if (consultant == null) {
                return "상담사";
            }
            Map<String, String> decrypted = userPersonalDataCacheService.getDecryptedUserData(consultant);
            if (decrypted != null && decrypted.get("name") != null && !decrypted.get("name").isEmpty()) {
                return decrypted.get("name");
            }
            return consultant.getName() != null ? consultant.getName() : "상담사";
        } catch (Exception e) {
            log.warn("예약 확정 알림: 상담사명 조회 실패 scheduleId={}", schedule.getId(), e);
            return "상담사";
        }
    }

    @Override
    public Schedule completeSchedule(Long scheduleId) {
        log.info("✅ 스케줄 완료: ID {}", scheduleId);
        Schedule schedule = findById(scheduleId);
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null && schedule.getTenantId() != null) tenantId = schedule.getTenantId();
        if (tenantId != null) {
            boolean hasRecord = consultationRecordRepository.existsByTenantIdAndConsultationIdAndIsDeletedFalse(tenantId, scheduleId);
            if (!hasRecord) {
                try {
                    plSqlScheduleValidationService.createConsultationRecordReminder(
                        scheduleId, schedule.getConsultantId(), schedule.getClientId(),
                        schedule.getDate(), "상담일지 누락 안내");
                } catch (Exception e) { log.warn("상담일지 리마인더 생성 실패: {}", e.getMessage()); }
                try {
                    consultationMessageService.sendMessage(
                        schedule.getConsultantId(), schedule.getClientId(), scheduleId,
                        getRoleCodeFromCommonCode(UserRole.CONSULTANT.name()),
                        "상담일지 누락 안내",
                        "상담일지가 누락되었습니다. 상담일지를 작성한 후 완료 처리해 주세요.",
                        getMessageTypeFromCommonCode("COMPLETION"), true, false);
                } catch (Exception e) { log.warn("상담일지 누락 리마인드 발송 실패: {}", e.getMessage()); }
                throw new IllegalStateException("상담일지를 작성한 후 완료 처리할 수 있습니다.");
            }
        }
        schedule.setStatus(ScheduleStatus.COMPLETED);
        
        Schedule completedSchedule = scheduleRepository.save(schedule);
        
        try {
            log.info("📊 상담 완료 후 통계 자동 업데이트 시작: scheduleId={}", scheduleId);
            statisticsService.updateDailyStatistics(schedule.getDate(), null);
            statisticsService.updateConsultantPerformance(schedule.getConsultantId(), schedule.getDate());
            
            log.info("🔔 상담 완료 후 성과 알림 자동 발송: consultantId={}", schedule.getConsultantId());
            String message = String.format("상담이 완료되었습니다. (일시: %s %s-%s)", 
                schedule.getDate(), schedule.getStartTime(), schedule.getEndTime());
            
            consultationMessageService.sendMessage(
                schedule.getConsultantId(), 
                schedule.getClientId(), 
                null, // consultationId
                getRoleCodeFromCommonCode(UserRole.CONSULTANT.name()), 
                "상담 완료", 
                message,
                getMessageTypeFromCommonCode("COMPLETION"),
                false, // isImportant
                false  // isUrgent
            );
            
            String ratingMessage = "상담이 완료되었습니다. 상담사에 대한 평가를 남겨주세요.";
            consultationMessageService.sendMessage(
                schedule.getClientId(), 
                schedule.getConsultantId(), 
                null, // consultationId
                getRoleCodeFromCommonCode(UserRole.CLIENT.name()), 
                "평가 요청", 
                ratingMessage,
                getMessageTypeFromCommonCode("RATING_REQUEST"),
                false, // isImportant
                false  // isUrgent
            );
            
            log.info("✅ 워크플로우 자동화 완료: scheduleId={}", scheduleId);
            
        } catch (Exception e) {
            log.error("❌ 워크플로우 자동화 실패: scheduleId={}", scheduleId, e);
        }
        
        return completedSchedule;
    }

    @Override
    public Schedule blockSchedule(Long scheduleId, String reason) {
        log.info("🚫 스케줄 차단: ID {}, 사유: {}", scheduleId, reason);
        Schedule schedule = findById(scheduleId);
        schedule.setStatus(ScheduleStatus.VACATION);
        return scheduleRepository.save(schedule);
    }


    @Override
    public boolean hasTimeConflict(Long consultantId, LocalDate date, LocalTime startTime, LocalTime endTime, Long excludeScheduleId) {
        log.debug("⏰ 시간 충돌 검사 (기본): 상담사 {}, 날짜 {}, 시간 {} - {}", consultantId, date, startTime, endTime);
        
        if (consultantAvailabilityService.isConsultantOnVacation(consultantId, date, startTime, endTime)) {
            log.warn("🚫 휴가 중인 상담사: 상담사 {}, 날짜 {}", consultantId, date);
            return true;
        }
        
        List<Schedule> existingSchedules = findByConsultantIdAndDate(consultantId, date);
        
        for (Schedule existing : existingSchedules) {
            if (excludeScheduleId != null && existing.getId().equals(excludeScheduleId)) {
                continue; // 자기 자신은 제외
            }
            if (!isScheduleOccupyingTimeSlot(existing)) {
                continue;
            }
            
            if (isTimeOverlapping(startTime, endTime, existing.getStartTime(), existing.getEndTime())) {
                log.debug("시간 충돌 발견: 기존 스케줄 {} ({} - {})", existing.getId(), existing.getStartTime(), existing.getEndTime());
                return true;
            }
        }
        
        return false;
    }

    @Override
    public boolean hasTimeConflictWithType(Long consultantId, LocalDate date, LocalTime startTime, 
                                        ConsultationType consultationType, Long excludeScheduleId) {
        log.debug("⏰ 시간 충돌 검사 (유형 기반): 상담사 {}, 날짜 {}, 시작시간 {}, 상담유형 {}", 
                consultantId, date, startTime, consultationType.getDisplayName());
        
        LocalTime endTime = calculateEndTime(startTime, consultationType);
        
        if (consultantAvailabilityService.isConsultantOnVacation(consultantId, date, startTime, endTime)) {
            log.warn("🚫 휴가 중인 상담사: 상담사 {}, 날짜 {}", consultantId, date);
            return true;
        }
        
        if (hasTimeConflict(consultantId, date, startTime, endTime, excludeScheduleId)) {
            return true;
        }
        
        List<Schedule> existingSchedules = findByConsultantIdAndDate(consultantId, date);
        
        for (Schedule existing : existingSchedules) {
            if (excludeScheduleId != null && existing.getId().equals(excludeScheduleId)) {
                continue; // 자기 자신은 제외
            }
            if (!isScheduleOccupyingTimeSlot(existing)) {
                continue;
            }
            
            if (isTimeTooClose(startTime, endTime, existing.getStartTime(), existing.getEndTime())) {
                log.debug("시간 간격 부족 발견: 기존 스케줄 {} ({} - {})", existing.getId(), existing.getStartTime(), existing.getEndTime());
                return true;
            }
        }
        
        return false;
    }

    /**
     * 예약 점유로 간주하는 스케줄만 충돌 후보에 포함한다.
     * {@link com.coresolution.consultation.repository.ScheduleRepository#findOverlappingSchedules} JPQL status 집합과 동일 정책.
     *
     * @param schedule 검사 대상
     * @return 점유(충돌 검사 대상)이면 true
     */
    private boolean isScheduleOccupyingTimeSlot(Schedule schedule) {
        if (schedule == null || schedule.getStatus() == null) {
            return false;
        }
        return schedule.getStatus().occupiesTimeForConflictCheck();
    }

    @Override
    public boolean validateMappingForSchedule(Long consultantId, Long clientId) {
        log.debug("🔗 매칭 상태 검증: 상담사 {}, 내담자 {}", consultantId, clientId);
        String tenantId = TenantContextHolder.getRequiredTenantId();

        List<ConsultantClientMapping> activeMappings = mappingRepository.findByTenantIdAndStatus(
            tenantId, MappingStatus.ACTIVE);

        for (ConsultantClientMapping mapping : activeMappings) {
            if (mappingMatchesConsultantClientPair(mapping, consultantId, clientId)) {
                log.debug("유효한 매칭 발견: ID {}", mapping.getId());
                return true;
            }
        }

        log.warn("유효한 매칭을 찾을 수 없음: 상담사 {}, 내담자 {}", consultantId, clientId);
        return false;
    }

    /**
     * 입금 전 가예약: 동일 테넌트에서 상담사·내담자 쌍에 대한 매핑이 {@link MappingStatus#ACTIVE} 인 경우만 통과.
     * {@code DEPOSIT_PENDING}(승인 대기)은 관리자 승인 전이므로 일정 생성·드롭 경로에서 제외한다.
     *
     * @param consultantId 상담사 사용자 ID
     * @param clientId 내담자 사용자 ID
     * @return 허용되면 true
     */
    private boolean validateMappingForTentativeBeforeDepositSchedule(Long consultantId, Long clientId) {
        log.debug("🔗 가예약 매칭 검증: 상담사 {}, 내담자 {}", consultantId, clientId);
        String tenantId = TenantContextHolder.getRequiredTenantId();

        List<ConsultantClientMapping> mappings = mappingRepository.findByTenantIdAndStatus(tenantId,
                MappingStatus.ACTIVE);
        for (ConsultantClientMapping mapping : mappings) {
            if (mappingMatchesConsultantClientPair(mapping, consultantId, clientId)) {
                log.debug("가예약 허용 매칭: status=ACTIVE, mappingId={}", mapping.getId());
                return true;
            }
        }
        log.warn("가예약 매칭 검증 실패: tenantId={}, 상담사 {}, 내담자 {}", tenantId, consultantId, clientId);
        return false;
    }

    private boolean mappingMatchesConsultantClientPair(ConsultantClientMapping mapping, Long consultantId,
            Long clientId) {
        if (mapping == null || mapping.getConsultant() == null || mapping.getClient() == null) {
            return false;
        }
        return mapping.getConsultant().getId().equals(consultantId)
                && mapping.getClient().getId().equals(clientId);
    }

    @Override
    public boolean validateRemainingSessions(Long consultantId, Long clientId) {
        log.debug("📊 회기 수 검증: 상담사 {}, 내담자 {}", consultantId, clientId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        List<ConsultantClientMapping> activeMappings = mappingRepository.findByTenantIdAndStatus(
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            tenantId, ConsultantClientMapping.MappingStatus.ACTIVE);
        
        for (ConsultantClientMapping mapping : activeMappings) {
            if (mapping.getConsultant().getId().equals(consultantId) && 
                mapping.getClient().getId().equals(clientId)) {
                
                Integer remainingSessions = mapping.getRemainingSessions();
                log.debug("남은 회기 수: {}", remainingSessions);
                
                return remainingSessions != null && remainingSessions > 0;
            }
        }
        
        log.warn("활성 매칭을 찾을 수 없음: 상담사 {}, 내담자 {}", consultantId, clientId);
        return false;
    }


    @Override
    public LocalTime calculateEndTime(LocalTime startTime, ConsultationType consultationType) {
        int durationMinutes = consultationType.getDefaultDurationMinutes() + 10; // BREAK_TIME_MINUTES = 10
        return startTime.plus(durationMinutes, ChronoUnit.MINUTES);
    }

    @Override
    public LocalTime calculateEndTime(LocalTime startTime, int durationMinutes) {
        int totalMinutes = durationMinutes + 10; // BREAK_TIME_MINUTES = 10
        return startTime.plus(totalMinutes, ChronoUnit.MINUTES);
    }

    @Override
    public int calculateMaxConsultationTimePerDay(Long consultantId, LocalDate date) {
        int maxWorkMinutes = 8 * 60; // WORKDAY_TOTAL_HOURS = 8, MINUTES_PER_HOUR = 60
        
        List<Schedule> existingSchedules = findByConsultantIdAndDate(consultantId, date);
        int usedMinutes = existingSchedules.stream()
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            .filter(s -> ScheduleStatus.BOOKED.equals(s.getStatus()))
            .mapToInt(s -> {
                if (s.getStartTime() != null && s.getEndTime() != null) {
                    return (int) ChronoUnit.MINUTES.between(s.getStartTime(), s.getEndTime());
                }
                return 0;
            })
            .sum();
        
        return maxWorkMinutes - usedMinutes;
    }


    @Override
    public Map<String, Object> getConsultantScheduleStats(Long consultantId, LocalDate startDate, LocalDate endDate) {
        log.info("📊 상담사 스케줄 통계: ID {}, 기간 {} - {}", consultantId, startDate, endDate);
        
        List<Schedule> schedules = findByConsultantIdAndDateBetween(consultantId, startDate, endDate);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSchedules", schedules.size());
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        stats.put("bookedSchedules", schedules.stream().filter(s -> ScheduleStatus.BOOKED.equals(s.getStatus())).count());
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        stats.put("completedSchedules", schedules.stream().filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus())).count());
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        stats.put("cancelledSchedules", schedules.stream().filter(s -> ScheduleStatus.CANCELLED.equals(s.getStatus())).count());
        
        return stats;
    }

    @Override
    public Map<String, Object> getClientScheduleStats(Long clientId, LocalDate startDate, LocalDate endDate) {
        log.info("📊 내담자 스케줄 통계: ID {}, 기간 {} - {}", clientId, startDate, endDate);
        
        List<Schedule> schedules = findByClientIdAndDateBetween(clientId, startDate, endDate);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSchedules", schedules.size());
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        stats.put("bookedSchedules", schedules.stream().filter(s -> ScheduleStatus.BOOKED.equals(s.getStatus())).count());
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        stats.put("completedSchedules", schedules.stream().filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus())).count());
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        stats.put("cancelledSchedules", schedules.stream().filter(s -> ScheduleStatus.CANCELLED.equals(s.getStatus())).count());
        
        return stats;
    }

    @Override
    public Map<String, Object> getOverallScheduleStats(LocalDate startDate, LocalDate endDate) {
        log.info("📊 전체 스케줄 통계: 기간 {} - {}", startDate, endDate);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        List<Schedule> allSchedules = scheduleRepository.findByTenantIdAndDateBetween(tenantId, startDate, endDate);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSchedules", allSchedules.size());
        stats.put("bookedSchedules", allSchedules.stream().filter(s -> ScheduleStatus.BOOKED.name().equals(s.getStatus())).count());
        stats.put("completedSchedules", allSchedules.stream().filter(s -> ScheduleStatus.COMPLETED.name().equals(s.getStatus())).count());
        stats.put("cancelledSchedules", allSchedules.stream().filter(s -> ScheduleStatus.CANCELLED.name().equals(s.getStatus())).count());
        
        return stats;
    }


    @Override
    public List<Schedule> findSchedulesByUserRole(Long userId, String userRole) {
        log.info("🔐 권한 기반 스케줄 조회: 사용자 {}, 역할 {}", userId, userRole);
        
        autoCompleteExpiredSchedules();
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        
        if (scheduleAdminSeesAllTenant(userId, userRole)) {
            log.info("👑 관리자 권한으로 모든 스케줄 조회");
            return scheduleRepository.findByTenantId(tenantId);
        } else if (scheduleUsesConsultantOwnScope(userId, userRole)) {
            log.info("👨‍⚕️ 상담사 권한으로 자신의 스케줄만 조회: {}", userId);
            return scheduleRepository.findByTenantIdAndConsultantId(tenantId, userId);
        } else {
            log.warn("❌ 권한 없음: 사용자 {}, 역할 {}", userId, userRole);
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }
    }

    @Override
    public List<Schedule> findSchedulesByUserRoleAndDate(Long userId, String userRole, LocalDate date) {
        log.info("🔐 권한 기반 특정 날짜 스케줄 조회: 사용자 {}, 역할 {}, 날짜 {}", userId, userRole, date);
        
        autoCompleteExpiredSchedules();
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        if (scheduleAdminSeesAllTenant(userId, userRole)) {
            return scheduleRepository.findByTenantIdAndDate(tenantId, date);
        } else if (scheduleUsesConsultantOwnScope(userId, userRole)) {
            return scheduleRepository.findByTenantIdAndConsultantIdAndDate(tenantId, userId, date);
        } else {
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }
    }

    @Override
    public List<Schedule> findSchedulesByUserRoleAndDateBetween(Long userId, String userRole, LocalDate startDate, LocalDate endDate) {
        log.info("🔐 권한 기반 날짜 범위 스케줄 조회: 사용자 {}, 역할 {}, 기간 {} ~ {}", userId, userRole, startDate, endDate);
        
        autoCompleteExpiredSchedules();
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        if (scheduleAdminSeesAllTenant(userId, userRole)) {
            return scheduleRepository.findByTenantIdAndDateBetween(tenantId, startDate, endDate);
        } else if (scheduleUsesConsultantOwnScope(userId, userRole)) {
            return scheduleRepository.findByTenantIdAndConsultantIdAndDateBetween(tenantId, userId, startDate, endDate);
        } else {
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }
    }

    @Override
    public List<ScheduleResponse> findScheduleResponsesByUserRoleAndDate(
        Long userId, String userRole, LocalDate date) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<Schedule> schedules = findSchedulesByUserRoleAndDate(userId, userRole, date);
        Map<String, ConsultantClientMapping> mappingLookup = buildActiveOrExhaustedMappingLookup(tenantId);
        return schedules.stream()
            .map(schedule -> convertToScheduleDto(schedule, mappingLookup))
            .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public List<ScheduleResponse> findScheduleResponsesByUserRoleAndDateBetween(
        Long userId, String userRole, LocalDate startDate, LocalDate endDate) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<Schedule> schedules = findSchedulesByUserRoleAndDateBetween(userId, userRole, startDate, endDate);
        Map<String, ConsultantClientMapping> mappingLookup = buildActiveOrExhaustedMappingLookup(tenantId);
        return schedules.stream()
            .map(schedule -> convertToScheduleDto(schedule, mappingLookup))
            .collect(java.util.stream.Collectors.toList());
    }

    @Override
    public Map<String, Object> getScheduleStatisticsForAdmin(String startDate, String endDate) {
        log.info("📊 관리자용 전체 스케줄 통계 조회 시작 - 시작일: {}, 종료일: {}", startDate, endDate);
        
        try {
            Map<String, Object> statistics = new HashMap<>();
            
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : null;
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : null;
            
            String tenantId = TenantContextHolder.getTenantId();
            
            log.info("📊 전체 스케줄 수 조회 중...");
            long totalSchedules;
            if (start != null && end != null) {
                totalSchedules = scheduleRepository.countByDateBetween(tenantId, start, end);
            } else if (start != null) {
                totalSchedules = scheduleRepository.countByDateGreaterThanEqual(tenantId, start);
            } else if (end != null) {
                totalSchedules = scheduleRepository.countByDateLessThanEqual(tenantId, end);
            } else {
                totalSchedules = scheduleRepository.count();
            }
            statistics.put("totalSchedules", totalSchedules);
            log.info("📊 전체 스케줄 수: {}", totalSchedules);
            
            log.info("📊 상태별 스케줄 수 조회 중...");
            long bookedSchedules, completedSchedules, cancelledSchedules, inProgressSchedules;
            
            if (start != null && end != null) {
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                bookedSchedules = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.BOOKED, start, end);
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                completedSchedules = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.COMPLETED, start, end);
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                cancelledSchedules = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.CANCELLED, start, end);
                inProgressSchedules = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.IN_PROGRESS, start, end);
            } else if (start != null) {
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                bookedSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(tenantId, ScheduleStatus.BOOKED, start);
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                completedSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(tenantId, ScheduleStatus.COMPLETED, start);
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                cancelledSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(tenantId, ScheduleStatus.CANCELLED, start);
                inProgressSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(tenantId, ScheduleStatus.IN_PROGRESS, start);
            } else if (end != null) {
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                bookedSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(tenantId, ScheduleStatus.BOOKED, end);
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                completedSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(tenantId, ScheduleStatus.COMPLETED, end);
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                cancelledSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(tenantId, ScheduleStatus.CANCELLED, end);
                inProgressSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(tenantId, ScheduleStatus.IN_PROGRESS, end);
            } else {
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                bookedSchedules = scheduleRepository.countByStatus(tenantId, ScheduleStatus.BOOKED.name());
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                completedSchedules = scheduleRepository.countByStatus(tenantId, ScheduleStatus.COMPLETED.name());
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                cancelledSchedules = scheduleRepository.countByStatus(tenantId, ScheduleStatus.CANCELLED.name());
                inProgressSchedules = scheduleRepository.countByStatus(tenantId, ScheduleStatus.IN_PROGRESS.name());
            }
            
            statistics.put("bookedSchedules", bookedSchedules);
            statistics.put("completedSchedules", completedSchedules);
            statistics.put("cancelledSchedules", cancelledSchedules);
            statistics.put("inProgressSchedules", inProgressSchedules);
            
            log.info("📊 상태별 스케줄 수 - 예약: {}, 완료: {}, 취소: {}, 진행중: {}", 
                    bookedSchedules, completedSchedules, cancelledSchedules, inProgressSchedules);
            
            LocalDate today = LocalDate.now();
            log.info("📊 오늘의 통계 조회 중... (날짜: {})", today);
            long totalToday = scheduleRepository.countByDate(tenantId, today);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            long bookedToday = scheduleRepository.countByDateAndStatus(tenantId, today, ScheduleStatus.BOOKED);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            long completedToday = scheduleRepository.countByDateAndStatus(tenantId, today, ScheduleStatus.COMPLETED);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            long cancelledToday = scheduleRepository.countByDateAndStatus(tenantId, today, ScheduleStatus.CANCELLED);
            long inProgressToday = scheduleRepository.countByDateAndStatus(tenantId, today, ScheduleStatus.IN_PROGRESS);
            
            statistics.put("totalToday", totalToday);
            statistics.put("bookedToday", bookedToday);
            statistics.put("completedToday", completedToday);
            statistics.put("cancelledToday", cancelledToday);
            statistics.put("inProgressToday", inProgressToday);
            
            log.info("📊 오늘의 통계 - 총: {}, 예약: {}, 완료: {}, 취소: {}, 진행중: {}", 
                    totalToday, bookedToday, completedToday, cancelledToday, inProgressToday);
            
            log.info("📊 추가 상세 통계 조회 중...");
            
            LocalDate thisMonthStart = today.withDayOfMonth(1);
            LocalDate lastMonthStart = thisMonthStart.minusMonths(1);
            LocalDate lastMonthEnd = thisMonthStart.minusDays(1);
            
            long thisMonthClients = scheduleRepository.countDistinctClientsByDateBetween(tenantId, thisMonthStart, today);
            long lastMonthClients = scheduleRepository.countDistinctClientsByDateBetween(tenantId, lastMonthStart, lastMonthEnd);
            long clientGrowth = thisMonthClients - lastMonthClients;
            double clientGrowthRate = lastMonthClients > 0 ? ((double) clientGrowth / lastMonthClients) * 100 : 0;
            
            statistics.put("thisMonthClients", thisMonthClients);
            statistics.put("lastMonthClients", lastMonthClients);
            statistics.put("clientGrowth", clientGrowth);
            statistics.put("clientGrowthRate", Math.round(clientGrowthRate * 100.0) / 100.0);
            
            long thisMonthConsultants = scheduleRepository.countDistinctConsultantsByDateBetween(tenantId, thisMonthStart, today);
            long lastMonthConsultants = scheduleRepository.countDistinctConsultantsByDateBetween(tenantId, lastMonthStart, lastMonthEnd);
            long consultantGrowth = thisMonthConsultants - lastMonthConsultants;
            double consultantGrowthRate = lastMonthConsultants > 0 ? ((double) consultantGrowth / lastMonthConsultants) * 100 : 0;
            
            statistics.put("thisMonthConsultants", thisMonthConsultants);
            statistics.put("lastMonthConsultants", lastMonthConsultants);
            statistics.put("consultantGrowth", consultantGrowth);
            statistics.put("consultantGrowthRate", Math.round(consultantGrowthRate * 100.0) / 100.0);
            
            long totalSchedulesInPeriod = scheduleRepository.countByDateBetween(tenantId, thisMonthStart, today);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            long completedSchedulesInPeriod = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.COMPLETED, thisMonthStart, today);
            double completionRate = totalSchedulesInPeriod > 0 ? ((double) completedSchedulesInPeriod / totalSchedulesInPeriod) * 100 : 0;
            
            statistics.put("totalSchedulesInPeriod", totalSchedulesInPeriod);
            statistics.put("completedSchedulesInPeriod", completedSchedulesInPeriod);
            statistics.put("completionRate", Math.round(completionRate * 100.0) / 100.0);
            
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            long cancelledSchedulesInPeriod = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.CANCELLED, thisMonthStart, today);
            double cancellationRate = totalSchedulesInPeriod > 0 ? ((double) cancelledSchedulesInPeriod / totalSchedulesInPeriod) * 100 : 0;
            
            statistics.put("cancelledSchedulesInPeriod", cancelledSchedulesInPeriod);
            statistics.put("cancellationRate", Math.round(cancellationRate * 100.0) / 100.0);
            
            LocalDate weekAgo = today.minusDays(7);
            long weeklySchedules = scheduleRepository.countByDateBetween(tenantId, weekAgo, today);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            long weeklyCompleted = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.COMPLETED, weekAgo, today);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            long weeklyCancelled = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.CANCELLED, weekAgo, today);
            
            statistics.put("weeklySchedules", weeklySchedules);
            statistics.put("weeklyCompleted", weeklyCompleted);
            statistics.put("weeklyCancelled", weeklyCancelled);
            
            log.info("📊 상세 통계 - 이번달 내담자: {} (증감: {}), 이번달 상담사: {} (증감: {}), 완료율: {}%, 취소율: {}%", 
                    thisMonthClients, clientGrowth, thisMonthConsultants, consultantGrowth, completionRate, cancellationRate);
            
            log.info("✅ 관리자용 스케줄 통계 조회 완료: 총 {}개 스케줄", totalSchedules);
            return statistics;
            
        } catch (Exception e) {
            log.error("❌ 관리자용 스케줄 통계 조회 실패: {}", e.getMessage(), e);
            throw new RuntimeException("통계 조회 중 오류가 발생했습니다: " + e.getMessage(), e);
        }
    }

     /**
     * 오늘의 스케줄 통계 조회
     */
    @Override
    public Map<String, Object> getTodayScheduleStatistics() {
        log.info("📊 오늘의 스케줄 통계 조회");
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("❌ 테넌트 컨텍스트 없음 - 오늘 통계 빈 결과 반환");
            Map<String, Object> empty = new HashMap<>();
            empty.put("totalToday", 0L);
            empty.put("completedToday", 0L);
            empty.put("inProgressToday", 0L);
            empty.put("cancelledToday", 0L);
            empty.put("bookedToday", 0L);
            empty.put("confirmedToday", 0L);
            empty.put("bookedGrowthRate", 0.0);
            empty.put("totalUsersGrowthRate", 0.0);
            return empty;
        }
        LocalDate today = LocalDate.now();
        Map<String, Object> statistics = new HashMap<>();
        
        long totalToday = scheduleRepository.countByDate(tenantId, today);
        statistics.put("totalToday", totalToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long completedToday = scheduleRepository.countByDateAndStatus(tenantId, today, ScheduleStatus.COMPLETED);
        statistics.put("completedToday", completedToday);
        
        long inProgressToday = scheduleRepository.countByDateAndStatus(tenantId, today, ScheduleStatus.IN_PROGRESS);
        statistics.put("inProgressToday", inProgressToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long cancelledToday = scheduleRepository.countByDateAndStatus(tenantId, today, ScheduleStatus.CANCELLED);
        statistics.put("cancelledToday", cancelledToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long bookedToday = scheduleRepository.countByDateAndStatus(tenantId, today, ScheduleStatus.BOOKED);
        statistics.put("bookedToday", bookedToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long confirmedToday = scheduleRepository.countByDateAndStatus(tenantId, today, ScheduleStatus.CONFIRMED);
        statistics.put("confirmedToday", confirmedToday);

        // 전주 동일 요일 대비 예약 건수 증감 (KPI 배지용)
        LocalDate lastWeekSameDay = today.minusWeeks(1);
        long lastWeekBooked = scheduleRepository.countByDateAndStatus(tenantId, lastWeekSameDay, ScheduleStatus.BOOKED);
        double bookedGrowthRate = lastWeekBooked > 0
                ? Math.round(((double) (bookedToday - lastWeekBooked) / lastWeekBooked * 100.0) * 10.0) / 10.0
                : (bookedToday > 0 ? 100.0 : 0.0);
        statistics.put("bookedGrowthRate", bookedGrowthRate);

        // 총 사용자(상담사+내담자) 증감률: 전일 0시 시점 대비 (KPI 배지용)
        double totalUsersGrowthRate = computeTotalUsersGrowthRate(tenantId);
        statistics.put("totalUsersGrowthRate", totalUsersGrowthRate);
        
        log.info("✅ 오늘의 스케줄 통계 조회 완료: 총 {}개, 완료 {}개, 진행중 {}개, 취소 {}개, 예약 {}개, 확인 {}개, 예약증감 {}%, 사용자증감 {}%", 
                totalToday, completedToday, inProgressToday, cancelledToday, bookedToday, confirmedToday, bookedGrowthRate, totalUsersGrowthRate);
        
        return statistics;
    }
    
     /**
     * 테넌트별 오늘의 스케줄 통계 조회
     */
    @Override
    public Map<String, Object> getTodayScheduleStatisticsByTenant(String tenantId) {
        log.info("📊 테넌트별 오늘의 스케줄 통계 조회 - 테넌트 ID: {}", tenantId);
        
        LocalDate today = LocalDate.now();
        Map<String, Object> statistics = new HashMap<>();
        
        long totalToday = scheduleRepository.countByTenantIdAndDate(tenantId, today);
        statistics.put("totalToday", totalToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long completedToday = scheduleRepository.countByTenantIdAndDateAndStatus(tenantId, today, ScheduleStatus.COMPLETED);
        statistics.put("completedToday", completedToday);
        
        long inProgressToday = scheduleRepository.countByDateAndStatus(tenantId, today, ScheduleStatus.IN_PROGRESS);
        statistics.put("inProgressToday", inProgressToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long cancelledToday = scheduleRepository.countByTenantIdAndDateAndStatus(tenantId, today, ScheduleStatus.CANCELLED);
        statistics.put("cancelledToday", cancelledToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long bookedToday = scheduleRepository.countByTenantIdAndDateAndStatus(tenantId, today, ScheduleStatus.BOOKED);
        statistics.put("bookedToday", bookedToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long confirmedToday = scheduleRepository.countByTenantIdAndDateAndStatus(tenantId, today, ScheduleStatus.CONFIRMED);
        statistics.put("confirmedToday", confirmedToday);

        LocalDate lastWeekSameDay = today.minusWeeks(1);
        long lastWeekBooked = scheduleRepository.countByTenantIdAndDateAndStatus(tenantId, lastWeekSameDay, ScheduleStatus.BOOKED);
        double bookedGrowthRate = lastWeekBooked > 0
                ? Math.round(((double) (bookedToday - lastWeekBooked) / lastWeekBooked * 100.0) * 10.0) / 10.0
                : (bookedToday > 0 ? 100.0 : 0.0);
        statistics.put("bookedGrowthRate", bookedGrowthRate);

        // 총 사용자(상담사+내담자) 증감률: 전일 0시 시점 대비 (KPI 배지용)
        double totalUsersGrowthRate = computeTotalUsersGrowthRate(tenantId);
        statistics.put("totalUsersGrowthRate", totalUsersGrowthRate);
        
        log.info("📊 테넌트별 오늘의 통계 - 테넌트: {}, 총: {}, 완료: {}, 진행중: {}, 취소: {}, 예약: {}, 확인: {}, 예약증감: {}%, 사용자증감: {}%", 
                tenantId, totalToday, completedToday, inProgressToday, cancelledToday, bookedToday, confirmedToday, bookedGrowthRate, totalUsersGrowthRate);
        
        return statistics;
    }

    /**
     * 총 사용자(상담사+내담자) 수 전일 0시 대비 증감률 계산.
     * 비교 시점(전일 0시) 이전 생성 건수와 현재 건수를 비교해 증가율 반환. 비교 데이터 없으면 0.0.
     *
     * @param tenantId 테넌트 UUID (필수)
     * @return 증감률 (소수점 1자리, 비교 불가 시 0.0)
     */
    private double computeTotalUsersGrowthRate(String tenantId) {
        if (tenantId == null || tenantId.isEmpty()) {
            return 0.0;
        }
        try {
            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            long currentConsultants = consultantRepository.countByTenantId(tenantId);
            long currentClients = clientRepository.countByTenantId(tenantId);
            long currentTotal = currentConsultants + currentClients;
            long previousConsultants = consultantRepository.countByTenantIdAndIsDeletedFalseAndCreatedAtBefore(tenantId, todayStart);
            long previousClients = clientRepository.countByTenantIdAndIsDeletedFalseAndCreatedAtBefore(tenantId, todayStart);
            long previousTotal = previousConsultants + previousClients;
            if (previousTotal <= 0) {
                return 0.0;
            }
            return Math.round(((double) (currentTotal - previousTotal) / previousTotal * 100.0) * 10.0) / 10.0;
        } catch (Exception e) {
            log.warn("총 사용자 증감률 계산 스킵: tenantId={}, {}", tenantId, e.getMessage());
            return 0.0;
        }
    }
    
    @Override
    public List<Map<String, Object>> getConsultantWeeklyTrend(Long consultantId, int lastWeeks) {
        log.info("📊 상담사 주간 상담 추이 조회 - 상담사 ID: {}, 주간: {}, tenantId={}", consultantId, lastWeeks, TenantContextHolder.getTenantId());
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("❌ 테넌트 컨텍스트 없음 - 빈 통계 반환. consultantId={}", consultantId);
            return new ArrayList<>();
        }
        
        List<Map<String, Object>> weeklyData = new ArrayList<>();
        LocalDate now = LocalDate.now();
        for (int i = lastWeeks - 1; i >= 0; i--) {
            LocalDate weekEnd = now.minusWeeks(i);
            LocalDate weekStart = weekEnd.minusDays(6);
            
            long completedCount = scheduleRepository.countByStatusAndDateBetweenAndConsultantId(
                    tenantId, ScheduleStatus.COMPLETED, weekStart, weekEnd, consultantId);
            
            Map<String, Object> row = new HashMap<>();
            row.put("period", weekEnd.format(java.time.format.DateTimeFormatter.ofPattern("MM/dd")));
            row.put("completedCount", completedCount);
            weeklyData.add(row);
        }
        log.info("✅ 상담사 주간 상담 추이 조회 완료: {}주", weeklyData.size());
        return weeklyData;
    }

     /**
     * 특정 상담사의 오늘의 스케줄 통계 조회
     */
    @Override
    public Map<String, Object> getTodayScheduleStatisticsByConsultant(Long consultantId) {
        log.info("📊 상담사 오늘의 스케줄 통계 조회 - 상담사 ID: {}, tenantId={}", consultantId, TenantContextHolder.getTenantId());
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("❌ 테넌트 컨텍스트 없음 - 빈 통계 반환. consultantId={}", consultantId);
            Map<String, Object> empty = new HashMap<>();
            empty.put("totalToday", 0L);
            empty.put("completedToday", 0L);
            empty.put("inProgressToday", 0L);
            empty.put("cancelledToday", 0L);
            empty.put("bookedToday", 0L);
            empty.put("confirmedToday", 0L);
            return empty;
        }
        LocalDate today = LocalDate.now();
        Map<String, Object> statistics = new HashMap<>();
        
        long totalToday = scheduleRepository.countByDateAndConsultantId(tenantId, today, consultantId);
        statistics.put("totalToday", totalToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long completedToday = scheduleRepository.countByDateAndStatusAndConsultantId(tenantId, today, ScheduleStatus.COMPLETED, consultantId);
        statistics.put("completedToday", completedToday);
        
        long inProgressToday = scheduleRepository.countByDateAndStatusAndConsultantId(
                tenantId, today, ScheduleStatus.IN_PROGRESS, consultantId);
        statistics.put("inProgressToday", inProgressToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long cancelledToday = scheduleRepository.countByDateAndStatusAndConsultantId(tenantId, today, ScheduleStatus.CANCELLED, consultantId);
        statistics.put("cancelledToday", cancelledToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long bookedToday = scheduleRepository.countByDateAndStatusAndConsultantId(tenantId, today, ScheduleStatus.BOOKED, consultantId);
        statistics.put("bookedToday", bookedToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long confirmedToday = scheduleRepository.countByDateAndStatusAndConsultantId(tenantId, today, ScheduleStatus.CONFIRMED, consultantId);
        statistics.put("confirmedToday", confirmedToday);
        
        log.info("✅ 상담사 오늘의 스케줄 통계 조회 완료 - 상담사 ID: {}, 총 {}개, 완료 {}개, 진행중 {}개, 취소 {}개, 예약 {}개, 확인 {}개", 
                consultantId, totalToday, completedToday, inProgressToday, cancelledToday, bookedToday, confirmedToday);
        
        return statistics;
    }


     /**
     * 시간 겹침 여부 확인
     */
    private boolean isTimeOverlapping(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }

     /**
     * 시간 간격이 너무 가까운지 확인 (최소 10분 간격 필요)
     */
    private boolean isTimeTooClose(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        if (end1.isBefore(start2)) {
            long gapMinutes = ChronoUnit.MINUTES.between(end1, start2);
            return gapMinutes < 10; // BREAK_TIME_MINUTES = 10
        }
        
        if (end2.isBefore(start1)) {
            long gapMinutes = ChronoUnit.MINUTES.between(end2, start1);
            return gapMinutes < 10; // BREAK_TIME_MINUTES = 10
        }
        
        return true;
    }

    /**
     * 회기 차감 직전 매칭 잔여 기준 예약 회차(1-based): totalSessions - remainingSessions + 1.
     */
    private static Integer computeSessionSequenceBeforeDeduction(ConsultantClientMapping mapping) {
        if (mapping == null) {
            return null;
        }
        Integer totalSessions = mapping.getTotalSessions();
        Integer remainingSessions = mapping.getRemainingSessions();
        if (totalSessions == null || totalSessions < 1 || remainingSessions == null || remainingSessions <= 0) {
            return null;
        }
        return totalSessions - remainingSessions + 1;
    }

    /**
     * 상담 일정이 회기 차감 대상인지 (CONSULTATION·내담자·상담사 존재).
     */
    private static boolean isConsultationScheduleForSessionDeduction(Schedule schedule) {
        if (schedule == null || schedule.getClientId() == null || schedule.getConsultantId() == null) {
            return false;
        }
        String scheduleType = schedule.getScheduleType();
        return scheduleType == null || "CONSULTATION".equalsIgnoreCase(scheduleType);
    }

    /**
     * 예약 확정·BOOKED 전환 등에서 회기 미차감 일정에 대해 멱등 차감·sessionSequence 저장.
     * 이미 {@code sessionSequence}가 있으면 중복 차감하지 않는다.
     */
    private void deductSessionForScheduleIfNeeded(Schedule schedule) {
        if (!isConsultationScheduleForSessionDeduction(schedule)) {
            return;
        }
        if (schedule.getSessionSequence() != null) {
            log.debug("회기 이미 차감됨(sessionSequence): scheduleId={}", schedule.getId());
            return;
        }
        useSessionForMapping(schedule.getConsultantId(), schedule.getClientId(), schedule);
    }

    private void persistSessionSequenceBeforeDeduction(Schedule schedule, ConsultantClientMapping mapping) {
        if (schedule == null || schedule.getId() == null || mapping == null) {
            return;
        }
        Integer sequence = computeSessionSequenceBeforeDeduction(mapping);
        if (sequence == null) {
            return;
        }
        schedule.setSessionSequence(sequence);
        scheduleRepository.save(schedule);
        log.info("예약 시점 회차 저장: scheduleId={}, sessionSequence={}", schedule.getId(), sequence);
    }

     /**
     * 매칭의 회기 사용 처리
     */
    private void useSessionForMapping(Long consultantId, Long clientId, Schedule scheduleForSequence) {
        log.debug("📅 매칭 회기 사용 처리: 상담사 {}, 내담자 {}", consultantId, clientId);
        String tenantId = TenantContextHolder.getRequiredTenantId();

        Optional<ConsultantClientMapping> mappingOpt = mappingRepository
                .findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(tenantId, consultantId, clientId);
        if (mappingOpt.isEmpty()) {
            List<ConsultantClientMapping> activeMappings = mappingRepository.findByTenantIdAndStatus(
                    tenantId, ConsultantClientMapping.MappingStatus.ACTIVE);
            for (ConsultantClientMapping mapping : activeMappings) {
                if (mappingMatchesConsultantClientPair(mapping, consultantId, clientId)) {
                    mappingOpt = Optional.of(mapping);
                    break;
                }
            }
        }
        if (mappingOpt.isEmpty()) {
            log.warn("회기 차감 대상 매핑 없음: consultantId={}, clientId={}", consultantId, clientId);
            return;
        }

        try {
            Long mappingId = mappingOpt.get().getId();
            ConsultantClientMapping freshMapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                    .orElseThrow(() -> new RuntimeException("매칭을 찾을 수 없습니다: " + mappingId));

            MappingStatus mappingStatus = freshMapping.getStatus();
            if (mappingStatus != MappingStatus.ACTIVE && mappingStatus != MappingStatus.SESSIONS_EXHAUSTED) {
                log.warn("회기 차감 불가 매핑 상태: mappingId={}, status={}", mappingId, mappingStatus);
                return;
            }
            Integer remaining = freshMapping.getRemainingSessions();
            if (remaining == null || remaining <= 0) {
                log.warn("사용 가능한 회기 없음: mappingId={}, remaining={}", mappingId, remaining);
                return;
            }

            log.info("🔍 매칭 상태 확인: mappingId={}, totalSessions={}, usedSessions={}, remainingSessions={}",
                    freshMapping.getId(), freshMapping.getTotalSessions(),
                    freshMapping.getUsedSessions(), freshMapping.getRemainingSessions());

            persistSessionSequenceBeforeDeduction(scheduleForSequence, freshMapping);

            freshMapping.useSession();
            mappingRepository.save(freshMapping);

            try {
                sessionSyncService.syncAfterSessionUsage(mappingId, consultantId, clientId);
                log.info("✅ 회기 사용 후 동기화 완료: mappingId={}", mappingId);
            } catch (Exception syncError) {
                log.error("❌ 회기 사용 후 동기화 실패: mappingId={}, error={}",
                        mappingId, syncError.getMessage(), syncError);
            }

            log.info("✅ 회기 사용 완료: 남은 회기 수 {}", freshMapping.getRemainingSessions());
        } catch (Exception e) {
            log.error("❌ 회기 사용 처리 실패: {}", e.getMessage(), e);
            throw new RuntimeException("회기 사용 처리에 실패했습니다: " + e.getMessage());
        }
    }

    /**
     * 예약 취소 시 매핑 회기 1회 복원 (분쟁 방지)
     */
    private void restoreSessionForMapping(Long consultantId, Long clientId) {
        if (consultantId == null || clientId == null) {
            return;
        }
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            return;
        }
        Optional<ConsultantClientMapping> opt = mappingRepository.findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(tenantId, consultantId, clientId);
        if (opt.isEmpty()) {
            log.warn("⚠️ 회기 복원 대상 매핑 없음: consultantId={}, clientId={}", consultantId, clientId);
            return;
        }
        ConsultantClientMapping mapping = opt.get();
        try {
            mapping.restoreSession();
            mappingRepository.save(mapping);
            log.info("✅ 예약 취소로 회기 1회 복원: mappingId={}, 남은 회기={}", mapping.getId(), mapping.getRemainingSessions());
        } catch (Exception e) {
            log.error("❌ 회기 복원 처리 실패: {}", e.getMessage(), e);
        }
    }

     /**
     * 관리자 역할 여부 확인
     */
    private boolean isAdminRole(String userRole) {
        if (userRole == null) {
            return false;
        }
        try {
            UserRole role = UserRole.fromString(userRole);
            return role != null && role.isAdmin();
        } catch (Exception e) {
            log.warn("역할 확인 실패: {}", userRole, e);
            return false;
        }
    }

    private boolean isStaffRole(String userRole) {
        if (userRole == null) {
            return false;
        }
        try {
            UserRole role = UserRole.fromString(userRole);
            return role != null && role.isStaff();
        } catch (Exception e) {
            log.warn("역할 확인 실패: {}", userRole, e);
            return false;
        }
    }

     /**
     * 상담사 역할 여부 확인
     */
    private boolean isConsultantRole(String userRole) {
        if (userRole == null) {
            return false;
        }
        try {
            UserRole role = UserRole.fromString(userRole);
            return role != null && role.isConsultant();
        } catch (Exception e) {
            log.warn("역할 확인 실패: {}", userRole, e);
            return false;
        }
    }

    private boolean adminCounselingOwnSchedulesOnly(Long userId, String userRole) {
        if (userId == null || userRole == null) {
            return false;
        }
        UserRole r = UserRole.fromString(userRole);
        if (r != UserRole.ADMIN) {
            return false;
        }
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            return false;
        }
        return userRepository.findByTenantIdAndId(tenantId, userId)
                .map(u -> Boolean.TRUE.equals(u.getCounselingEnabled()))
                .orElse(false);
    }

    private boolean scheduleAdminSeesAllTenant(Long userId, String userRole) {
        if (adminCounselingOwnSchedulesOnly(userId, userRole)) {
            return false;
        }
        return isAdminRole(userRole) || isStaffRole(userRole);
    }

    private boolean scheduleUsesConsultantOwnScope(Long userId, String userRole) {
        return isConsultantRole(userRole) || adminCounselingOwnSchedulesOnly(userId, userRole);
    }

     /**
     * 권한 기반 스케줄 조회 (상담사 이름 포함)
     */
    @Override
    public List<ScheduleResponse> findSchedulesWithNamesByUserRole(Long userId, String userRole) {
        log.info("🔐 권한 기반 스케줄 조회 (이름 포함): 사용자 {}, 역할 {}", userId, userRole);
        
        autoCompleteExpiredSchedules();
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<Schedule> schedules;
        if (scheduleAdminSeesAllTenant(userId, userRole)) {
            log.info("👑 관리자 권한으로 모든 스케줄 조회");
            schedules = scheduleRepository.findByTenantId(tenantId);
        } else if (scheduleUsesConsultantOwnScope(userId, userRole)) {
            log.info("👨‍⚕️ 상담사 권한으로 자신의 스케줄만 조회: {}", userId);
            schedules = scheduleRepository.findByTenantIdAndConsultantId(tenantId, userId);
        } else if (getRoleCodeFromCommonCode(UserRole.CLIENT.name()).equals(userRole)) {
            log.info("👤 내담자 권한으로 자신의 스케줄만 조회: {}", userId);
            schedules = scheduleRepository.findByTenantIdAndClientId(tenantId, userId);
        } else {
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }
        
        Map<String, ConsultantClientMapping> mappingLookup = buildActiveOrExhaustedMappingLookup(tenantId);
        List<ScheduleResponse> scheduleDtos = schedules.stream()
            .map(schedule -> convertToScheduleDto(schedule, mappingLookup))
            .collect(java.util.stream.Collectors.toList());
        
        List<ScheduleResponse> vacationDtos = getVacationSchedules(userId, userRole);
        scheduleDtos.addAll(vacationDtos);
        
        log.info("📅 총 스케줄 데이터: 일반 {}개, 휴가 {}개, 합계 {}개", 
                schedules.size(), vacationDtos.size(), scheduleDtos.size());
        
        return scheduleDtos;
    }

     /**
     * 권한 기반 페이지네이션 스케줄 조회 (상담사 이름 포함)
     */
    @Override
    public Page<ScheduleResponse> findSchedulesWithNamesByUserRolePaged(Long userId, String userRole, Pageable pageable) {
        log.info("🔐 권한 기반 페이지네이션 스케줄 조회 (이름 포함): 사용자 {}, 역할 {}, 페이지 {}", userId, userRole, pageable.getPageNumber());
        
        autoCompleteExpiredSchedules();
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        Page<Schedule> schedulePage;
        if (scheduleAdminSeesAllTenant(userId, userRole)) {
            log.info("👑 관리자 권한으로 모든 스케줄 페이지네이션 조회");
            schedulePage = scheduleRepository.findByTenantId(tenantId, pageable);
        } else if (scheduleUsesConsultantOwnScope(userId, userRole)) {
            log.info("👨‍⚕️ 상담사 권한으로 자신의 스케줄만 페이지네이션 조회: {}", userId);
            schedulePage = scheduleRepository.findByTenantIdAndConsultantId(tenantId, userId, pageable);
        } else if (getRoleCodeFromCommonCode(UserRole.CLIENT.name()).equals(userRole)) {
            log.info("👤 내담자 권한으로 자신의 스케줄만 페이지네이션 조회: {}", userId);
            schedulePage = scheduleRepository.findByTenantIdAndClientId(tenantId, userId, pageable);
        } else {
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }

        Map<String, ConsultantClientMapping> mappingLookup = buildActiveOrExhaustedMappingLookup(tenantId);
        return schedulePage.map(schedule -> convertToScheduleDto(schedule, mappingLookup));
    }

    /**
     * {@link #findSchedulesWithNamesByUserRole(Long, String)} 과 동일한 권한 스코프로 단건 접근 가능 여부.
     *
     * @param userId 요청 사용자 PK
     * @param userRole 요청 역할 문자열
     * @param schedule 이미 테넌트로 조회된 스케줄
     * @return 허용이면 true
     */
    @Override
    @Transactional(readOnly = true)
    public boolean canAccessScheduleDetail(Long userId, String userRole, Schedule schedule) {
        if (userId == null || userRole == null || schedule == null) {
            return false;
        }
        if (scheduleAdminSeesAllTenant(userId, userRole)) {
            return true;
        }
        if (scheduleUsesConsultantOwnScope(userId, userRole)) {
            return Objects.equals(schedule.getConsultantId(), userId);
        }
        if (getRoleCodeFromCommonCode(UserRole.CLIENT.name()).equals(userRole)) {
            return Objects.equals(schedule.getClientId(), userId);
        }
        return false;
    }

     /**
     * 휴가 데이터를 ScheduleDto로 변환
     */
    private List<ScheduleResponse> getVacationSchedules(Long userId, String userRole) {
        log.info("🏖️ 휴가 스케줄 조회: 사용자 {}, 역할 {}", userId, userRole);
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<Vacation> vacations;
        if (scheduleAdminSeesAllTenant(userId, userRole)) {
            // 표준화 2025-12-06: 테넌트 필터링 필수
            vacations = vacationRepository.findByTenantIdAndIsDeletedFalseOrderByVacationDateAsc(tenantId);
        } else if (scheduleUsesConsultantOwnScope(userId, userRole)) {
            // 표준화 2025-12-06: 테넌트 필터링 필수
            vacations = vacationRepository.findByTenantIdAndConsultantIdAndIsDeletedFalseOrderByVacationDateAsc(tenantId, userId);
        } else {
            return new ArrayList<>();
        }
        
        return vacations.stream()
            .map(this::convertVacationToScheduleDto)
            .collect(java.util.stream.Collectors.toList());
    }
    
     /**
     * Vacation 엔티티를 ScheduleDto로 변환
     */
    private ScheduleResponse convertVacationToScheduleDto(Vacation vacation) {
        ScheduleResponse request = new ScheduleResponse();
        request.setId(vacation.getId() + 100000L); // 휴가 ID는 100000 이상으로 설정하여 구분
        request.setConsultantId(vacation.getConsultantId());
        request.setClientId(null); // 휴가는 내담자 없음
        request.setDate(vacation.getVacationDate());
        request.setStartTime(vacation.getStartTime() != null ? vacation.getStartTime() : LocalTime.of(0, 0));
        request.setEndTime(vacation.getEndTime() != null ? vacation.getEndTime() : LocalTime.of(23, 59));
        request.setStatus(ScheduleStatus.VACATION.name()); // 휴가 상태
        request.setScheduleType("VACATION");
        request.setConsultationType("VACATION");
        request.setVacationType(vacation.getVacationType().name()); // 휴가 유형 추가
        request.setDescription(vacation.getReason());
        request.setCreatedAt(vacation.getCreatedAt());
        request.setUpdatedAt(vacation.getUpdatedAt());
        
        User consultant = findUserByTenantContext(vacation.getTenantId(), vacation.getConsultantId()).orElse(null);
        if (consultant != null) {
            request.setConsultantName(consultant.getName());
        }
        
        String vacationTitle = getVacationTitle(vacation);
        request.setTitle(vacationTitle);
        
        return request;
    }
    
     /**
     * 휴가 제목 생성
     */
    private String getVacationTitle(Vacation vacation) {
        String consultantName = "";
        User consultant = findUserByTenantContext(vacation.getTenantId(), vacation.getConsultantId()).orElse(null);
        if (consultant != null) {
            consultantName = consultant.getName();
        }
        
        String vacationTypeTitle = getVacationTypeTitle(vacation.getVacationType());
        return consultantName + " - " + vacationTypeTitle;
    }
    
     /**
     * 휴가 타입별 제목 반환 (데이터베이스 코드 사용)
     */
    private String getVacationTypeTitle(Vacation.VacationType type) {
        try {
            String codeName = commonCodeService.getCodeName("VACATION_TYPE", type.name());
            if (!codeName.equals(type.name())) {
                return codeName; // 데이터베이스에서 찾은 한글명 반환
            }
        } catch (Exception e) {
            log.warn("휴가 타입 코드 조회 실패: {} -> 기본값 사용", type.name());
        }
        
        switch (type) {
            case MORNING:
                return "🌅 오전 휴가 (09:00-13:00)";
            case MORNING_HALF_DAY:
                return "🌅 오전반차 (09:00-14:00)";
            case MORNING_HALF_1:
                return "🌅 오전 반반차 1 (09:00-11:00)";
            case MORNING_HALF_2:
                return "🌅 오전 반반차 2 (11:00-13:00)";
            case AFTERNOON:
                return "🌆 오후 휴가 (14:00-18:00)";
            case AFTERNOON_HALF_DAY:
                return "🌆 오후반차 (14:00-18:00)";
            case AFTERNOON_HALF_1:
                return "🌆 오후 반반차 1 (14:00-16:00)";
            case AFTERNOON_HALF_2:
                return "🌆 오후 반반차 2 (16:00-18:00)";
            case CUSTOM_TIME:
                return "⏰ 사용자 정의 휴가";
            case ALL_DAY:
            case FULL_DAY:
            default:
                return "🏖️ 하루 종일 휴가";
        }
    }

     /**
     * Schedule 엔티티를 ScheduleDto로 변환 (상담사 이름 포함)
     */
    private ScheduleResponse convertToScheduleDto(Schedule schedule) {
        String tenantId = schedule.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = TenantContextHolder.getTenantId();
        }
        Map<String, ConsultantClientMapping> mappingLookup = buildActiveOrExhaustedMappingLookup(tenantId);
        return convertToScheduleDto(schedule, mappingLookup);
    }

    private ScheduleResponse convertToScheduleDto(
            Schedule schedule,
            Map<String, ConsultantClientMapping> mappingLookup) {
        String consultantName = "알 수 없음";
        String consultantProfessionalProviderTypeCode = null;
        String consultantProfileImageUrl = null;
        String clientName = "알 수 없음";
        String clientProfileImageUrl = null;
        
        log.info("🔍 스케줄 변환 시작: scheduleId={}, consultantId={}, clientId={}", 
                schedule.getId(), schedule.getConsultantId(), schedule.getClientId());
        
        try {
            User consultant = findUserByTenantContext(schedule.getTenantId(), schedule.getConsultantId()).orElse(null);
            log.info("👤 상담사 조회 결과: consultant={}, isActive={}", 
                    consultant != null ? consultant.getName() : "null", 
                    consultant != null ? consultant.getIsActive() : "null");
            
            if (consultant != null && consultant.getIsActive()) {
                consultantName = scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(consultant);
                consultantProfileImageUrl = nullableUserProfileImageUrl(consultant);
            } else if (consultant != null && !consultant.getIsActive()) {
                consultantName = scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(consultant) + " (비활성)";
                consultantProfileImageUrl = nullableUserProfileImageUrl(consultant);
            }
            if (consultant != null) {
                consultantProfessionalProviderTypeCode = resolveProfessionalProviderTypeCode(consultant);
            }
            
            if (schedule.getClientId() != null) {
                User client = findUserByTenantContext(schedule.getTenantId(), schedule.getClientId()).orElse(null);
                log.info("👥 내담자 조회 결과: client={}, isActive={}", 
                        client != null ? client.getName() : "null", 
                        client != null ? client.getIsActive() : "null");
                
                if (client != null) {
                    clientProfileImageUrl = nullableUserProfileImageUrl(client);
                    if (client.getIsActive()) {
                        clientName = scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(client);
                    } else {
                        clientName = scheduleListUserFieldsResolver.resolveDisplayNameForScheduleList(client) + " (비활성)";
                    }
                }
            }
        } catch (Exception e) {
            log.warn("상담사/클라이언트 정보 조회 실패: {}", e.getMessage());
        }
        
        log.info("✅ 최종 변환 결과: consultantName={}, clientName={}", consultantName, clientName);

        String tenantId = schedule.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            tenantId = TenantContextHolder.getTenantId();
        }
        ConsultantClientMapping mapping = resolveActiveOrExhaustedMapping(
                tenantId, schedule.getConsultantId(), schedule.getClientId(), mappingLookup);
        Long mappingId = mapping != null ? mapping.getId() : null;
        Integer totalSessions = mapping != null ? mapping.getTotalSessions() : null;
        Integer remainingSessions = mapping != null ? mapping.getRemainingSessions() : null;
        
        return ScheduleResponse.builder()
            .id(schedule.getId())
            .consultantId(schedule.getConsultantId())
            .consultantName(consultantName)
            .consultantProfessionalProviderTypeCode(consultantProfessionalProviderTypeCode)
            .consultantProfileImageUrl(consultantProfileImageUrl)
            .clientId(schedule.getClientId())
            .clientName(clientName)
            .clientProfileImageUrl(clientProfileImageUrl)
            .date(schedule.getDate())
            .startTime(schedule.getStartTime())
            .endTime(schedule.getEndTime())
            .status(schedule.getStatus().name())
            .scheduleType(convertScheduleTypeToKorean(schedule.getScheduleType()))
            .consultationType(convertConsultationTypeToKorean(schedule.getConsultationType()))
            .title(schedule.getTitle())
            .description(schedule.getDescription())
            .notes(schedule.getNotes())
            .createdAt(schedule.getCreatedAt())
            .updatedAt(schedule.getUpdatedAt())
            .mappingId(mappingId)
            .totalSessions(totalSessions)
            .remainingSessions(remainingSessions)
            .sessionSequence(schedule.getSessionSequence())
            .build();
    }

    private static String mappingLookupKey(Long consultantId, Long clientId) {
        return consultantId + ":" + clientId;
    }

    private Map<String, ConsultantClientMapping> buildActiveOrExhaustedMappingLookup(String tenantId) {
        if (tenantId == null || tenantId.isEmpty()) {
            return Map.of();
        }
        List<ConsultantClientMapping> mappings =
                mappingRepository.findActiveOrExhaustedByTenantId(tenantId);
        Map<String, ConsultantClientMapping> lookup = new HashMap<>();
        for (ConsultantClientMapping mapping : mappings) {
            if (mapping.getConsultant() == null || mapping.getClient() == null) {
                continue;
            }
            Long consultantId = mapping.getConsultant().getId();
            Long clientId = mapping.getClient().getId();
            if (consultantId == null || clientId == null) {
                continue;
            }
            String key = mappingLookupKey(consultantId, clientId);
            lookup.merge(key, mapping, ScheduleServiceImpl::preferActiveMapping);
        }
        return lookup;
    }

    private ConsultantClientMapping resolveActiveOrExhaustedMapping(
            String tenantId,
            Long consultantId,
            Long clientId,
            Map<String, ConsultantClientMapping> mappingLookup) {
        if (consultantId == null || clientId == null || tenantId == null || tenantId.isEmpty()) {
            return null;
        }
        if (mappingLookup != null && !mappingLookup.isEmpty()) {
            return mappingLookup.get(mappingLookupKey(consultantId, clientId));
        }
        return mappingRepository
                .findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(tenantId, consultantId, clientId)
                .orElse(null);
    }

    private static ConsultantClientMapping preferActiveMapping(
            ConsultantClientMapping existing,
            ConsultantClientMapping incoming) {
        if (existing.getStatus() == MappingStatus.ACTIVE) {
            return existing;
        }
        if (incoming.getStatus() == MappingStatus.ACTIVE) {
            return incoming;
        }
        return existing;
    }

    private static String nullableUserProfileImageUrl(User user) {
        if (user == null || user.getProfileImageUrl() == null) {
            return null;
        }
        String url = user.getProfileImageUrl().trim();
        return url.isEmpty() ? null : url;
    }

    /**
     * 사용자의 역할(UserRole)로부터 전문가 유형 코드를 유추합니다.
     * DB에 professionalProviderTypeCode가 설정되지 않은 레거시 데이터에 대한 fallback.
     *
     * @param user 대상 사용자
     * @return 유추된 전문가 유형 코드, 유추 불가 시 null
     */
    private String resolveProfessionalProviderTypeCode(User user) {
        if (user == null) {
            return null;
        }
        String code = user.getProfessionalProviderTypeCode();
        if (code != null && !code.trim().isEmpty()) {
            return code;
        }
        UserRole role = user.getRole();
        if (role == null) {
            return null;
        }
        switch (role) {
            case CONSULTANT:
                return ProfessionalProviderTypeConstants.DEFAULT_TYPE_CODE_VALUE;
            case PLAY_THERAPIST:
                return ProfessionalProviderTypeConstants.LEGACY_PLAY_TYPE_CODE_VALUE;
            case SPEECH_THERAPIST:
                return ProfessionalProviderTypeConstants.LEGACY_SPEECH_TYPE_CODE_VALUE;
            default:
                return null;
        }
    }

     /**
     * 상태값을 한글로 변환 (데이터베이스 기반)
     */
    private String convertStatusToKorean(String status) {
        if (status == null) return "알 수 없음";
        
        try {
            return commonCodeService.getCodeName("STATUS", status);
        } catch (Exception e) {
            log.warn("상태값 변환 실패: {} -> 기본값 사용", status);
            return status;
        }
    }

     /**
     * 스케줄 타입을 한글로 변환 (데이터베이스 기반)
     */
    private String convertScheduleTypeToKorean(String scheduleType) {
        if (scheduleType == null) return "알 수 없음";
        
        try {
            return commonCodeService.getCodeName("SCHEDULE_TYPE", scheduleType);
        } catch (Exception e) {
            log.warn("스케줄 타입 변환 실패: {} -> 기본값 사용", scheduleType);
            return scheduleType;
        }
    }

     /**
     * 상담 유형을 한글로 변환 (데이터베이스 기반)
     */
    private String convertConsultationTypeToKorean(String consultationType) {
        if (consultationType == null) return "알 수 없음";
        
        try {
            return commonCodeService.getCodeName("CONSULTATION_TYPE", consultationType);
        } catch (Exception e) {
            log.warn("상담 유형 변환 실패: {} -> 기본값 사용", consultationType);
            return consultationType;
        }
    }


     /**
     * 시간이 지난 확정된 스케줄을 자동으로 완료 처리
     */
    @Override
    @Transactional
    public void autoCompleteExpiredSchedules() {
        log.info("🔄 시간이 지난 스케줄 자동 완료 처리 시작");
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();
        
        int completedCount = 0;
        
        try {
            List<Schedule> todayExpiredSchedules = scheduleRepository.findExpiredConfirmedSchedules(tenantId, today, currentTime);
            
            for (Schedule schedule : todayExpiredSchedules) {
                try {
                    Schedule latestSchedule = scheduleRepository.findByTenantIdAndId(tenantId, schedule.getId()).orElse(null);
                    if (latestSchedule != null && ScheduleStatus.CONFIRMED.equals(latestSchedule.getStatus())) {
                        boolean hasRecord = consultationRecordRepository.existsByTenantIdAndConsultationIdAndIsDeletedFalse(tenantId, latestSchedule.getId());
                        if (hasRecord) {
                            latestSchedule.setStatus(ScheduleStatus.COMPLETED);
                            latestSchedule.setUpdatedAt(LocalDateTime.now());
                            scheduleRepository.save(latestSchedule);
                            completedCount++;
                            log.info("✅ 오늘 확정 스케줄 자동 완료: ID={}, 제목={}, 시간={}", 
                                latestSchedule.getId(), latestSchedule.getTitle(), latestSchedule.getStartTime());
                        } else {
                            try {
                                plSqlScheduleValidationService.createConsultationRecordReminder(
                                    latestSchedule.getId(), latestSchedule.getConsultantId(), latestSchedule.getClientId(),
                                    latestSchedule.getDate(), "상담일지 누락 안내");
                            } catch (Exception e) { log.warn("상담일지 리마인더 생성 실패: {}", e.getMessage()); }
                        }
                    }
                } catch (Exception e) {
                    log.error("❌ 오늘 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
                }
            }
            
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            List<Schedule> pastBookedSchedules = scheduleRepository.findByDateBeforeAndStatus(tenantId, today, ScheduleStatus.BOOKED);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            List<Schedule> pastConfirmedSchedules = scheduleRepository.findByDateBeforeAndStatus(tenantId, today, ScheduleStatus.CONFIRMED);
            
            for (Schedule schedule : pastBookedSchedules) {
                try {
                    Schedule latestSchedule = scheduleRepository.findByTenantIdAndId(tenantId, schedule.getId()).orElse(null);
                    if (latestSchedule != null && ScheduleStatus.BOOKED.equals(latestSchedule.getStatus())) {
                        boolean hasRecord = consultationRecordRepository.existsByTenantIdAndConsultationIdAndIsDeletedFalse(tenantId, latestSchedule.getId());
                        if (hasRecord) {
                            latestSchedule.setStatus(ScheduleStatus.COMPLETED);
                            latestSchedule.setUpdatedAt(LocalDateTime.now());
                            scheduleRepository.save(latestSchedule);
                            completedCount++;
                            log.info("✅ 지난 예약 스케줄 자동 완료: ID={}, 제목={}, 날짜={}, 시간={}", 
                                latestSchedule.getId(), latestSchedule.getTitle(), latestSchedule.getDate(), latestSchedule.getStartTime());
                        } else {
                            try {
                                plSqlScheduleValidationService.createConsultationRecordReminder(
                                    latestSchedule.getId(), latestSchedule.getConsultantId(), latestSchedule.getClientId(),
                                    latestSchedule.getDate(), "상담일지 누락 안내");
                            } catch (Exception e) { log.warn("상담일지 리마인더 생성 실패: {}", e.getMessage()); }
                        }
                    }
                } catch (Exception e) {
                    log.error("❌ 지난 예약 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
                }
            }
            
            for (Schedule schedule : pastConfirmedSchedules) {
                try {
                    Schedule latestSchedule = scheduleRepository.findByTenantIdAndId(tenantId, schedule.getId()).orElse(null);
                    if (latestSchedule != null && ScheduleStatus.CONFIRMED.equals(latestSchedule.getStatus())) {
                        boolean hasRecord = consultationRecordRepository.existsByTenantIdAndConsultationIdAndIsDeletedFalse(tenantId, latestSchedule.getId());
                        if (hasRecord) {
                            latestSchedule.setStatus(ScheduleStatus.COMPLETED);
                            latestSchedule.setUpdatedAt(LocalDateTime.now());
                            scheduleRepository.save(latestSchedule);
                            completedCount++;
                            log.info("✅ 지난 확정 스케줄 자동 완료: ID={}, 제목={}, 날짜={}, 시간={}", 
                                latestSchedule.getId(), latestSchedule.getTitle(), latestSchedule.getDate(), latestSchedule.getStartTime());
                        } else {
                            try {
                                plSqlScheduleValidationService.createConsultationRecordReminder(
                                    latestSchedule.getId(), latestSchedule.getConsultantId(), latestSchedule.getClientId(),
                                    latestSchedule.getDate(), "상담일지 누락 안내");
                            } catch (Exception e) { log.warn("상담일지 리마인더 생성 실패: {}", e.getMessage()); }
                        }
                    }
                } catch (Exception e) {
                    log.error("❌ 지난 확정 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
                }
            }
            
            List<Schedule> pastInProgressSchedules = scheduleRepository.findByDateBeforeAndStatus(
                    tenantId, today, ScheduleStatus.IN_PROGRESS);
            for (Schedule schedule : pastInProgressSchedules) {
                try {
                    Schedule latestSchedule = scheduleRepository.findByTenantIdAndId(tenantId, schedule.getId()).orElse(null);
                    if (latestSchedule != null && ScheduleStatus.IN_PROGRESS.equals(latestSchedule.getStatus())) {
                        boolean hasRecord = consultationRecordRepository.existsByTenantIdAndConsultationIdAndIsDeletedFalse(tenantId, latestSchedule.getId());
                        if (hasRecord) {
                            latestSchedule.setStatus(ScheduleStatus.COMPLETED);
                            latestSchedule.setUpdatedAt(LocalDateTime.now());
                            scheduleRepository.save(latestSchedule);
                            completedCount++;
                            log.info("✅ 지난 진행중 스케줄 자동 완료: ID={}, 제목={}, 날짜={}, 시간={}",
                                    latestSchedule.getId(), latestSchedule.getTitle(), latestSchedule.getDate(), latestSchedule.getStartTime());
                        } else {
                            try {
                                plSqlScheduleValidationService.createConsultationRecordReminder(
                                        latestSchedule.getId(), latestSchedule.getConsultantId(), latestSchedule.getClientId(),
                                        latestSchedule.getDate(), "상담일지 누락 안내");
                            } catch (Exception e) {
                                log.warn("상담일지 리마인더 생성 실패: {}", e.getMessage());
                            }
                        }
                    }
                } catch (Exception e) {
                    log.error("❌ 지난 진행중 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
                }
            }
            
        } catch (Exception e) {
            log.error("❌ 자동 완료 처리 중 오류 발생: {}", e.getMessage(), e);
        }
        
        log.info("🔄 자동 완료 처리 완료: {}개 스케줄 처리됨", completedCount);
    }

     /**
     * 특정 스케줄이 시간이 지났는지 확인
     */
    @Override
    public boolean isScheduleExpired(Schedule schedule) {
        if (schedule == null || !ScheduleStatus.CONFIRMED.name().equals(schedule.getStatus())) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();
        
        return today.equals(schedule.getDate()) && currentTime.isAfter(schedule.getEndTime());
    }

     /**
     * 스케줄 상태를 한글로 변환 (공개 메서드)
     */
    @Override
    public String getStatusInKorean(String status) {
        return convertStatusToKorean(status);
    }

     /**
     * 스케줄 타입을 한글로 변환 (공개 메서드)
     */
    @Override
    public String getScheduleTypeInKorean(String scheduleType) {
        return convertScheduleTypeToKorean(scheduleType);
    }

     /**
     * 상담 유형을 한글로 변환 (공개 메서드)
     */
    @Override
    public String getConsultationTypeInKorean(String consultationType) {
        return convertConsultationTypeToKorean(consultationType);
    }
    
     /**
     * 특정 날짜의 스케줄 조회 (드래그 앤 드롭용) - tenantId 필터링 적용
     */
    @Override
    public List<Schedule> getSchedulesByDate(LocalDate date, Long consultantId) {
        log.info("📅 특정 날짜 스케줄 조회: date={}, consultantId={}", date, consultantId);
        
        try {
            String tenantIdStr = accessControlService.getCurrentTenantId().toString();
            log.info("🔒 tenantId 필터링: {}", tenantIdStr);
            
            if (consultantId != null) {
                log.info("🔒 consultantId 필터링: {}", consultantId);
                return scheduleRepository.findByTenantIdAndDateAndConsultantIdAndIsDeletedFalse(tenantIdStr, date, consultantId);
            } else {
                return scheduleRepository.findByTenantIdAndDateAndIsDeletedFalse(tenantIdStr, date);
            }
        } catch (Exception e) {
            log.error("❌ 특정 날짜 스케줄 조회 실패: date={}, consultantId={}, error={}", 
                date, consultantId, e.getMessage(), e);
            return new ArrayList<>();
        }
    }
    
    
    @Override
    public List<Schedule> getBranchSchedules(Long branchId, LocalDate startDate, LocalDate endDate) {
        log.info("🏢 지점별 스케줄 조회: branchId={}, startDate={}, endDate={}", branchId, startDate, endDate);
        
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return new ArrayList<>();
            }
            Branch branch = branchRepository.findByTenantIdAndId(tenantId, branchId)
                .orElseThrow(() -> new IllegalArgumentException("지점을 찾을 수 없습니다: " + branchId));
            
            List<User> consultants = userRepository.findByBranchAndRolesInAndIsDeletedFalseOrderByUserId(
                tenantId, branch, UserRole.getProfessionalProviderRoles());
            if (consultants.isEmpty()) {
                log.warn("지점에 상담사가 없습니다: branchId={}", branchId);
                return new ArrayList<>();
            }
            
            List<Schedule> allSchedules = new ArrayList<>();
            for (User consultant : consultants) {
                List<Schedule> consultantSchedules = scheduleRepository.findByConsultantIdAndDateBetween(
                    consultant.getId(), startDate, endDate);
                allSchedules.addAll(consultantSchedules);
            }
            
            log.info("지점별 스케줄 조회 완료: branchId={}, 상담사 수={}, 스케줄 수={}", 
                    branchId, consultants.size(), allSchedules.size());
            
            return allSchedules;
            
        } catch (Exception e) {
            log.error("지점별 스케줄 조회 실패: branchId={}, error={}", branchId, e.getMessage(), e);
            throw new RuntimeException("지점별 스케줄 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public List<Schedule> getBranchConsultantSchedules(Long branchId, Long consultantId, LocalDate startDate, LocalDate endDate) {
        log.info("🏢 지점별 상담사 스케줄 조회: branchId={}, consultantId={}, startDate={}, endDate={}", 
                branchId, consultantId, startDate, endDate);
        
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                throw new IllegalArgumentException("tenantId가 설정되지 않았습니다");
            }
            User consultant = userRepository.findByTenantIdAndId(tenantId, consultantId)
                .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + consultantId));
            
            if (consultant.getBranch() == null || !consultant.getBranch().getId().equals(branchId)) {
                throw new IllegalArgumentException("상담사가 해당 지점에 속하지 않습니다: consultantId=" + consultantId + ", branchId=" + branchId);
            }
            
            List<Schedule> schedules = scheduleRepository.findByConsultantIdAndDateBetween(consultantId, startDate, endDate);
            
            log.info("지점별 상담사 스케줄 조회 완료: branchId={}, consultantId={}, 스케줄 수={}", 
                    branchId, consultantId, schedules.size());
            
            return schedules;
            
        } catch (Exception e) {
            log.error("지점별 상담사 스케줄 조회 실패: branchId={}, consultantId={}, error={}", 
                    branchId, consultantId, e.getMessage(), e);
            throw new RuntimeException("지점별 상담사 스케줄 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public Map<String, Object> getBranchScheduleStatistics(Long branchId, LocalDate startDate, LocalDate endDate) {
        log.info("📊 지점별 스케줄 통계 조회: branchId={}, startDate={}, endDate={}", branchId, startDate, endDate);
        
        try {
            List<Schedule> schedules = getBranchSchedules(branchId, startDate, endDate);
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("branchId", branchId);
            statistics.put("startDate", startDate);
            statistics.put("endDate", endDate);
            statistics.put("totalSchedules", schedules.size());
            
            long completedCount = schedules.stream()
                .filter(s -> "완료".equals(s.getStatus()))
                .count();
            long pendingCount = schedules.stream()
                .filter(s -> "대기".equals(s.getStatus()))
                .count();
            long cancelledCount = schedules.stream()
                .filter(s -> "취소".equals(s.getStatus()))
                .count();
            
            statistics.put("completedSchedules", completedCount);
            statistics.put("pendingSchedules", pendingCount);
            statistics.put("cancelledSchedules", cancelledCount);
            
            Map<Long, Long> consultantStats = schedules.stream()
                .collect(Collectors.groupingBy(
                    Schedule::getConsultantId,
                    Collectors.counting()
                ));
            statistics.put("consultantStatistics", consultantStats);
            
            log.info("지점별 스케줄 통계 완료: branchId={}, 총 스케줄={}, 완료={}, 대기={}, 취소={}", 
                    branchId, schedules.size(), completedCount, pendingCount, cancelledCount);
            
            return statistics;
            
        } catch (Exception e) {
            log.error("지점별 스케줄 통계 조회 실패: branchId={}, error={}", branchId, e.getMessage(), e);
            throw new RuntimeException("지점별 스케줄 통계 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public Map<String, Object> getBranchConsultantScheduleStatus(Long branchId, LocalDate date) {
        log.info("📅 지점별 상담사 스케줄 현황 조회: branchId={}, date={}", branchId, date);
        
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return new HashMap<>();
            }
            Branch branch = branchRepository.findByTenantIdAndId(tenantId, branchId)
                .orElseThrow(() -> new IllegalArgumentException("지점을 찾을 수 없습니다: " + branchId));
            
            List<User> consultants = userRepository.findByBranchAndRolesInAndIsDeletedFalseOrderByUserId(
                tenantId, branch, UserRole.getProfessionalProviderRoles());
            
            Map<String, Object> status = new HashMap<>();
            status.put("branchId", branchId);
            status.put("date", date);
            status.put("totalConsultants", consultants.size());
            
            List<Map<String, Object>> consultantStatus = new ArrayList<>();
            for (User consultant : consultants) {
                List<Schedule> daySchedules = scheduleRepository.findByConsultantIdAndDate(consultant.getId(), date);
                
                Map<String, Object> consultantInfo = new HashMap<>();
                consultantInfo.put("consultantId", consultant.getId());
                consultantInfo.put("consultantName", consultant.getUserId());
                consultantInfo.put("scheduleCount", daySchedules.size());
                consultantInfo.put("schedules", daySchedules);
                
                consultantStatus.add(consultantInfo);
            }
            
            status.put("consultantStatus", consultantStatus);
            
            log.info("지점별 상담사 스케줄 현황 완료: branchId={}, 상담사 수={}", branchId, consultants.size());
            
            return status;
            
        } catch (Exception e) {
            log.error("지점별 상담사 스케줄 현황 조회 실패: branchId={}, error={}", branchId, e.getMessage(), e);
            throw new RuntimeException("지점별 상담사 스케줄 현황 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public Schedule createBranchSchedule(Long branchId, Schedule schedule) {
        log.info("🏢 지점별 스케줄 생성: branchId={}, schedule={}", branchId, schedule.getTitle());
        
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                throw new IllegalArgumentException("tenantId가 설정되지 않았습니다");
            }
            if (schedule.getConsultantId() != null) {
                User consultant = userRepository.findByTenantIdAndId(tenantId, schedule.getConsultantId())
                    .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + schedule.getConsultantId()));
                
                if (consultant.getBranch() == null || !consultant.getBranch().getId().equals(branchId)) {
                    throw new IllegalArgumentException("상담사가 해당 지점에 속하지 않습니다: consultantId=" + schedule.getConsultantId() + ", branchId=" + branchId);
                }
            }
            
            Schedule savedSchedule = scheduleRepository.save(schedule);
            
            log.info("지점별 스케줄 생성 완료: branchId={}, scheduleId={}", branchId, savedSchedule.getId());
            
            return savedSchedule;
            
        } catch (Exception e) {
            log.error("지점별 스케줄 생성 실패: branchId={}, error={}", branchId, e.getMessage(), e);
            throw new RuntimeException("지점별 스케줄 생성 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public Schedule updateBranchSchedule(Long branchId, Long scheduleId, Schedule schedule) {
        log.info("🏢 지점별 스케줄 수정: branchId={}, scheduleId={}", branchId, scheduleId);
        
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                throw new IllegalArgumentException("tenantId가 설정되지 않았습니다");
            }
            Schedule existingSchedule = scheduleRepository.findByTenantIdAndId(tenantId, scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("스케줄을 찾을 수 없습니다: " + scheduleId));
            
            if (existingSchedule.getConsultantId() != null) {
                User consultant = userRepository.findByTenantIdAndId(tenantId, existingSchedule.getConsultantId())
                    .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + existingSchedule.getConsultantId()));
                
                if (consultant.getBranch() == null || !consultant.getBranch().getId().equals(branchId)) {
                    throw new IllegalArgumentException("상담사가 해당 지점에 속하지 않습니다: consultantId=" + existingSchedule.getConsultantId() + ", branchId=" + branchId);
                }
            }
            
            Schedule updatedSchedule = updateSchedule(scheduleId, schedule);
            
            log.info("지점별 스케줄 수정 완료: branchId={}, scheduleId={}", branchId, scheduleId);
            
            return updatedSchedule;
            
        } catch (Exception e) {
            log.error("지점별 스케줄 수정 실패: branchId={}, scheduleId={}, error={}", branchId, scheduleId, e.getMessage(), e);
            throw new RuntimeException("지점별 스케줄 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public void deleteBranchSchedule(Long branchId, Long scheduleId) {
        log.info("🏢 지점별 스케줄 삭제: branchId={}, scheduleId={}", branchId, scheduleId);
        
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                throw new IllegalArgumentException("tenantId가 설정되지 않았습니다");
            }
            Schedule existingSchedule = scheduleRepository.findByTenantIdAndId(tenantId, scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("스케줄을 찾을 수 없습니다: " + scheduleId));
            
            if (existingSchedule.getConsultantId() != null) {
                User consultant = userRepository.findByTenantIdAndId(tenantId, existingSchedule.getConsultantId())
                    .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + existingSchedule.getConsultantId()));
                
                if (consultant.getBranch() == null || !consultant.getBranch().getId().equals(branchId)) {
                    throw new IllegalArgumentException("상담사가 해당 지점에 속하지 않습니다: consultantId=" + existingSchedule.getConsultantId() + ", branchId=" + branchId);
                }
            }
            
            scheduleRepository.deleteById(scheduleId);
            
            log.info("지점별 스케줄 삭제 완료: branchId={}, scheduleId={}", branchId, scheduleId);
            
        } catch (Exception e) {
            log.error("지점별 스케줄 삭제 실패: branchId={}, scheduleId={}, error={}", branchId, scheduleId, e.getMessage(), e);
            throw new RuntimeException("지점별 스케줄 삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public boolean isScheduleConflict(Long branchId, Long consultantId, LocalDateTime startTime, LocalDateTime endTime) {
        log.debug("🔍 지점별 스케줄 중복 확인: branchId={}, consultantId={}, startTime={}, endTime={}", 
                branchId, consultantId, startTime, endTime);
        
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                throw new IllegalArgumentException("tenantId가 설정되지 않았습니다");
            }
            User consultant = userRepository.findByTenantIdAndId(tenantId, consultantId)
                .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + consultantId));
            
            if (consultant.getBranch() == null || !consultant.getBranch().getId().equals(branchId)) {
                throw new IllegalArgumentException("상담사가 해당 지점에 속하지 않습니다: consultantId=" + consultantId + ", branchId=" + branchId);
            }
            
            LocalDate date = startTime.toLocalDate();
            List<Schedule> existingSchedules = scheduleRepository.findByConsultantIdAndDate(consultantId, date);
            
            for (Schedule existingSchedule : existingSchedules) {
                if (isTimeOverlap(startTime, endTime, 
                    existingSchedule.getDate().atTime(existingSchedule.getStartTime()),
                    existingSchedule.getDate().atTime(existingSchedule.getEndTime()))) {
                    return true;
                }
            }
            
            return false;
            
        } catch (Exception e) {
            log.error("지점별 스케줄 중복 확인 실패: branchId={}, consultantId={}, error={}", 
                    branchId, consultantId, e.getMessage(), e);
            throw new RuntimeException("지점별 스케줄 중복 확인 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public List<Map<String, Object>> getAvailableTimeSlots(Long branchId, Long consultantId, LocalDate date) {
        log.info("⏰ 지점별 스케줄 가능 시간 조회: branchId={}, consultantId={}, date={}", branchId, consultantId, date);
        
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                throw new IllegalArgumentException("tenantId가 설정되지 않았습니다");
            }
            User consultant = userRepository.findByTenantIdAndId(tenantId, consultantId)
                .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + consultantId));
            
            if (consultant.getBranch() == null || !consultant.getBranch().getId().equals(branchId)) {
                throw new IllegalArgumentException("상담사가 해당 지점에 속하지 않습니다: consultantId=" + consultantId + ", branchId=" + branchId);
            }
            
            List<Schedule> existingSchedules = scheduleRepository.findByConsultantIdAndDate(consultantId, date);
            
            List<Map<String, Object>> availableSlots = new ArrayList<>();
            LocalTime startHour = LocalTime.of(10, 0);
            LocalTime endHour = LocalTime.of(20, 0);
            
            for (LocalTime time = startHour; time.isBefore(endHour); time = time.plusHours(1)) {
                LocalTime slotEnd = time.plusHours(1);
                LocalDateTime slotStart = date.atTime(time);
                LocalDateTime slotEndDateTime = date.atTime(slotEnd);
                
                boolean isConflict = false;
                for (Schedule existingSchedule : existingSchedules) {
                    if (isTimeOverlap(slotStart, slotEndDateTime,
                        existingSchedule.getDate().atTime(existingSchedule.getStartTime()),
                        existingSchedule.getDate().atTime(existingSchedule.getEndTime()))) {
                        isConflict = true;
                        break;
                    }
                }
                
                if (!isConflict) {
                    Map<String, Object> slot = new HashMap<>();
                    slot.put("startTime", time.toString());
                    slot.put("endTime", slotEnd.toString());
                    slot.put("available", true);
                    availableSlots.add(slot);
                }
            }
            
            log.info("지점별 스케줄 가능 시간 조회 완료: branchId={}, consultantId={}, 가능한 시간대={}개", 
                    branchId, consultantId, availableSlots.size());
            
            return availableSlots;
            
        } catch (Exception e) {
            log.error("지점별 스케줄 가능 시간 조회 실패: branchId={}, consultantId={}, error={}", 
                    branchId, consultantId, e.getMessage(), e);
            throw new RuntimeException("지점별 스케줄 가능 시간 조회 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
     /**
     * 시간대 중복 확인 헬퍼 메서드
     */
    private boolean isTimeOverlap(LocalDateTime start1, LocalDateTime end1, LocalDateTime start2, LocalDateTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }
    
    /**
     * 공통코드에서 역할 코드 조회
     */
    private String getRoleCodeFromCommonCode(String roleName) {
        try {
            String codeValue = commonCodeService.getCodeValue("ROLE", roleName);
            return codeValue != null ? codeValue : roleName;
        } catch (Exception e) {
            return roleName;
        }
    }
    
    /**
     * 공통코드에서 메시지 타입 코드 조회
     */
    private String getMessageTypeFromCommonCode(String messageTypeName) {
        return ConsultationMessageTypeCodes.resolve(
                commonCodeService, messageTypeName, messageTypeName);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ScheduleResponse> getUpcomingSchedules(Long consultantId, LocalDate startDate, LocalDate endDate, Integer limit) {
        log.info("📅 다가오는 상담 조회: consultantId={}, startDate={}, endDate={}, limit={}", 
                consultantId, startDate, endDate, limit);
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("❌ 테넌트 정보 없음 - 다가오는 상담 조회 거부");
            throw new IllegalStateException("테넌트 정보가 없습니다. 로그아웃 후 다시 로그인해 주세요.");
        }
        
        LocalDate actualStartDate = startDate != null ? startDate : LocalDate.now();
        LocalDate actualEndDate = endDate != null ? endDate : actualStartDate.plusDays(7);
        int actualLimit = limit != null && limit > 0 ? limit : 5;
        
        List<Schedule> schedules = scheduleRepository.findByTenantIdAndConsultantIdAndDateBetween(
                tenantId, consultantId, actualStartDate, actualEndDate);
        
        List<ScheduleResponse> responses = schedules.stream()
                .filter(schedule -> schedule.getStatus() == ScheduleStatus.BOOKED
                        || schedule.getStatus() == ScheduleStatus.CONFIRMED
                        || schedule.getStatus() == ScheduleStatus.IN_PROGRESS)
                .sorted((s1, s2) -> {
                    int dateCompare = s1.getDate().compareTo(s2.getDate());
                    if (dateCompare != 0) {
                        return dateCompare;
                    }
                    return s1.getStartTime().compareTo(s2.getStartTime());
                })
                .limit(actualLimit)
                .map(schedule -> {
                    String consultantName = "알 수 없음";
                    String consultantProfessionalProviderTypeCode = null;
                    String clientName = "알 수 없음";
                    
                    try {
                        if (schedule.getConsultantId() != null) {
                            User consultant = userRepository.findByTenantIdAndId(tenantId, schedule.getConsultantId()).orElse(null);
                            if (consultant != null) {
                                Map<String, String> decryptedData = userPersonalDataCacheService.getDecryptedUserData(consultant);
                                if (decryptedData != null && decryptedData.get("name") != null) {
                                    consultantName = decryptedData.get("name");
                                }
                                consultantProfessionalProviderTypeCode = resolveProfessionalProviderTypeCode(consultant);
                            }
                        }
                        
                        if (schedule.getClientId() != null) {
                            User client = userRepository.findByTenantIdAndId(tenantId, schedule.getClientId()).orElse(null);
                            if (client != null) {
                                Map<String, String> decryptedData = userPersonalDataCacheService.getDecryptedUserData(client);
                                if (decryptedData != null && decryptedData.get("name") != null) {
                                    clientName = decryptedData.get("name");
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.warn("⚠️ 사용자 정보 조회 실패: scheduleId={}, error={}", 
                                schedule.getId(), e.getMessage());
                    }
                    
                    String koreanConsultationType = schedule.getConsultationType() != null 
                            ? commonCodeService.getCodeName("CONSULTATION_TYPE", schedule.getConsultationType())
                            : "알 수 없음";
                    
                    return ScheduleResponse.builder()
                            .id(schedule.getId())
                            .consultantId(schedule.getConsultantId())
                            .consultantName(consultantName)
                            .consultantProfessionalProviderTypeCode(consultantProfessionalProviderTypeCode)
                            .clientId(schedule.getClientId())
                            .clientName(clientName)
                            .date(schedule.getDate())
                            .startTime(schedule.getStartTime())
                            .endTime(schedule.getEndTime())
                            .status(schedule.getStatus() != null ? schedule.getStatus().name() : "UNKNOWN")
                            .scheduleType(schedule.getScheduleType())
                            .consultationType(koreanConsultationType)
                            .title(schedule.getTitle())
                            .description(schedule.getDescription())
                            .notes(schedule.getNotes())
                            .consultationId(schedule.getConsultationId())
                            .createdAt(schedule.getCreatedAt())
                            .updatedAt(schedule.getUpdatedAt())
                            .build();
                })
                .collect(Collectors.toList());
        
        log.info("✅ 다가오는 상담 조회 완료: consultantId={}, count={}", consultantId, responses.size());
        return responses;
    }
}
