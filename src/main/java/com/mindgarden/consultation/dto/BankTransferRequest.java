package com.mindgarden.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 계좌이체 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankTransferRequest {
    
    /**
     * 결제 ID
     */
    @NotBlank(message = "결제 ID는 필수입니다.")
    private String paymentId;
    
    /**
     * 입금 금액
     */
    @NotNull(message = "입금 금액은 필수입니다.")
    @DecimalMin(value = "1000", message = "입금 금액은 최소 1,000원 이상이어야 합니다.")
    private BigDecimal amount;
    
    /**
     * 입금자명
     */
    @NotBlank(message = "입금자명은 필수입니다.")
    @Size(max = 50, message = "입금자명은 50자를 초과할 수 없습니다.")
    private String depositorName;
    
    /**
     * 입금자 전화번호
     */
    @Pattern(regexp = "^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$", 
             message = "올바른 전화번호 형식이 아닙니다.")
    private String depositorPhone;
    
    /**
     * 입금자 이메일
     */
    @Email(message = "올바른 이메일 형식이 아닙니다.")
    private String depositorEmail;
    
    /**
     * 입금 시간
     */
    private LocalDateTime depositTime;
    
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
     * 입금 만료 시간
     */
    private LocalDateTime expiresAt;
    
    /**
     * 입금 확인 여부
     */
    @Builder.Default
    private Boolean isConfirmed = false;
    
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
    @Size(max = 500, message = "입금 확인 메모는 500자를 초과할 수 없습니다.")
    private String confirmationMemo;
}
