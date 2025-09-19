package com.mindgarden.consultation.service;

import java.time.LocalDateTime;
import java.util.List;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.Schedule;

/**
 * 매핑시스템-ERP 동기화 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-19
 */
public interface MappingErpSyncService {
    
    /**
     * 매핑 결제 상태와 ERP 거래 동기화
     * 결제 확인된 매핑 중 ERP 거래가 누락된 경우 자동 생성
     */
    int syncPaymentConfirmations();
    
    /**
     * 완료된 상담 스케줄에 대한 자동 수입 처리
     * 상담이 완료되면 자동으로 상담료 수입 생성
     */
    int processCompletedConsultations();
    
    /**
     * ERP 거래 데이터 정합성 검증
     * 매핑 데이터와 FinancialTransaction 데이터 간 일관성 확인
     */
    List<String> validateDataConsistency();
    
    /**
     * 실패한 ERP 연동 재시도
     * 이전에 실패한 거래 생성을 재시도
     */
    int retryFailedTransactions();
}
