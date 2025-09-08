package com.mindgarden.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 계좌이체 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankTransferResponse {
    
    /**
     * 결제 ID
     */
    private String paymentId;
    
    /**
     * 가상계좌번호
     */
    private String virtualAccountNumber;
    
    /**
     * 은행 코드
     */
    private String bankCode;
    
    /**
     * 은행명
     */
    private String bankName;
    
    /**
     * 입금 금액
     */
    private BigDecimal amount;
    
    /**
     * 입금자명
     */
    private String depositorName;
    
    /**
     * 입금 만료 시간
     */
    private LocalDateTime expiresAt;
    
    /**
     * 입금 확인 여부
     */
    private Boolean isConfirmed;
    
    /**
     * 입금 확인 시간
     */
    private LocalDateTime confirmedAt;
    
    /**
     * 입금 확인자 ID
     */
    private Long confirmedBy;
    
    /**
     * 입금 확인 메모
     */
    private String confirmationMemo;
    
    /**
     * 입금 안내 메시지
     */
    private String instructionMessage;
    
    /**
     * 입금 확인 URL
     */
    private String confirmationUrl;
}
