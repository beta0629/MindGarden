package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.constant.ConsultationType;
import com.mindgarden.consultation.constant.ScheduleConstants;
import com.mindgarden.consultation.dto.ScheduleDto;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.ConsultantClientMappingRepository;
import com.mindgarden.consultation.repository.ScheduleRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.CodeManagementService;
import com.mindgarden.consultation.service.ScheduleService;
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
    private final CodeManagementService codeManagementService;
    
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
        schedule.setStatus(ScheduleConstants.STATUS_BOOKED);
        
        Schedule savedSchedule = scheduleRepository.save(schedule);
        
        // 5. 회기 사용 처리
        useSessionForMapping(consultantId, clientId);
        
        log.info("✅ 상담사 스케줄 생성 완료: ID {}", savedSchedule.getId());
        return savedSchedule;
    }

    @Override
    public Schedule createConsultantSchedule(Long consultantId, Long clientId, LocalDate date, 
                                          LocalTime startTime, LocalTime endTime, String title, String description, String consultationType) {
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
        schedule.setStatus(ScheduleConstants.STATUS_BOOKED);
        schedule.setConsultationType(consultationType); // 상담 유형 설정
        
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
        schedule.setStatus(ScheduleConstants.STATUS_BOOKED);
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
        schedule.setStatus(ScheduleConstants.STATUS_CANCELLED);
        schedule.setDescription(reason);
        return scheduleRepository.save(schedule);
    }

    @Override
    public Schedule confirmSchedule(Long scheduleId, String adminNote) {
        log.info("✅ 예약 확정: ID {}, 관리자 메모: {}", scheduleId, adminNote);
        Schedule schedule = findById(scheduleId);
        
        // 예약 확정 상태로 변경
        schedule.setStatus(ScheduleConstants.STATUS_CONFIRMED);
        
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
        schedule.setStatus(ScheduleConstants.STATUS_COMPLETED);
        return scheduleRepository.save(schedule);
    }

    @Override
    public Schedule blockSchedule(Long scheduleId, String reason) {
        log.info("🚫 스케줄 차단: ID {}, 사유: {}", scheduleId, reason);
        Schedule schedule = findById(scheduleId);
        schedule.block(reason);
        return scheduleRepository.save(schedule);
    }

    // ==================== 스케줄 검증 및 검사 ====================

    @Override
    public boolean hasTimeConflict(Long consultantId, LocalDate date, LocalTime startTime, LocalTime endTime, Long excludeScheduleId) {
        log.debug("⏰ 시간 충돌 검사 (기본): 상담사 {}, 날짜 {}, 시간 {} - {}", consultantId, date, startTime, endTime);
        
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
        
        // 2. 기본 시간 충돌 검사
        if (hasTimeConflict(consultantId, date, startTime, endTime, excludeScheduleId)) {
            return true;
        }
        
        // 3. 쉬는 시간을 고려한 추가 검사
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
            .filter(s -> ScheduleConstants.STATUS_BOOKED.equals(s.getStatus()) || ScheduleConstants.STATUS_IN_PROGRESS.equals(s.getStatus()))
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
        stats.put("bookedSchedules", schedules.stream().filter(s -> ScheduleConstants.STATUS_BOOKED.equals(s.getStatus())).count());
        stats.put("completedSchedules", schedules.stream().filter(s -> ScheduleConstants.STATUS_COMPLETED.equals(s.getStatus())).count());
        stats.put("cancelledSchedules", schedules.stream().filter(s -> ScheduleConstants.STATUS_CANCELLED.equals(s.getStatus())).count());
        
        return stats;
    }

    @Override
    public Map<String, Object> getClientScheduleStats(Long clientId, LocalDate startDate, LocalDate endDate) {
        log.info("📊 내담자 스케줄 통계: ID {}, 기간 {} - {}", clientId, startDate, endDate);
        
        List<Schedule> schedules = findByClientIdAndDateBetween(clientId, startDate, endDate);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSchedules", schedules.size());
        stats.put("bookedSchedules", schedules.stream().filter(s -> ScheduleConstants.STATUS_BOOKED.equals(s.getStatus())).count());
        stats.put("completedSchedules", schedules.stream().filter(s -> ScheduleConstants.STATUS_COMPLETED.equals(s.getStatus())).count());
        stats.put("cancelledSchedules", schedules.stream().filter(s -> ScheduleConstants.STATUS_CANCELLED.equals(s.getStatus())).count());
        
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
            long bookedSchedules, confirmedSchedules, completedSchedules, cancelledSchedules, inProgressSchedules;
            
            if (start != null && end != null) {
                bookedSchedules = scheduleRepository.countByStatusAndDateBetween(ScheduleConstants.STATUS_BOOKED, start, end);
                confirmedSchedules = scheduleRepository.countByStatusAndDateBetween(ScheduleConstants.STATUS_CONFIRMED, start, end);
                completedSchedules = scheduleRepository.countByStatusAndDateBetween(ScheduleConstants.STATUS_COMPLETED, start, end);
                cancelledSchedules = scheduleRepository.countByStatusAndDateBetween(ScheduleConstants.STATUS_CANCELLED, start, end);
                inProgressSchedules = scheduleRepository.countByStatusAndDateBetween(ScheduleConstants.STATUS_IN_PROGRESS, start, end);
            } else if (start != null) {
                bookedSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(ScheduleConstants.STATUS_BOOKED, start);
                confirmedSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(ScheduleConstants.STATUS_CONFIRMED, start);
                completedSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(ScheduleConstants.STATUS_COMPLETED, start);
                cancelledSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(ScheduleConstants.STATUS_CANCELLED, start);
                inProgressSchedules = scheduleRepository.countByStatusAndDateGreaterThanEqual(ScheduleConstants.STATUS_IN_PROGRESS, start);
            } else if (end != null) {
                bookedSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(ScheduleConstants.STATUS_BOOKED, end);
                confirmedSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(ScheduleConstants.STATUS_CONFIRMED, end);
                completedSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(ScheduleConstants.STATUS_COMPLETED, end);
                cancelledSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(ScheduleConstants.STATUS_CANCELLED, end);
                inProgressSchedules = scheduleRepository.countByStatusAndDateLessThanEqual(ScheduleConstants.STATUS_IN_PROGRESS, end);
            } else {
                bookedSchedules = scheduleRepository.countByStatus(ScheduleConstants.STATUS_BOOKED);
                confirmedSchedules = scheduleRepository.countByStatus(ScheduleConstants.STATUS_CONFIRMED);
                completedSchedules = scheduleRepository.countByStatus(ScheduleConstants.STATUS_COMPLETED);
                cancelledSchedules = scheduleRepository.countByStatus(ScheduleConstants.STATUS_CANCELLED);
                inProgressSchedules = scheduleRepository.countByStatus(ScheduleConstants.STATUS_IN_PROGRESS);
            }
            
            statistics.put("bookedSchedules", bookedSchedules);
            statistics.put("confirmedSchedules", confirmedSchedules);
            statistics.put("completedSchedules", completedSchedules);
            statistics.put("cancelledSchedules", cancelledSchedules);
            statistics.put("inProgressSchedules", inProgressSchedules);
            
            log.info("📊 상태별 스케줄 수 - 예약: {}, 확정: {}, 완료: {}, 취소: {}, 진행중: {}", 
                    bookedSchedules, confirmedSchedules, completedSchedules, cancelledSchedules, inProgressSchedules);
            
            // 오늘의 통계
            LocalDate today = LocalDate.now();
            log.info("📊 오늘의 통계 조회 중... (날짜: {})", today);
            long totalToday = scheduleRepository.countByDate(today);
            long bookedToday = scheduleRepository.countByDateAndStatus(today, ScheduleConstants.STATUS_BOOKED);
            long confirmedToday = scheduleRepository.countByDateAndStatus(today, ScheduleConstants.STATUS_CONFIRMED);
            long completedToday = scheduleRepository.countByDateAndStatus(today, ScheduleConstants.STATUS_COMPLETED);
            long cancelledToday = scheduleRepository.countByDateAndStatus(today, ScheduleConstants.STATUS_CANCELLED);
            long inProgressToday = scheduleRepository.countByDateAndStatus(today, ScheduleConstants.STATUS_IN_PROGRESS);
            
            statistics.put("totalToday", totalToday);
            statistics.put("bookedToday", bookedToday);
            statistics.put("confirmedToday", confirmedToday);
            statistics.put("completedToday", completedToday);
            statistics.put("cancelledToday", cancelledToday);
            statistics.put("inProgressToday", inProgressToday);
            
            log.info("📊 오늘의 통계 - 총: {}, 예약: {}, 확정: {}, 완료: {}, 취소: {}, 진행중: {}", 
                    totalToday, bookedToday, confirmedToday, completedToday, cancelledToday, inProgressToday);
            
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
            long completedSchedulesInPeriod = scheduleRepository.countByStatusAndDateBetween(ScheduleConstants.STATUS_COMPLETED, thisMonthStart, today);
            double completionRate = totalSchedulesInPeriod > 0 ? ((double) completedSchedulesInPeriod / totalSchedulesInPeriod) * 100 : 0;
            
            statistics.put("totalSchedulesInPeriod", totalSchedulesInPeriod);
            statistics.put("completedSchedulesInPeriod", completedSchedulesInPeriod);
            statistics.put("completionRate", Math.round(completionRate * 100.0) / 100.0);
            
            // 취소율 통계
            long cancelledSchedulesInPeriod = scheduleRepository.countByStatusAndDateBetween(ScheduleConstants.STATUS_CANCELLED, thisMonthStart, today);
            double cancellationRate = totalSchedulesInPeriod > 0 ? ((double) cancelledSchedulesInPeriod / totalSchedulesInPeriod) * 100 : 0;
            
            statistics.put("cancelledSchedulesInPeriod", cancelledSchedulesInPeriod);
            statistics.put("cancellationRate", Math.round(cancellationRate * 100.0) / 100.0);
            
            // 주간 통계 (최근 7일)
            LocalDate weekAgo = today.minusDays(7);
            long weeklySchedules = scheduleRepository.countByDateBetween(weekAgo, today);
            long weeklyCompleted = scheduleRepository.countByStatusAndDateBetween(ScheduleConstants.STATUS_COMPLETED, weekAgo, today);
            long weeklyCancelled = scheduleRepository.countByStatusAndDateBetween(ScheduleConstants.STATUS_CANCELLED, weekAgo, today);
            
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
        long completedToday = scheduleRepository.countByDateAndStatus(today, ScheduleConstants.STATUS_COMPLETED);
        statistics.put("completedToday", completedToday);
        
        // 오늘의 진행중인 상담 수
        long inProgressToday = scheduleRepository.countByDateAndStatus(today, ScheduleConstants.STATUS_IN_PROGRESS);
        statistics.put("inProgressToday", inProgressToday);
        
        // 오늘의 취소된 상담 수
        long cancelledToday = scheduleRepository.countByDateAndStatus(today, ScheduleConstants.STATUS_CANCELLED);
        statistics.put("cancelledToday", cancelledToday);
        
        // 오늘의 예약된 상담 수
        long bookedToday = scheduleRepository.countByDateAndStatus(today, ScheduleConstants.STATUS_BOOKED);
        statistics.put("bookedToday", bookedToday);
        
        // 오늘의 확정된 상담 수
        long confirmedToday = scheduleRepository.countByDateAndStatus(today, ScheduleConstants.STATUS_CONFIRMED);
        statistics.put("confirmedToday", confirmedToday);
        
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
        return ScheduleConstants.ROLE_ADMIN.equals(userRole) || ScheduleConstants.ROLE_SUPER_ADMIN.equals(userRole);
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
        return schedules.stream()
            .map(this::convertToScheduleDto)
            .collect(java.util.stream.Collectors.toList());
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
            .status(convertStatusToKorean(schedule.getStatus()))
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
            return codeManagementService.getCodeName("SCHEDULE_STATUS", status);
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
            return codeManagementService.getCodeName("SCHEDULE_TYPE", scheduleType);
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
            return codeManagementService.getCodeName("CONSULTATION_TYPE", consultationType);
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
    public void autoCompleteExpiredSchedules() {
        log.info("🔄 시간이 지난 스케줄 자동 완료 처리 시작");
        
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalTime currentTime = now.toLocalTime();
        
        int completedCount = 0;
        
        // 1. 오늘 날짜이고 현재 시간을 지난 확정된 스케줄 조회
        List<Schedule> todayExpiredSchedules = scheduleRepository.findExpiredConfirmedSchedules(today, currentTime);
        
        for (Schedule schedule : todayExpiredSchedules) {
            try {
                schedule.setStatus(ScheduleConstants.STATUS_COMPLETED);
                schedule.setUpdatedAt(LocalDateTime.now());
                scheduleRepository.save(schedule);
                completedCount++;
                
                log.info("✅ 오늘 스케줄 자동 완료: ID={}, 제목={}, 시간={}", 
                    schedule.getId(), schedule.getTitle(), schedule.getStartTime());
                
            } catch (Exception e) {
                log.error("❌ 오늘 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
            }
        }
        
        // 2. 지난 날짜의 예약된/확정된 스케줄 조회 (오늘 이전)
        // 예약됨(BOOKED) 상태의 지난 스케줄도 완료 처리
        List<Schedule> pastBookedSchedules = scheduleRepository.findByDateBeforeAndStatus(today, ScheduleConstants.STATUS_BOOKED);
        List<Schedule> pastConfirmedSchedules = scheduleRepository.findByDateBeforeAndStatus(today, ScheduleConstants.STATUS_CONFIRMED);
        
        // 예약됨 상태의 지난 스케줄 처리
        for (Schedule schedule : pastBookedSchedules) {
            try {
                schedule.setStatus(ScheduleConstants.STATUS_COMPLETED);
                schedule.setUpdatedAt(LocalDateTime.now());
                scheduleRepository.save(schedule);
                completedCount++;
                
                log.info("✅ 지난 예약 스케줄 자동 완료: ID={}, 제목={}, 날짜={}, 시간={}", 
                    schedule.getId(), schedule.getTitle(), schedule.getDate(), schedule.getStartTime());
                
            } catch (Exception e) {
                log.error("❌ 지난 예약 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
            }
        }
        
        // 확정됨 상태의 지난 스케줄 처리
        for (Schedule schedule : pastConfirmedSchedules) {
            try {
                schedule.setStatus(ScheduleConstants.STATUS_COMPLETED);
                schedule.setUpdatedAt(LocalDateTime.now());
                scheduleRepository.save(schedule);
                completedCount++;
                
                log.info("✅ 지난 확정 스케줄 자동 완료: ID={}, 제목={}, 날짜={}, 시간={}", 
                    schedule.getId(), schedule.getTitle(), schedule.getDate(), schedule.getStartTime());
                
            } catch (Exception e) {
                log.error("❌ 지난 확정 스케줄 자동 완료 실패: ID={}, 오류={}", schedule.getId(), e.getMessage());
            }
        }
        
        log.info("🔄 자동 완료 처리 완료: {}개 스케줄 처리됨 (오늘: {}, 지난예약: {}, 지난확정: {})", 
            completedCount, todayExpiredSchedules.size(), pastBookedSchedules.size(), pastConfirmedSchedules.size());
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
}
