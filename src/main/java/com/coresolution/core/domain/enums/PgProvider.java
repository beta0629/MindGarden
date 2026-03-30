package com.coresolution.core.domain.enums;

import lombok.Getter;

/**
 * PG사 제공자 열거형
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Getter
public enum PgProvider {
    
    /**
     * 토스페이먼츠
     */
    TOSS("토스페이먼츠", "Toss Payments"),
    
    /**
     * 아임포트
     */
    IAMPORT("아임포트", "Iamport"),
    
    /**
     * 카카오페이
     */
    KAKAO("카카오페이", "Kakao Pay"),
    
    /**
     * 네이버페이
     */
    NAVER("네이버페이", "Naver Pay"),
    
    /**
     * 페이팔
     */
    PAYPAL("페이팔", "PayPal"),
    
    /**
     * 스트라이프
     */
    STRIPE("스트라이프", "Stripe");
    
    private final String nameKo;
    private final String nameEn;
    
    PgProvider(String nameKo, String nameEn) {
        this.nameKo = nameKo;
        this.nameEn = nameEn;
    }
    
    /**
     * 한글명 반환
     */
    public String getName() {
        return nameKo;
    }
}

