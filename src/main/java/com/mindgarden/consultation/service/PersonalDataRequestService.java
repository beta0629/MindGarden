package com.mindgarden.consultation.service;

import java.time.LocalDateTime;
import java.util.Map;
import jakarta.servlet.http.HttpServletRequest;

/**
 * 개인정보 열람/삭제 요청 서비스 인터페이스
 * 개인정보보호법 준수를 위한 서비스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
public interface PersonalDataRequestService {
    
    /**
     * 개인정보 열람 요청 처리
     * 
     * @param userId 사용자 ID
     * @param request HTTP 요청
     * @return 처리 결과
     */
    Map<String, Object> requestPersonalDataAccess(Long userId, HttpServletRequest request);
    
    /**
     * 개인정보 삭제 요청 처리
     * 
     * @param userId 사용자 ID
     * @param password 본인 확인용 비밀번호
     * @param reason 삭제 사유
     * @param request HTTP 요청
     * @return 처리 결과
     */
    Map<String, Object> requestPersonalDataDeletion(Long userId, String password, String reason, HttpServletRequest request);
    
    /**
     * 개인정보 열람/삭제 요청 현황 조회
     * 
     * @param userId 사용자 ID
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 요청 현황
     */
    Map<String, Object> getRequestStatus(Long userId, LocalDateTime startDate, LocalDateTime endDate);
    
    /**
     * 개인정보 처리 현황 조회
     * 
     * @param userId 사용자 ID
     * @return 처리 현황
     */
    Map<String, Object> getPersonalDataProcessingStatus(Long userId);
}

