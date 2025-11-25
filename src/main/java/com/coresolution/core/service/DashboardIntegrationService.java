package com.coresolution.core.service;

import java.util.List;

/**
 * 대시보드 통합 서비스
 * 스케줄, ERP 등 데이터 변경 시 대시보드 위젯 자동 새로고침 처리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
public interface DashboardIntegrationService {
    
    /**
     * 위젯 새로고침 트리거
     * 
     * @param widgetType 위젯 타입 (예: "schedule", "erp-stats-grid")
     * @param tenantId 테넌트 ID
     */
    void notifyWidgetRefresh(String widgetType, String tenantId);
    
    /**
     * 여러 위젯 동시 새로고침 트리거
     * 
     * @param widgetTypes 위젯 타입 목록
     * @param tenantId 테넌트 ID
     */
    void notifyWidgetsRefresh(List<String> widgetTypes, String tenantId);
    
    /**
     * 스케줄 생성 후 통합 처리
     * - ERP 연동 (상담 수수료 예약)
     * - 대시보드 위젯 새로고침
     * 
     * @param scheduleId 스케줄 ID
     * @param tenantId 테넌트 ID
     * @param mappingId 매핑 ID (선택적, ERP 연동용)
     */
    void handleScheduleCreated(Long scheduleId, String tenantId, Long mappingId);
    
    /**
     * 구매 요청 생성 후 통합 처리
     * - ERP 회계 분개 자동 생성
     * - 예산 체크 및 업데이트
     * - 대시보드 위젯 새로고침
     * 
     * @param purchaseRequestId 구매 요청 ID
     * @param tenantId 테넌트 ID
     */
    void handlePurchaseRequestCreated(Long purchaseRequestId, String tenantId);
}


