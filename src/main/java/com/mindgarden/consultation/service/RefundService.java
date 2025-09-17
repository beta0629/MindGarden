package com.mindgarden.consultation.service;

import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.RefundRequest;

/**
 * 환불 관리 서비스 인터페이스
 */
public interface RefundService {

    /**
     * 환불 요청 생성
     */
    RefundRequest createRefundRequest(Long mappingId, String refundReason, String reasonCode, 
                                    Integer refundSessions, Long requestedById);

    /**
     * 환불 요청 승인
     */
    RefundRequest approveRefundRequest(Long refundRequestId, Long approvedById);

    /**
     * 환불 요청 거부
     */
    RefundRequest rejectRefundRequest(Long refundRequestId, String rejectionReason, Long rejectedById);

    /**
     * 환불 요청 목록 조회
     */
    List<RefundRequest> getAllRefundRequests();

    /**
     * 상태별 환불 요청 조회
     */
    List<RefundRequest> getRefundRequestsByStatus(RefundRequest.RefundStatus status);

    /**
     * 매핑별 환불 요청 조회
     */
    List<RefundRequest> getRefundRequestsByMapping(Long mappingId);

    /**
     * 내담자별 환불 요청 조회
     */
    List<RefundRequest> getRefundRequestsByClient(Long clientId);

    /**
     * 상담사별 환불 요청 조회
     */
    List<RefundRequest> getRefundRequestsByConsultant(Long consultantId);

    /**
     * 환불 요청 상세 조회
     */
    RefundRequest getRefundRequestById(Long refundRequestId);

    /**
     * ERP 연동 상태 업데이트
     */
    void updateErpIntegrationStatus(Long refundRequestId, RefundRequest.ErpIntegrationStatus erpStatus, 
                                  String erpReferenceNumber, String erpResponseMessage);

    /**
     * 환불 처리 완료
     */
    RefundRequest completeRefundRequest(Long refundRequestId);

    /**
     * 환불 통계 조회 (ERP 연동 기반)
     */
    Map<String, Object> getRefundStatisticsWithErp(String period);

    /**
     * ERP 동기화 실행
     */
    void syncWithErp();
}
