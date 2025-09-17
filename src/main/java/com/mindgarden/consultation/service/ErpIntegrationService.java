package com.mindgarden.consultation.service;

import java.util.Map;
import com.mindgarden.consultation.entity.RefundRequest;

/**
 * ERP 연동 서비스 인터페이스
 */
public interface ErpIntegrationService {

    /**
     * ERP에 환불 요청 전송
     */
    Map<String, Object> sendRefundRequestToErp(RefundRequest refundRequest);

    /**
     * ERP에서 환불 상태 확인
     */
    Map<String, Object> checkRefundStatusFromErp(String erpReferenceNumber);

    /**
     * ERP 연동 실패 시 재시도
     */
    void retryFailedErpIntegrations();

    /**
     * ERP 시스템 연결 상태 확인
     */
    boolean isErpSystemAvailable();

    /**
     * ERP 환불 데이터 동기화
     */
    void synchronizeErpRefundData();
}
