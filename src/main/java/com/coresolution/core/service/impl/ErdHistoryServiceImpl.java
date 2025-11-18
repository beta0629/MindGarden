package com.coresolution.core.service.impl;

import com.coresolution.core.domain.ErdDiagramHistory;
import com.coresolution.core.dto.ErdDiagramHistoryResponse;
import com.coresolution.core.repository.ErdDiagramHistoryRepository;
import com.coresolution.core.service.ErdHistoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ERD 변경 이력 서비스 구현체
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ErdHistoryServiceImpl implements ErdHistoryService {
    
    private final ErdDiagramHistoryRepository historyRepository;
    
    @Override
    public List<ErdDiagramHistoryResponse> getHistoryByDiagramId(String diagramId) {
        log.debug("ERD 변경 이력 조회: diagramId={}", diagramId);
        
        List<ErdDiagramHistory> historyList = 
                historyRepository.findByDiagramIdOrderByChangedAtDesc(diagramId);
        
        return historyList.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public ErdDiagramHistoryResponse getHistoryByVersion(String diagramId, Integer version) {
        log.debug("ERD 변경 이력 조회: diagramId={}, version={}", diagramId, version);
        
        ErdDiagramHistory history = historyRepository.findByDiagramIdAndVersion(diagramId, version)
                .orElseThrow(() -> new IllegalArgumentException(
                        "ERD 변경 이력을 찾을 수 없습니다: diagramId=" + diagramId + ", version=" + version));
        
        return toResponse(history);
    }
    
    @Override
    public List<ErdDiagramHistoryResponse> getHistoryByChangeType(
            String diagramId, 
            ErdDiagramHistory.ChangeType changeType) {
        log.debug("ERD 변경 이력 조회: diagramId={}, changeType={}", diagramId, changeType);
        
        List<ErdDiagramHistory> historyList = 
                historyRepository.findByDiagramIdAndChangeTypeOrderByChangedAtDesc(diagramId, changeType);
        
        return historyList.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public String compareVersions(String diagramId, Integer fromVersion, Integer toVersion) {
        log.debug("ERD 버전 비교: diagramId={}, fromVersion={}, toVersion={}", 
                diagramId, fromVersion, toVersion);
        
        ErdDiagramHistory fromHistory = historyRepository.findByDiagramIdAndVersion(diagramId, fromVersion)
                .orElseThrow(() -> new IllegalArgumentException(
                        "ERD 변경 이력을 찾을 수 없습니다: diagramId=" + diagramId + ", version=" + fromVersion));
        
        ErdDiagramHistory toHistory = historyRepository.findByDiagramIdAndVersion(diagramId, toVersion)
                .orElseThrow(() -> new IllegalArgumentException(
                        "ERD 변경 이력을 찾을 수 없습니다: diagramId=" + diagramId + ", version=" + toVersion));
        
        // 간단한 비교 요약 (실제로는 더 정교한 diff 알고리즘 사용 가능)
        StringBuilder diff = new StringBuilder();
        diff.append("버전 비교: ").append(fromVersion).append(" -> ").append(toVersion).append("\n");
        
        if (fromHistory.getDiffSummary() != null) {
            diff.append("변경 사항: ").append(fromHistory.getDiffSummary()).append("\n");
        }
        
        if (toHistory.getDiffSummary() != null) {
            diff.append("변경 사항: ").append(toHistory.getDiffSummary()).append("\n");
        }
        
        return diff.toString();
    }
    
    /**
     * 엔티티를 응답 DTO로 변환
     */
    private ErdDiagramHistoryResponse toResponse(ErdDiagramHistory history) {
        return ErdDiagramHistoryResponse.builder()
                .id(history.getId())
                .diagramId(history.getDiagramId())
                .version(history.getVersion())
                .changeType(history.getChangeType())
                .changeDescription(history.getChangeDescription())
                .mermaidCode(history.getMermaidCode())
                .diffSummary(history.getDiffSummary())
                .changedBy(history.getChangedBy())
                .changedAt(history.getChangedAt())
                .build();
    }
}

