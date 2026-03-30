package com.mindgarden.consultation.constant;

/**
 * 주소 타입 상수 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public class AddressType {
    
    // 집
    public static final String HOME = "HOME";
    
    // 직장
    public static final String WORK = "WORK";
    
    // 사무실
    public static final String OFFICE = "OFFICE";
    
    // 지점
    public static final String BRANCH = "BRANCH";
    
    // 비상연락처
    public static final String EMERGENCY = "EMERGENCY";
    
    // 기타
    public static final String OTHER = "OTHER";
    
    // 주소 타입 목록
    public static final String[] ALL_ADDRESS_TYPES = {
        HOME, WORK, OFFICE, BRANCH, EMERGENCY, OTHER
    };
    
    // 주소 타입 표시명
    public static final String getDisplayName(String addressType) {
        switch (addressType) {
            case HOME:
                return "집";
            case WORK:
                return "직장";
            case OFFICE:
                return "사무실";
            case BRANCH:
                return "지점";
            case EMERGENCY:
                return "비상연락처";
            case OTHER:
                return "기타";
            default:
                return "알 수 없음";
        }
    }
    
    // 기본 주소 타입 (집)
    public static final String DEFAULT_ADDRESS_TYPE = HOME;
}
