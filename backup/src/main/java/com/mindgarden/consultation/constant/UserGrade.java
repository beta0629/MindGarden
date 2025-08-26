package com.mindgarden.consultation.constant;

/**
 * 사용자 등급 상수 정의
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public class UserGrade {
    
    // 내담자 등급
    public static final String CLIENT_BRONZE = "CLIENT_BRONZE";      // 브론즈
    public static final String CLIENT_SILVER = "CLIENT_SILVER";      // 실버
    public static final String CLIENT_GOLD = "CLIENT_GOLD";          // 골드
    public static final String CLIENT_PLATINUM = "CLIENT_PLATINUM";  // 플래티넘
    
    // 상담사 등급
    public static final String CONSULTANT_JUNIOR = "CONSULTANT_JUNIOR";    // 주니어
    public static final String CONSULTANT_SENIOR = "CONSULTANT_SENIOR";    // 시니어
    public static final String CONSULTANT_EXPERT = "CONSULTANT_EXPERT";    // 엑스퍼트
    public static final String CONSULTANT_MASTER = "CONSULTANT_MASTER";    // 마스터
    
    // 관리자 등급
    public static final String ADMIN_MANAGER = "ADMIN_MANAGER";      // 매니저
    public static final String ADMIN_DIRECTOR = "ADMIN_DIRECTOR";    // 디렉터
    public static final String ADMIN_EXECUTIVE = "ADMIN_EXECUTIVE";  // 임원
    public static final String ADMIN_SUPER = "ADMIN_SUPER";          // 최고 관리자
    
    // 내담자 등급 목록 (낮은 순서)
    public static final String[] CLIENT_GRADES = {
        CLIENT_BRONZE, CLIENT_SILVER, CLIENT_GOLD, CLIENT_PLATINUM
    };
    
    // 상담사 등급 목록 (낮은 순서)
    public static final String[] CONSULTANT_GRADES = {
        CONSULTANT_JUNIOR, CONSULTANT_SENIOR, CONSULTANT_EXPERT, CONSULTANT_MASTER
    };
    
    // 관리자 등급 목록 (낮은 순서)
    public static final String[] ADMIN_GRADES = {
        ADMIN_MANAGER, ADMIN_DIRECTOR, ADMIN_EXECUTIVE, ADMIN_SUPER
    };
    
    // 모든 등급 목록
    public static final String[] ALL_GRADES = {
        CLIENT_BRONZE, CLIENT_SILVER, CLIENT_GOLD, CLIENT_PLATINUM,
        CONSULTANT_JUNIOR, CONSULTANT_SENIOR, CONSULTANT_EXPERT, CONSULTANT_MASTER,
        ADMIN_MANAGER, ADMIN_DIRECTOR, ADMIN_EXECUTIVE, ADMIN_SUPER
    };
}
