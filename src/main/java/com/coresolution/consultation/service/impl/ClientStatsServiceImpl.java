package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

 /**
 * 내담자 통계 정보 조회 서비스 구현
 /**
 * - 내담자 정보와 통계를 통합 조회
 /**
 * - 중앙화된 데이터 관리
 /**
 * 
 /**
 * @author MindGarden
 /**
 * @version 1.0.0
 /**
 * @since 2025-01-20
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClientStatsServiceImpl implements ClientStatsService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final ScheduleRepository scheduleRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;

    @Override
    @Cacheable(value = "clientsWithStats", key = "'client:' + #clientId")
    public Map<String, Object> getClientWithStats(Long clientId) {
        log.info("📊 내담자 통계 조회 (DB): clientId={}", clientId);
        
        com.coresolution.consultation.entity.User user = userRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("내담자를 찾을 수 없습니다: " + clientId));
        
        Client client = convertToClient(user);
        
        Map<String, Object> clientMap = convertClientToMap(client);
        clientMap.put("grade", user.getGrade());
        clientMap.put("notes", user.getNotes());
        clientMap.put("status", Boolean.TRUE.equals(user.getIsActive()) ? "ACTIVE" : "INACTIVE");
        clientMap.put("isActive", user.getIsActive() != null ? user.getIsActive() : true);

        long currentConsultants = calculateCurrentConsultants(clientId);
        
        Map<String, Object> stats = calculateClientStats(clientId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("client", clientMap);
        result.put("currentConsultants", currentConsultants);
        result.put("statistics", stats);
        
        return result;
    }

    @Override
    @Cacheable(value = "clientsWithStats", key = "'all'")
    public List<Map<String, Object>> getAllClientsWithStats() {
        log.info("📊 전체 내담자 통계 조회 (DB) - 레거시 호환");
        
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return List.of();
        }
        List<com.coresolution.consultation.entity.User> clientUsers = userRepository
                .findByRole(tenantId, UserRole.CLIENT);
        
        return buildClientStatsList(clientUsers);
    }
    
     /**
     * 테넌트별 내담자 통계 조회 (신규 추가)
     */
    @Cacheable(value = "clientsWithStats", key = "'tenant:' + #tenantId")
    public List<Map<String, Object>> getAllClientsWithStatsByTenant(String tenantId) {
        log.info("📊 테넌트별 내담자 통계 조회: tenantId={}", tenantId);
        
        List<com.coresolution.consultation.entity.User> clientUsers = userRepository
                .findByRole(tenantId, UserRole.CLIENT);
        
        log.info("📊 테넌트별 내담자 조회 완료: tenantId={}, 조회된 수={}", tenantId, clientUsers.size());
        
        return buildClientStatsList(clientUsers);
    }
    
     /**
     * 내담자 목록을 통계와 함께 Map 리스트로 변환 (공통 로직)
     */
    private List<Map<String, Object>> buildClientStatsList(List<com.coresolution.consultation.entity.User> clientUsers) {
        
        return clientUsers.stream()
                .map(user -> {
                    Client client = convertToClient(user);
                    
                    Map<String, Object> clientMap = convertClientToMap(client);
                    clientMap.put("grade", user.getGrade());
                    clientMap.put("notes", user.getNotes());
                    clientMap.put("status", Boolean.TRUE.equals(user.getIsActive()) ? "ACTIVE" : "INACTIVE");
                    clientMap.put("isActive", user.getIsActive() != null ? user.getIsActive() : true);
                    if (user.getProfileImageUrl() != null) {
                        clientMap.put("profileImageUrl", user.getProfileImageUrl());
                    }
                    
                    long currentConsultants = calculateCurrentConsultants(client.getId());
                    Map<String, Object> stats = calculateClientStats(client.getId());
                    
                    Map<String, Object> result = new HashMap<>();
                    result.put("client", clientMap);
                    result.put("currentConsultants", currentConsultants);
                    result.put("statistics", stats);
                    
                    return result;
                })
                .collect(Collectors.toList());
    }

    @Override
    public Long calculateCurrentConsultants(Long clientId) {
        String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return 0L;
        }
        
        return (long) mappingRepository.findByClientIdAndStatusNot(
            tenantId,
            clientId, 
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            ConsultantClientMapping.MappingStatus.INACTIVE
        ).stream()
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            .filter(m -> m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE || 
                        m.getStatus() == ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED)
            .count();
    }

    @Override
    public Map<String, Object> calculateClientStats(Long clientId) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new HashMap<>();
        }
        
        long totalSessions = scheduleRepository.countByClientId(tenantId, clientId);
        
        long completedSessions = scheduleRepository.countByClientId(tenantId, clientId);
        
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
     * 표준화 2025-12-08: name 필드 복호화 추가
     */
    private Client convertToClient(com.coresolution.consultation.entity.User user) {
        Client client = new Client();
        client.setId(user.getId());
        
        // 표준화 2025-12-08: 이름 복호화
        if (user.getName() != null && !user.getName().trim().isEmpty()) {
            try {
                client.setName(encryptionUtil.safeDecrypt(user.getName()));
            } catch (Exception e) {
                log.warn("🔓 내담자 이름 복호화 실패: userId={}, error={}", user.getId(), e.getMessage());
                client.setName(user.getName());
            }
        } else {
            client.setName(user.getName());
        }
        
        // 표준화 2025-12-08: 이메일 복호화 (safeDecrypt 사용)
        if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
            try {
                client.setEmail(encryptionUtil.safeDecrypt(user.getEmail()));
            } catch (Exception e) {
                log.warn("🔓 내담자 이메일 복호화 실패: userId={}, error={}", user.getId(), e.getMessage());
                client.setEmail(user.getEmail());
            }
        } else {
            client.setEmail(user.getEmail());
        }
        
        // 표준화 2025-12-08: 전화번호 복호화 (safeDecrypt 사용)
        if (user.getPhone() != null && !user.getPhone().trim().isEmpty()) {
            try {
                client.setPhone(encryptionUtil.safeDecrypt(user.getPhone()));
            } catch (Exception e) {
                log.warn("🔓 내담자 전화번호 복호화 실패: userId={}, error={}", user.getId(), e.getMessage());
                client.setPhone(user.getPhone());
            }
        } else {
            client.setPhone(user.getPhone());
        }
        
        client.setBirthDate(user.getBirthDate());
        client.setGender(user.getGender());
        client.setAddress(user.getAddress());
        client.setAddressDetail(user.getAddressDetail());
        client.setPostalCode(user.getPostalCode());
        client.setBranchCode(user.getBranchCode());
        client.setIsDeleted(user.getIsDeleted());
        client.setCreatedAt(user.getCreatedAt());
        client.setUpdatedAt(user.getUpdatedAt());

        if (user.getTenantId() != null) {
            clientRepository.findById(user.getId()).ifPresent(row -> {
                if (user.getTenantId().equals(row.getTenantId())) {
                    client.setVehiclePlate(row.getVehiclePlate());
                }
            });
        }

        return client;
    }
    
     /**
     * Client 엔티티를 Map으로 변환
     */
    private Map<String, Object> convertClientToMap(Client client) {
        Map<String, Object> clientMap = new HashMap<>();
        clientMap.put("id", client.getId());
        clientMap.put("name", client.getName());
        clientMap.put("email", client.getEmail());
        clientMap.put("phone", client.getPhone());
        clientMap.put("birthDate", client.getBirthDate());
        clientMap.put("gender", client.getGender());
        clientMap.put("age", client.getAge());
        clientMap.put("address", client.getAddress());
        clientMap.put("addressDetail", client.getAddressDetail());
        clientMap.put("postalCode", client.getPostalCode());
        clientMap.put("vehiclePlate", client.getVehiclePlate());
        clientMap.put("role", UserRole.CLIENT.name());
        clientMap.put("isDeleted", client.getIsDeleted());
        clientMap.put("createdAt", client.getCreatedAt());
        clientMap.put("updatedAt", client.getUpdatedAt());
        return clientMap;
    }
    
     /**
     * 캐시 무효화 (매핑 변경 시 호출)
     /**
     * 
     /**
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

