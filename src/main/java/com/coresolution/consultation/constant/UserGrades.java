package com.coresolution.consultation.constant;

/**
 * 사용자 등급 상수 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public final class UserGrades {
    
    // 기본 등급
    public static final String BRONZE = "BRONZE";
    public static final String SILVER = "SILVER";
    public static final String GOLD = "GOLD";
    public static final String PLATINUM = "PLATINUM";
    public static final String DIAMOND = "DIAMOND";
    
    // 등급 순서 (낮은 순서대로)
    public static final String[] GRADE_ORDER = {BRONZE, SILVER, GOLD, PLATINUM, DIAMOND};
    
    // 등급별 최소 경험치
    public static final int BRONZE_MIN_EXP = 0;
    public static final int SILVER_MIN_EXP = 100;
    public static final int GOLD_MIN_EXP = 500;
    public static final int PLATINUM_MIN_EXP = 1000;
    public static final int DIAMOND_MIN_EXP = 2000;
    
    // 등급별 설명
    public static final String BRONZE_DESCRIPTION = "브론즈";
    public static final String SILVER_DESCRIPTION = "실버";
    public static final String GOLD_DESCRIPTION = "골드";
    public static final String PLATINUM_DESCRIPTION = "플래티넘";
    public static final String DIAMOND_DESCRIPTION = "다이아몬드";
    
    // 등급별 혜택
    public static final double BRONZE_DISCOUNT = 0.0;
    public static final double SILVER_DISCOUNT = 0.05;
    public static final double GOLD_DISCOUNT = 0.10;
    public static final double PLATINUM_DISCOUNT = 0.15;
    public static final double DIAMOND_DISCOUNT = 0.20;
    
    private UserGrades() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }
    
    /**
     * 등급이 유효한지 확인
     */
    public static boolean isValidGrade(String grade) {
        if (grade == null) return false;
        for (String validGrade : GRADE_ORDER) {
            if (validGrade.equals(grade)) return true;
        }
        return false;
    }
    
    /**
     * 경험치에 따른 등급 반환
     */
    public static String getGradeByExperience(int experience) {
        if (experience >= DIAMOND_MIN_EXP) return DIAMOND;
        if (experience >= PLATINUM_MIN_EXP) return PLATINUM;
        if (experience >= GOLD_MIN_EXP) return GOLD;
        if (experience >= SILVER_MIN_EXP) return SILVER;
        return BRONZE;
    }
    
    /**
     * 등급의 할인율 반환
     */
    public static double getDiscountByGrade(String grade) {
        switch (grade) {
            case BRONZE: return BRONZE_DISCOUNT;
            case SILVER: return SILVER_DISCOUNT;
            case GOLD: return GOLD_DISCOUNT;
            case PLATINUM: return PLATINUM_DISCOUNT;
            case DIAMOND: return DIAMOND_DISCOUNT;
            default: return BRONZE_DISCOUNT;
        }
    }
    
    /**
     * 등급 설명 반환
     */
    public static String getGradeDescription(String grade) {
        switch (grade) {
            case BRONZE: return BRONZE_DESCRIPTION;
            case SILVER: return SILVER_DESCRIPTION;
            case GOLD: return GOLD_DESCRIPTION;
            case PLATINUM: return PLATINUM_DESCRIPTION;
            case DIAMOND: return DIAMOND_DESCRIPTION;
            default: return "알 수 없음";
        }
    }
    
    /**
     * 다음 등급까지 필요한 경험치 반환
     */
    public static int getExperienceToNextGrade(String currentGrade) {
        switch (currentGrade) {
            case BRONZE: return SILVER_MIN_EXP;
            case SILVER: return GOLD_MIN_EXP;
            case GOLD: return PLATINUM_MIN_EXP;
            case PLATINUM: return DIAMOND_MIN_EXP;
            case DIAMOND: return -1; // 이미 최고 등급
            default: return -1;
        }
    }
}
