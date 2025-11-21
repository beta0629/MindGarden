package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AccountRequest {
    
    @NotBlank(message = "은행 코드는 필수입니다")
    private String bankCode;
    
    @NotBlank(message = "은행명은 필수입니다")
    @Size(max = 50, message = "은행명은 50자를 초과할 수 없습니다")
    private String bankName;
    
    @NotBlank(message = "계좌번호는 필수입니다")
    @Pattern(regexp = "^[0-9-]+$", message = "계좌번호는 숫자와 하이픈만 입력 가능합니다")
    @Size(max = 50, message = "계좌번호는 50자를 초과할 수 없습니다")
    private String accountNumber;
    
    @NotBlank(message = "예금주명은 필수입니다")
    @Size(max = 100, message = "예금주명은 100자를 초과할 수 없습니다")
    private String accountHolder;
    
    private Long branchId;
    
    private Boolean isPrimary = false;
    
    private Boolean isActive = true;
    
    @Size(max = 500, message = "설명은 500자를 초과할 수 없습니다")
    private String description;
}
