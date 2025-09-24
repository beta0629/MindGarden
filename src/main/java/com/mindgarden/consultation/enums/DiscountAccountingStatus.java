package com.mindgarden.consultation.enums;

/**
 * 할인 회계 상태 열거형
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public enum DiscountAccountingStatus {
    
    // 기본 상태
    PENDING("대기중", "할인 적용 대기 상태"),
    APPLIED("적용됨", "할인이 적용된 상태"),
    CONFIRMED("확정됨", "할인이 확정된 상태"),
    
    // 환불 관련 상태
    PARTIAL_REFUND("부분환불", "일부 환불된 상태"),
    FULL_REFUND("전체환불", "전체 환불된 상태"),
    REFUND_PENDING("환불대기", "환불 처리 대기 상태"),
    REFUND_PROCESSING("환불처리중", "환불 처리 중인 상태"),
    
    // 취소/수정 관련 상태
    CANCELLED("취소됨", "할인이 취소된 상태"),
    MODIFIED("수정됨", "할인이 수정된 상태"),
    REVERSED("역전됨", "할인이 역전된 상태"),
    
    // 오류 상태
    ERROR("오류", "처리 중 오류 발생"),
    FAILED("실패", "처리 실패"),
    
    // 최종 상태
    COMPLETED("완료", "모든 처리가 완료된 상태"),
    CLOSED("종료", "더 이상 처리할 수 없는 상태");
    
    private final String koreanName;
    private final String description;
    
    DiscountAccountingStatus(String koreanName, String description) {
        this.koreanName = koreanName;
        this.description = description;
    }
    
    public String getKoreanName() {
        return koreanName;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * 환불 가능한 상태인지 확인
     */
    public boolean isRefundable() {
        return this == APPLIED || 
               this == CONFIRMED || 
               this == PARTIAL_REFUND;
    }
    
    /**
     * 수정 가능한 상태인지 확인
     */
    public boolean isModifiable() {
        return this == PENDING || 
               this == APPLIED || 
               this == CONFIRMED;
    }
    
    /**
     * 취소 가능한 상태인지 확인
     */
    public boolean isCancellable() {
        return this == PENDING || 
               this == APPLIED || 
               this == CONFIRMED;
    }
    
    /**
     * 최종 상태인지 확인
     */
    public boolean isFinal() {
        return this == COMPLETED || 
               this == CLOSED || 
               this == FULL_REFUND;
    }
}
