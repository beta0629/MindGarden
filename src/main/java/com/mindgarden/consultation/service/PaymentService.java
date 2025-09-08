package com.mindgarden.consultation.service;

import com.mindgarden.consultation.dto.PaymentRequest;
import com.mindgarden.consultation.dto.PaymentResponse;
import com.mindgarden.consultation.dto.PaymentWebhookRequest;
import com.mindgarden.consultation.entity.Payment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 결제 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
public interface PaymentService {
    
    /**
     * 결제 생성
     * 
     * @param request 결제 요청
     * @return 결제 응답
     */
    PaymentResponse createPayment(PaymentRequest request);
    
    /**
     * 결제 조회
     * 
     * @param paymentId 결제 ID
     * @return 결제 응답
     */
    PaymentResponse getPayment(String paymentId);
    
    /**
     * 결제 목록 조회
     * 
     * @param payerId 결제자 ID
     * @param pageable 페이지 정보
     * @return 결제 목록
     */
    Page<PaymentResponse> getPaymentsByPayerId(Long payerId, Pageable pageable);
    
    /**
     * 결제 목록 조회 (지점별)
     * 
     * @param branchId 지점 ID
     * @param pageable 페이지 정보
     * @return 결제 목록
     */
    Page<PaymentResponse> getPaymentsByBranchId(Long branchId, Pageable pageable);
    
    /**
     * 결제 목록 조회 (관리자용)
     * 
     * @param pageable 페이지 정보
     * @return 결제 목록
     */
    Page<PaymentResponse> getAllPayments(Pageable pageable);
    
    /**
     * 결제 상태 업데이트
     * 
     * @param paymentId 결제 ID
     * @param status 새로운 상태
     * @return 업데이트된 결제 응답
     */
    PaymentResponse updatePaymentStatus(String paymentId, Payment.PaymentStatus status);
    
    /**
     * 결제 취소
     * 
     * @param paymentId 결제 ID
     * @param reason 취소 사유
     * @return 취소된 결제 응답
     */
    PaymentResponse cancelPayment(String paymentId, String reason);
    
    /**
     * 결제 환불
     * 
     * @param paymentId 결제 ID
     * @param amount 환불 금액 (null이면 전체 환불)
     * @param reason 환불 사유
     * @return 환불된 결제 응답
     */
    PaymentResponse refundPayment(String paymentId, BigDecimal amount, String reason);
    
    /**
     * Webhook 처리
     * 
     * @param webhookRequest Webhook 요청
     * @return 처리 결과
     */
    boolean processWebhook(PaymentWebhookRequest webhookRequest);
    
    /**
     * 결제 검증
     * 
     * @param paymentId 결제 ID
     * @param amount 결제 금액
     * @return 검증 결과
     */
    boolean verifyPayment(String paymentId, BigDecimal amount);
    
    /**
     * 만료된 결제 처리
     * 
     * @return 처리된 결제 수
     */
    int processExpiredPayments();
    
    /**
     * 결제 통계 조회
     * 
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 결제 통계
     */
    Map<String, Object> getPaymentStatistics(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 지점별 결제 통계 조회
     * 
     * @param branchId 지점 ID
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 지점별 결제 통계
     */
    Map<String, Object> getBranchPaymentStatistics(Long branchId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 결제자별 결제 통계 조회
     * 
     * @param payerId 결제자 ID
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 결제자별 결제 통계
     */
    Map<String, Object> getPayerPaymentStatistics(Long payerId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 월별 결제 통계 조회
     * 
     * @param year 연도
     * @return 월별 결제 통계
     */
    List<Map<String, Object>> getMonthlyPaymentStatistics(int year);
    
    /**
     * 결제 방법별 통계 조회
     * 
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 결제 방법별 통계
     */
    Map<String, Object> getPaymentMethodStatistics(LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 결제 대행사별 통계 조회
     * 
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 결제 대행사별 통계
     */
    Map<String, Object> getPaymentProviderStatistics(LocalDateTime startDate, LocalDateTime endDate);
}
