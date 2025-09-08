package com.mindgarden.consultation.service;

import java.time.LocalDateTime;
import java.util.List;
import com.mindgarden.consultation.dto.BankTransferRequest;
import com.mindgarden.consultation.dto.BankTransferResponse;
import com.mindgarden.consultation.entity.Payment;

/**
 * 계좌이체 입금 확인 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
public interface BankTransferService {
    
    /**
     * 가상계좌 생성
     * 
     * @param request 가상계좌 생성 요청
     * @return 가상계좌 응답
     */
    BankTransferResponse createVirtualAccount(BankTransferRequest request);
    
    /**
     * 입금 확인 (수동)
     * 
     * @param paymentId 결제 ID
     * @param amount 입금 금액
     * @param depositorName 입금자명
     * @return 확인 결과
     */
    boolean confirmDeposit(String paymentId, Long amount, String depositorName);
    
    /**
     * 입금 확인 (자동)
     * 
     * @param paymentId 결제 ID
     * @return 확인 결과
     */
    boolean autoConfirmDeposit(String paymentId);
    
    /**
     * 미확인 입금 목록 조회
     * 
     * @return 미확인 입금 목록
     */
    List<Payment> getUnconfirmedDeposits();
    
    /**
     * 입금 확인 처리 (배치)
     * 
     * @return 처리된 건수
     */
    int processDepositConfirmations();
    
    /**
     * 가상계좌 입금 알림 처리
     * 
     * @param virtualAccountNumber 가상계좌번호
     * @param amount 입금 금액
     * @param depositorName 입금자명
     * @param depositTime 입금 시간
     * @return 처리 결과
     */
    boolean processDepositNotification(String virtualAccountNumber, Long amount, 
                                     String depositorName, LocalDateTime depositTime);
    
    /**
     * 입금 통계 조회
     * 
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 입금 통계
     */
    Object getDepositStatistics(LocalDateTime startDate, LocalDateTime endDate);
}
