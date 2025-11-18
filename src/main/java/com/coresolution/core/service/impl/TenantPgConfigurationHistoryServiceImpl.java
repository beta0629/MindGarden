package com.coresolution.core.service.impl;

import com.coresolution.core.domain.TenantPgConfigurationHistory;
import com.coresolution.core.dto.TenantPgConfigurationHistoryResponse;
import com.coresolution.core.repository.TenantPgConfigurationHistoryRepository;
import com.coresolution.core.service.TenantPgConfigurationHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 테넌트 PG 설정 변경 이력 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class TenantPgConfigurationHistoryServiceImpl implements TenantPgConfigurationHistoryService {
    
    private final TenantPgConfigurationHistoryRepository historyRepository;
    
    @Override
    public void saveHistory(String configId, 
                           TenantPgConfigurationHistory.ChangeType changeType,
                           String oldStatus,
                           String newStatus,
                           String changedBy,
                           String notes) {
        saveHistoryWithDetails(configId, changeType, oldStatus, newStatus, changedBy, notes, null);
    }
    
    @Override
    public void saveHistoryWithDetails(String configId, 
                                      TenantPgConfigurationHistory.ChangeType changeType,
                                      String oldStatus,
                                      String newStatus,
                                      String changedBy,
                                      String notes,
                                      String changeDetailsJson) {
        log.debug("변경 이력 저장: configId={}, changeType={}, oldStatus={}, newStatus={}", 
                configId, changeType, oldStatus, newStatus);
        
        TenantPgConfigurationHistory history = TenantPgConfigurationHistory.builder()
                .configId(configId)
                .changeType(changeType)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .changedBy(changedBy)
                .changedAt(LocalDateTime.now())
                .changeDetailsJson(changeDetailsJson)
                .notes(notes)
                .build();
        
        historyRepository.save(history);
        log.debug("변경 이력 저장 완료: historyId={}", history.getId());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TenantPgConfigurationHistoryResponse> getHistoryByConfigId(String configId) {
        log.debug("변경 이력 조회: configId={}", configId);
        
        List<TenantPgConfigurationHistory> historyList = 
                historyRepository.findByConfigIdOrderByChangedAtDesc(configId);
        
        return historyList.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TenantPgConfigurationHistoryResponse> getHistoryByConfigIdAndChangeType(
            String configId, 
            TenantPgConfigurationHistory.ChangeType changeType) {
        log.debug("변경 이력 조회: configId={}, changeType={}", configId, changeType);
        
        List<TenantPgConfigurationHistory> historyList = 
                historyRepository.findByConfigIdAndChangeTypeOrderByChangedAtDesc(configId, changeType);
        
        return historyList.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TenantPgConfigurationHistoryResponse> getHistoryByConfigIdAndDateRange(
            String configId,
            LocalDateTime startDate,
            LocalDateTime endDate) {
        log.debug("변경 이력 조회: configId={}, startDate={}, endDate={}", configId, startDate, endDate);
        
        List<TenantPgConfigurationHistory> historyList = 
                historyRepository.findByConfigIdAndDateRange(configId, startDate, endDate);
        
        return historyList.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TenantPgConfigurationHistoryResponse> getHistoryByChangedBy(String changedBy) {
        log.debug("변경 이력 조회: changedBy={}", changedBy);
        
        List<TenantPgConfigurationHistory> historyList = 
                historyRepository.findByChangedByOrderByChangedAtDesc(changedBy);
        
        return historyList.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<TenantPgConfigurationHistoryResponse> getRecentHistory(String configId, int limit) {
        log.debug("최근 변경 이력 조회: configId={}, limit={}", configId, limit);
        
        List<TenantPgConfigurationHistory> historyList = 
                historyRepository.findRecentHistory(configId, limit);
        
        return historyList.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * 엔티티를 응답 DTO로 변환
     */
    private TenantPgConfigurationHistoryResponse toResponse(TenantPgConfigurationHistory history) {
        return TenantPgConfigurationHistoryResponse.builder()
                .id(history.getId())
                .configId(history.getConfigId())
                .changeType(history.getChangeType())
                .oldStatus(history.getOldStatus())
                .newStatus(history.getNewStatus())
                .changedBy(history.getChangedBy())
                .changedAt(history.getChangedAt())
                .changeDetailsJson(history.getChangeDetailsJson())
                .notes(history.getNotes())
                .build();
    }
}

