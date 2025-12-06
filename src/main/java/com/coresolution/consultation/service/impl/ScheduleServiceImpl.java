package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.ConsultationType;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ScheduleResponse;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.Vacation;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.VacationRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.impl.BaseTenantEntityServiceImpl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import java.util.Optional;

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
    private final UserRepository userRepository;
    private final VacationRepository vacationRepository;
    private final BranchRepository branchRepository;
    private final CommonCodeService commonCodeService;
    private final ConsultantAvailabilityService consultantAvailabilityService;
    private final SessionSyncService sessionSyncService;
    private final StatisticsService statisticsService;
    private final ConsultationMessageService consultationMessageService;
    private final com.coresolution.core.service.DashboardIntegrationService dashboardIntegrationService;
    
    public ScheduleServiceImpl(
            ScheduleRepository scheduleRepository,
            TenantAccessControlService accessControlService,
            ConsultantClientMappingRepository mappingRepository,
            UserRepository userRepository,
            VacationRepository vacationRepository,
            BranchRepository branchRepository,
            CommonCodeService commonCodeService,
            ConsultantAvailabilityService consultantAvailabilityService,
            SessionSyncService sessionSyncService,
            StatisticsService statisticsService,
            ConsultationMessageService consultationMessageService,
            com.coresolution.core.service.DashboardIntegrationService dashboardIntegrationService) {
        super(scheduleRepository, accessControlService);
        this.scheduleRepository = scheduleRepository;
        this.mappingRepository = mappingRepository;
        this.userRepository = userRepository;
        this.vacationRepository = vacationRepository;
        this.branchRepository = branchRepository;
        this.commonCodeService = commonCodeService;
        this.consultantAvailabilityService = consultantAvailabilityService;
        this.sessionSyncService = sessionSyncService;
        this.statisticsService = statisticsService;
        this.consultationMessageService = consultationMessageService;
        this.dashboardIntegrationService = dashboardIntegrationService;
    }
    
    
    @Override
    protected Optional<Schedule> findEntityById(Long id) {
        return scheduleRepository.findById(id);
    }
    
    @Override
    protected List<Schedule> findEntitiesByTenantAndBranch(String tenantId, Long branchId) {
        if (branchId != null) {
            return scheduleRepository.findAllByTenantIdAndBranchId(tenantId, branchId);
        } else {
            return scheduleRepository.findAllByTenantId(tenantId);
        }
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
        
        try {
            log.info("🔔 예약 생성 후 자동 알림 발송: scheduleId={}", createdSchedule.getId());
            
            String clientMessage = String.format("상담 예약이 완료되었습니다.\n" +
                "📅 날짜: %s\n" +
                "⏰ 시간: %s - %s", 
                schedule.getDate(), 
                schedule.getStartTime(), 
                schedule.getEndTime()
            );
            
            consultationMessageService.sendMessage(
                schedule.getClientId(), 
                schedule.getConsultantId(), 
                null, // consultationId
                getRoleCodeFromCommonCode(UserRole.CLIENT.name()), 
                "예약 확인", 
                clientMessage,
                getMessageTypeFromCommonCode("APPOINTMENT_CONFIRMATION"),
                false, // isImportant
                false  // isUrgent
            );
            
            String consultantMessage = String.format("새로운 상담 예약이 있습니다.\n" +
                "📅 날짜: %s\n" +
                "⏰ 시간: %s - %s", 
                schedule.getDate(), 
                schedule.getStartTime(), 
                schedule.getEndTime()
            );
            
            consultationMessageService.sendMessage(
                schedule.getConsultantId(), 
                schedule.getClientId(), 
                null, // consultationId
                getRoleCodeFromCommonCode(UserRole.CONSULTANT.name()), 
                "새 예약", 
                consultantMessage,
                getMessageTypeFromCommonCode("NEW_APPOINTMENT"),
                false, // isImportant
                false  // isUrgent
            );
            
            log.info("✅ 예약 생성 워크플로우 자동화 완료: scheduleId={}", createdSchedule.getId());
            
        } catch (Exception e) {
            log.error("❌ 예약 생성 워크플로우 자동화 실패: scheduleId={}", createdSchedule.getId(), e);
        }
        
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
        
        copyScheduleFields(updateData, existingSchedule);
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null && existingSchedule.getTenantId() != null) {
            return update(tenantId, existingSchedule);
        } else {
            return scheduleRepository.save(existingSchedule);
        }
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
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("스케줄을 찾을 수 없습니다: " + id));
    }

    @Override
    public List<Schedule> findAll() {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return findAllByTenant(tenantId, null);
        }
        return scheduleRepository.findAllActiveByCurrentTenant();
    }

    @Override
    public org.springframework.data.domain.Page<Schedule> findAll(org.springframework.data.domain.Pageable pageable) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId != null) {
            return scheduleRepository.findAllByTenantId(tenantId, pageable);
        }
        return scheduleRepository.findAll(pageable);
    }


    @Override
    public Schedule createConsultantSchedule(Long consultantId, Long clientId, LocalDate date, 
                                          LocalTime startTime, LocalTime endTime, String title, String description) {
        log.info("📅 상담사 스케줄 생성: 상담사 {}, 내담자 {}, 날짜 {}", consultantId, clientId, date);
        
        
        
        if (hasTimeConflict(consultantId, date, startTime, endTime, null)) {
            throw new RuntimeException("해당 시간대에 이미 스케줄이 존재합니다.");
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
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        schedule.setStatus(ScheduleStatus.BOOKED);
        
        Schedule savedSchedule = scheduleRepository.save(schedule);
        
        useSessionForMapping(consultantId, clientId);
        
        log.info("✅ 상담사 스케줄 생성 완료: ID {}", savedSchedule.getId());
        return savedSchedule;
    }

    /**
     * 상담사 스케줄 생성
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    public Schedule createConsultantSchedule(Long consultantId, Long clientId, LocalDate date, 
                                          LocalTime startTime, LocalTime endTime, String title, String description, String consultationType, String branchCode) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        log.info("📅 상담사 스케줄 생성 (상담유형 포함): 상담사 {}, 내담자 {}, 날짜 {}, 상담유형 {}, tenantId={}", consultantId, clientId, date, consultationType, tenantId);
        
        
        
        if (hasTimeConflict(consultantId, date, startTime, endTime, null)) {
            throw new RuntimeException("해당 시간대에 이미 스케줄이 존재합니다.");
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
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setConsultationType(consultationType); // 상담 유형 설정
        schedule.setBranchCode(null); // 표준화 2025-12-06: branchCode는 더 이상 사용하지 않음
        
        Schedule savedSchedule = scheduleRepository.save(schedule);
        
        useSessionForMapping(consultantId, clientId);
        
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
        
        useSessionForMapping(consultantId, clientId);
        
        log.info("✅ 상담사 스케줄 생성 완료 (유형 기반): ID {}, 상담 유형: {}, 시간: {} - {}", 
                savedSchedule.getId(), consultationType.getDisplayName(), startTime, endTime);
        return savedSchedule;
    }

    @Override
    public List<Schedule> findByConsultantId(Long consultantId) {
        autoCompleteExpiredSchedules();
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        return scheduleRepository.findByTenantIdAndConsultantId(tenantId, consultantId);
    }

    @Override
    public List<Schedule> findByConsultantIdAndDate(Long consultantId, LocalDate date) {
        autoCompleteExpiredSchedules();
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
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
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        return scheduleRepository.findByTenantIdAndClientId(tenantId, clientId);
    }

    @Override
    public List<Schedule> findByClientIdAndDate(Long clientId, LocalDate date) {
        autoCompleteExpiredSchedules();
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
        return scheduleRepository.findByTenantIdAndClientIdAndDate(tenantId, clientId, date);
    }

    @Override
    public List<Schedule> findByClientIdAndDateBetween(Long clientId, LocalDate startDate, LocalDate endDate) {
        autoCompleteExpiredSchedules();
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new ArrayList<>();
        }
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
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        schedule.setStatus(ScheduleStatus.CANCELLED);
        schedule.setDescription(reason);
        return scheduleRepository.save(schedule);
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
        
        return scheduleRepository.save(schedule);
    }

    @Override
    public Schedule completeSchedule(Long scheduleId) {
        log.info("✅ 스케줄 완료: ID {}", scheduleId);
        Schedule schedule = findById(scheduleId);
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
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
            
            if (isTimeTooClose(startTime, endTime, existing.getStartTime(), existing.getEndTime())) {
                log.debug("시간 간격 부족 발견: 기존 스케줄 {} ({} - {})", existing.getId(), existing.getStartTime(), existing.getEndTime());
                return true;
            }
        }
        
        return false;
    }

    @Override
    public boolean validateMappingForSchedule(Long consultantId, Long clientId) {
        log.debug("🔗 매칭 상태 검증: 상담사 {}, 내담자 {}", consultantId, clientId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        List<ConsultantClientMapping> activeMappings = mappingRepository.findByTenantIdAndStatus(
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            tenantId, ConsultantClientMapping.MappingStatus.ACTIVE);
        
        for (ConsultantClientMapping mapping : activeMappings) {
            if (mapping.getConsultant().getId().equals(consultantId) && 
                mapping.getClient().getId().equals(clientId)) {
                log.debug("유효한 매칭 발견: ID {}", mapping.getId());
                return true;
            }
        }
        
        log.warn("유효한 매칭을 찾을 수 없음: 상담사 {}, 내담자 {}", consultantId, clientId);
        return false;
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
        
        if (isAdminRole(userRole)) {
            log.info("👑 관리자 권한으로 모든 스케줄 조회");
            return scheduleRepository.findByTenantId(tenantId);
        } else if (isConsultantRole(userRole)) {
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
        if (isAdminRole(userRole)) {
            return scheduleRepository.findByTenantIdAndDate(tenantId, date);
        } else if (isConsultantRole(userRole)) {
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
        if (isAdminRole(userRole)) {
            return scheduleRepository.findByTenantIdAndDateBetween(tenantId, startDate, endDate);
        } else if (isConsultantRole(userRole)) {
            return scheduleRepository.findByTenantIdAndConsultantIdAndDateBetween(tenantId, userId, startDate, endDate);
        } else {
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }
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
                bookedSchedules = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.BOOKED.name(), start, end);
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                completedSchedules = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.COMPLETED.name(), start, end);
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                cancelledSchedules = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.CANCELLED.name(), start, end);
                inProgressSchedules = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
            } else if (start != null) {
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                bookedSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(tenantId, ScheduleStatus.BOOKED.name(), start);
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                completedSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(tenantId, ScheduleStatus.COMPLETED.name(), start);
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                cancelledSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(tenantId, ScheduleStatus.CANCELLED.name(), start);
                inProgressSchedules = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
            } else if (end != null) {
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                bookedSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(tenantId, ScheduleStatus.BOOKED.name(), end);
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                completedSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(tenantId, ScheduleStatus.COMPLETED.name(), end);
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                cancelledSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(tenantId, ScheduleStatus.CANCELLED.name(), end);
                inProgressSchedules = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
            } else {
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                bookedSchedules = scheduleRepository.countByStatus(tenantId, ScheduleStatus.BOOKED.name());
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                completedSchedules = scheduleRepository.countByStatus(tenantId, ScheduleStatus.COMPLETED.name());
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                cancelledSchedules = scheduleRepository.countByStatus(tenantId, ScheduleStatus.CANCELLED.name());
                inProgressSchedules = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
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
            long inProgressToday = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
            
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
            long completedSchedulesInPeriod = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.COMPLETED.name(), thisMonthStart, today);
            double completionRate = totalSchedulesInPeriod > 0 ? ((double) completedSchedulesInPeriod / totalSchedulesInPeriod) * 100 : 0;
            
            statistics.put("totalSchedulesInPeriod", totalSchedulesInPeriod);
            statistics.put("completedSchedulesInPeriod", completedSchedulesInPeriod);
            statistics.put("completionRate", Math.round(completionRate * 100.0) / 100.0);
            
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            long cancelledSchedulesInPeriod = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.CANCELLED.name(), thisMonthStart, today);
            double cancellationRate = totalSchedulesInPeriod > 0 ? ((double) cancelledSchedulesInPeriod / totalSchedulesInPeriod) * 100 : 0;
            
            statistics.put("cancelledSchedulesInPeriod", cancelledSchedulesInPeriod);
            statistics.put("cancellationRate", Math.round(cancellationRate * 100.0) / 100.0);
            
            LocalDate weekAgo = today.minusDays(7);
            long weeklySchedules = scheduleRepository.countByDateBetween(tenantId, weekAgo, today);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            long weeklyCompleted = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.COMPLETED.name(), weekAgo, today);
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            long weeklyCancelled = scheduleRepository.countByStatusAndDateBetween(tenantId, ScheduleStatus.CANCELLED.name(), weekAgo, today);
            
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
        LocalDate today = LocalDate.now();
        Map<String, Object> statistics = new HashMap<>();
        
        long totalToday = scheduleRepository.countByDate(tenantId, today);
        statistics.put("totalToday", totalToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long completedToday = scheduleRepository.countByDateAndStatus(tenantId, today, ScheduleStatus.COMPLETED);
        statistics.put("completedToday", completedToday);
        
        long inProgressToday = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
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
        
        log.info("✅ 오늘의 스케줄 통계 조회 완료: 총 {}개, 완료 {}개, 진행중 {}개, 취소 {}개, 예약 {}개, 확인 {}개", 
                totalToday, completedToday, inProgressToday, cancelledToday, bookedToday, confirmedToday);
        
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
        
        long inProgressToday = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
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
        
        log.info("📊 테넌트별 오늘의 통계 - 테넌트: {}, 총: {}, 완료: {}, 진행중: {}, 취소: {}, 예약: {}, 확인: {}", 
                tenantId, totalToday, completedToday, inProgressToday, cancelledToday, bookedToday, confirmedToday);
        
        return statistics;
    }
    
     /**
     * 특정 상담사의 오늘의 스케줄 통계 조회
     */
    @Override
    public Map<String, Object> getTodayScheduleStatisticsByConsultant(Long consultantId) {
        log.info("📊 상담사 오늘의 스케줄 통계 조회 - 상담사 ID: {}", consultantId);
        
        String tenantId = TenantContextHolder.getTenantId();
        LocalDate today = LocalDate.now();
        Map<String, Object> statistics = new HashMap<>();
        
        long totalToday = scheduleRepository.countByDateAndConsultantId(tenantId, today, consultantId);
        statistics.put("totalToday", totalToday);
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        long completedToday = scheduleRepository.countByDateAndStatusAndConsultantId(tenantId, today, ScheduleStatus.COMPLETED, consultantId);
        statistics.put("completedToday", completedToday);
        
        long inProgressToday = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
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
     * 매칭의 회기 사용 처리
     */
    private void useSessionForMapping(Long consultantId, Long clientId) {
        log.debug("📅 매칭 회기 사용 처리: 상담사 {}, 내담자 {}", consultantId, clientId);
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        List<ConsultantClientMapping> activeMappings = mappingRepository.findByTenantIdAndStatus(
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            tenantId, ConsultantClientMapping.MappingStatus.ACTIVE);
        
        for (ConsultantClientMapping mapping : activeMappings) {
            if (mapping.getConsultant().getId().equals(consultantId) && 
                mapping.getClient().getId().equals(clientId)) {
                
                try {
                    ConsultantClientMapping freshMapping = mappingRepository.findById(mapping.getId())
                            .orElseThrow(() -> new RuntimeException("매칭을 찾을 수 없습니다: " + mapping.getId()));
                    
                    log.info("🔍 매칭 상태 확인: mappingId={}, totalSessions={}, usedSessions={}, remainingSessions={}", 
                            freshMapping.getId(), freshMapping.getTotalSessions(), 
                            freshMapping.getUsedSessions(), freshMapping.getRemainingSessions());
                    
                    freshMapping.useSession();
                    mappingRepository.save(freshMapping);
                    
                    try {
                        sessionSyncService.syncAfterSessionUsage(mapping.getId(), consultantId, clientId);
                        log.info("✅ 회기 사용 후 동기화 완료: mappingId={}", mapping.getId());
                    } catch (Exception syncError) {
                        log.error("❌ 회기 사용 후 동기화 실패: mappingId={}, error={}", 
                                 mapping.getId(), syncError.getMessage(), syncError);
                    }
                    
                    log.info("✅ 회기 사용 완료: 남은 회기 수 {}", mapping.getRemainingSessions());
                } catch (Exception e) {
                    log.error("❌ 회기 사용 처리 실패: {}", e.getMessage(), e);
                    throw new RuntimeException("회기 사용 처리에 실패했습니다: " + e.getMessage());
                }
                break;
            }
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

     /**
     * 권한 기반 스케줄 조회 (상담사 이름 포함)
     */
    @Override
    public List<ScheduleResponse> findSchedulesWithNamesByUserRole(Long userId, String userRole) {
        log.info("🔐 권한 기반 스케줄 조회 (이름 포함): 사용자 {}, 역할 {}", userId, userRole);
        
        autoCompleteExpiredSchedules();
        
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<Schedule> schedules;
        if (isAdminRole(userRole)) {
            log.info("👑 관리자 권한으로 모든 스케줄 조회");
            schedules = scheduleRepository.findByTenantId(tenantId);
        } else if (isConsultantRole(userRole)) {
            log.info("👨‍⚕️ 상담사 권한으로 자신의 스케줄만 조회: {}", userId);
            schedules = scheduleRepository.findByTenantIdAndConsultantId(tenantId, userId);
        } else if (getRoleCodeFromCommonCode(UserRole.CLIENT.name()).equals(userRole)) {
            log.info("👤 내담자 권한으로 자신의 스케줄만 조회: {}", userId);
            schedules = scheduleRepository.findByTenantIdAndClientId(tenantId, userId);
        } else {
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }
        
        List<ScheduleResponse> scheduleDtos = schedules.stream()
            .map(this::convertToScheduleDto)
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
        if (isAdminRole(userRole)) {
            log.info("👑 관리자 권한으로 모든 스케줄 페이지네이션 조회");
            schedulePage = scheduleRepository.findByTenantId(tenantId, pageable);
        } else if (isConsultantRole(userRole)) {
            log.info("👨‍⚕️ 상담사 권한으로 자신의 스케줄만 페이지네이션 조회: {}", userId);
            schedulePage = scheduleRepository.findByTenantIdAndConsultantId(tenantId, userId, pageable);
        } else if (getRoleCodeFromCommonCode(UserRole.CLIENT.name()).equals(userRole)) {
            log.info("👤 내담자 권한으로 자신의 스케줄만 페이지네이션 조회: {}", userId);
            schedulePage = scheduleRepository.findByTenantIdAndClientId(tenantId, userId, pageable);
        } else {
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }
        
        return schedulePage.map(this::convertToScheduleDto);
    }

     /**
     * 휴가 데이터를 ScheduleDto로 변환
     */
    private List<ScheduleResponse> getVacationSchedules(Long userId, String userRole) {
        log.info("🏖️ 휴가 스케줄 조회: 사용자 {}, 역할 {}", userId, userRole);
        
        List<Vacation> vacations;
        if (isAdminRole(userRole)) {
            vacations = vacationRepository.findByIsDeletedFalseOrderByVacationDateAsc();
        } else if (isConsultantRole(userRole)) {
            vacations = vacationRepository.findByConsultantIdAndIsDeletedFalseOrderByVacationDateAsc(userId);
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
        
        User consultant = userRepository.findById(vacation.getConsultantId()).orElse(null);
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
        User consultant = userRepository.findById(vacation.getConsultantId()).orElse(null);
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
        String consultantName = "알 수 없음";
        String clientName = "알 수 없음";
        
        log.info("🔍 스케줄 변환 시작: scheduleId={}, consultantId={}, clientId={}", 
                schedule.getId(), schedule.getConsultantId(), schedule.getClientId());
        
        try {
            User consultant = userRepository.findById(schedule.getConsultantId()).orElse(null);
            log.info("👤 상담사 조회 결과: consultant={}, isActive={}", 
                    consultant != null ? consultant.getName() : "null", 
                    consultant != null ? consultant.getIsActive() : "null");
            
            if (consultant != null && consultant.getIsActive()) {
                consultantName = consultant.getName();
            } else if (consultant != null && !consultant.getIsActive()) {
                consultantName = consultant.getName() + " (비활성)";
            }
            
            if (schedule.getClientId() != null) {
                User client = userRepository.findById(schedule.getClientId()).orElse(null);
                log.info("👥 내담자 조회 결과: client={}, isActive={}", 
                        client != null ? client.getName() : "null", 
                        client != null ? client.getIsActive() : "null");
                
                if (client != null && client.getIsActive()) {
                    clientName = client.getName();
                } else if (client != null && !client.getIsActive()) {
                    clientName = client.getName() + " (비활성)";
                }
            }
        } catch (Exception e) {
            log.warn("상담사/클라이언트 정보 조회 실패: {}", e.getMessage());
        }
        
        log.info("✅ 최종 변환 결과: consultantName={}, clientName={}", consultantName, clientName);
        
        return ScheduleResponse.builder()
            .id(schedule.getId())
            .consultantId(schedule.getConsultantId())
            .consultantName(consultantName)
            .clientId(schedule.getClientId())
            .clientName(clientName)
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
            .build();
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
                    Schedule latestSchedule = scheduleRepository.findById(schedule.getId()).orElse(null);
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    if (latestSchedule != null && ScheduleStatus.CONFIRMED.equals(latestSchedule.getStatus())) {
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                        latestSchedule.setStatus(ScheduleStatus.COMPLETED);
                        latestSchedule.setUpdatedAt(LocalDateTime.now());
                        scheduleRepository.save(latestSchedule);
                        completedCount++;
                        
                        log.info("✅ 오늘 확정 스케줄 자동 완료: ID={}, 제목={}, 시간={}", 
                            latestSchedule.getId(), latestSchedule.getTitle(), latestSchedule.getStartTime());
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
                    Schedule latestSchedule = scheduleRepository.findById(schedule.getId()).orElse(null);
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    if (latestSchedule != null && ScheduleStatus.BOOKED.equals(latestSchedule.getStatus())) {
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                        latestSchedule.setStatus(ScheduleStatus.COMPLETED);
                        latestSchedule.setUpdatedAt(LocalDateTime.now());
                        scheduleRepository.save(latestSchedule);
                        completedCount++;
                        
                        log.info("✅ 지난 예약 스케줄 자동 완료: ID={}, 제목={}, 날짜={}, 시간={}", 
                            latestSchedule.getId(), latestSchedule.getTitle(), latestSchedule.getDate(), latestSchedule.getStartTime());
                    }
                } catch (Exception e) {
                    log.error("❌ 지난 예약 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
                }
            }
            
            for (Schedule schedule : pastConfirmedSchedules) {
                try {
                    Schedule latestSchedule = scheduleRepository.findById(schedule.getId()).orElse(null);
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    if (latestSchedule != null && ScheduleStatus.CONFIRMED.equals(latestSchedule.getStatus())) {
                        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                        latestSchedule.setStatus(ScheduleStatus.COMPLETED);
                        latestSchedule.setUpdatedAt(LocalDateTime.now());
                        scheduleRepository.save(latestSchedule);
                        completedCount++;
                        
                        log.info("✅ 지난 확정 스케줄 자동 완료: ID={}, 제목={}, 날짜={}, 시간={}", 
                            latestSchedule.getId(), latestSchedule.getTitle(), latestSchedule.getDate(), latestSchedule.getStartTime());
                    }
                } catch (Exception e) {
                    log.error("❌ 지난 확정 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
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
            Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("지점을 찾을 수 없습니다: " + branchId));
            
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return new ArrayList<>();
            }
            List<User> consultants = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUsername(
                tenantId, branch, com.coresolution.consultation.constant.UserRole.CONSULTANT);
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
            User consultant = userRepository.findById(consultantId)
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
            Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("지점을 찾을 수 없습니다: " + branchId));
            
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return new HashMap<>();
            }
            List<User> consultants = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUsername(
                tenantId, branch, com.coresolution.consultation.constant.UserRole.CONSULTANT);
            
            Map<String, Object> status = new HashMap<>();
            status.put("branchId", branchId);
            status.put("date", date);
            status.put("totalConsultants", consultants.size());
            
            List<Map<String, Object>> consultantStatus = new ArrayList<>();
            for (User consultant : consultants) {
                List<Schedule> daySchedules = scheduleRepository.findByConsultantIdAndDate(consultant.getId(), date);
                
                Map<String, Object> consultantInfo = new HashMap<>();
                consultantInfo.put("consultantId", consultant.getId());
                consultantInfo.put("consultantName", consultant.getUsername());
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
            if (schedule.getConsultantId() != null) {
                User consultant = userRepository.findById(schedule.getConsultantId())
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
            Schedule existingSchedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("스케줄을 찾을 수 없습니다: " + scheduleId));
            
            if (existingSchedule.getConsultantId() != null) {
                User consultant = userRepository.findById(existingSchedule.getConsultantId())
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
            Schedule existingSchedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("스케줄을 찾을 수 없습니다: " + scheduleId));
            
            if (existingSchedule.getConsultantId() != null) {
                User consultant = userRepository.findById(existingSchedule.getConsultantId())
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
            User consultant = userRepository.findById(consultantId)
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
            User consultant = userRepository.findById(consultantId)
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
        try {
            String codeValue = commonCodeService.getCodeValue("MESSAGE_TYPE", messageTypeName);
            return codeValue != null ? codeValue : messageTypeName;
        } catch (Exception e) {
            return messageTypeName;
        }
    }
}
