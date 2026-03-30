package com.coresolution.consultation.constant;

/**
 * 연령대 상수 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public class AgeGroup {
    
    // 아동 (0-12세)
    public static final String CHILD = "CHILD";
    
    // 청소년 (13-18세)
    public static final String TEENAGER = "TEENAGER";
    
    // 청년 (19-29세)
    public static final String YOUNG_ADULT = "YOUNG_ADULT";
    
    // 성인 (30-49세)
    public static final String ADULT = "ADULT";
    
    // 중년 (50-64세)
    public static final String MIDDLE_AGE = "MIDDLE_AGE";
    
    // 노년 (65세 이상)
    public static final String ELDERLY = "ELDERLY";
    
    // 연령대 목록
    public static final String[] ALL_AGE_GROUPS = {
        CHILD, TEENAGER, YOUNG_ADULT, ADULT, MIDDLE_AGE, ELDERLY
    };
    
    // 연령대 표시명
    public static final String getDisplayName(String ageGroup) {
        switch (ageGroup) {
            case CHILD:
                return "아동 (0-12세)";
            case TEENAGER:
                return "청소년 (13-18세)";
            case YOUNG_ADULT:
                return "청년 (19-29세)";
            case ADULT:
                return "성인 (30-49세)";
            case MIDDLE_AGE:
                return "중년 (50-64세)";
            case ELDERLY:
                return "노년 (65세 이상)";
            default:
                return "알 수 없음";
        }
    }
    
    // 연령대 범위
    public static final String getAgeRange(String ageGroup) {
        switch (ageGroup) {
            case CHILD:
                return "0-12세";
            case TEENAGER:
                return "13-18세";
            case YOUNG_ADULT:
                return "19-29세";
            case ADULT:
                return "30-49세";
            case MIDDLE_AGE:
                return "50-64세";
            case ELDERLY:
                return "65세 이상";
            default:
                return "알 수 없음";
        }
    }
}
