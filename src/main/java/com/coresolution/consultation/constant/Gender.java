package com.coresolution.consultation.constant;

/**
 * 성별 상수 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public class Gender {
    
    // 남성
    public static final String MALE = "MALE";
    
    // 여성
    public static final String FEMALE = "FEMALE";
    
    // 기타
    public static final String OTHER = "OTHER";
    
    // 답변 거부
    public static final String PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY";
    
    // 성별 목록
    public static final String[] ALL_GENDERS = {
        MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY
    };
    
    // 성별 표시명
    public static final String getDisplayName(String gender) {
        switch (gender) {
            case MALE:
                return "남성";
            case FEMALE:
                return "여성";
            case OTHER:
                return "기타";
            case PREFER_NOT_TO_SAY:
                return "답변 거부";
            default:
                return "알 수 없음";
        }
    }
}
