package com.coresolution.core.domain.enums;

import lombok.Getter;

/**
 * 승인 상태 열거형
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Getter
public enum ApprovalStatus {
    
    /**
     * 대기 중
     */
    PENDING("대기 중", "Pending"),
    
    /**
     * 승인됨
     */
    APPROVED("승인됨", "Approved"),
    
    /**
     * 거부됨
     */
    REJECTED("거부됨", "Rejected");
    
    private final String nameKo;
    private final String nameEn;
    
    ApprovalStatus(String nameKo, String nameEn) {
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
     * 승인 여부 확인
     */
    public boolean isApproved() {
        return this == APPROVED;
    }
    
    /**
     * 거부 여부 확인
     */
    public boolean isRejected() {
        return this == REJECTED;
    }
    
    /**
     * 대기 중 여부 확인
     */
    public boolean isPending() {
        return this == PENDING;
    }
}

