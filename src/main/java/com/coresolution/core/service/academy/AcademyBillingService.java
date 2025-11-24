package com.coresolution.core.service.academy;

import com.coresolution.core.dto.academy.*;

import java.time.LocalDate;
import java.util.List;

/**
 * 학원 청구 서비스 인터페이스
 * 학원 시스템의 수강료 청구 및 결제 관리 비즈니스 로직
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-24
 */
public interface AcademyBillingService {
    
    // ==================== 청구 스케줄 관리 ====================
    
    /**
     * 청구 스케줄 목록 조회
     */
    List<BillingScheduleResponse> getBillingSchedules(String tenantId, Long branchId);
    
    /**
     * 청구 스케줄 상세 조회
     */
    BillingScheduleResponse getBillingSchedule(String tenantId, String billingScheduleId);
    
    /**
     * 청구 스케줄 생성
     */
    BillingScheduleResponse createBillingSchedule(String tenantId, BillingScheduleRequest request, String createdBy);
    
    /**
     * 청구 스케줄 수정
     */
    BillingScheduleResponse updateBillingSchedule(String tenantId, String billingScheduleId, BillingScheduleRequest request, String updatedBy);
    
    /**
     * 청구 스케줄 삭제
     */
    void deleteBillingSchedule(String tenantId, String billingScheduleId, String deletedBy);
    
    /**
     * 청구 스케줄 실행 (청구서 생성)
     */
    List<InvoiceResponse> executeBillingSchedule(String tenantId, String billingScheduleId, String executedBy);
    
    // ==================== 청구서 관리 ====================
    
    /**
     * 청구서 목록 조회
     */
    List<InvoiceResponse> getInvoices(String tenantId, Long branchId, String enrollmentId, Long consumerId, InvoiceResponse.InvoiceStatus status);
    
    /**
     * 청구서 상세 조회
     */
    InvoiceResponse getInvoice(String tenantId, String invoiceId);
    
    /**
     * 청구서 생성
     */
    InvoiceResponse createInvoice(String tenantId, InvoiceRequest request, String createdBy);
    
    /**
     * 청구서 발행
     */
    InvoiceResponse issueInvoice(String tenantId, String invoiceId, String issuedBy);
    
    /**
     * 청구서 발송
     */
    InvoiceResponse sendInvoice(String tenantId, String invoiceId, String sentBy);
    
    /**
     * 청구서 취소
     */
    InvoiceResponse cancelInvoice(String tenantId, String invoiceId, String cancelledBy);
    
    /**
     * 연체 청구서 조회
     */
    List<InvoiceResponse> getOverdueInvoices(String tenantId, Long branchId);
    
    // ==================== 결제 관리 ====================
    
    /**
     * 결제 목록 조회
     */
    List<TuitionPaymentResponse> getPayments(String tenantId, Long branchId, String invoiceId, String enrollmentId, Long consumerId);
    
    /**
     * 결제 상세 조회
     */
    TuitionPaymentResponse getPayment(String tenantId, String paymentId);
    
    /**
     * 결제 생성
     */
    TuitionPaymentResponse createPayment(String tenantId, TuitionPaymentRequest request, String createdBy);
    
    /**
     * 결제 완료 처리
     */
    TuitionPaymentResponse completePayment(String tenantId, String paymentId, String completedBy);
    
    /**
     * 결제 취소
     */
    TuitionPaymentResponse cancelPayment(String tenantId, String paymentId, String cancelledBy);
    
    /**
     * 환불 처리
     */
    TuitionPaymentResponse refundPayment(String tenantId, String paymentId, RefundRequest request, String refundedBy);
    
    /**
     * 영수증 발급
     */
    TuitionPaymentResponse issueReceipt(String tenantId, String paymentId, String issuedBy);
    
    // ==================== 배치 작업 ====================
    
    /**
     * 월별 청구서 자동 생성 (배치)
     */
    int generateMonthlyInvoices(String tenantId, LocalDate billingDate);
    
    /**
     * 연체 청구서 상태 업데이트 (배치)
     */
    int updateOverdueInvoices(String tenantId);
}

