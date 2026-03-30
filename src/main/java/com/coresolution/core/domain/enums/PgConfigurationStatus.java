package com.coresolution.core.domain.enums;

import lombok.Getter;

/**
 * PG 설정 상태 열거형
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Getter
public enum PgConfigurationStatus {
    
    /**
     * 대기 중 (승인 대기)
     */
    PENDING("대기 중", "Pending"),
    
    /**
     * 승인됨
     */
    APPROVED("승인됨", "Approved"),
    
    /**
     * 거부됨
     */
    REJECTED("거부됨", "Rejected"),
    
    /**
     * 활성화됨 (사용 중)
     */
    ACTIVE("활성화됨", "Active"),
    
    /**
     * 비활성화됨
     */
    INACTIVE("비활성화됨", "Inactive");
    
    private final String nameKo;
    private final String nameEn;
    
    PgConfigurationStatus(String nameKo, String nameEn) {
        this.nameKo = nameKo;
        this.nameEn = nameEn;
    }
    
    /**
     * 한글명 반환
     */
    public String getName() {
        return nameKo;
    }
    
    /**
     * 활성 상태 확인
     */
    public boolean isActive() {
        return this == ACTIVE;
    }
    
    /**
     * 승인 상태 확인
     */
    public boolean isApproved() {
        return this == APPROVED || this == ACTIVE;
    }
}

