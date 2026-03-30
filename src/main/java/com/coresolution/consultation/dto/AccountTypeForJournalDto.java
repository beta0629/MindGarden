package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 분개용 계정과목 목록 응답 DTO.
 * CommonCode(ERP_ACCOUNT_TYPE) + extraData.accountId 기반.
 *
 * @author MindGarden
 * @since 2025-03-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountTypeForJournalDto {

    private Long accountId;
    private String label;
    private String codeValue;
}
