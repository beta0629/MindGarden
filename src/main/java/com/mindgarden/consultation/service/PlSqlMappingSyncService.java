package com.mindgarden.consultation.service;

import java.util.Map;

/**
 * PL/SQL 매핑-회기 동기화 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
public interface PlSqlMappingSyncService {
    
    /**
     * 회기 사용 처리 (스케줄 생성 시)
     * 
     * @param consultantId 상담사 ID
     * @param clientId 내담자 ID
     * @param scheduleId 스케줄 ID
     * @param sessionType 회기 유형
     * @return 처리 결과
     */
    Map<String, Object> useSessionForMapping(Long consultantId, Long clientId, Long scheduleId, String sessionType);
    
    /**
     * 회기 추가 처리 (연장 요청 시)
     * 
     * @param mappingId 매핑 ID
     * @param additionalSessions 추가 회기 수
     * @param packageName 패키지명
     * @param packagePrice 패키지 가격
     * @param extensionReason 연장 사유
     * @return 처리 결과
     */
    Map<String, Object> addSessionsToMapping(Long mappingId, Integer additionalSessions, 
                                           String packageName, Long packagePrice, String extensionReason);
    
    /**
     * 매핑 데이터 무결성 검증
     * 
     * @param mappingId 매핑 ID
     * @return 검증 결과
     */
    Map<String, Object> validateMappingIntegrity(Long mappingId);
    
    /**
     * 전체 시스템 매핑 동기화
     * 
     * @return 동기화 결과
     */
    Map<String, Object> syncAllMappings();
    
    /**
     * 환불 시 회기 수 조절 처리
     * 
     * @param mappingId 매핑 ID
     * @param refundAmount 환불 금액
     * @param refundSessions 환불 회기 수
     * @param refundReason 환불 사유
     * @param processedBy 처리자
     * @return 처리 결과
     */
    Map<String, Object> processRefundWithSessionAdjustment(Long mappingId, Long refundAmount, 
                                                          Integer refundSessions, String refundReason, String processedBy);
    
    /**
     * 부분 환불 처리 (최근 회기만 환불)
     * 
     * @param mappingId 매핑 ID
     * @param refundAmount 환불 금액
     * @param refundSessions 환불 회기 수
     * @param refundReason 환불 사유
     * @param processedBy 처리자
     * @return 처리 결과
     */
    Map<String, Object> processPartialRefund(Long mappingId, Long refundAmount, 
                                           Integer refundSessions, String refundReason, String processedBy);
    
    /**
     * 환불 가능 회기 수 조회
     * 
     * @param mappingId 매핑 ID
     * @return 환불 가능 정보
     */
    Map<String, Object> getRefundableSessions(Long mappingId);
    
    /**
     * 환불 통계 조회
     * 
     * @param branchCode 지점 코드
     * @param startDate 시작 날짜
     * @param endDate 종료 날짜
     * @return 환불 통계
     */
    Map<String, Object> getRefundStatistics(String branchCode, String startDate, String endDate);
    
    /**
     * PL/SQL 프로시저 사용 가능 여부 확인
     * 
     * @return 사용 가능 여부
     */
    boolean isProcedureAvailable();
}
