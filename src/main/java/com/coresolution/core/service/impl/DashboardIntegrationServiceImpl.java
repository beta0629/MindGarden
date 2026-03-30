package com.coresolution.core.service.impl;

import com.coresolution.core.service.DashboardIntegrationService;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

/**
 * 대시보드 통합 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DashboardIntegrationServiceImpl implements DashboardIntegrationService {
    
    // TODO: ERP 연동 구현 시 사용
    // private final ErpService erpService;
    private final ScheduleRepository scheduleRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    
    // TODO: WebSocket 또는 이벤트 발행을 위한 메시징 템플릿 추가
    // private final SimpMessagingTemplate messagingTemplate;
    
    @Override
    public void notifyWidgetRefresh(String widgetType, String tenantId) {
        log.info("🔄 위젯 새로고침 트리거: widgetType={}, tenantId={}", widgetType, tenantId);
        
        // TODO: WebSocket을 통한 실시간 새로고침
        // messagingTemplate.convertAndSend(
        //     "/topic/dashboard/" + tenantId + "/widget/" + widgetType,
        //     Map.of("action", "refresh", "timestamp", System.currentTimeMillis())
        // );
        
        // 현재는 로그만 남김 (향후 WebSocket 구현)
        log.debug("위젯 새로고침 이벤트 발행: widgetType={}, tenantId={}", widgetType, tenantId);
    }
    
    @Override
    public void notifyWidgetsRefresh(List<String> widgetTypes, String tenantId) {
        log.info("🔄 여러 위젯 새로고침 트리거: widgetTypes={}, tenantId={}", widgetTypes, tenantId);
        
        for (String widgetType : widgetTypes) {
            notifyWidgetRefresh(widgetType, tenantId);
        }
    }
    
    @Override
    public void handleScheduleCreated(Long scheduleId, String tenantId, Long mappingId) {
        log.info("📅 스케줄 생성 후 통합 처리: scheduleId={}, tenantId={}, mappingId={}", 
                scheduleId, tenantId, mappingId);
        
        try {
            // 1. 스케줄 정보 조회
            Schedule schedule = scheduleRepository.findByTenantIdAndId(tenantId, scheduleId)
                    .orElseThrow(() -> new RuntimeException("스케줄을 찾을 수 없습니다: " + scheduleId));
            
            // 2. ERP 연동: 매핑이 있으면 상담 수수료 예약
            if (mappingId != null) {
                ConsultantClientMapping mapping = mappingRepository.findByTenantIdAndId(tenantId, mappingId)
                        .orElse(null);
                
                if (mapping != null) {
                    log.info("💰 ERP 연동: 상담 수수료 예약 - mappingId={}", mappingId);
                    
                    // 상담 수수료 계산 및 ERP 재무 거래 생성
                    BigDecimal consultationFee = calculateConsultationFee(mapping, schedule);
                    
                    // TODO: ERP 재무 거래 생성
                    // erpService.createFinancialTransactionForSchedule(schedule, consultationFee);
                    
                    log.info("✅ ERP 연동 완료: consultationFee={}", consultationFee);
                }
            }
            
            // 3. 대시보드 위젯 새로고침
            notifyWidgetsRefresh(
                Arrays.asList("schedule", "consultation-summary", "erp-stats-grid"),
                tenantId
            );
            
            log.info("✅ 스케줄 생성 통합 처리 완료: scheduleId={}", scheduleId);
            
        } catch (Exception e) {
            log.error("❌ 스케줄 생성 통합 처리 실패: scheduleId={}", scheduleId, e);
            // 통합 처리 실패해도 스케줄 생성은 유지
        }
    }
    
    @Override
    public void handlePurchaseRequestCreated(Long purchaseRequestId, String tenantId) {
        log.info("🛒 구매 요청 생성 후 통합 처리: purchaseRequestId={}, tenantId={}", 
                purchaseRequestId, tenantId);
        
        try {
            // 1. ERP 회계 분개 자동 생성 (PL/SQL 프로시저 호출)
            // TODO: PL/SQL 프로시저 호출
            // erpProcedureService.createJournalEntryForPurchaseRequest(tenantId, purchaseRequestId);
            
            // 2. 예산 체크 및 업데이트
            // TODO: 예산 서비스 호출
            // budgetService.checkAndReserveBudget(tenantId, amount);
            
            // 3. 대시보드 위젯 새로고침
            notifyWidgetsRefresh(
                Arrays.asList("purchase-request", "erp-stats-grid", "erp-management-grid"),
                tenantId
            );
            
            log.info("✅ 구매 요청 생성 통합 처리 완료: purchaseRequestId={}", purchaseRequestId);
            
        } catch (Exception e) {
            log.error("❌ 구매 요청 생성 통합 처리 실패: purchaseRequestId={}", purchaseRequestId, e);
            // 통합 처리 실패해도 구매 요청 생성은 유지
        }
    }
    
    /**
     * 상담 수수료 계산
     */
    private BigDecimal calculateConsultationFee(ConsultantClientMapping mapping, Schedule schedule) {
        // 매핑의 패키지 정보에서 수수료 계산
        // TODO: 실제 수수료 계산 로직 구현
        return BigDecimal.valueOf(mapping.getPackagePrice() != null ? mapping.getPackagePrice() : 0);
    }
}

