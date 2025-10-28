package com.mindgarden.consultation.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.Client;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.repository.ConsultantClientMappingRepository;
import com.mindgarden.consultation.repository.ScheduleRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.ClientStatsService;
import com.mindgarden.consultation.util.PersonalDataEncryptionUtil;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 내담자 통계 정보 조회 서비스 구현
 * - 내담자 정보와 통계를 통합 조회
 * - 중앙화된 데이터 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-20
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClientStatsServiceImpl implements ClientStatsService {

    private final UserRepository userRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final ScheduleRepository scheduleRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;

    @Override
    @Cacheable(value = "clientsWithStats", key = "'client:' + #clientId")
    public Map<String, Object> getClientWithStats(Long clientId) {
        log.info("📊 내담자 통계 조회 (DB): clientId={}", clientId);
        
        com.mindgarden.consultation.entity.User user = userRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("내담자를 찾을 수 없습니다: " + clientId));
        
        Client client = convertToClient(user);
        
        // 활성 매핑 수 계산
        long currentConsultants = calculateCurrentConsultants(clientId);
        
        // 통계 정보
        Map<String, Object> stats = calculateClientStats(clientId);
        
        // Map.of()는 null을 허용하지 않으므로 HashMap 사용
        Map<String, Object> result = new HashMap<>();
        result.put("client", client);
        result.put("currentConsultants", currentConsultants);
        result.put("statistics", stats);
        
        return result;
    }

    @Override
    @Cacheable(value = "clientsWithStats", key = "'all'")
    public List<Map<String, Object>> getAllClientsWithStats() {
        log.info("📊 전체 내담자 통계 조회 (DB)");
        
        // 삭제되지 않고 활성인 CLIENT 역할 사용자만 조회
        List<com.mindgarden.consultation.entity.User> clientUsers = userRepository
                .findByRoleAndIsDeletedFalse(UserRole.CLIENT.name()).stream()
                .filter(user -> user.getIsActive() != null && user.getIsActive())
                .collect(Collectors.toList());
        
        return clientUsers.stream()
                .map(user -> {
                    Client client = convertToClient(user);
                    long currentConsultants = calculateCurrentConsultants(client.getId());
                    Map<String, Object> stats = calculateClientStats(client.getId());
                    
                    // Map.of()는 null을 허용하지 않으므로 HashMap 사용
                    Map<String, Object> result = new HashMap<>();
                    result.put("client", client);
                    result.put("currentConsultants", currentConsultants);
                    result.put("statistics", stats);
                    
                    return result;
                })
                .collect(Collectors.toList());
    }

    @Override
    public Long calculateCurrentConsultants(Long clientId) {
        // clientId로 매핑 카운트 조회
        return (long) mappingRepository.findByClientIdAndStatusNot(
            clientId, 
            ConsultantClientMapping.MappingStatus.INACTIVE
        ).stream()
            .filter(m -> m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE || 
                        m.getStatus() == ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED)
            .count();
    }

    @Override
    public Map<String, Object> calculateClientStats(Long clientId) {
        // 총 상담 횟수
        long totalSessions = scheduleRepository.countByClientId(clientId);
        
        // 완료된 상담 횟수
        long completedSessions = scheduleRepository.countByClientId(clientId);
        
        // 완료율 계산
        double completionRate = totalSessions > 0 
            ? (double) completedSessions / totalSessions * 100 
            : 0;
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSessions", totalSessions);
        stats.put("completedSessions", completedSessions);
        stats.put("completionRate", Math.round(completionRate * 10.0) / 10.0);
        
        return stats;
    }
    
    /**
     * User를 Client로 변환 (개인정보 복호화 포함)
     */
    private Client convertToClient(com.mindgarden.consultation.entity.User user) {
        Client client = new Client();
        client.setId(user.getId());
        client.setName(user.getName());
        
        // 이메일 복호화
        if (user.getEmail() != null) {
            try {
                client.setEmail(encryptionUtil.decrypt(user.getEmail()));
            } catch (Exception e) {
                log.warn("이메일 복호화 실패: userId={}", user.getId());
                client.setEmail(user.getEmail());
            }
        }
        
        // 전화번호 복호화
        if (user.getPhone() != null) {
            try {
                client.setPhone(encryptionUtil.decrypt(user.getPhone()));
            } catch (Exception e) {
                log.warn("전화번호 복호화 실패: userId={}", user.getId());
                client.setPhone(user.getPhone());
            }
        }
        
        client.setBirthDate(user.getBirthDate());
        client.setGender(user.getGender());
        client.setBranchCode(user.getBranchCode());
        client.setIsDeleted(user.getIsDeleted());
        client.setCreatedAt(user.getCreatedAt());
        client.setUpdatedAt(user.getUpdatedAt());
        
        return client;
    }
    
    /**
     * 캐시 무효화 (매핑 변경 시 호출)
     * 
     * @param clientId 내담자 ID
     */
    @CacheEvict(value = {"clientsWithStats", "clientCurrentConsultants"}, key = "'client:' + #clientId")
    public void evictClientStatsCache(Long clientId) {
        log.info("🗑️ 캐시 무효화: clientId={}", clientId);
    }
    
    /**
     * 전체 캐시 무효화
     */
    @CacheEvict(value = {"clientsWithStats", "clientCurrentConsultants"}, allEntries = true)
    public void evictAllClientStatsCache() {
        log.info("🗑️ 전체 내담자 캐시 무효화");
    }
}

