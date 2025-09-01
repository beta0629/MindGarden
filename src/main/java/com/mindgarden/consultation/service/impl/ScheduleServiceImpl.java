package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.constant.ConsultationType;
import com.mindgarden.consultation.constant.ScheduleConstants;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.repository.ConsultantClientMappingRepository;
import com.mindgarden.consultation.repository.ScheduleRepository;
import com.mindgarden.consultation.service.ScheduleService;
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
        
        // 1. 매핑 상태 검증
        if (!validateMappingForSchedule(consultantId, clientId)) {
            throw new RuntimeException("상담사와 내담자 간의 유효한 매핑이 없거나 승인되지 않았습니다.");
        }
        
        // 2. 회기 수 검증
        if (!validateRemainingSessions(consultantId, clientId)) {
            throw new RuntimeException("사용 가능한 회기가 없습니다.");
        }
        
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
        return scheduleRepository.findByConsultantId(consultantId);
    }

    @Override
    public List<Schedule> findByConsultantIdAndDate(Long consultantId, LocalDate date) {
        return scheduleRepository.findByConsultantIdAndDate(consultantId, date);
    }

    @Override
    public List<Schedule> findByConsultantIdAndDateBetween(Long consultantId, LocalDate startDate, LocalDate endDate) {
        return scheduleRepository.findByConsultantIdAndDateBetween(consultantId, startDate, endDate);
    }

    // ==================== 내담자별 스케줄 관리 ====================

    @Override
    public List<Schedule> findByClientId(Long clientId) {
        return scheduleRepository.findByClientId(clientId);
    }

    @Override
    public List<Schedule> findByClientIdAndDate(Long clientId, LocalDate date) {
        return scheduleRepository.findByClientIdAndDate(clientId, date);
    }

    @Override
    public List<Schedule> findByClientIdAndDateBetween(Long clientId, LocalDate startDate, LocalDate endDate) {
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
    public Map<String, Object> getScheduleStatisticsForAdmin() {
        log.info("📊 관리자용 전체 스케줄 통계 조회");
        
        Map<String, Object> statistics = new HashMap<>();
        
        // 전체 스케줄 수
        long totalSchedules = scheduleRepository.count();
        statistics.put("totalSchedules", totalSchedules);
        
        // 상담사별 스케줄 수
        List<Object[]> consultantStats = scheduleRepository.countSchedulesByConsultant();
        statistics.put("consultantStats", consultantStats);
        
        // 날짜별 스케줄 수 (최근 30일)
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(ScheduleConstants.MAX_ADVANCE_BOOKING_DAYS);
        List<Object[]> dailyStats = scheduleRepository.countSchedulesByDateBetween(startDate, endDate);
        statistics.put("dailyStats", dailyStats);
        
        // 상태별 스케줄 수
        List<Object[]> statusStats = scheduleRepository.countSchedulesByStatus();
        statistics.put("statusStats", statusStats);
        
        log.info("✅ 관리자용 스케줄 통계 조회 완료: 총 {}개 스케줄", totalSchedules);
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
}
