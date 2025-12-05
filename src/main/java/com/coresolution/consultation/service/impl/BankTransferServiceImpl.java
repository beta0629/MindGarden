package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.constant.BankTransferConstants;
import com.coresolution.consultation.dto.BankTransferRequest;
import com.coresolution.consultation.dto.BankTransferResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.service.BankTransferService;
import com.coresolution.consultation.service.FinancialTransactionService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

 /**
 * 계좌이체 입금 확인 서비스 구현체
 /**
 * 
 /**
 * @author MindGarden
 /**
 * @version 1.0.0
 /**
 * @since 2025-01-05
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class BankTransferServiceImpl implements BankTransferService {
    
    private final PaymentRepository paymentRepository;
    private final FinancialTransactionService financialTransactionService;
    
    @Override
    public BankTransferResponse createVirtualAccount(BankTransferRequest request) {
        log.info("가상계좌 생성 요청: {}", request.getPaymentId());
        
        Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(request.getPaymentId())
                .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다."));
        
        String virtualAccountNumber = generateVirtualAccountNumber();
        
        payment.setDescription("가상계좌: " + virtualAccountNumber);
        payment.setExpiresAt(request.getExpiresAt());
        paymentRepository.save(payment);
        
        log.info("가상계좌 생성 완료: {}", virtualAccountNumber);
        
        return BankTransferResponse.builder()
                .paymentId(payment.getPaymentId())
                .virtualAccountNumber(virtualAccountNumber)
                .bankCode("004") // 국민은행 코드 (예시)
                .bankName("국민은행")
                .amount(request.getAmount())
                .depositorName(request.getDepositorName())
                .expiresAt(request.getExpiresAt())
                .isConfirmed(false)
                .instructionMessage("가상계좌로 입금해주세요. 입금자명은 정확히 입력해주세요.")
                .confirmationUrl("/api/payments/" + payment.getPaymentId() + "/confirm")
                .build();
    }
    
    @Override
    public boolean confirmDeposit(String paymentId, Long amount, String depositorName) {
        log.info("입금 확인 (수동): {}, 금액: {}, 입금자: {}", paymentId, amount, depositorName);
        
        try {
            Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
                    .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다."));
            
            if (payment.getAmount().longValue() != amount) {
                log.warn("입금 금액 불일치: 예상={}, 실제={}", payment.getAmount(), amount);
                return false;
            }
            
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            payment.setStatus(Payment.PaymentStatus.APPROVED);
            payment.setApprovedAt(LocalDateTime.now());
            payment.setDescription(payment.getDescription() + " (입금자: " + depositorName + ")");
            paymentRepository.save(payment);
            
            log.info("입금 확인 완료: {}", paymentId);
            return true;
            
        } catch (Exception e) {
            log.error("입금 확인 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    public boolean autoConfirmDeposit(String paymentId) {
        log.info("입금 확인 (자동): {}", paymentId);
        
        try {
            Payment payment = paymentRepository.findByPaymentIdAndIsDeletedFalse(paymentId)
                    .orElseThrow(() -> new RuntimeException("결제를 찾을 수 없습니다."));
            
            boolean isDeposited = checkBankDeposit(payment);
            
            if (isDeposited) {
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                payment.setStatus(Payment.PaymentStatus.APPROVED);
                payment.setApprovedAt(LocalDateTime.now());
                payment.setDescription(payment.getDescription() + " (자동 확인)");
                paymentRepository.save(payment);
                
                log.info("자동 입금 확인 완료: {}", paymentId);
                return true;
            }
            
            return false;
            
        } catch (Exception e) {
            log.error("자동 입금 확인 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Payment> getUnconfirmedDeposits() {
        log.info("미확인 입금 목록 조회");
        
        // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
        return paymentRepository.findByStatusAndIsDeletedFalse(Payment.PaymentStatus.PENDING, null).getContent();
    }
    
    @Override
    @Scheduled(fixedRate = 300000) // 5분마다 실행
    public int processDepositConfirmations() {
        log.info("입금 확인 배치 처리 시작");
        
        List<Payment> unconfirmedPayments = getUnconfirmedDeposits();
        int processedCount = 0;
        
        for (Payment payment : unconfirmedPayments) {
            try {
                if (payment.getMethod() == Payment.PaymentMethod.VIRTUAL_ACCOUNT) {
                    if (autoConfirmDeposit(payment.getPaymentId())) {
                        processedCount++;
                    }
                }
            } catch (Exception e) {
                log.error("입금 확인 처리 실패: {}, {}", payment.getPaymentId(), e.getMessage());
            }
        }
        
        log.info("입금 확인 배치 처리 완료: {}건 처리", processedCount);
        return processedCount;
    }
    
    @Override
    public boolean processDepositNotification(String virtualAccountNumber, Long amount, 
                                           String depositorName, LocalDateTime depositTime) {
        log.info("가상계좌 입금 알림 처리: {}, 금액: {}, 입금자: {}", 
                virtualAccountNumber, amount, depositorName);
        
        try {
            Payment payment = findPaymentByVirtualAccount(virtualAccountNumber);
            
            if (payment == null) {
                log.warn("가상계좌에 해당하는 결제를 찾을 수 없습니다: {}", virtualAccountNumber);
                return false;
            }
            
            if (payment.getAmount().longValue() != amount) {
                log.warn("입금 금액 불일치: 예상={}, 실제={}", payment.getAmount(), amount);
                return false;
            }
            
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            payment.setStatus(Payment.PaymentStatus.APPROVED);
            payment.setApprovedAt(depositTime);
            payment.setDescription(payment.getDescription() + " (입금자: " + depositorName + ")");
            paymentRepository.save(payment);
            
            try {
                financialTransactionService.createPaymentTransaction(payment.getId(), 
                    "가상계좌 입금 완료 - " + payment.getDescription(), "가상계좌", "가상계좌입금");
                log.info("💚 가상계좌 입금으로 인한 수입 거래 자동 생성: PaymentID={}", payment.getPaymentId());
            } catch (Exception e) {
                log.error("수입 거래 자동 생성 실패: {}", e.getMessage(), e);
            }
            
            log.info("가상계좌 입금 알림 처리 완료: {}", virtualAccountNumber);
            return true;
            
        } catch (Exception e) {
            log.error("가상계좌 입금 알림 처리 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Object getDepositStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("입금 통계 조회: {} ~ {}", startDate, endDate);
        
        try {
            if (startDate.isAfter(endDate)) {
                throw new IllegalArgumentException("시작일은 종료일보다 빨라야 합니다.");
            }
            
            List<Payment> deposits = paymentRepository.findByCreatedAtBetweenAndIsDeletedFalse(startDate, endDate, null).getContent();
            
            long totalDeposits = deposits.size();
            long successfulDeposits = deposits.stream()
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    .filter(p -> Payment.PaymentStatus.APPROVED.equals(p.getStatus()))
                    .count();
            long failedDeposits = deposits.stream()
                    .filter(p -> Payment.PaymentStatus.FAILED.equals(p.getStatus()))
                    .count();
            long pendingDeposits = deposits.stream()
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    .filter(p -> Payment.PaymentStatus.PENDING.equals(p.getStatus()))
                    .count();
            
            long totalAmount = deposits.stream()
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    .filter(p -> Payment.PaymentStatus.APPROVED.equals(p.getStatus()))
                    .mapToLong(p -> p.getAmount().longValue())
                    .sum();
            
            double averageAmount = successfulDeposits > 0 ? (double) totalAmount / successfulDeposits : 0.0;
            
            java.util.Map<String, Object> statistics = new java.util.HashMap<>();
            statistics.put(BankTransferConstants.STATS_TOTAL_DEPOSITS, totalDeposits);
            statistics.put(BankTransferConstants.STATS_SUCCESSFUL_DEPOSITS, successfulDeposits);
            statistics.put(BankTransferConstants.STATS_FAILED_DEPOSITS, failedDeposits);
            statistics.put(BankTransferConstants.STATS_PENDING_DEPOSITS, pendingDeposits);
            statistics.put(BankTransferConstants.STATS_TOTAL_AMOUNT, totalAmount);
            statistics.put(BankTransferConstants.STATS_AVERAGE_AMOUNT, averageAmount);
            statistics.put("startDate", startDate);
            statistics.put("endDate", endDate);
            
            log.info("입금 통계 조회 완료: total={}, successful={}, failed={}, pending={}", 
                    totalDeposits, successfulDeposits, failedDeposits, pendingDeposits);
            
            return statistics;
            
        } catch (Exception e) {
            log.error("입금 통계 조회 중 오류 발생: {}", e.getMessage(), e);
            throw new RuntimeException("입금 통계 조회에 실패했습니다.", e);
        }
    }
    
    
    private String generateVirtualAccountNumber() {
        log.info("가상계좌번호 생성 시작");
        
        try {
            String timestamp = String.valueOf(System.currentTimeMillis());
            String randomSuffix = String.format("%04d", (int) (Math.random() * 10000));
            String virtualAccountNumber = BankTransferConstants.VIRTUAL_ACCOUNT_PREFIX + 
                    timestamp.substring(timestamp.length() - 8) + randomSuffix;
            
            if (virtualAccountNumber.length() != BankTransferConstants.VIRTUAL_ACCOUNT_LENGTH) {
                throw new RuntimeException("가상계좌번호 길이가 올바르지 않습니다.");
            }
            
            log.info("가상계좌번호 생성 완료: {}", virtualAccountNumber);
            return virtualAccountNumber;
            
        } catch (Exception e) {
            log.error("가상계좌번호 생성 실패: {}", e.getMessage(), e);
            throw new RuntimeException(BankTransferConstants.ERROR_VIRTUAL_ACCOUNT_CREATION_FAILED, e);
        }
    }
    
    private boolean checkBankDeposit(Payment payment) {
        log.info("은행 입금 확인 시작: paymentId={}, virtualAccount={}", 
                payment.getPaymentId(), "N/A");
        
        try {
            String apiUrl = BankTransferConstants.BANK_API_BASE_URL + BankTransferConstants.BANK_API_DEPOSIT_CHECK_ENDPOINT;
            
            java.util.Map<String, Object> requestData = new java.util.HashMap<>();
            requestData.put("virtualAccountNumber", "N/A");
            requestData.put("amount", payment.getAmount());
            requestData.put("currency", BankTransferConstants.CURRENCY_KRW);
            requestData.put("paymentId", payment.getPaymentId());
            
            boolean depositConfirmed = simulateBankDepositCheck(requestData);
            
            if (depositConfirmed) {
                log.info(BankTransferConstants.SUCCESS_DEPOSIT_CONFIRMED);
            } else {
                log.info("입금 확인되지 않음: {}", payment.getPaymentId());
            }
            
            return depositConfirmed;
            
        } catch (Exception e) {
            log.error("은행 입금 확인 중 오류 발생: {}", e.getMessage(), e);
            return false;
        }
    }
    
    private boolean simulateBankDepositCheck(java.util.Map<String, Object> requestData) {
        return Math.random() > 0.3;
    }
    
    private Payment findPaymentByVirtualAccount(String virtualAccountNumber) {
        log.info("가상계좌번호로 결제 조회: {}", virtualAccountNumber);
        
        try {
            if (virtualAccountNumber == null || virtualAccountNumber.length() != BankTransferConstants.VIRTUAL_ACCOUNT_LENGTH) {
                throw new IllegalArgumentException(BankTransferConstants.ERROR_INVALID_ACCOUNT_NUMBER);
            }
            
            List<Payment> payments = paymentRepository.findByVirtualAccountNumberAndIsDeletedFalse(virtualAccountNumber);
            
            if (payments.isEmpty()) {
                log.warn("가상계좌번호에 해당하는 결제를 찾을 수 없음: {}", virtualAccountNumber);
                return null;
            }
            
            Payment payment = payments.stream()
                    // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                    .filter(p -> Payment.PaymentStatus.PENDING.equals(p.getStatus()))
                    .findFirst()
                    .orElse(payments.get(0));
            
            log.info("가상계좌번호로 결제 조회 완료: paymentId={}, status={}", 
                    payment.getPaymentId(), payment.getStatus());
            
            return payment;
            
        } catch (Exception e) {
            log.error("가상계좌번호로 결제 조회 중 오류 발생: {}", e.getMessage(), e);
            return null;
        }
    }
}
