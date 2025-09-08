package com.mindgarden.consultation.dto;

import java.time.LocalDateTime;
import com.mindgarden.consultation.entity.Account;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountResponse {
    
    private Long id;
    private String bankCode;
    private String bankName;
    private String accountNumber;
    private String accountHolder;
    private Long branchId;
    private Boolean isPrimary;
    private Boolean isActive;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static AccountResponse from(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .bankCode(account.getBankCode())
                .bankName(account.getBankName())
                .accountNumber(account.getAccountNumber())
                .accountHolder(account.getAccountHolder())
                .branchId(account.getBranchId())
                .isPrimary(account.getIsPrimary())
                .isActive(account.getIsActive())
                .description(account.getDescription())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }
}
