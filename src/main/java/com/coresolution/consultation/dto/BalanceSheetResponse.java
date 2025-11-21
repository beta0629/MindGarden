package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 대차대조표 응답 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceSheetResponse {
    
    private String reportDate;
    private String reportPeriod;
    
    // 자산
    private AssetsSection assets;
    
    // 부채
    private LiabilitiesSection liabilities;
    
    // 자본
    private EquitySection equity;
    
    // 합계 검증
    private BalanceSummary summary;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssetsSection {
        // 유동자산
        private List<BalanceSheetItem> currentAssets;
        private BigDecimal currentAssetsTotal;
        
        // 고정자산
        private List<BalanceSheetItem> fixedAssets;
        private BigDecimal fixedAssetsTotal;
        
        // 자산 총계
        private BigDecimal totalAssets;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LiabilitiesSection {
        // 유동부채
        private List<BalanceSheetItem> currentLiabilities;
        private BigDecimal currentLiabilitiesTotal;
        
        // 비유동부채
        private List<BalanceSheetItem> longTermLiabilities;
        private BigDecimal longTermLiabilitiesTotal;
        
        // 부채 총계
        private BigDecimal totalLiabilities;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquitySection {
        // 자본금
        private BigDecimal capital;
        
        // 이익잉여금
        private BigDecimal retainedEarnings;
        
        // 당기순이익
        private BigDecimal netIncome;
        
        // 자본 총계
        private BigDecimal totalEquity;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BalanceSheetItem {
        private String accountCode;
        private String accountName;
        private BigDecimal amount;
        private String subcategory;
        private String description;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BalanceSummary {
        private BigDecimal totalAssets;
        private BigDecimal totalLiabilities;
        private BigDecimal totalEquity;
        private boolean isBalanced;
        private BigDecimal difference;
    }
}
