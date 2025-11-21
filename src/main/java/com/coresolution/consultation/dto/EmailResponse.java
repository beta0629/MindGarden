package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 이메일 발송 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailResponse {
    
    /**
     * 이메일 발송 ID
     */
    private String emailId;
    
    /**
     * 발송 상태
     */
    private String status;
    
    /**
     * 발송 성공 여부
     */
    private boolean success;
    
    /**
     * 응답 메시지
     */
    private String message;
    
    /**
     * 수신자 이메일
     */
    private String toEmail;
    
    /**
     * 이메일 제목
     */
    private String subject;
    
    /**
     * 발송 시간
     */
    private LocalDateTime sentAt;
    
    /**
     * 예약 발송 시간
     */
    private LocalDateTime scheduledAt;
    
    /**
     * 발송 시도 횟수
     */
    private int retryCount;
    
    /**
     * 에러 코드
     */
    private String errorCode;
    
    /**
     * 에러 메시지
     */
    private String errorMessage;
    
    /**
     * 외부 이메일 서비스 ID
     */
    private String externalId;
}
