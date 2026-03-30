package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * 회기 추가 요청 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface SessionExtensionService {
    
    /**
     * 회기 추가 요청 생성
     */
    SessionExtensionRequest createRequest(Long mappingId, Long requesterId, 
                                        Integer additionalSessions, String packageName, 
                                        BigDecimal packagePrice, String reason);
    
    /**
     * 입금 확인 처리
     */
    SessionExtensionRequest confirmPayment(Long requestId, String paymentMethod, String paymentReference);
    
    /**
     * 관리자 승인
     */
    SessionExtensionRequest approveByAdmin(Long requestId, Long adminId, String comment);
    
    /**
     * 요청 거부
     */
    SessionExtensionRequest rejectRequest(Long requestId, Long adminId, String reason);
    
    /**
     * 요청 완료 처리 (실제 회기 추가)
     */
    SessionExtensionRequest completeRequest(Long requestId);
    
    /**
     * 요청 상세 조회
     */
    SessionExtensionRequest getRequestById(Long requestId);
    
    /**
     * 전체 요청 목록 조회
     */
    List<SessionExtensionRequest> getAllRequests();
    
    /**
     * 상태별 요청 목록 조회
     */
    List<SessionExtensionRequest> getRequestsByStatus(SessionExtensionRequest.ExtensionStatus status);
    
    /**
     * 입금 확인 대기 중인 요청 목록
     */
    List<SessionExtensionRequest> getPendingPaymentRequests();
    
    /**
     * 관리자 승인 대기 중인 요청 목록
     */
    List<SessionExtensionRequest> getPendingAdminApprovalRequests();
    
    /**
     * 요청자별 요청 목록 조회
     */
    List<SessionExtensionRequest> getRequestsByRequester(Long requesterId);
    
    /**
     * 매핑별 요청 목록 조회
     */
    List<SessionExtensionRequest> getRequestsByMapping(Long mappingId);
    
    /**
     * 요청 통계 조회
     */
    Map<String, Object> getRequestStatistics();
    
    /**
     * 요청자별 통계 조회
     */
    List<Map<String, Object>> getRequesterStatistics();
    
    /**
     * 기간별 통계 조회
     */
    Map<String, Object> getPeriodStatistics(String startDate, String endDate);
}
