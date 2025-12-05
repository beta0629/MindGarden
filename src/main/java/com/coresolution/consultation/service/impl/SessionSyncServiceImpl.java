package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.SessionExtensionRequestRepository;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.service.impl.BaseTenantAwareService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

 /**
 * 회기 동기화 서비스 구현체
 /**
 * 
 /**
 * @author MindGarden
 /**
 * @version 1.0.0
 /**
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SessionSyncServiceImpl extends BaseTenantAwareService implements SessionSyncService {
    
    private final ConsultantClientMappingRepository mappingRepository;
    private final SessionExtensionRequestRepository requestRepository;
    
    @Override
    public void syncAfterSessionExtension(SessionExtensionRequest extensionRequest) {
        log.info("🔄 회기 추가 후 동기화 시작: requestId={}, mappingId={}, sessions={}", 
                extensionRequest.getId(), extensionRequest.getMapping().getId(), 
                extensionRequest.getAdditionalSessions());
        
        try {
            ConsultantClientMapping mapping = extensionRequest.getMapping();
            
            mapping.addSessions(
                extensionRequest.getAdditionalSessions(),
                extensionRequest.getPackageName(),
                extensionRequest.getPackagePrice().longValue()
            );
            mappingRepository.save(mapping);
            
            validateMappingStatus(mapping);
            
            validateSessionCounts(mapping);
            
            syncRelatedMappings(mapping);
            
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
            
            log.info("📋 매핑 상태 확인: mappingId={}, totalSessions={}, usedSessions={}, remainingSessions={}", 
                    mappingId, mapping.getTotalSessions(), mapping.getUsedSessions(), mapping.getRemainingSessions());
            
            validateSessionCountsForUsage(mapping);
            
            validateMappingStatus(mapping);
            
            syncRelatedMappings(mapping);
            
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
            
            validateSessionCounts(mapping);
            
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
            String tenantId = getTenantId();
            List<ConsultantClientMapping> allMappings = mappingRepository.findByTenantId(tenantId);
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
            String tenantId = getTenantId();
            List<ConsultantClientMapping> allMappings = mappingRepository.findByTenantId(tenantId);
            int fixedCount = 0;
            
            for (ConsultantClientMapping mapping : allMappings) {
                try {
                    if (mapping.getTotalSessions() != (mapping.getUsedSessions() + mapping.getRemainingSessions())) {
                        log.warn("⚠️ 회기 수 불일치 발견: mappingId={}, total={}, used={}, remaining={}", 
                                mapping.getId(), mapping.getTotalSessions(), 
                                mapping.getUsedSessions(), mapping.getRemainingSessions());
                        
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
        
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getSyncStatus() {
        log.info("📊 회기 동기화 상태 조회");
        
        Map<String, Object> status = new HashMap<>();
        
        try {
            long totalMappings = mappingRepository.count();
            
            // 표준화 2025-12-05: tenantId 필터링 필수 (BaseTenantAwareService 상속)
            String tenantId = getTenantId();
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            long activeMappings = mappingRepository.findByTenantIdAndStatus(tenantId, ConsultantClientMapping.MappingStatus.ACTIVE).size();
            long exhaustedMappings = mappingRepository.findByTenantIdAndStatus(tenantId, ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED).size();
            
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
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
     * 회기 사용 후 검증 (단회기 패키지 고려)
     */
    private void validateSessionCountsForUsage(ConsultantClientMapping mapping) {
        int total = mapping.getTotalSessions();
        int used = mapping.getUsedSessions();
        int remaining = mapping.getRemainingSessions();
        
        log.info("🔍 회기 사용 후 검증: mappingId={}, total={}, used={}, remaining={}", 
                mapping.getId(), total, used, remaining);
        
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
        
        if (total == 1 && used == 1 && remaining == 0) {
            log.info("✅ 단회기 패키지 정상 완료: mappingId={}", mapping.getId());
            return;
        }
        
        log.info("✅ 회기 사용 후 검증 완료: mappingId={}", mapping.getId());
    }
    
     /**
     * 관련된 모든 매핑 동기화
     */
    private void syncRelatedMappings(ConsultantClientMapping mapping) {
        try {
            String tenantId = com.coresolution.core.context.TenantContext.getTenantId();
            if (tenantId == null) {
                log.warn("⚠️ tenantId가 설정되지 않아 관련 매핑 동기화를 건너뜁니다");
                return;
            }
            
            List<ConsultantClientMapping> consultantMappings = mappingRepository
                    .findByConsultantIdAndStatusNot(tenantId, mapping.getConsultant().getId(), 
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
