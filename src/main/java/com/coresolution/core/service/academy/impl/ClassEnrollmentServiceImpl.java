package com.coresolution.core.service.academy.impl;

import com.coresolution.core.domain.academy.ClassEnrollment;
import com.coresolution.core.dto.academy.ClassEnrollmentRequest;
import com.coresolution.core.dto.academy.ClassEnrollmentResponse;
import com.coresolution.core.repository.academy.ClassEnrollmentRepository;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.academy.ClassEnrollmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 수강 등록 서비스 구현체
 * 학원 시스템의 수강 등록 관리 비즈니스 로직 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-19
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class ClassEnrollmentServiceImpl implements ClassEnrollmentService {
    
    private final ClassEnrollmentRepository enrollmentRepository;
    private final TenantAccessControlService accessControlService;
    
    @Override
    @Transactional(readOnly = true)
    public List<ClassEnrollmentResponse> getEnrollments(String tenantId, Long branchId, String classId, Long consumerId, ClassEnrollment.EnrollmentStatus status) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<ClassEnrollment> enrollments;
        
        if (consumerId != null) {
            enrollments = enrollmentRepository.findByTenantIdAndConsumerIdAndIsDeletedFalse(tenantId, consumerId);
        } else if (classId != null) {
            enrollments = enrollmentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classId);
        } else if (branchId != null && status != null) {
            enrollments = enrollmentRepository.findByTenantIdAndBranchIdAndStatusAndIsActiveTrueAndIsDeletedFalse(tenantId, branchId, status);
        } else if (branchId != null) {
            enrollments = enrollmentRepository.findByTenantIdAndBranchIdAndIsDeletedFalse(tenantId, branchId);
        } else {
            enrollments = enrollmentRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        }
        
        // 상태 필터링 (필요한 경우)
        if (status != null) {
            enrollments = enrollments.stream()
                .filter(e -> status.equals(e.getStatus()))
                .collect(Collectors.toList());
        }
        
        return enrollments.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public ClassEnrollmentResponse getEnrollment(String tenantId, String enrollmentId) {
        accessControlService.validateTenantAccess(tenantId);
        
        ClassEnrollment enrollment = enrollmentRepository.findByEnrollmentIdAndIsDeletedFalse(enrollmentId)
            .orElseThrow(() -> new RuntimeException("수강 등록을 찾을 수 없습니다: " + enrollmentId));
        
        if (!tenantId.equals(enrollment.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        return toResponse(enrollment);
    }
    
    @Override
    public ClassEnrollmentResponse createEnrollment(String tenantId, ClassEnrollmentRequest request, String createdBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        ClassEnrollment enrollment = ClassEnrollment.builder()
            .enrollmentId(UUID.randomUUID().toString())
            .tenantId(tenantId)
            .branchId(request.getBranchId())
            .classId(request.getClassId())
            .consumerId(request.getConsumerId())
            .enrollmentDate(request.getEnrollmentDate() != null ? request.getEnrollmentDate() : java.time.LocalDate.now())
            .startDate(request.getStartDate())
            .endDate(request.getEndDate())
            .tuitionPlanId(request.getTuitionPlanId())
            .tuitionAmount(request.getTuitionAmount() != null ? request.getTuitionAmount() : java.math.BigDecimal.ZERO)
            .paymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : ClassEnrollment.PaymentStatus.PENDING)
            .status(request.getStatus() != null ? request.getStatus() : ClassEnrollment.EnrollmentStatus.ACTIVE)
            .isActive(true)
            .notes(request.getNotes())
            .settingsJson(request.getSettingsJson())
            .createdBy(createdBy)
            .isDeleted(false)
            .build();
        
        ClassEnrollment saved = enrollmentRepository.save(enrollment);
        return toResponse(saved);
    }
    
    @Override
    public ClassEnrollmentResponse updateEnrollment(String tenantId, String enrollmentId, ClassEnrollmentRequest request, String updatedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        ClassEnrollment enrollment = enrollmentRepository.findByEnrollmentIdAndIsDeletedFalse(enrollmentId)
            .orElseThrow(() -> new RuntimeException("수강 등록을 찾을 수 없습니다: " + enrollmentId));
        
        if (!tenantId.equals(enrollment.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        enrollment.setBranchId(request.getBranchId());
        enrollment.setClassId(request.getClassId());
        enrollment.setConsumerId(request.getConsumerId());
        enrollment.setEnrollmentDate(request.getEnrollmentDate());
        enrollment.setStartDate(request.getStartDate());
        enrollment.setEndDate(request.getEndDate());
        enrollment.setTuitionPlanId(request.getTuitionPlanId());
        if (request.getTuitionAmount() != null) {
            enrollment.setTuitionAmount(request.getTuitionAmount());
        }
        if (request.getPaymentStatus() != null) {
            enrollment.setPaymentStatus(request.getPaymentStatus());
        }
        if (request.getStatus() != null) {
            enrollment.setStatus(request.getStatus());
        }
        enrollment.setNotes(request.getNotes());
        enrollment.setSettingsJson(request.getSettingsJson());
        enrollment.setUpdatedBy(updatedBy);
        enrollment.setUpdatedAt(LocalDateTime.now());
        
        ClassEnrollment saved = enrollmentRepository.save(enrollment);
        return toResponse(saved);
    }
    
    @Override
    public void deleteEnrollment(String tenantId, String enrollmentId, String deletedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        ClassEnrollment enrollment = enrollmentRepository.findByEnrollmentIdAndIsDeletedFalse(enrollmentId)
            .orElseThrow(() -> new RuntimeException("수강 등록을 찾을 수 없습니다: " + enrollmentId));
        
        if (!tenantId.equals(enrollment.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        enrollment.setIsDeleted(true);
        enrollment.setUpdatedBy(deletedBy);
        enrollment.setUpdatedAt(LocalDateTime.now());
        enrollmentRepository.save(enrollment);
    }
    
    @Override
    public ClassEnrollmentResponse updateEnrollmentStatus(String tenantId, String enrollmentId, ClassEnrollment.EnrollmentStatus status, String updatedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        ClassEnrollment enrollment = enrollmentRepository.findByEnrollmentIdAndIsDeletedFalse(enrollmentId)
            .orElseThrow(() -> new RuntimeException("수강 등록을 찾을 수 없습니다: " + enrollmentId));
        
        if (!tenantId.equals(enrollment.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        enrollment.setStatus(status);
        enrollment.setUpdatedBy(updatedBy);
        enrollment.setUpdatedAt(LocalDateTime.now());
        
        ClassEnrollment saved = enrollmentRepository.save(enrollment);
        return toResponse(saved);
    }
    
    @Override
    public ClassEnrollmentResponse updatePaymentStatus(String tenantId, String enrollmentId, ClassEnrollment.PaymentStatus paymentStatus, String updatedBy) {
        accessControlService.validateTenantAccess(tenantId);
        
        ClassEnrollment enrollment = enrollmentRepository.findByEnrollmentIdAndIsDeletedFalse(enrollmentId)
            .orElseThrow(() -> new RuntimeException("수강 등록을 찾을 수 없습니다: " + enrollmentId));
        
        if (!tenantId.equals(enrollment.getTenantId())) {
            throw new RuntimeException("접근 권한이 없습니다.");
        }
        
        enrollment.setPaymentStatus(paymentStatus);
        enrollment.setUpdatedBy(updatedBy);
        enrollment.setUpdatedAt(LocalDateTime.now());
        
        ClassEnrollment saved = enrollmentRepository.save(enrollment);
        return toResponse(saved);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<ClassEnrollmentResponse> getActiveEnrollmentsByConsumer(String tenantId, Long consumerId) {
        accessControlService.validateTenantAccess(tenantId);
        
        List<ClassEnrollment> enrollments = enrollmentRepository.findActiveEnrollmentsByConsumerId(tenantId, consumerId);
        return enrollments.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }
    
    private ClassEnrollmentResponse toResponse(ClassEnrollment enrollment) {
        return ClassEnrollmentResponse.builder()
            .enrollmentId(enrollment.getEnrollmentId())
            .tenantId(enrollment.getTenantId())
            .branchId(enrollment.getBranchId())
            .classId(enrollment.getClassId())
            .consumerId(enrollment.getConsumerId())
            .enrollmentDate(enrollment.getEnrollmentDate())
            .startDate(enrollment.getStartDate())
            .endDate(enrollment.getEndDate())
            .tuitionPlanId(enrollment.getTuitionPlanId())
            .tuitionAmount(enrollment.getTuitionAmount())
            .paymentStatus(enrollment.getPaymentStatus())
            .status(enrollment.getStatus())
            .isActive(enrollment.getIsActive())
            .notes(enrollment.getNotes())
            .settingsJson(enrollment.getSettingsJson())
            .createdAt(enrollment.getCreatedAt())
            .updatedAt(enrollment.getUpdatedAt())
            .build();
    }
}

