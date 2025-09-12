package com.mindgarden.consultation.service.impl;

import com.mindgarden.consultation.dto.PaymentStatusResponse;
import com.mindgarden.consultation.entity.Payment;
import com.mindgarden.consultation.repository.PaymentRepository;
import com.mindgarden.consultation.service.PaymentGatewayService;
import com.mindgarden.consultation.service.PaymentStatusService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 결제 상태 관리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentStatusServiceImpl implements PaymentStatusService {
    
    private final PaymentRepository paymentRepository;
    
    @Qualifier("tossPaymentService")
    private final PaymentGatewayService paymentGatewayService;
    
    @Override
    @Transactional(readOnly = true)
    public PaymentStatusResponse checkPaymentStatus(String paymentId) {
        log.info("결제 상태 확인: {}", paymentId);
        
        try {
            // 데이터베이스에서 결제 정보 조회
            Optional<Payment> paymentOpt = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId);
            if (paymentOpt.isEmpty()) {
                throw new RuntimeException("결제 정보를 찾을 수 없습니다: " + paymentId);
            }
            
            Payment payment = paymentOpt.get();
            
            // 외부 결제 시스템에서 최신 상태 확인
            PaymentStatusResponse externalStatus = paymentGatewayService.getPaymentStatus(paymentId);
            
            // 상태가 변경되었으면 업데이트
            if (!payment.getStatus().toString().equals(externalStatus.getStatus())) {
                Payment.PaymentStatus newStatus = Payment.PaymentStatus.valueOf(externalStatus.getStatus());
                updatePaymentStatus(paymentId, newStatus);
                
                // 상태 변경 알림 전송
                sendPaymentNotification(paymentId, externalStatus.getStatus());
            }
            
            return externalStatus;
            
        } catch (Exception e) {
            log.error("결제 상태 확인 실패: {}", e.getMessage(), e);
            throw new RuntimeException("결제 상태 확인에 실패했습니다.", e);
        }
    }
    
    @Override
    @Transactional
    public boolean updatePaymentStatus(String paymentId, Payment.PaymentStatus newStatus) {
        log.info("결제 상태 업데이트: {} -> {}", paymentId, newStatus);
        
        try {
            Optional<Payment> paymentOpt = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId);
            if (paymentOpt.isEmpty()) {
                log.warn("결제 정보를 찾을 수 없습니다: {}", paymentId);
                return false;
            }
            
            Payment payment = paymentOpt.get();
            Payment.PaymentStatus oldStatus = payment.getStatus();
            
            // 상태 업데이트
            payment.setStatus(newStatus);
            payment.setUpdatedAt(LocalDateTime.now());
            
            // 상태별 추가 처리
            switch (newStatus) {
                case APPROVED:
                    payment.setApprovedAt(LocalDateTime.now());
                    break;
                case CANCELLED:
                    payment.setCancelledAt(LocalDateTime.now());
                    break;
                case FAILED:
                    payment.setFailedAt(LocalDateTime.now());
                    break;
                case REFUNDED:
                    payment.setRefundedAt(LocalDateTime.now());
                    break;
            }
            
            paymentRepository.save(payment);
            
            log.info("결제 상태 업데이트 완료: {} ({} -> {})", paymentId, oldStatus, newStatus);
            return true;
            
        } catch (Exception e) {
            log.error("결제 상태 업데이트 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    @Transactional
    public boolean syncPaymentStatus(String paymentId) {
        log.info("결제 상태 동기화: {}", paymentId);
        
        try {
            // 외부 시스템에서 상태 조회
            PaymentStatusResponse externalStatus = paymentGatewayService.getPaymentStatus(paymentId);
            
            // 내부 데이터베이스 상태와 비교하여 동기화
            return updatePaymentStatus(paymentId, Payment.PaymentStatus.valueOf(externalStatus.getStatus()));
            
        } catch (Exception e) {
            log.error("결제 상태 동기화 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    @Transactional
    @Scheduled(fixedRate = 300000) // 5분마다 실행
    public int processExpiredPayments() {
        log.info("만료된 결제 처리 시작");
        
        try {
            // 30분 이상 PENDING 상태인 결제들 조회
            LocalDateTime expiredTime = LocalDateTime.now().minusMinutes(30);
            List<Payment> expiredPayments = paymentRepository.findExpiredPayments(expiredTime);
            
            int processedCount = 0;
            for (Payment payment : expiredPayments) {
                try {
                    // 외부 시스템에서 상태 확인
                    PaymentStatusResponse externalStatus = paymentGatewayService.getPaymentStatus(payment.getPaymentId());
                    
                    if ("PENDING".equals(externalStatus.getStatus())) {
                        // 여전히 PENDING이면 만료 처리
                        updatePaymentStatus(payment.getPaymentId(), Payment.PaymentStatus.EXPIRED);
                        sendPaymentNotification(payment.getPaymentId(), "EXPIRED");
                        processedCount++;
                    } else {
                        // 상태가 변경되었으면 업데이트
                        updatePaymentStatus(payment.getPaymentId(), Payment.PaymentStatus.valueOf(externalStatus.getStatus()));
                        processedCount++;
                    }
                    
                } catch (Exception e) {
                    log.error("만료된 결제 처리 실패: {}", payment.getPaymentId(), e);
                }
            }
            
            log.info("만료된 결제 처리 완료: {}개 처리됨", processedCount);
            return processedCount;
            
        } catch (Exception e) {
            log.error("만료된 결제 처리 중 오류 발생: {}", e.getMessage(), e);
            return 0;
        }
    }
    
    @Override
    public boolean sendPaymentNotification(String paymentId, String status) {
        log.info("결제 상태 알림 전송: {} - {}", paymentId, status);
        
        try {
            // 실제 구현에서는 이메일, SMS, 푸시 알림 등을 전송
            // 여기서는 로그로 대체
            log.info("결제 상태 알림: 결제ID={}, 상태={}", paymentId, status);
            
            // TODO: 실제 알림 시스템 연동
            // - 이메일 알림
            // - SMS 알림
            // - 푸시 알림
            // - 웹소켓 실시간 알림
            
            return true;
            
        } catch (Exception e) {
            log.error("결제 상태 알림 전송 실패: {}", e.getMessage(), e);
            return false;
        }
    }
}
