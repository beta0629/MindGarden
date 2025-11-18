package com.coresolution.core.service;

import com.coresolution.core.domain.TenantPgConfigurationHistory;
import com.coresolution.core.dto.TenantPgConfigurationHistoryResponse;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 테넌트 PG 설정 변경 이력 서비스 인터페이스
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
public interface TenantPgConfigurationHistoryService {
    
    /**
     * 변경 이력 저장
     */
    void saveHistory(String configId, 
                    TenantPgConfigurationHistory.ChangeType changeType,
                    String oldStatus,
                    String newStatus,
                    String changedBy,
                    String notes);
    
    /**
     * 변경 이력 저장 (상세 정보 포함)
     */
    void saveHistoryWithDetails(String configId, 
                               TenantPgConfigurationHistory.ChangeType changeType,
                               String oldStatus,
                               String newStatus,
                               String changedBy,
                               String notes,
                               String changeDetailsJson);
    
    /**
     * config_id로 변경 이력 조회 (최신순)
     */
    List<TenantPgConfigurationHistoryResponse> getHistoryByConfigId(String configId);
    
    /**
     * config_id와 change_type으로 변경 이력 조회
     */
    List<TenantPgConfigurationHistoryResponse> getHistoryByConfigIdAndChangeType(
            String configId, 
            TenantPgConfigurationHistory.ChangeType changeType);
    
    /**
     * config_id와 기간으로 변경 이력 조회
     */
    List<TenantPgConfigurationHistoryResponse> getHistoryByConfigIdAndDateRange(
            String configId,
            LocalDateTime startDate,
            LocalDateTime endDate);
    
    /**
     * changed_by로 변경 이력 조회
     */
    List<TenantPgConfigurationHistoryResponse> getHistoryByChangedBy(String changedBy);
    
    /**
     * 최근 변경 이력 조회 (상위 N개)
     */
    List<TenantPgConfigurationHistoryResponse> getRecentHistory(String configId, int limit);
}

