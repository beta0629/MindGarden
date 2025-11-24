package com.coresolution.core.service.academy.impl;

import com.coresolution.core.domain.academy.ClassSchedule;
import com.coresolution.core.dto.academy.ClassScheduleRequest;
import com.coresolution.core.dto.academy.ClassScheduleResponse;
import com.coresolution.core.repository.academy.ClassScheduleRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.academy.ClassScheduleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 시간표 서비스 구현체
 * 학원 시스템의 시간표 관리 비즈니스 로직 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ClassScheduleServiceImpl implements ClassScheduleService {
    
    private final ClassScheduleRepository scheduleRepository;
    private final TenantAccessControlService accessControlService;
    
    @Override
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getSchedules(String tenantId, Long branchId, String classId) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<ClassSchedule> schedules;
        if (classId != null && branchId != null) {
            schedules = scheduleRepository.findByTenantIdAndBranchIdAndClassIdAndIsDeletedFalse(tenantId, branchId, classId);
        } else if (classId != null) {
            schedules = scheduleRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classId);
        } else if (branchId != null) {
            schedules = scheduleRepository.findByTenantIdAndBranchIdAndIsDeletedFalse(tenantId, branchId);
        } else {
            schedules = scheduleRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        }
        
        return schedules.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public ClassScheduleResponse getSchedule(String tenantId, String scheduleId) {
        accessControlService.validateTenantAccess(tenantId);
        
        ClassSchedule schedule = scheduleRepository.findByScheduleIdAndIsDeletedFalse(scheduleId)
            .orElseThrow(() -> new RuntimeException("시간표를 찾을 수 없습니다: " + scheduleId));
        
        if (!tenantId.equals(schedule.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        return toResponse(schedule);
    }
    
    @Override
    public ClassScheduleResponse createSchedule(String tenantId, ClassScheduleRequest request, String createdBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        // 시간 유효성 검사
        if (request.getEndTime().isBefore(request.getStartTime()) || 
            request.getEndTime().equals(request.getStartTime())) {
            throw new IllegalArgumentException("종료 시간은 시작 시간보다 늦어야 합니다.");
        }
        
        // 요일 유효성 검사
        if (request.getDayOfWeek() < 0 || request.getDayOfWeek() > 6) {
            throw new IllegalArgumentException("요일은 0(일요일)부터 6(토요일) 사이여야 합니다.");
        }
        
        ClassSchedule schedule = ClassSchedule.builder()
            .scheduleId(UUID.randomUUID().toString())
            .branchId(request.getBranchId())
            .classId(request.getClassId())
            .dayOfWeek(request.getDayOfWeek())
            .startTime(request.getStartTime())
            .endTime(request.getEndTime())
            .room(request.getRoom())
            .sessionNumber(request.getSessionNumber())
            .sessionDate(request.getSessionDate())
            .isRegular(request.getIsRegular() != null ? request.getIsRegular() : true)
            .isActive(request.getIsActive() != null ? request.getIsActive() : true)
            .createdBy(createdBy)
            .build();
        
        // BaseEntity의 필드 설정
        schedule.setTenantId(tenantId);
        schedule.setIsDeleted(false);
        
        ClassSchedule saved = scheduleRepository.save(schedule);
        log.info("시간표 생성 완료: scheduleId={}, classId={}", saved.getScheduleId(), saved.getClassId());
        
        return toResponse(saved);
    }
    
    @Override
    public ClassScheduleResponse updateSchedule(String tenantId, String scheduleId, ClassScheduleRequest request, String updatedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        ClassSchedule schedule = scheduleRepository.findByScheduleIdAndIsDeletedFalse(scheduleId)
            .orElseThrow(() -> new RuntimeException("시간표를 찾을 수 없습니다: " + scheduleId));
        
        if (!tenantId.equals(schedule.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        // 시간 유효성 검사
        if (request.getEndTime().isBefore(request.getStartTime()) || 
            request.getEndTime().equals(request.getStartTime())) {
            throw new IllegalArgumentException("종료 시간은 시작 시간보다 늦어야 합니다.");
        }
        
        // 요일 유효성 검사
        if (request.getDayOfWeek() < 0 || request.getDayOfWeek() > 6) {
            throw new IllegalArgumentException("요일은 0(일요일)부터 6(토요일) 사이여야 합니다.");
        }
        
        schedule.setBranchId(request.getBranchId());
        schedule.setClassId(request.getClassId());
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setRoom(request.getRoom());
        schedule.setSessionNumber(request.getSessionNumber());
        schedule.setSessionDate(request.getSessionDate());
        if (request.getIsRegular() != null) {
            schedule.setIsRegular(request.getIsRegular());
        }
        if (request.getIsActive() != null) {
            schedule.setIsActive(request.getIsActive());
        }
        schedule.setUpdatedBy(updatedBy);
        schedule.setUpdatedAt(LocalDateTime.now());
        
        ClassSchedule saved = scheduleRepository.save(schedule);
        log.info("시간표 수정 완료: scheduleId={}", saved.getScheduleId());
        
        return toResponse(saved);
    }
    
    @Override
    public void deleteSchedule(String tenantId, String scheduleId, String deletedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        ClassSchedule schedule = scheduleRepository.findByScheduleIdAndIsDeletedFalse(scheduleId)
            .orElseThrow(() -> new RuntimeException("시간표를 찾을 수 없습니다: " + scheduleId));
        
        if (!tenantId.equals(schedule.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        schedule.setIsDeleted(true);
        schedule.setDeletedAt(LocalDateTime.now());
        schedule.setUpdatedBy(deletedBy);
        schedule.setUpdatedAt(LocalDateTime.now());
        
        scheduleRepository.save(schedule);
        log.info("시간표 삭제 완료: scheduleId={}", scheduleId);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getActiveSchedulesByClass(String tenantId, String classId) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<ClassSchedule> schedules = scheduleRepository.findActiveSchedulesByClassId(tenantId, classId);
        
        return schedules.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getRegularSchedulesByClass(String tenantId, String classId) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<ClassSchedule> schedules = scheduleRepository.findRegularSchedulesByClassId(tenantId, classId);
        
        return schedules.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getSchedulesByDate(String tenantId, String classId, LocalDate date) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<ClassSchedule> schedules = scheduleRepository.findSchedulesByDate(tenantId, classId, date);
        
        return schedules.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getSchedulesByDayOfWeek(String tenantId, String classId, Integer dayOfWeek) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<ClassSchedule> schedules = scheduleRepository.findSchedulesByDayOfWeek(tenantId, classId, dayOfWeek);
        
        return schedules.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getSchedulesByDateRange(String tenantId, String classId, LocalDate startDate, LocalDate endDate) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<ClassSchedule> schedules = scheduleRepository.findSchedulesByDateRange(tenantId, classId, startDate, endDate);
        
        return schedules.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * ClassSchedule 엔티티를 ClassScheduleResponse로 변환
     */
    private ClassScheduleResponse toResponse(ClassSchedule schedule) {
        return ClassScheduleResponse.builder()
            .scheduleId(schedule.getScheduleId())
            .tenantId(schedule.getTenantId())
            .branchId(schedule.getBranchId())
            .classId(schedule.getClassId())
            .dayOfWeek(schedule.getDayOfWeek())
            .dayOfWeekName(schedule.getDayOfWeekName())
            .startTime(schedule.getStartTime())
            .endTime(schedule.getEndTime())
            .durationMinutes(schedule.getDurationMinutes())
            .room(schedule.getRoom())
            .sessionNumber(schedule.getSessionNumber())
            .sessionDate(schedule.getSessionDate())
            .isRegular(schedule.getIsRegular())
            .isActive(schedule.getIsActive())
            .createdAt(schedule.getCreatedAt())
            .updatedAt(schedule.getUpdatedAt())
            .build();
    }
}

