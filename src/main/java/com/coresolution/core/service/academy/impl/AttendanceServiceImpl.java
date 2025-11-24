package com.coresolution.core.service.academy.impl;

import com.coresolution.core.domain.academy.Attendance;
import com.coresolution.core.domain.academy.ClassEnrollment;
import com.coresolution.core.dto.academy.AttendanceRequest;
import com.coresolution.core.dto.academy.AttendanceResponse;
import com.coresolution.core.dto.academy.AttendanceStatisticsResponse;
import com.coresolution.core.repository.academy.AttendanceRepository;
import com.coresolution.core.repository.academy.ClassEnrollmentRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.academy.AttendanceService;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 출결 서비스 구현체
 * 학원 시스템의 출결 관리 비즈니스 로직 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-19
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {
    
    private final AttendanceRepository attendanceRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final TenantAccessControlService accessControlService;
    private final NotificationService notificationService;
    
    // ==================== AttendanceService 구현 ====================
    
    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendances(String tenantId, Long branchId, String enrollmentId, String scheduleId, LocalDate date) {
        log.debug("출결 목록 조회: tenantId={}, branchId={}, enrollmentId={}, scheduleId={}, date={}", 
            tenantId, branchId, enrollmentId, scheduleId, date);
        
        accessControlService.validateTenantAccess(tenantId);
        
        List<Attendance> attendances;
        
        if (enrollmentId != null && !enrollmentId.isEmpty()) {
            attendances = attendanceRepository.findByTenantIdAndEnrollmentIdAndIsDeletedFalse(tenantId, enrollmentId);
        } else if (scheduleId != null && !scheduleId.isEmpty()) {
            attendances = attendanceRepository.findByTenantIdAndScheduleIdAndIsDeletedFalse(tenantId, scheduleId);
        } else if (date != null && branchId != null) {
            attendances = attendanceRepository.findAttendancesByDate(tenantId, branchId, date);
        } else if (branchId != null) {
            attendances = attendanceRepository.findByTenantIdAndBranchIdAndIsDeletedFalse(tenantId, branchId);
        } else {
            attendances = attendanceRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        }
        
        return attendances.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public AttendanceResponse getAttendance(String tenantId, String attendanceId) {
        log.debug("출결 상세 조회: tenantId={}, attendanceId={}", tenantId, attendanceId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        Attendance attendance = attendanceRepository.findByAttendanceIdAndIsDeletedFalse(attendanceId)
            .orElseThrow(() -> new RuntimeException("출결을 찾을 수 없습니다: " + attendanceId));
        
        if (!tenantId.equals(attendance.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        return toResponse(attendance);
    }
    
    @Override
    public AttendanceResponse createAttendance(String tenantId, AttendanceRequest request, String recordedBy) {
        log.info("출결 기록 생성: tenantId={}, enrollmentId={}", tenantId, request.getEnrollmentId());
        
        accessControlService.validateTenantAccess(tenantId);
        
        // 중복 체크 (같은 enrollment, schedule, date 조합)
        if (request.getScheduleId() != null && !request.getScheduleId().isEmpty()) {
            Optional<Attendance> existing = attendanceRepository.findAttendanceByEnrollmentAndScheduleAndDate(
                tenantId, request.getEnrollmentId(), request.getScheduleId(), request.getAttendanceDate());
            
            if (existing.isPresent() && !existing.get().getIsDeleted()) {
                throw new RuntimeException("이미 해당 날짜의 출결 기록이 존재합니다.");
            }
        }
        
        Attendance attendance = Attendance.builder()
            .attendanceId(UUID.randomUUID().toString())
            .tenantId(tenantId)
            .branchId(request.getBranchId())
            .enrollmentId(request.getEnrollmentId())
            .scheduleId(request.getScheduleId())
            .attendanceDate(request.getAttendanceDate())
            .attendanceTime(request.getAttendanceTime() != null ? request.getAttendanceTime() : java.time.LocalTime.now())
            .status(request.getStatus())
            .recordedAt(LocalDateTime.now())
            .recordedBy(recordedBy)
            .recordingMethod(request.getRecordingMethod() != null ? request.getRecordingMethod() : Attendance.RecordingMethod.MANUAL)
            .notes(request.getNotes())
            .excuseReason(request.getExcuseReason())
            .createdBy(recordedBy)
            .isDeleted(false)
            .build();
        
        Attendance saved = attendanceRepository.save(attendance);
        
        log.info("✅ 출결 기록 생성 완료: attendanceId={}", saved.getAttendanceId());
        return toResponse(saved);
    }
    
    @Override
    public AttendanceResponse updateAttendance(String tenantId, String attendanceId, AttendanceRequest request, String updatedBy) {
        log.info("출결 기록 수정: tenantId={}, attendanceId={}", tenantId, attendanceId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        Attendance attendance = attendanceRepository.findByAttendanceIdAndIsDeletedFalse(attendanceId)
            .orElseThrow(() -> new RuntimeException("출결을 찾을 수 없습니다: " + attendanceId));
        
        if (!tenantId.equals(attendance.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // 업데이트
        attendance.setBranchId(request.getBranchId());
        attendance.setEnrollmentId(request.getEnrollmentId());
        attendance.setScheduleId(request.getScheduleId());
        attendance.setAttendanceDate(request.getAttendanceDate());
        if (request.getAttendanceTime() != null) {
            attendance.setAttendanceTime(request.getAttendanceTime());
        }
        attendance.setStatus(request.getStatus());
        if (request.getRecordingMethod() != null) {
            attendance.setRecordingMethod(request.getRecordingMethod());
        }
        attendance.setNotes(request.getNotes());
        attendance.setExcuseReason(request.getExcuseReason());
        attendance.setUpdatedBy(updatedBy);
        attendance.setUpdatedAt(LocalDateTime.now());
        
        Attendance saved = attendanceRepository.save(attendance);
        
        log.info("✅ 출결 기록 수정 완료: attendanceId={}", saved.getAttendanceId());
        return toResponse(saved);
    }
    
    @Override
    public void deleteAttendance(String tenantId, String attendanceId, String deletedBy) {
        log.info("출결 기록 삭제: tenantId={}, attendanceId={}", tenantId, attendanceId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        Attendance attendance = attendanceRepository.findByAttendanceIdAndIsDeletedFalse(attendanceId)
            .orElseThrow(() -> new RuntimeException("출결을 찾을 수 없습니다: " + attendanceId));
        
        if (!tenantId.equals(attendance.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        attendance.setIsDeleted(true);
        attendance.setUpdatedBy(deletedBy);
        attendance.setUpdatedAt(LocalDateTime.now());
        
        attendanceRepository.save(attendance);
        
        log.info("✅ 출결 기록 삭제 완료: attendanceId={}", attendanceId);
    }
    
    @Override
    public AttendanceResponse updateAttendanceStatus(String tenantId, String attendanceId, Attendance.AttendanceStatus status, String updatedBy) {
        log.info("출결 상태 변경: tenantId={}, attendanceId={}, status={}", tenantId, attendanceId, status);
        
        accessControlService.validateTenantAccess(tenantId);
        
        Attendance attendance = attendanceRepository.findByAttendanceIdAndIsDeletedFalse(attendanceId)
            .orElseThrow(() -> new RuntimeException("출결을 찾을 수 없습니다: " + attendanceId));
        
        if (!tenantId.equals(attendance.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        attendance.setStatus(status);
        attendance.setUpdatedBy(updatedBy);
        attendance.setUpdatedAt(LocalDateTime.now());
        
        Attendance saved = attendanceRepository.save(attendance);
        
        log.info("✅ 출결 상태 변경 완료: attendanceId={}, status={}", saved.getAttendanceId(), status);
        return toResponse(saved);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendancesByEnrollment(String tenantId, String enrollmentId) {
        log.debug("수강생별 출결 조회: tenantId={}, enrollmentId={}", tenantId, enrollmentId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        List<Attendance> attendances = attendanceRepository.findAttendancesByEnrollmentId(tenantId, enrollmentId);
        
        return attendances.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendancesByDate(String tenantId, Long branchId, LocalDate date) {
        log.debug("날짜별 출결 조회: tenantId={}, branchId={}, date={}", tenantId, branchId, date);
        
        accessControlService.validateTenantAccess(tenantId);
        
        List<Attendance> attendances = attendanceRepository.findAttendancesByDate(tenantId, branchId, date);
        
        return attendances.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendancesByDateRange(String tenantId, String enrollmentId, LocalDate startDate, LocalDate endDate) {
        log.debug("기간별 출결 조회: tenantId={}, enrollmentId={}, startDate={}, endDate={}", 
            tenantId, enrollmentId, startDate, endDate);
        
        accessControlService.validateTenantAccess(tenantId);
        
        List<Attendance> attendances = attendanceRepository.findAttendancesByDateRange(tenantId, enrollmentId, startDate, endDate);
        
        return attendances.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public double calculateAttendanceRate(String tenantId, String enrollmentId) {
        log.debug("출석률 계산: tenantId={}, enrollmentId={}", tenantId, enrollmentId);
        
        accessControlService.validateTenantAccess(tenantId);
        
        Long presentCount = attendanceRepository.countPresentAttendances(tenantId, enrollmentId);
        Long totalCount = attendanceRepository.countTotalAttendances(tenantId, enrollmentId);
        
        if (totalCount == null || totalCount == 0) {
            return 0.0;
        }
        
        return (double) presentCount / totalCount * 100.0;
    }
    
    @Override
    @Transactional(readOnly = true)
    public AttendanceStatisticsResponse getAttendanceStatistics(String tenantId, String enrollmentId, LocalDate startDate, LocalDate endDate) {
        log.debug("출결 통계 조회: tenantId={}, enrollmentId={}, startDate={}, endDate={}", 
            tenantId, enrollmentId, startDate, endDate);
        
        accessControlService.validateTenantAccess(tenantId);
        
        // 수강 등록 정보 조회
        ClassEnrollment enrollment = enrollmentRepository.findByEnrollmentIdAndIsDeletedFalse(enrollmentId)
            .orElseThrow(() -> new RuntimeException("수강 등록을 찾을 수 없습니다: " + enrollmentId));
        
        if (!tenantId.equals(enrollment.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // 기간별 출결 조회
        LocalDate actualStartDate = startDate != null ? startDate : enrollment.getStartDate() != null ? enrollment.getStartDate() : LocalDate.now().minusMonths(1);
        LocalDate actualEndDate = endDate != null ? endDate : LocalDate.now();
        
        List<Attendance> attendances = attendanceRepository.findAttendancesByDateRange(
            tenantId, enrollmentId, actualStartDate, actualEndDate);
        
        // 통계 계산
        long totalCount = attendances.size();
        long presentCount = attendances.stream().filter(a -> a.getStatus() == Attendance.AttendanceStatus.PRESENT).count();
        long lateCount = attendances.stream().filter(a -> a.getStatus() == Attendance.AttendanceStatus.LATE).count();
        long earlyLeaveCount = attendances.stream().filter(a -> a.getStatus() == Attendance.AttendanceStatus.EARLY_LEAVE).count();
        long absentCount = attendances.stream().filter(a -> a.getStatus() == Attendance.AttendanceStatus.ABSENT).count();
        
        // 출석률 계산
        double attendanceRate = totalCount > 0 ? (double) presentCount / totalCount * 100.0 : 0.0;
        
        // 상태별 통계
        Map<String, Long> statusCounts = new HashMap<>();
        for (Attendance attendance : attendances) {
            String statusName = attendance.getStatus().name();
            statusCounts.put(statusName, statusCounts.getOrDefault(statusName, 0L) + 1);
        }
        
        // 월별 출석률 계산
        Map<String, Double> monthlyAttendanceRates = new HashMap<>();
        Map<String, Long> monthlyTotal = new HashMap<>();
        Map<String, Long> monthlyPresent = new HashMap<>();
        
        for (Attendance attendance : attendances) {
            String monthKey = attendance.getAttendanceDate().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            monthlyTotal.put(monthKey, monthlyTotal.getOrDefault(monthKey, 0L) + 1);
            if (attendance.getStatus() == Attendance.AttendanceStatus.PRESENT) {
                monthlyPresent.put(monthKey, monthlyPresent.getOrDefault(monthKey, 0L) + 1);
            }
        }
        
        for (String monthKey : monthlyTotal.keySet()) {
            long monthTotal = monthlyTotal.get(monthKey);
            long monthPresent = monthlyPresent.getOrDefault(monthKey, 0L);
            double monthRate = monthTotal > 0 ? (double) monthPresent / monthTotal * 100.0 : 0.0;
            monthlyAttendanceRates.put(monthKey, monthRate);
        }
        
        // 수강생 정보 조회
        String consumerName = null;
        if (enrollment.getConsumerId() != null) {
            Optional<User> consumer = userRepository.findById(enrollment.getConsumerId());
            if (consumer.isPresent()) {
                consumerName = consumer.get().getName();
            }
        }
        
        return AttendanceStatisticsResponse.builder()
            .enrollmentId(enrollmentId)
            .consumerId(enrollment.getConsumerId())
            .consumerName(consumerName)
            .classId(enrollment.getClassId())
            .className(null) // TODO: Class 정보 조회 필요
            .startDate(actualStartDate)
            .endDate(actualEndDate)
            .totalCount(totalCount)
            .presentCount(presentCount)
            .lateCount(lateCount)
            .earlyLeaveCount(earlyLeaveCount)
            .absentCount(absentCount)
            .attendanceRate(attendanceRate)
            .statusCounts(statusCounts)
            .monthlyAttendanceRates(monthlyAttendanceRates)
            .build();
    }
    
    @Override
    public boolean sendAttendanceNotificationToParent(String tenantId, String attendanceId) {
        log.info("학부모 알림 발송: tenantId={}, attendanceId={}", tenantId, attendanceId);
        
        try {
            accessControlService.validateTenantAccess(tenantId);
            
            // 출결 정보 조회
            Attendance attendance = attendanceRepository.findByAttendanceIdAndIsDeletedFalse(attendanceId)
                .orElseThrow(() -> new RuntimeException("출결을 찾을 수 없습니다: " + attendanceId));
            
            if (!tenantId.equals(attendance.getTenantId())) {
                throw new RuntimeException("접근 권한이 없습니다.");
            }
            
            // 수강 등록 정보 조회
            ClassEnrollment enrollment = enrollmentRepository.findByEnrollmentIdAndIsDeletedFalse(attendance.getEnrollmentId())
                .orElseThrow(() -> new RuntimeException("수강 등록을 찾을 수 없습니다: " + attendance.getEnrollmentId()));
            
            // 수강생(학생) 정보 조회
            if (enrollment.getConsumerId() == null) {
                log.warn("수강생 ID가 없어 알림을 발송할 수 없습니다: enrollmentId={}", enrollment.getEnrollmentId());
                return false;
            }
            
            User student = userRepository.findById(enrollment.getConsumerId())
                .orElseThrow(() -> new RuntimeException("수강생을 찾을 수 없습니다: " + enrollment.getConsumerId()));
            
            // TODO: 학부모 정보 조회 (현재는 수강생에게 직접 발송)
            // 실제로는 학부모 계정을 별도로 관리하거나, 수강생 계정에 학부모 정보를 연결해야 함
            User parent = student; // 임시로 수강생에게 발송
            
            // 알림 메시지 생성
            String statusText = getAttendanceStatusText(attendance.getStatus());
            String dateText = attendance.getAttendanceDate().format(DateTimeFormatter.ofPattern("yyyy년 MM월 dd일"));
            String timeText = attendance.getAttendanceTime() != null ? 
                attendance.getAttendanceTime().format(DateTimeFormatter.ofPattern("HH:mm")) : "";
            
            String message = String.format(
                "[%s] %s님의 출결 상태: %s\n날짜: %s %s",
                "학원", 
                student.getName() != null ? student.getName() : "학생",
                statusText,
                dateText,
                timeText
            );
            
            // 알림 발송 (현재는 NotificationService의 기본 타입 사용)
            // TODO: 출결 알림 전용 NotificationType 추가 필요
            boolean success = notificationService.sendNotification(
                parent,
                NotificationService.NotificationType.SCHEDULE_CHANGED, // 임시로 일정 변경 타입 사용
                NotificationService.NotificationPriority.HIGH,
                message
            );
            
            if (success) {
                log.info("✅ 학부모 알림 발송 성공: attendanceId={}, parentId={}", attendanceId, parent.getId());
            } else {
                log.warn("⚠️ 학부모 알림 발송 실패: attendanceId={}, parentId={}", attendanceId, parent.getId());
            }
            
            return success;
            
        } catch (Exception e) {
            log.error("학부모 알림 발송 중 오류 발생: attendanceId={}", attendanceId, e);
            return false;
        }
    }
    
    // ==================== 내부 헬퍼 메서드 ====================
    
    /**
     * 출결 상태 텍스트 변환
     */
    private String getAttendanceStatusText(Attendance.AttendanceStatus status) {
        if (status == null) {
            return "미확인";
        }
        switch (status) {
            case PRESENT:
                return "출석";
            case LATE:
                return "지각";
            case EARLY_LEAVE:
                return "조퇴";
            case ABSENT:
                return "결석";
            case EXCUSED:
                return "사유결석";
            default:
                return "미확인";
        }
    }
    
    private AttendanceResponse toResponse(Attendance attendance) {
        return AttendanceResponse.builder()
            .attendanceId(attendance.getAttendanceId())
            .tenantId(attendance.getTenantId())
            .branchId(attendance.getBranchId())
            .enrollmentId(attendance.getEnrollmentId())
            .scheduleId(attendance.getScheduleId())
            .attendanceDate(attendance.getAttendanceDate())
            .attendanceTime(attendance.getAttendanceTime())
            .status(attendance.getStatus())
            .recordedAt(attendance.getRecordedAt())
            .recordedBy(attendance.getRecordedBy())
            .recordingMethod(attendance.getRecordingMethod())
            .notes(attendance.getNotes())
            .excuseReason(attendance.getExcuseReason())
            .createdAt(attendance.getCreatedAt())
            .updatedAt(attendance.getUpdatedAt())
            .build();
    }
}

