package com.mindgarden.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.entity.SessionExtensionRequest;
import com.mindgarden.consultation.repository.ConsultantClientMappingRepository;
import com.mindgarden.consultation.repository.SessionExtensionRequestRepository;
import com.mindgarden.consultation.service.SessionSyncService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 회기 동기화 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SessionSyncServiceImpl implements SessionSyncService {
    
    private final ConsultantClientMappingRepository mappingRepository;
    private final SessionExtensionRequestRepository requestRepository;
    
    @Override
    public void syncAfterSessionExtension(SessionExtensionRequest extensionRequest) {
        log.info("🔄 회기 추가 후 동기화 시작: requestId={}, mappingId={}, sessions={}", 
                extensionRequest.getId(), extensionRequest.getMapping().getId(), 
                extensionRequest.getAdditionalSessions());
        
        try {
            ConsultantClientMapping mapping = extensionRequest.getMapping();
            
            // 1. 회기 추가 처리
            mapping.addSessions(
                extensionRequest.getAdditionalSessions(),
                extensionRequest.getPackageName(),
                extensionRequest.getPackagePrice().longValue()
            );
            mappingRepository.save(mapping);
            
            // 2. 매핑 상태 검증
            validateMappingStatus(mapping);
            
            // 3. 회기 수 검증
            validateSessionCounts(mapping);
            
            // 4. 관련된 모든 매핑 동기화
            syncRelatedMappings(mapping);
            
            // 5. 사용 로그 기록
            logSessionUsage(mapping.getId(), "EXTENSION", 
                          extensionRequest.getAdditionalSessions(), 
                          "회기 추가: " + extensionRequest.getReason());
            
            log.info("✅ 회기 추가 후 동기화 완료: mappingId={}, totalSessions={}, remainingSessions={}", 
                    mapping.getId(), mapping.getTotalSessions(), mapping.getRemainingSessions());
            
        } catch (Exception e) {
            log.error("❌ 회기 추가 후 동기화 실패: requestId={}, error={}", 
                     extensionRequest.getId(), e.getMessage(), e);
            throw new RuntimeException("회기 동기화에 실패했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public void syncAfterSessionUsage(Long mappingId, Long consultantId, Long clientId) {
        log.info("🔄 회기 사용 후 동기화 시작: mappingId={}, consultantId={}, clientId={}", 
                mappingId, consultantId, clientId);
        
        try {
            ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                    .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
            
            // 1. 회기 사용 처리
            mapping.useSession();
            mappingRepository.save(mapping);
            
            // 2. 매핑 상태 검증
            validateMappingStatus(mapping);
            
            // 3. 관련된 모든 매핑 동기화
            syncRelatedMappings(mapping);
            
            // 4. 사용 로그 기록
            logSessionUsage(mappingId, "USAGE", 1, 
                          "상담 완료: consultantId=" + consultantId + ", clientId=" + clientId);
            
            log.info("✅ 회기 사용 후 동기화 완료: mappingId={}, remainingSessions={}", 
                    mappingId, mapping.getRemainingSessions());
            
        } catch (Exception e) {
            log.error("❌ 회기 사용 후 동기화 실패: mappingId={}, error={}", 
                     mappingId, e.getMessage(), e);
            throw new RuntimeException("회기 동기화에 실패했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public void validateAndSyncMappingSessions(Long mappingId) {
        log.info("🔍 매핑 회기 수 검증 및 동기화: mappingId={}", mappingId);
        
        try {
            ConsultantClientMapping mapping = mappingRepository.findById(mappingId)
                    .orElseThrow(() -> new RuntimeException("매핑을 찾을 수 없습니다: " + mappingId));
            
            // 회기 수 검증
            validateSessionCounts(mapping);
            
            // 상태 검증
            validateMappingStatus(mapping);
            
            log.info("✅ 매핑 회기 수 검증 완료: mappingId={}", mappingId);
            
        } catch (Exception e) {
            log.error("❌ 매핑 회기 수 검증 실패: mappingId={}, error={}", 
                     mappingId, e.getMessage(), e);
            throw new RuntimeException("회기 수 검증에 실패했습니다: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> validateAllSessions() {
        log.info("🔍 전체 시스템 회기 수 검증 시작");
        
        Map<String, Object> result = new HashMap<>();
        int totalMappings = 0;
        int validMappings = 0;
        int invalidMappings = 0;
        int totalSessions = 0;
        int usedSessions = 0;
        int remainingSessions = 0;
        
        try {
            List<ConsultantClientMapping> allMappings = mappingRepository.findAll();
            totalMappings = allMappings.size();
            
            for (ConsultantClientMapping mapping : allMappings) {
                try {
                    validateSessionCounts(mapping);
                    validateMappingStatus(mapping);
                    validMappings++;
                    
                    totalSessions += mapping.getTotalSessions();
                    usedSessions += mapping.getUsedSessions();
                    remainingSessions += mapping.getRemainingSessions();
                    
                } catch (Exception e) {
                    invalidMappings++;
                    log.warn("⚠️ 매핑 검증 실패: mappingId={}, error={}", 
                            mapping.getId(), e.getMessage());
                }
            }
            
            result.put("totalMappings", totalMappings);
            result.put("validMappings", validMappings);
            result.put("invalidMappings", invalidMappings);
            result.put("totalSessions", totalSessions);
            result.put("usedSessions", usedSessions);
            result.put("remainingSessions", remainingSessions);
            result.put("validationRate", totalMappings > 0 ? (double) validMappings / totalMappings * 100 : 0);
            result.put("timestamp", LocalDateTime.now());
            
            log.info("✅ 전체 시스템 회기 수 검증 완료: 총 {}개 매핑, 유효 {}개, 무효 {}개", 
                    totalMappings, validMappings, invalidMappings);
            
        } catch (Exception e) {
            log.error("❌ 전체 시스템 회기 수 검증 실패: {}", e.getMessage(), e);
            result.put("error", e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public void fixSessionMismatches() {
        log.info("🔧 회기 수 불일치 자동 수정 시작");
        
        try {
            List<ConsultantClientMapping> allMappings = mappingRepository.findAll();
            int fixedCount = 0;
            
            for (ConsultantClientMapping mapping : allMappings) {
                try {
                    // 회기 수 불일치 확인
                    if (mapping.getTotalSessions() != (mapping.getUsedSessions() + mapping.getRemainingSessions())) {
                        log.warn("⚠️ 회기 수 불일치 발견: mappingId={}, total={}, used={}, remaining={}", 
                                mapping.getId(), mapping.getTotalSessions(), 
                                mapping.getUsedSessions(), mapping.getRemainingSessions());
                        
                        // 자동 수정: remainingSessions = totalSessions - usedSessions
                        int correctRemaining = mapping.getTotalSessions() - mapping.getUsedSessions();
                        mapping.setRemainingSessions(Math.max(0, correctRemaining));
                        mappingRepository.save(mapping);
                        
                        fixedCount++;
                        log.info("✅ 회기 수 수정 완료: mappingId={}, remainingSessions={}", 
                                mapping.getId(), mapping.getRemainingSessions());
                    }
                } catch (Exception e) {
                    log.error("❌ 매핑 수정 실패: mappingId={}, error={}", 
                             mapping.getId(), e.getMessage());
                }
            }
            
            log.info("✅ 회기 수 불일치 자동 수정 완료: {}개 매핑 수정", fixedCount);
            
        } catch (Exception e) {
            log.error("❌ 회기 수 불일치 자동 수정 실패: {}", e.getMessage(), e);
            throw new RuntimeException("회기 수 수정에 실패했습니다: " + e.getMessage());
        }
    }
    
    @Override
    public void logSessionUsage(Long mappingId, String action, Integer sessions, String reason) {
        log.info("📝 회기 사용 로그: mappingId={}, action={}, sessions={}, reason={}", 
                mappingId, action, sessions, reason);
        
        // 향후 회기 사용 로그 테이블이 있다면 여기에 저장
        // 현재는 로그로만 기록
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getSyncStatus() {
        log.info("📊 회기 동기화 상태 조회");
        
        Map<String, Object> status = new HashMap<>();
        
        try {
            // 전체 매핑 수
            long totalMappings = mappingRepository.count();
            
            // 상태별 매핑 수
            long activeMappings = mappingRepository.findByStatus(ConsultantClientMapping.MappingStatus.ACTIVE).size();
            long exhaustedMappings = mappingRepository.findByStatus(ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED).size();
            
            // 회기 추가 요청 수
            long pendingRequests = requestRepository.findByStatusOrderByCreatedAtDesc(SessionExtensionRequest.ExtensionStatus.PENDING).size();
            long confirmedRequests = requestRepository.findByStatusOrderByCreatedAtDesc(SessionExtensionRequest.ExtensionStatus.PAYMENT_CONFIRMED).size();
            long approvedRequests = requestRepository.findByStatusOrderByCreatedAtDesc(SessionExtensionRequest.ExtensionStatus.ADMIN_APPROVED).size();
            
            status.put("totalMappings", totalMappings);
            status.put("activeMappings", activeMappings);
            status.put("exhaustedMappings", exhaustedMappings);
            status.put("pendingExtensionRequests", pendingRequests);
            status.put("confirmedExtensionRequests", confirmedRequests);
            status.put("approvedExtensionRequests", approvedRequests);
            status.put("lastSyncCheck", LocalDateTime.now());
            
        } catch (Exception e) {
            log.error("❌ 동기화 상태 조회 실패: {}", e.getMessage(), e);
            status.put("error", e.getMessage());
        }
        
        return status;
    }
    
    /**
     * 매핑 상태 검증
     */
    private void validateMappingStatus(ConsultantClientMapping mapping) {
        if (mapping.getRemainingSessions() <= 0 && mapping.getStatus() != ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED) {
            log.warn("⚠️ 매핑 상태 불일치: mappingId={}, remainingSessions={}, status={}", 
                    mapping.getId(), mapping.getRemainingSessions(), mapping.getStatus());
            
            // 자동 수정
            mapping.setStatus(ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED);
            mapping.setEndDate(LocalDateTime.now());
            mappingRepository.save(mapping);
            
            log.info("✅ 매핑 상태 자동 수정: mappingId={}, status=SESSIONS_EXHAUSTED", mapping.getId());
        }
    }
    
    /**
     * 회기 수 검증
     */
    private void validateSessionCounts(ConsultantClientMapping mapping) {
        int total = mapping.getTotalSessions();
        int used = mapping.getUsedSessions();
        int remaining = mapping.getRemainingSessions();
        
        if (total != (used + remaining)) {
            throw new RuntimeException(String.format(
                "회기 수 불일치: mappingId=%d, total=%d, used=%d, remaining=%d", 
                mapping.getId(), total, used, remaining));
        }
        
        if (remaining < 0) {
            throw new RuntimeException(String.format(
                "잔여 회기 수 음수: mappingId=%d, remaining=%d", 
                mapping.getId(), remaining));
        }
    }
    
    /**
     * 관련된 모든 매핑 동기화
     */
    private void syncRelatedMappings(ConsultantClientMapping mapping) {
        try {
            // 같은 상담사-내담자 조합의 다른 매핑들도 동기화
            // 먼저 상담사 ID로 매핑들을 찾고, 그 중에서 같은 내담자 ID를 가진 것들을 필터링
            List<ConsultantClientMapping> consultantMappings = mappingRepository
                    .findByConsultantIdAndStatusNot(mapping.getConsultant().getId(), 
                            ConsultantClientMapping.MappingStatus.TERMINATED);
            
            List<ConsultantClientMapping> relatedMappings = consultantMappings.stream()
                    .filter(relatedMapping -> relatedMapping.getClient() != null && 
                            relatedMapping.getClient().getId().equals(mapping.getClient().getId()))
                    .filter(relatedMapping -> !relatedMapping.getId().equals(mapping.getId()))
                    .collect(java.util.stream.Collectors.toList());
            
            for (ConsultantClientMapping relatedMapping : relatedMappings) {
                try {
                    validateSessionCounts(relatedMapping);
                    validateMappingStatus(relatedMapping);
                } catch (Exception e) {
                    log.warn("⚠️ 관련 매핑 동기화 실패: mappingId={}, error={}", 
                            relatedMapping.getId(), e.getMessage());
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ 관련 매핑 조회 실패: error={}", e.getMessage());
        }
    }
}
