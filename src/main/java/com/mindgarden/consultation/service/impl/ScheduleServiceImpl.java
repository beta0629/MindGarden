package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.ConsultationType;
import com.mindgarden.consultation.constant.ScheduleConstants;
import com.mindgarden.consultation.constant.ScheduleStatus;
import com.mindgarden.consultation.dto.ScheduleDto;
import com.mindgarden.consultation.entity.Branch;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.Vacation;
import com.mindgarden.consultation.repository.BranchRepository;
import com.mindgarden.consultation.repository.ConsultantClientMappingRepository;
import com.mindgarden.consultation.repository.ScheduleRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.repository.VacationRepository;
import com.mindgarden.consultation.service.CommonCodeService;
import com.mindgarden.consultation.service.ConsultantAvailabilityService;
import com.mindgarden.consultation.service.ScheduleService;
import com.mindgarden.consultation.service.SessionSyncService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 스케줄 관리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleServiceImpl implements ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final UserRepository userRepository;
    private final VacationRepository vacationRepository;
    private final BranchRepository branchRepository;
    private final CommonCodeService commonCodeService;
    private final ConsultantAvailabilityService consultantAvailabilityService;
    private final SessionSyncService sessionSyncService;
    
    // 상수는 ScheduleConstants 클래스에서 관리

    // ==================== 기본 CRUD 메서드 ====================

    @Override
    public Schedule createSchedule(Schedule schedule) {
        
        log.info("📅 스케줄 생성: {}", schedule.getTitle());
        return scheduleRepository.save(schedule);
    }

    @Override
    public Schedule updateSchedule(Long id, Schedule updateData) {
        log.info("📝 스케줄 수정: ID {}", id);
        Schedule existingSchedule = findById(id);
        
        if (updateData.getDate() != null) existingSchedule.setDate(updateData.getDate());
        if (updateData.getStartTime() != null) existingSchedule.setStartTime(updateData.getStartTime());
        if (updateData.getEndTime() != null) existingSchedule.setEndTime(updateData.getEndTime());
        if (updateData.getTitle() != null) existingSchedule.setTitle(updateData.getTitle());
        if (updateData.getDescription() != null) existingSchedule.setDescription(updateData.getDescription());
        if (updateData.getStatus() != null) existingSchedule.setStatus(updateData.getStatus());
        
        return scheduleRepository.save(existingSchedule);
    }

    @Override
    public void deleteSchedule(Long id) {
        log.info("🗑️ 스케줄 삭제: ID {}", id);
        scheduleRepository.deleteById(id);
    }

    @Override
    public Schedule findById(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("스케줄을 찾을 수 없습니다: " + id));
    }

    @Override
    public List<Schedule> findAll() {
        return scheduleRepository.findAll();
    }

    @Override
    public org.springframework.data.domain.Page<Schedule> findAll(org.springframework.data.domain.Pageable pageable) {
        return scheduleRepository.findAll(pageable);
    }

    // ==================== 상담사별 스케줄 관리 ====================

    @Override
    public Schedule createConsultantSchedule(Long consultantId, Long clientId, LocalDate date, 
                                          LocalTime startTime, LocalTime endTime, String title, String description) {
        log.info("📅 상담사 스케줄 생성: 상담사 {}, 내담자 {}, 날짜 {}", consultantId, clientId, date);
        
        // 1. 매핑 상태 검증 (임시로 우회)
        // if (!validateMappingForSchedule(consultantId, clientId)) {
        //     throw new RuntimeException("상담사와 내담자 간의 유효한 매핑이 없거나 승인되지 않았습니다.");
        // }
        
        // 2. 회기 수 검증 (임시로 우회)
        // if (!validateRemainingSessions(consultantId, clientId)) {
        //     throw new RuntimeException("사용 가능한 회기가 없습니다.");
        // }
        
        // 3. 시간 충돌 검사
        if (hasTimeConflict(consultantId, date, startTime, endTime, null)) {
            throw new RuntimeException("해당 시간대에 이미 스케줄이 존재합니다.");
        }
        
        // 4. 스케줄 생성
        Schedule schedule = new Schedule();
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(date);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setTitle(title);
        schedule.setDescription(description);
        schedule.setScheduleType(ScheduleConstants.TYPE_CONSULTATION);
        schedule.setStatus(ScheduleStatus.BOOKED);
        
        Schedule savedSchedule = scheduleRepository.save(schedule);
        
        // 5. 회기 사용 처리
        useSessionForMapping(consultantId, clientId);
        
        log.info("✅ 상담사 스케줄 생성 완료: ID {}", savedSchedule.getId());
        return savedSchedule;
    }

    @Override
    public Schedule createConsultantSchedule(Long consultantId, Long clientId, LocalDate date, 
                                          LocalTime startTime, LocalTime endTime, String title, String description, String consultationType, String branchCode) {
        log.info("📅 상담사 스케줄 생성 (상담유형 포함): 상담사 {}, 내담자 {}, 날짜 {}, 상담유형 {}", consultantId, clientId, date, consultationType);
        
        // 1. 매핑 상태 검증 (임시로 우회)
        // if (!validateMappingForSchedule(consultantId, clientId)) {
        //     throw new RuntimeException("상담사와 내담자 간의 유효한 매핑이 없거나 승인되지 않았습니다.");
        // }
        
        // 2. 회기 수 검증 (임시로 우회)
        // if (!validateRemainingSessions(consultantId, clientId)) {
        //     throw new RuntimeException("사용 가능한 회기가 없습니다.");
        // }
        
        // 3. 시간 충돌 검사
        if (hasTimeConflict(consultantId, date, startTime, endTime, null)) {
            throw new RuntimeException("해당 시간대에 이미 스케줄이 존재합니다.");
        }
        
        // 4. 스케줄 생성
        Schedule schedule = new Schedule();
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(date);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setTitle(title);
        schedule.setDescription(description);
        schedule.setScheduleType(ScheduleConstants.TYPE_CONSULTATION);
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setConsultationType(consultationType); // 상담 유형 설정
        schedule.setBranchCode(branchCode); // 지점코드 설정
        
        Schedule savedSchedule = scheduleRepository.save(schedule);
        
        // 5. 회기 사용 처리
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
        
        // 1. 매핑 상태 검증
        if (!validateMappingForSchedule(consultantId, clientId)) {
            throw new RuntimeException("상담사와 내담자 간의 유효한 매핑이 없거나 승인되지 않았습니다.");
        }
        
        // 2. 회기 수 검증
        if (!validateRemainingSessions(consultantId, clientId)) {
            throw new RuntimeException("사용 가능한 회기가 없습니다.");
        }
        
        // 3. 시간 충돌 검사 (상담 유형 기반)
        if (hasTimeConflictWithType(consultantId, date, startTime, consultationType, null)) {
            throw new RuntimeException("해당 시간대에 이미 스케줄이 존재하거나 시간이 충돌합니다.");
        }
        
        // 4. 종료 시간 자동 계산
        LocalTime endTime = calculateEndTime(startTime, consultationType);
        
        // 5. 스케줄 생성
        Schedule schedule = new Schedule();
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(date);
        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setTitle(title);
        schedule.setDescription(description);
        schedule.setScheduleType(ScheduleConstants.TYPE_CONSULTATION);
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setNotes("상담 유형: " + consultationType.getDisplayName() + " (" + consultationType.getDefaultDurationMinutes() + "분)");
        
        Schedule savedSchedule = scheduleRepository.save(schedule);
        
        // 6. 회기 사용 처리
        useSessionForMapping(consultantId, clientId);
        
        log.info("✅ 상담사 스케줄 생성 완료 (유형 기반): ID {}, 상담 유형: {}, 시간: {} - {}", 
                savedSchedule.getId(), consultationType.getDisplayName(), startTime, endTime);
        return savedSchedule;
    }

    @Override
    public List<Schedule> findByConsultantId(Long consultantId) {
        // 먼저 자동 완료 처리 실행
        autoCompleteExpiredSchedules();
        return scheduleRepository.findByConsultantId(consultantId);
    }

    @Override
    public List<Schedule> findByConsultantIdAndDate(Long consultantId, LocalDate date) {
        // 먼저 자동 완료 처리 실행
        autoCompleteExpiredSchedules();
        return scheduleRepository.findByConsultantIdAndDate(consultantId, date);
    }

    @Override
    public List<Schedule> findByConsultantIdAndDateBetween(Long consultantId, LocalDate startDate, LocalDate endDate) {
        // 먼저 자동 완료 처리 실행
        autoCompleteExpiredSchedules();
        return scheduleRepository.findByConsultantIdAndDateBetween(consultantId, startDate, endDate);
    }

    // ==================== 내담자별 스케줄 관리 ====================

    @Override
    public List<Schedule> findByClientId(Long clientId) {
        // 먼저 자동 완료 처리 실행
        autoCompleteExpiredSchedules();
        return scheduleRepository.findByClientId(clientId);
    }

    @Override
    public List<Schedule> findByClientIdAndDate(Long clientId, LocalDate date) {
        // 먼저 자동 완료 처리 실행
        autoCompleteExpiredSchedules();
        return scheduleRepository.findByClientIdAndDate(clientId, date);
    }

    @Override
    public List<Schedule> findByClientIdAndDateBetween(Long clientId, LocalDate startDate, LocalDate endDate) {
        // 먼저 자동 완료 처리 실행
        autoCompleteExpiredSchedules();
        return scheduleRepository.findByClientIdAndDateBetween(clientId, startDate, endDate);
    }

    // ==================== 스케줄 상태 관리 ====================

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
        schedule.setStatus(ScheduleStatus.CANCELLED);
        schedule.setDescription(reason);
        return scheduleRepository.save(schedule);
    }

    @Override
    public Schedule confirmSchedule(Long scheduleId, String adminNote) {
        log.info("✅ 예약 확정: ID {}, 관리자 메모: {}", scheduleId, adminNote);
        Schedule schedule = findById(scheduleId);
        
        // 예약 확정 상태로 변경
        schedule.setStatus(ScheduleStatus.BOOKED);
        
        // 관리자 메모 추가
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
        schedule.setStatus(ScheduleStatus.COMPLETED);
        return scheduleRepository.save(schedule);
    }

    @Override
    public Schedule blockSchedule(Long scheduleId, String reason) {
        log.info("🚫 스케줄 차단: ID {}, 사유: {}", scheduleId, reason);
        Schedule schedule = findById(scheduleId);
        schedule.setStatus(ScheduleStatus.VACATION);
        return scheduleRepository.save(schedule);
    }

    // ==================== 스케줄 검증 및 검사 ====================

    @Override
    public boolean hasTimeConflict(Long consultantId, LocalDate date, LocalTime startTime, LocalTime endTime, Long excludeScheduleId) {
        log.debug("⏰ 시간 충돌 검사 (기본): 상담사 {}, 날짜 {}, 시간 {} - {}", consultantId, date, startTime, endTime);
        
        // 1. 휴가 검사 - 상담사가 해당 날짜에 휴가인지 확인
        if (consultantAvailabilityService.isConsultantOnVacation(consultantId, date, startTime, endTime)) {
            log.warn("🚫 휴가 중인 상담사: 상담사 {}, 날짜 {}", consultantId, date);
            return true;
        }
        
        // 2. 기존 스케줄과의 시간 충돌 검사
        List<Schedule> existingSchedules = findByConsultantIdAndDate(consultantId, date);
        
        for (Schedule existing : existingSchedules) {
            if (excludeScheduleId != null && existing.getId().equals(excludeScheduleId)) {
                continue; // 자기 자신은 제외
            }
            
            // 시간 겹침 검사
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
        
        // 1. 상담 시간 + 쉬는 시간 계산
        LocalTime endTime = calculateEndTime(startTime, consultationType);
        
        // 2. 휴가 검사 - 상담사가 해당 날짜에 휴가인지 확인
        if (consultantAvailabilityService.isConsultantOnVacation(consultantId, date, startTime, endTime)) {
            log.warn("🚫 휴가 중인 상담사: 상담사 {}, 날짜 {}", consultantId, date);
            return true;
        }
        
        // 3. 기본 시간 충돌 검사
        if (hasTimeConflict(consultantId, date, startTime, endTime, excludeScheduleId)) {
            return true;
        }
        
        // 4. 쉬는 시간을 고려한 추가 검사
        List<Schedule> existingSchedules = findByConsultantIdAndDate(consultantId, date);
        
        for (Schedule existing : existingSchedules) {
            if (excludeScheduleId != null && existing.getId().equals(excludeScheduleId)) {
                continue; // 자기 자신은 제외
            }
            
            // 기존 스케줄과의 간격 검사 (최소 10분)
            if (isTimeTooClose(startTime, endTime, existing.getStartTime(), existing.getEndTime())) {
                log.debug("시간 간격 부족 발견: 기존 스케줄 {} ({} - {})", existing.getId(), existing.getStartTime(), existing.getEndTime());
                return true;
            }
        }
        
        return false;
    }

    @Override
    public boolean validateMappingForSchedule(Long consultantId, Long clientId) {
        log.debug("🔗 매핑 상태 검증: 상담사 {}, 내담자 {}", consultantId, clientId);
        
        // 활성 상태의 매핑이 있는지 확인
        List<ConsultantClientMapping> activeMappings = mappingRepository.findByStatus(
            ConsultantClientMapping.MappingStatus.ACTIVE);
        
        for (ConsultantClientMapping mapping : activeMappings) {
            if (mapping.getConsultant().getId().equals(consultantId) && 
                mapping.getClient().getId().equals(clientId)) {
                log.debug("유효한 매핑 발견: ID {}", mapping.getId());
                return true;
            }
        }
        
        log.warn("유효한 매핑을 찾을 수 없음: 상담사 {}, 내담자 {}", consultantId, clientId);
        return false;
    }

    @Override
    public boolean validateRemainingSessions(Long consultantId, Long clientId) {
        log.debug("📊 회기 수 검증: 상담사 {}, 내담자 {}", consultantId, clientId);
        
        // 활성 상태의 매핑에서 남은 회기 수 확인
        List<ConsultantClientMapping> activeMappings = mappingRepository.findByStatus(
            ConsultantClientMapping.MappingStatus.ACTIVE);
        
        for (ConsultantClientMapping mapping : activeMappings) {
            if (mapping.getConsultant().getId().equals(consultantId) && 
                mapping.getClient().getId().equals(clientId)) {
                
                Integer remainingSessions = mapping.getRemainingSessions();
                log.debug("남은 회기 수: {}", remainingSessions);
                
                return remainingSessions != null && remainingSessions > 0;
            }
        }
        
        log.warn("활성 매핑을 찾을 수 없음: 상담사 {}, 내담자 {}", consultantId, clientId);
        return false;
    }

    // ==================== 시간 관리 ====================

    @Override
    public LocalTime calculateEndTime(LocalTime startTime, ConsultationType consultationType) {
        int durationMinutes = consultationType.getDefaultDurationMinutes() + ScheduleConstants.BREAK_TIME_MINUTES;
        return startTime.plus(durationMinutes, ChronoUnit.MINUTES);
    }

    @Override
    public LocalTime calculateEndTime(LocalTime startTime, int durationMinutes) {
        int totalMinutes = durationMinutes + ScheduleConstants.BREAK_TIME_MINUTES;
        return startTime.plus(totalMinutes, ChronoUnit.MINUTES);
    }

    @Override
    public int calculateMaxConsultationTimePerDay(Long consultantId, LocalDate date) {
        // 기본 업무 시간: ScheduleConstants에서 관리
        int maxWorkMinutes = ScheduleConstants.WORKDAY_TOTAL_HOURS * ScheduleConstants.MINUTES_PER_HOUR;
        
        // 이미 예약된 시간 계산
        List<Schedule> existingSchedules = findByConsultantIdAndDate(consultantId, date);
        int usedMinutes = existingSchedules.stream()
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

    // ==================== 스케줄 통계 및 분석 ====================

    @Override
    public Map<String, Object> getConsultantScheduleStats(Long consultantId, LocalDate startDate, LocalDate endDate) {
        log.info("📊 상담사 스케줄 통계: ID {}, 기간 {} - {}", consultantId, startDate, endDate);
        
        List<Schedule> schedules = findByConsultantIdAndDateBetween(consultantId, startDate, endDate);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSchedules", schedules.size());
        stats.put("bookedSchedules", schedules.stream().filter(s -> ScheduleStatus.BOOKED.equals(s.getStatus())).count());
        stats.put("completedSchedules", schedules.stream().filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus())).count());
        stats.put("cancelledSchedules", schedules.stream().filter(s -> ScheduleStatus.CANCELLED.equals(s.getStatus())).count());
        
        return stats;
    }

    @Override
    public Map<String, Object> getClientScheduleStats(Long clientId, LocalDate startDate, LocalDate endDate) {
        log.info("📊 내담자 스케줄 통계: ID {}, 기간 {} - {}", clientId, startDate, endDate);
        
        List<Schedule> schedules = findByClientIdAndDateBetween(clientId, startDate, endDate);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSchedules", schedules.size());
        stats.put("bookedSchedules", schedules.stream().filter(s -> ScheduleStatus.BOOKED.equals(s.getStatus())).count());
        stats.put("completedSchedules", schedules.stream().filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus())).count());
        stats.put("cancelledSchedules", schedules.stream().filter(s -> ScheduleStatus.CANCELLED.equals(s.getStatus())).count());
        
        return stats;
    }

    @Override
    public Map<String, Object> getOverallScheduleStats(LocalDate startDate, LocalDate endDate) {
        log.info("📊 전체 스케줄 통계: 기간 {} - {}", startDate, endDate);
        
        List<Schedule> allSchedules = scheduleRepository.findAll();
        List<Schedule> periodSchedules = allSchedules.stream()
            .filter(s -> s.getDate() != null && 
                        !s.getDate().isBefore(startDate) && 
                        !s.getDate().isAfter(endDate))
            .toList();
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSchedules", periodSchedules.size());
        stats.put("bookedSchedules", periodSchedules.stream().filter(s -> ScheduleConstants.STATUS_BOOKED.equals(s.getStatus())).count());
        stats.put("completedSchedules", periodSchedules.stream().filter(s -> ScheduleConstants.STATUS_COMPLETED.equals(s.getStatus())).count());
        stats.put("cancelledSchedules", periodSchedules.stream().filter(s -> ScheduleConstants.STATUS_CANCELLED.equals(s.getStatus())).count());
        
        return stats;
    }

    // ==================== 권한 기반 스케줄 조회 ====================

    @Override
    public List<Schedule> findSchedulesByUserRole(Long userId, String userRole) {
        log.info("🔐 권한 기반 스케줄 조회: 사용자 {}, 역할 {}", userId, userRole);
        
        // 먼저 자동 완료 처리 실행
        autoCompleteExpiredSchedules();
        
        if (isAdminRole(userRole)) {
            // 관리자: 모든 스케줄 조회
            log.info("👑 관리자 권한으로 모든 스케줄 조회");
            return scheduleRepository.findAll();
        } else if (isConsultantRole(userRole)) {
            // 상담사: 자신의 스케줄만 조회
            log.info("👨‍⚕️ 상담사 권한으로 자신의 스케줄만 조회: {}", userId);
            return scheduleRepository.findByConsultantId(userId);
        } else {
            // 일반 사용자: 접근 권한 없음
            log.warn("❌ 권한 없음: 사용자 {}, 역할 {}", userId, userRole);
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }
    }

    @Override
    public List<Schedule> findSchedulesByUserRoleAndDate(Long userId, String userRole, LocalDate date) {
        log.info("🔐 권한 기반 특정 날짜 스케줄 조회: 사용자 {}, 역할 {}, 날짜 {}", userId, userRole, date);
        
        // 먼저 자동 완료 처리 실행
        autoCompleteExpiredSchedules();
        
        if (isAdminRole(userRole)) {
            // 관리자: 해당 날짜의 모든 스케줄 조회
            return scheduleRepository.findByDate(date);
        } else if (isConsultantRole(userRole)) {
            // 상담사: 해당 날짜의 자신의 스케줄만 조회
            return scheduleRepository.findByConsultantIdAndDate(userId, date);
        } else {
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }
    }

    @Override
    public List<Schedule> findSchedulesByUserRoleAndDateBetween(Long userId, String userRole, LocalDate startDate, LocalDate endDate) {
        log.info("🔐 권한 기반 날짜 범위 스케줄 조회: 사용자 {}, 역할 {}, 기간 {} ~ {}", userId, userRole, startDate, endDate);
        
        // 먼저 자동 완료 처리 실행
        autoCompleteExpiredSchedules();
        
        if (isAdminRole(userRole)) {
            // 관리자: 해당 기간의 모든 스케줄 조회
            return scheduleRepository.findByDateBetween(startDate, endDate);
        } else if (isConsultantRole(userRole)) {
            // 상담사: 해당 기간의 자신의 스케줄만 조회
            return scheduleRepository.findByConsultantIdAndDateBetween(userId, startDate, endDate);
        } else {
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }
    }

    @Override
    public Map<String, Object> getScheduleStatisticsForAdmin(String startDate, String endDate) {
        log.info("📊 관리자용 전체 스케줄 통계 조회 시작 - 시작일: {}, 종료일: {}", startDate, endDate);
        
        try {
            Map<String, Object> statistics = new HashMap<>();
            
            // 날짜 범위 설정
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : null;
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : null;
            
            // 전체 스케줄 수 (날짜 범위 적용)
            log.info("📊 전체 스케줄 수 조회 중...");
            long totalSchedules;
            if (start != null && end != null) {
                totalSchedules = scheduleRepository.countByDateBetween(start, end);
            } else if (start != null) {
                totalSchedules = scheduleRepository.countByDateGreaterThanEqual(start);
            } else if (end != null) {
                totalSchedules = scheduleRepository.countByDateLessThanEqual(end);
            } else {
                totalSchedules = scheduleRepository.count();
            }
            statistics.put("totalSchedules", totalSchedules);
            log.info("📊 전체 스케줄 수: {}", totalSchedules);
            
            // 상태별 스케줄 수 (날짜 범위 적용)
            log.info("📊 상태별 스케줄 수 조회 중...");
            long bookedSchedules, completedSchedules, cancelledSchedules, inProgressSchedules;
            
            if (start != null && end != null) {
                bookedSchedules = scheduleRepository.countByStatusAndDateBetween(ScheduleStatus.BOOKED.name(), start, end);
                completedSchedules = scheduleRepository.countByStatusAndDateBetween(ScheduleStatus.COMPLETED.name(), start, end);
                cancelledSchedules = scheduleRepository.countByStatusAndDateBetween(ScheduleStatus.CANCELLED.name(), start, end);
                inProgressSchedules = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
            } else if (start != null) {
                bookedSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(ScheduleStatus.BOOKED.name(), start);
                completedSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(ScheduleStatus.COMPLETED.name(), start);
                cancelledSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(ScheduleStatus.CANCELLED.name(), start);
                inProgressSchedules = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
            } else if (end != null) {
                bookedSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(ScheduleStatus.BOOKED.name(), end);
                completedSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(ScheduleStatus.COMPLETED.name(), end);
                cancelledSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(ScheduleStatus.CANCELLED.name(), end);
                inProgressSchedules = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
            } else {
                bookedSchedules = scheduleRepository.countByStatus(ScheduleStatus.BOOKED.name());
                completedSchedules = scheduleRepository.countByStatus(ScheduleStatus.COMPLETED.name());
                cancelledSchedules = scheduleRepository.countByStatus(ScheduleStatus.CANCELLED.name());
                inProgressSchedules = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
            }
            
            statistics.put("bookedSchedules", bookedSchedules);
            statistics.put("completedSchedules", completedSchedules);
            statistics.put("cancelledSchedules", cancelledSchedules);
            statistics.put("inProgressSchedules", inProgressSchedules);
            
            log.info("📊 상태별 스케줄 수 - 예약: {}, 완료: {}, 취소: {}, 진행중: {}", 
                    bookedSchedules, completedSchedules, cancelledSchedules, inProgressSchedules);
            
            // 오늘의 통계
            LocalDate today = LocalDate.now();
            log.info("📊 오늘의 통계 조회 중... (날짜: {})", today);
            long totalToday = scheduleRepository.countByDate(today);
            long bookedToday = scheduleRepository.countByDateAndStatus(today, ScheduleStatus.BOOKED.name());
            long completedToday = scheduleRepository.countByDateAndStatus(today, ScheduleStatus.COMPLETED.name());
            long cancelledToday = scheduleRepository.countByDateAndStatus(today, ScheduleStatus.CANCELLED.name());
            long inProgressToday = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
            
            statistics.put("totalToday", totalToday);
            statistics.put("bookedToday", bookedToday);
            statistics.put("completedToday", completedToday);
            statistics.put("cancelledToday", cancelledToday);
            statistics.put("inProgressToday", inProgressToday);
            
            log.info("📊 오늘의 통계 - 총: {}, 예약: {}, 완료: {}, 취소: {}, 진행중: {}", 
                    totalToday, bookedToday, completedToday, cancelledToday, inProgressToday);
            
            // 추가 상세 통계
            log.info("📊 추가 상세 통계 조회 중...");
            
            // 내담자 증감 통계 (이번 달 vs 지난 달)
            LocalDate thisMonthStart = today.withDayOfMonth(1);
            LocalDate lastMonthStart = thisMonthStart.minusMonths(1);
            LocalDate lastMonthEnd = thisMonthStart.minusDays(1);
            
            long thisMonthClients = scheduleRepository.countDistinctClientsByDateBetween(thisMonthStart, today);
            long lastMonthClients = scheduleRepository.countDistinctClientsByDateBetween(lastMonthStart, lastMonthEnd);
            long clientGrowth = thisMonthClients - lastMonthClients;
            double clientGrowthRate = lastMonthClients > 0 ? ((double) clientGrowth / lastMonthClients) * 100 : 0;
            
            statistics.put("thisMonthClients", thisMonthClients);
            statistics.put("lastMonthClients", lastMonthClients);
            statistics.put("clientGrowth", clientGrowth);
            statistics.put("clientGrowthRate", Math.round(clientGrowthRate * 100.0) / 100.0);
            
            // 상담사 증감 통계
            long thisMonthConsultants = scheduleRepository.countDistinctConsultantsByDateBetween(thisMonthStart, today);
            long lastMonthConsultants = scheduleRepository.countDistinctConsultantsByDateBetween(lastMonthStart, lastMonthEnd);
            long consultantGrowth = thisMonthConsultants - lastMonthConsultants;
            double consultantGrowthRate = lastMonthConsultants > 0 ? ((double) consultantGrowth / lastMonthConsultants) * 100 : 0;
            
            statistics.put("thisMonthConsultants", thisMonthConsultants);
            statistics.put("lastMonthConsultants", lastMonthConsultants);
            statistics.put("consultantGrowth", consultantGrowth);
            statistics.put("consultantGrowthRate", Math.round(consultantGrowthRate * 100.0) / 100.0);
            
            // 상담 완료율 통계
            long totalSchedulesInPeriod = scheduleRepository.countByDateBetween(thisMonthStart, today);
            long completedSchedulesInPeriod = scheduleRepository.countByStatusAndDateBetween(ScheduleStatus.COMPLETED.name(), thisMonthStart, today);
            double completionRate = totalSchedulesInPeriod > 0 ? ((double) completedSchedulesInPeriod / totalSchedulesInPeriod) * 100 : 0;
            
            statistics.put("totalSchedulesInPeriod", totalSchedulesInPeriod);
            statistics.put("completedSchedulesInPeriod", completedSchedulesInPeriod);
            statistics.put("completionRate", Math.round(completionRate * 100.0) / 100.0);
            
            // 취소율 통계
            long cancelledSchedulesInPeriod = scheduleRepository.countByStatusAndDateBetween(ScheduleStatus.CANCELLED.name(), thisMonthStart, today);
            double cancellationRate = totalSchedulesInPeriod > 0 ? ((double) cancelledSchedulesInPeriod / totalSchedulesInPeriod) * 100 : 0;
            
            statistics.put("cancelledSchedulesInPeriod", cancelledSchedulesInPeriod);
            statistics.put("cancellationRate", Math.round(cancellationRate * 100.0) / 100.0);
            
            // 주간 통계 (최근 7일)
            LocalDate weekAgo = today.minusDays(7);
            long weeklySchedules = scheduleRepository.countByDateBetween(weekAgo, today);
            long weeklyCompleted = scheduleRepository.countByStatusAndDateBetween(ScheduleStatus.COMPLETED.name(), weekAgo, today);
            long weeklyCancelled = scheduleRepository.countByStatusAndDateBetween(ScheduleStatus.CANCELLED.name(), weekAgo, today);
            
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
        
        LocalDate today = LocalDate.now();
        Map<String, Object> statistics = new HashMap<>();
        
        // 오늘의 총 상담 수
        long totalToday = scheduleRepository.countByDate(today);
        statistics.put("totalToday", totalToday);
        
        // 오늘의 완료된 상담 수
        long completedToday = scheduleRepository.countByDateAndStatus(today, ScheduleStatus.COMPLETED.name());
        statistics.put("completedToday", completedToday);
        
        // 오늘의 진행중인 상담 수
        long inProgressToday = 0; // IN_PROGRESS 상태가 없으므로 0으로 설정
        statistics.put("inProgressToday", inProgressToday);
        
        // 오늘의 취소된 상담 수
        long cancelledToday = scheduleRepository.countByDateAndStatus(today, ScheduleStatus.CANCELLED.name());
        statistics.put("cancelledToday", cancelledToday);
        
        // 오늘의 예약된 상담 수
        long bookedToday = scheduleRepository.countByDateAndStatus(today, ScheduleStatus.BOOKED.name());
        statistics.put("bookedToday", bookedToday);
        
        log.info("✅ 오늘의 스케줄 통계 조회 완료: 총 {}개, 완료 {}개, 진행중 {}개, 취소 {}개", 
                totalToday, completedToday, inProgressToday, cancelledToday);
        
        return statistics;
    }

    // ==================== 유틸리티 메서드 ====================

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
        // 첫 번째 스케줄이 두 번째 스케줄보다 먼저 끝나는 경우
        if (end1.isBefore(start2)) {
            long gapMinutes = ChronoUnit.MINUTES.between(end1, start2);
            return gapMinutes < ScheduleConstants.BREAK_TIME_MINUTES;
        }
        
        // 두 번째 스케줄이 첫 번째 스케줄보다 먼저 끝나는 경우
        if (end2.isBefore(start1)) {
            long gapMinutes = ChronoUnit.MINUTES.between(end2, start1);
            return gapMinutes < ScheduleConstants.BREAK_TIME_MINUTES;
        }
        
        // 시간이 겹치는 경우
        return true;
    }

    /**
     * 매핑의 회기 사용 처리
     */
    private void useSessionForMapping(Long consultantId, Long clientId) {
        log.debug("📅 매핑 회기 사용 처리: 상담사 {}, 내담자 {}", consultantId, clientId);
        
        List<ConsultantClientMapping> activeMappings = mappingRepository.findByStatus(
            ConsultantClientMapping.MappingStatus.ACTIVE);
        
        for (ConsultantClientMapping mapping : activeMappings) {
            if (mapping.getConsultant().getId().equals(consultantId) && 
                mapping.getClient().getId().equals(clientId)) {
                
                try {
                    mapping.useSession();
                    mappingRepository.save(mapping);
                    
                    // 🔄 회기 사용 후 전체 시스템 동기화
                    try {
                        sessionSyncService.syncAfterSessionUsage(mapping.getId(), consultantId, clientId);
                        log.info("✅ 회기 사용 후 동기화 완료: mappingId={}", mapping.getId());
                    } catch (Exception syncError) {
                        log.error("❌ 회기 사용 후 동기화 실패: mappingId={}, error={}", 
                                 mapping.getId(), syncError.getMessage(), syncError);
                        // 동기화 실패해도 회기 사용은 완료된 상태로 유지
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

    // ==================== 권한 검증 헬퍼 메서드 ====================

    /**
     * 관리자 역할 여부 확인
     */
    private boolean isAdminRole(String userRole) {
        return ScheduleConstants.ROLE_ADMIN.equals(userRole) || 
               ScheduleConstants.ROLE_HQ_MASTER.equals(userRole) || 
               ScheduleConstants.ROLE_BRANCH_HQ_MASTER.equals(userRole) ||
               ScheduleConstants.ROLE_BRANCH_MANAGER.equals(userRole) ||
               ScheduleConstants.ROLE_HQ_ADMIN.equals(userRole) ||
               ScheduleConstants.ROLE_SUPER_HQ_ADMIN.equals(userRole);
    }
    

    /**
     * 상담사 역할 여부 확인
     */
    private boolean isConsultantRole(String userRole) {
        return ScheduleConstants.ROLE_CONSULTANT.equals(userRole);
    }

    /**
     * 권한 기반 스케줄 조회 (상담사 이름 포함)
     */
    @Override
    public List<ScheduleDto> findSchedulesWithNamesByUserRole(Long userId, String userRole) {
        log.info("🔐 권한 기반 스케줄 조회 (이름 포함): 사용자 {}, 역할 {}", userId, userRole);
        
        // 먼저 자동 완료 처리 실행
        autoCompleteExpiredSchedules();
        
        List<Schedule> schedules;
        if (isAdminRole(userRole)) {
            // 관리자: 모든 스케줄 조회
            log.info("👑 관리자 권한으로 모든 스케줄 조회");
            schedules = scheduleRepository.findAll();
        } else if (isConsultantRole(userRole)) {
            // 상담사: 자신의 스케줄만 조회
            log.info("👨‍⚕️ 상담사 권한으로 자신의 스케줄만 조회: {}", userId);
            schedules = scheduleRepository.findByConsultantId(userId);
        } else if ("CLIENT".equals(userRole)) {
            // 내담자: 자신의 스케줄만 조회
            log.info("👤 내담자 권한으로 자신의 스케줄만 조회: {}", userId);
            schedules = scheduleRepository.findByClientId(userId);
        } else {
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }
        
        // Schedule을 ScheduleDto로 변환 (상담사 이름 포함)
        List<ScheduleDto> scheduleDtos = schedules.stream()
            .map(this::convertToScheduleDto)
            .collect(java.util.stream.Collectors.toList());
        
        // 휴가 데이터 추가
        List<ScheduleDto> vacationDtos = getVacationSchedules(userId, userRole);
        scheduleDtos.addAll(vacationDtos);
        
        log.info("📅 총 스케줄 데이터: 일반 {}개, 휴가 {}개, 합계 {}개", 
                schedules.size(), vacationDtos.size(), scheduleDtos.size());
        
        return scheduleDtos;
    }

    /**
     * 권한 기반 페이지네이션 스케줄 조회 (상담사 이름 포함)
     */
    @Override
    public Page<ScheduleDto> findSchedulesWithNamesByUserRolePaged(Long userId, String userRole, Pageable pageable) {
        log.info("🔐 권한 기반 페이지네이션 스케줄 조회 (이름 포함): 사용자 {}, 역할 {}, 페이지 {}", userId, userRole, pageable.getPageNumber());
        
        // 먼저 자동 완료 처리 실행
        autoCompleteExpiredSchedules();
        
        Page<Schedule> schedulePage;
        if (isAdminRole(userRole)) {
            // 관리자: 모든 스케줄 조회
            log.info("👑 관리자 권한으로 모든 스케줄 페이지네이션 조회");
            schedulePage = scheduleRepository.findAll(pageable);
        } else if (isConsultantRole(userRole)) {
            // 상담사: 자신의 스케줄만 조회
            log.info("👨‍⚕️ 상담사 권한으로 자신의 스케줄만 페이지네이션 조회: {}", userId);
            schedulePage = scheduleRepository.findByConsultantId(userId, pageable);
        } else if ("CLIENT".equals(userRole)) {
            // 내담자: 자신의 스케줄만 조회
            log.info("👤 내담자 권한으로 자신의 스케줄만 페이지네이션 조회: {}", userId);
            schedulePage = scheduleRepository.findByClientId(userId, pageable);
        } else {
            throw new RuntimeException("스케줄 조회 권한이 없습니다.");
        }
        
        // Schedule을 ScheduleDto로 변환 (상담사 이름 포함)
        return schedulePage.map(this::convertToScheduleDto);
    }

    /**
     * 휴가 데이터를 ScheduleDto로 변환
     */
    private List<ScheduleDto> getVacationSchedules(Long userId, String userRole) {
        log.info("🏖️ 휴가 스케줄 조회: 사용자 {}, 역할 {}", userId, userRole);
        
        List<Vacation> vacations;
        if (isAdminRole(userRole)) {
            // 관리자: 모든 상담사의 휴가 조회
            vacations = vacationRepository.findByIsDeletedFalseOrderByVacationDateAsc();
        } else if (isConsultantRole(userRole)) {
            // 상담사: 자신의 휴가만 조회
            vacations = vacationRepository.findByConsultantIdAndIsDeletedFalseOrderByVacationDateAsc(userId);
        } else {
            // 내담자: 휴가 조회 권한 없음
            return new ArrayList<>();
        }
        
        return vacations.stream()
            .map(this::convertVacationToScheduleDto)
            .collect(java.util.stream.Collectors.toList());
    }
    
    /**
     * Vacation 엔티티를 ScheduleDto로 변환
     */
    private ScheduleDto convertVacationToScheduleDto(Vacation vacation) {
        ScheduleDto dto = new ScheduleDto();
        dto.setId(vacation.getId() + 100000L); // 휴가 ID는 100000 이상으로 설정하여 구분
        dto.setConsultantId(vacation.getConsultantId());
        dto.setClientId(null); // 휴가는 내담자 없음
        dto.setDate(vacation.getVacationDate());
        dto.setStartTime(vacation.getStartTime() != null ? vacation.getStartTime() : LocalTime.of(0, 0));
        dto.setEndTime(vacation.getEndTime() != null ? vacation.getEndTime() : LocalTime.of(23, 59));
        dto.setStatus(ScheduleStatus.VACATION.name()); // 휴가 상태
        dto.setScheduleType("VACATION");
        dto.setConsultationType("VACATION");
        dto.setVacationType(vacation.getVacationType().name()); // 휴가 유형 추가
        dto.setDescription(vacation.getReason());
        dto.setCreatedAt(vacation.getCreatedAt());
        dto.setUpdatedAt(vacation.getUpdatedAt());
        
        // 상담사 이름 조회
        User consultant = userRepository.findById(vacation.getConsultantId()).orElse(null);
        if (consultant != null) {
            dto.setConsultantName(consultant.getName());
        }
        
        // 휴가 제목 생성
        String vacationTitle = getVacationTitle(vacation);
        dto.setTitle(vacationTitle);
        
        return dto;
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
            // 데이터베이스에서 휴가 타입 코드 조회
            String codeName = commonCodeService.getCodeName("VACATION_TYPE", type.name());
            if (!codeName.equals(type.name())) {
                return codeName; // 데이터베이스에서 찾은 한글명 반환
            }
        } catch (Exception e) {
            log.warn("휴가 타입 코드 조회 실패: {} -> 기본값 사용", type.name());
        }
        
        // 데이터베이스에서 찾지 못한 경우 기본값 사용
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
    private ScheduleDto convertToScheduleDto(Schedule schedule) {
        // 상담사 정보 조회
        String consultantName = "알 수 없음";
        String clientName = "알 수 없음";
        
        try {
            User consultant = userRepository.findById(schedule.getConsultantId()).orElse(null);
            if (consultant != null) {
                consultantName = consultant.getName();
            }
            
            // 클라이언트 정보가 있다면 조회
            if (schedule.getClientId() != null) {
                User client = userRepository.findById(schedule.getClientId()).orElse(null);
                if (client != null) {
                    clientName = client.getName();
                }
            }
        } catch (Exception e) {
            log.warn("상담사/클라이언트 정보 조회 실패: {}", e.getMessage());
        }
        
        return ScheduleDto.builder()
            .id(schedule.getId())
            .consultantId(schedule.getConsultantId())
            .consultantName(consultantName)
            .clientId(schedule.getClientId())
            .clientName(clientName)
            .date(schedule.getDate())
            .startTime(schedule.getStartTime())
            .endTime(schedule.getEndTime())
            .status(convertStatusToKorean(schedule.getStatus().name()))
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

    // ==================== 자동 완료 처리 메서드 ====================

    /**
     * 시간이 지난 확정된 스케줄을 자동으로 완료 처리
     */
    @Override
    @Transactional
    public void autoCompleteExpiredSchedules() {
        log.info("🔄 시간이 지난 스케줄 자동 완료 처리 시작");
        
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();
        
        int completedCount = 0;
        
        try {
            // 1. 오늘 날짜이고 현재 시간을 지난 확정된 스케줄 조회
            List<Schedule> todayExpiredSchedules = scheduleRepository.findExpiredConfirmedSchedules(today, currentTime);
            
            for (Schedule schedule : todayExpiredSchedules) {
                try {
                    // 최신 버전으로 다시 조회하여 버전 충돌 방지
                    Schedule latestSchedule = scheduleRepository.findById(schedule.getId()).orElse(null);
                    if (latestSchedule != null && ScheduleStatus.BOOKED.equals(latestSchedule.getStatus())) {
                        latestSchedule.setStatus(ScheduleStatus.COMPLETED);
                        latestSchedule.setUpdatedAt(LocalDateTime.now());
                        scheduleRepository.save(latestSchedule);
                        completedCount++;
                        
                        log.info("✅ 오늘 스케줄 자동 완료: ID={}, 제목={}, 시간={}", 
                            latestSchedule.getId(), latestSchedule.getTitle(), latestSchedule.getStartTime());
                    }
                } catch (Exception e) {
                    log.error("❌ 오늘 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
                }
            }
            
            // 2. 지난 날짜의 예약된/확정된 스케줄 조회 (오늘 이전)
            List<Schedule> pastBookedSchedules = scheduleRepository.findByDateBeforeAndStatus(today, ScheduleConstants.STATUS_BOOKED);
            List<Schedule> pastConfirmedSchedules = scheduleRepository.findByDateBeforeAndStatus(today, ScheduleConstants.STATUS_CONFIRMED);
            
            // 예약됨 상태의 지난 스케줄 처리
            for (Schedule schedule : pastBookedSchedules) {
                try {
                    Schedule latestSchedule = scheduleRepository.findById(schedule.getId()).orElse(null);
                    if (latestSchedule != null && ScheduleConstants.STATUS_BOOKED.equals(latestSchedule.getStatus())) {
                        latestSchedule.setStatus(ScheduleConstants.STATUS_COMPLETED);
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
            
            // 확정됨 상태의 지난 스케줄 처리
            for (Schedule schedule : pastConfirmedSchedules) {
                try {
                    Schedule latestSchedule = scheduleRepository.findById(schedule.getId()).orElse(null);
                    if (latestSchedule != null && ScheduleStatus.BOOKED.equals(latestSchedule.getStatus())) {
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
        if (schedule == null || !ScheduleConstants.STATUS_CONFIRMED.equals(schedule.getStatus())) {
            return false;
        }
        
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();
        
        // 오늘 날짜이고 현재 시간이 종료 시간을 지났는지 확인
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
    
    // ==================== 지점별 스케줄 관리 ====================
    
    @Override
    public List<Schedule> getBranchSchedules(Long branchId, LocalDate startDate, LocalDate endDate) {
        log.info("🏢 지점별 스케줄 조회: branchId={}, startDate={}, endDate={}", branchId, startDate, endDate);
        
        try {
            // 지점 조회
            Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("지점을 찾을 수 없습니다: " + branchId));
            
            // 지점의 상담사들 조회
            List<User> consultants = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUsername(
                branch, "CONSULTANT");
            if (consultants.isEmpty()) {
                log.warn("지점에 상담사가 없습니다: branchId={}", branchId);
                return new ArrayList<>();
            }
            
            // 상담사들의 스케줄 조회
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
            // 상담사가 해당 지점에 속하는지 확인
            User consultant = userRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + consultantId));
            
            if (consultant.getBranch() == null || !consultant.getBranch().getId().equals(branchId)) {
                throw new IllegalArgumentException("상담사가 해당 지점에 속하지 않습니다: consultantId=" + consultantId + ", branchId=" + branchId);
            }
            
            // 상담사의 스케줄 조회
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
            
            // 상태별 통계
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
            
            // 상담사별 통계
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
            // 지점 조회
            Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException("지점을 찾을 수 없습니다: " + branchId));
            
            // 지점의 상담사들 조회
            List<User> consultants = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUsername(
                branch, "CONSULTANT");
            
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
            // 상담사가 해당 지점에 속하는지 확인
            if (schedule.getConsultantId() != null) {
                User consultant = userRepository.findById(schedule.getConsultantId())
                    .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + schedule.getConsultantId()));
                
                if (consultant.getBranch() == null || !consultant.getBranch().getId().equals(branchId)) {
                    throw new IllegalArgumentException("상담사가 해당 지점에 속하지 않습니다: consultantId=" + schedule.getConsultantId() + ", branchId=" + branchId);
                }
            }
            
            // 스케줄 생성
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
            // 기존 스케줄 조회
            Schedule existingSchedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("스케줄을 찾을 수 없습니다: " + scheduleId));
            
            // 상담사가 해당 지점에 속하는지 확인
            if (existingSchedule.getConsultantId() != null) {
                User consultant = userRepository.findById(existingSchedule.getConsultantId())
                    .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + existingSchedule.getConsultantId()));
                
                if (consultant.getBranch() == null || !consultant.getBranch().getId().equals(branchId)) {
                    throw new IllegalArgumentException("상담사가 해당 지점에 속하지 않습니다: consultantId=" + existingSchedule.getConsultantId() + ", branchId=" + branchId);
                }
            }
            
            // 스케줄 수정
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
            // 기존 스케줄 조회
            Schedule existingSchedule = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("스케줄을 찾을 수 없습니다: " + scheduleId));
            
            // 상담사가 해당 지점에 속하는지 확인
            if (existingSchedule.getConsultantId() != null) {
                User consultant = userRepository.findById(existingSchedule.getConsultantId())
                    .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + existingSchedule.getConsultantId()));
                
                if (consultant.getBranch() == null || !consultant.getBranch().getId().equals(branchId)) {
                    throw new IllegalArgumentException("상담사가 해당 지점에 속하지 않습니다: consultantId=" + existingSchedule.getConsultantId() + ", branchId=" + branchId);
                }
            }
            
            // 스케줄 삭제
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
            // 상담사가 해당 지점에 속하는지 확인
            User consultant = userRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + consultantId));
            
            if (consultant.getBranch() == null || !consultant.getBranch().getId().equals(branchId)) {
                throw new IllegalArgumentException("상담사가 해당 지점에 속하지 않습니다: consultantId=" + consultantId + ", branchId=" + branchId);
            }
            
            // 시간대 중복 확인
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
            // 상담사가 해당 지점에 속하는지 확인
            User consultant = userRepository.findById(consultantId)
                .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + consultantId));
            
            if (consultant.getBranch() == null || !consultant.getBranch().getId().equals(branchId)) {
                throw new IllegalArgumentException("상담사가 해당 지점에 속하지 않습니다: consultantId=" + consultantId + ", branchId=" + branchId);
            }
            
            // 기존 스케줄 조회
            List<Schedule> existingSchedules = scheduleRepository.findByConsultantIdAndDate(consultantId, date);
            
            // 가능한 시간대 계산 (9시-18시, 1시간 단위)
            List<Map<String, Object>> availableSlots = new ArrayList<>();
            LocalTime startHour = LocalTime.of(9, 0);
            LocalTime endHour = LocalTime.of(18, 0);
            
            for (LocalTime time = startHour; time.isBefore(endHour); time = time.plusHours(1)) {
                LocalTime slotEnd = time.plusHours(1);
                LocalDateTime slotStart = date.atTime(time);
                LocalDateTime slotEndDateTime = date.atTime(slotEnd);
                
                // 중복 확인
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
}
