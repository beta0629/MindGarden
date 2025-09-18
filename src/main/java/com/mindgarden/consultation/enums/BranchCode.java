package com.mindgarden.consultation.enums;

/**
 * 지점 코드 열거형
 * 공통코드 시스템과 연동하여 지점 정보를 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-18
 */
public enum BranchCode {
    
    /**
     * 본점
     */
    MAIN001("MAIN001", "본점", "본점"),
    
    /**
     * 강남점
     */
    GANGNAM("GANGNAM", "강남점", "강남지점"),
    
    /**
     * 홍대점
     */
    HONGDAE("HONGDAE", "홍대점", "홍대지점"),
    
    /**
     * 잠실점
     */
    JAMSIL("JAMSIL", "잠실점", "잠실지점"),
    
    /**
     * 신촌점
     */
    SINCHON("SINCHON", "신촌점", "신촌지점");
    
    private final String code;
    private final String name;
    private final String description;
    
    BranchCode(String code, String name, String description) {
        this.code = code;
        this.name = name;
        this.description = description;
    }
    
    public String getCode() {
        return code;
    }
    
    public String getName() {
        return name;
    }
    
    public String getDescription() {
        return description;
    }
    
    /**
     * 코드로 BranchCode 찾기
     */
    public static BranchCode fromCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return MAIN001; // 기본값
        }
        
        for (BranchCode branchCode : values()) {
            if (branchCode.getCode().equals(code)) {
                return branchCode;
            }
        }
        
        return MAIN001; // 기본값
    }
    
    /**
     * 지점 코드 유효성 검사
     */
    public static boolean isValidCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return false;
        }
        
        for (BranchCode branchCode : values()) {
            if (branchCode.getCode().equals(code)) {
                return true;
            }
        }
        
        return false;
    }
}
