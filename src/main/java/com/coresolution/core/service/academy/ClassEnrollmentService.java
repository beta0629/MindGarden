package com.coresolution.core.service.academy;

import com.coresolution.core.domain.academy.ClassEnrollment;
import com.coresolution.core.dto.academy.ClassEnrollmentRequest;
import com.coresolution.core.dto.academy.ClassEnrollmentResponse;

import java.util.List;

/**
 * 수강 등록 서비스 인터페이스
 * 학원 시스템의 수강 등록 관리 비즈니스 로직
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-18
 */
public interface ClassEnrollmentService {
    
    /**
     * 수강 등록 목록 조회
     */
    List<ClassEnrollmentResponse> getEnrollments(String tenantId, Long branchId, String classId, Long consumerId, ClassEnrollment.EnrollmentStatus status);
    
    /**
     * 수강 등록 상세 조회
     */
    ClassEnrollmentResponse getEnrollment(String tenantId, String enrollmentId);
    
    /**
     * 수강 등록 생성
     */
    ClassEnrollmentResponse createEnrollment(String tenantId, ClassEnrollmentRequest request, String createdBy);
    
    /**
     * 수강 등록 수정
     */
    ClassEnrollmentResponse updateEnrollment(String tenantId, String enrollmentId, ClassEnrollmentRequest request, String updatedBy);
    
    /**
     * 수강 등록 삭제 (소프트 삭제)
     */
    void deleteEnrollment(String tenantId, String enrollmentId, String deletedBy);
    
    /**
     * 수강 등록 상태 변경
     */
    ClassEnrollmentResponse updateEnrollmentStatus(String tenantId, String enrollmentId, ClassEnrollment.EnrollmentStatus status, String updatedBy);
    
    /**
     * 결제 상태 업데이트
     */
    ClassEnrollmentResponse updatePaymentStatus(String tenantId, String enrollmentId, ClassEnrollment.PaymentStatus paymentStatus, String updatedBy);
    
    /**
     * 수강생별 활성 수강 등록 조회
     */
    List<ClassEnrollmentResponse> getActiveEnrollmentsByConsumer(String tenantId, Long consumerId);
}

