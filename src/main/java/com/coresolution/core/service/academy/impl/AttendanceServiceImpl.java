package com.coresolution.core.service.academy.impl;

import com.coresolution.core.domain.academy.Attendance;
import com.coresolution.core.dto.academy.AttendanceRequest;
import com.coresolution.core.dto.academy.AttendanceResponse;
import com.coresolution.core.repository.academy.AttendanceRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.academy.AttendanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
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
    private final TenantAccessControlService accessControlService;
    
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
    
    // ==================== 내부 헬퍼 메서드 ====================
    
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

