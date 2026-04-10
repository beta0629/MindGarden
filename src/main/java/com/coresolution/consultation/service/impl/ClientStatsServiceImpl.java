package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.Period;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.ClientProfileContextFields;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
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
    private final ConsultationRecordRepository consultationRecordRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;
    private final UserPersonalDataCacheService userPersonalDataCacheService;

    @Override
    @Cacheable(value = "clientsWithStats", key = "'tenant:' + #tenantId + ':client:' + #clientId")
    public Map<String, Object> getClientWithStats(String tenantId, Long clientId) {
        return buildClientWithStats(tenantId, clientId);
    }

    @Override
    public Map<String, Object> getClientWithStatsForConsultant(
            String tenantId, Long clientId, Long consultantUserId) {
        if (consultantUserId == null) {
            throw new IllegalArgumentException("consultantUserId는 필수입니다.");
        }
        if (tenantId == null || tenantId.isBlank() || clientId == null) {
            throw new IllegalArgumentException("tenantId와 clientId는 필수입니다.");
        }
        User consultantCaller = new User();
        consultantCaller.setId(consultantUserId);
        consultantCaller.setTenantId(tenantId);
        consultantCaller.setRole(UserRole.CONSULTANT);
        return getClientContextProfile(tenantId, clientId, consultantCaller);
    }

    @Override
    public Map<String, Object> getClientContextProfile(String tenantId, Long clientId, User caller) {
        if (caller == null) {
            throw new IllegalArgumentException("caller는 필수입니다.");
        }
        if (tenantId == null || tenantId.isBlank() || clientId == null) {
            throw new IllegalArgumentException("tenantId와 clientId는 필수입니다.");
        }
        UserRole role = caller.getRole();
        if (role == null) {
            throw new AccessDeniedException("역할 정보가 없어 프로필 맥락을 조회할 수 없습니다.");
        }
        if (role.isClient()) {
            throw new AccessDeniedException("내담자 프로필 맥락 조회 권한이 없습니다.");
        }
        if (role.isAdmin()) {
            Map<String, Object> stats = getClientWithStats(tenantId, clientId);
            Map<String, Object> out = new HashMap<>(stats);
            out.put(ClientProfileContextFields.VISIBILITY_TIER, ClientProfileContextFields.TIER_FULL);
            out.put(ClientProfileContextFields.ACCESS_REASON, ClientProfileContextFields.REASON_ADMIN_SCOPE);
            return out;
        }
        if (role.isStaff()) {
            Map<String, Object> stats = getClientWithStats(tenantId, clientId);
            Map<String, Object> out = new HashMap<>(stats);
            out.put(ClientProfileContextFields.VISIBILITY_TIER, ClientProfileContextFields.TIER_FULL);
            out.put(ClientProfileContextFields.ACCESS_REASON, ClientProfileContextFields.REASON_STAFF_SCOPE);
            return out;
        }
        if (!role.isConsultant()) {
            throw new AccessDeniedException("지원하지 않는 역할입니다.");
        }
        Long consultantUserId = caller.getId();
        if (consultantUserId == null) {
            throw new AccessDeniedException("상담사 식별 정보가 없습니다.");
        }

        Optional<ConsultantClientMapping> mapping = mappingRepository
                .findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(
                        tenantId, consultantUserId, clientId);
        if (mapping.isPresent()) {
            ConsultantClientMapping m = mapping.get();
            String reason = m.getStatus() == ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED
                    ? ClientProfileContextFields.REASON_SESSIONS_EXHAUSTED
                    : ClientProfileContextFields.REASON_MAPPING_ACTIVE;
            Map<String, Object> stats = buildClientWithStats(tenantId, clientId);
            stats.put(ClientProfileContextFields.VISIBILITY_TIER, ClientProfileContextFields.TIER_FULL);
            stats.put(ClientProfileContextFields.ACCESS_REASON, reason);
            return stats;
        }
        if (scheduleRepository.existsByTenantIdAndConsultantIdAndClientIdAndIsDeletedFalse(
                tenantId, consultantUserId, clientId)) {
            Map<String, Object> stats = buildClientWithStats(tenantId, clientId);
            stats.put(ClientProfileContextFields.VISIBILITY_TIER, ClientProfileContextFields.TIER_STANDARD);
            stats.put(ClientProfileContextFields.ACCESS_REASON, ClientProfileContextFields.REASON_SCHEDULE_LINKED);
            return stats;
        }
        if (consultationRecordRepository.existsByTenantIdAndConsultantIdAndClientIdAndIsDeletedFalse(
                tenantId, consultantUserId, clientId)) {
            Map<String, Object> stats = buildClientWithStats(tenantId, clientId);
            stats.put(ClientProfileContextFields.VISIBILITY_TIER, ClientProfileContextFields.TIER_STANDARD);
            stats.put(ClientProfileContextFields.ACCESS_REASON, ClientProfileContextFields.REASON_RECORD_LINKED);
            return stats;
        }
        log.warn("⚠️ 상담사 프로필 맥락 거부: 매칭·일정·상담기록 없음 tenantId={}, consultantId={}, clientId={}",
                tenantId, consultantUserId, clientId);
        throw new AccessDeniedException(
                "해당 내담자에 대한 매칭·일정·상담기록 연결이 없어 조회할 수 없습니다.");
    }

    @Override
    @Transactional(readOnly = false)
    @Caching(evict = {
        @CacheEvict(value = "clientsWithStats", key = "'tenant:' + #tenantId + ':client:' + #clientId"),
        @CacheEvict(value = "clientCurrentConsultants", key = "'client:' + #clientId")
    })
    public Map<String, Object> updateClientContextNotes(String tenantId, Long clientId, User caller, String notes) {
        Map<String, Object> profile = getClientContextProfile(tenantId, clientId, caller);
        String tier = (String) profile.get(ClientProfileContextFields.VISIBILITY_TIER);
        // FULL: 매칭 등 전면 표시. STANDARD: 일정·상담기록 연결만 있는 상담사도 상담일지·메모 편집에 필요.
        if (!ClientProfileContextFields.TIER_FULL.equals(tier)
                && !ClientProfileContextFields.TIER_STANDARD.equals(tier)) {
            throw new AccessDeniedException("메모 편집은 이 내담자에 대한 표시 등급이 부족합니다. (매칭·일정·상담기록 연결이 필요합니다)");
        }
        User clientUser = userRepository
                .findByTenantIdAndId(tenantId, clientId)
                .orElseThrow(() -> new EntityNotFoundException("내담자", clientId));
        if (clientUser.getRole() != UserRole.CLIENT) {
            throw new IllegalArgumentException("해당 사용자는 내담자가 아닙니다.");
        }
        String trimmed = notes == null ? "" : notes.trim();
        clientUser.setNotes(trimmed.isEmpty() ? null : trimmed);
        userRepository.saveAndFlush(clientUser);
        if (tenantId != null && !tenantId.isBlank()) {
            userPersonalDataCacheService.evictUserPersonalDataCache(tenantId, clientId);
        }
        Map<String, Object> out = new HashMap<>();
        out.put("clientId", clientId);
        out.put("notes", resolveDisplayNotes(clientUser));
        return out;
    }

    /**
     * 내담자 통계 본문 (캐시는 {@link #getClientWithStats} 프록시에만 적용).
     */
    private Map<String, Object> buildClientWithStats(String tenantId, Long clientId) {
        if (tenantId == null || tenantId.isBlank()) {
            log.error("❌ getClientWithStats: tenantId가 필수입니다. clientId={}", clientId);
            throw new IllegalArgumentException("tenantId는 필수입니다.");
        }
        if (clientId == null) {
            log.error("❌ getClientWithStats: clientId가 null입니다. tenantId={}", tenantId);
            throw new IllegalArgumentException("clientId는 필수입니다.");
        }
        log.info("📊 내담자 통계 조회 (DB): tenantId={}, clientId={}", tenantId, clientId);

        TenantContextHolder.setTenantId(tenantId);

        com.coresolution.consultation.entity.User user = userRepository
                .findByTenantIdAndId(tenantId, clientId)
                .orElseThrow(() -> new EntityNotFoundException("내담자", clientId));
        if (user.getRole() != UserRole.CLIENT) {
            throw new EntityNotFoundException("내담자", clientId);
        }

        Client client = convertToClient(user);

        Map<String, Object> clientMap = convertClientToMap(client, user);
        clientMap.put("grade", user.getGrade());
        clientMap.put("notes", resolveDisplayNotes(user));
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
                    
                    Map<String, Object> clientMap = convertClientToMap(client, user);
                    clientMap.put("grade", user.getGrade());
                    clientMap.put("notes", resolveDisplayNotes(user));
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

        Set<Long> consultantIds = new HashSet<>();
        mappingRepository.findByClientIdAndStatusNot(
            tenantId,
            clientId,
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            ConsultantClientMapping.MappingStatus.INACTIVE
        ).stream()
            // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
            .filter(m -> m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE
                || m.getStatus() == ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED)
            .map(m -> m.getConsultant() != null ? m.getConsultant().getId() : null)
            .filter(id -> id != null)
            .forEach(consultantIds::add);

        List<Long> fromSchedules = scheduleRepository.findDistinctConsultantIdsByClientId(tenantId, clientId);
        if (fromSchedules != null) {
            fromSchedules.stream().filter(id -> id != null).forEach(consultantIds::add);
        }

        return (long) consultantIds.size();
    }

    @Override
    public Map<String, Object> calculateClientStats(Long clientId) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new HashMap<>();
        }
        
        long totalSessions = scheduleRepository.countByClientId(tenantId, clientId);
        // 완료 건수는 total 과 동일 쿼리를 쓰고 있음(버그). 자동 등급 승급은
        // ScheduleRepository#countCompletedConsultationSessionsGroupedByClientIdForAutoGrade 로 별도 정의.
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

        String gender = user.getGender();
        if (gender != null && !gender.trim().isEmpty()) {
            try {
                gender = encryptionUtil.safeDecrypt(gender);
            } catch (Exception e) {
                log.warn("🔓 내담자 성별 복호화 실패: userId={}, error={}", user.getId(), e.getMessage());
            }
        }
        client.setGender(gender);

        client.setAddress(user.getAddress());
        client.setAddressDetail(user.getAddressDetail());
        client.setPostalCode(user.getPostalCode());
        client.setBranchCode(user.getBranchCode());
        client.setIsDeleted(user.getIsDeleted());
        client.setCreatedAt(user.getCreatedAt());
        client.setUpdatedAt(user.getUpdatedAt());

        String userTenantId = user.getTenantId();
        if (userTenantId == null || userTenantId.isBlank()) {
            log.warn("내담자 User.tenantId가 없어 차량번호 복사 생략: userId={}", user.getId());
        } else {
            // 소프트 삭제된 clients 행에도 차량번호·상담·비상연락처가 있으면 DTO에 반영
            clientRepository.findByTenantIdAndIdIncludingDeleted(userTenantId, user.getId())
                    .ifPresent(row -> {
                        client.setVehiclePlate(row.getVehiclePlate());
                        client.setConsultationPurpose(row.getConsultationPurpose());
                        client.setConsultationHistory(row.getConsultationHistory());
                        if (row.getEmergencyContact() != null && !row.getEmergencyContact().trim().isEmpty()) {
                            try {
                                client.setEmergencyContact(
                                        encryptionUtil.safeDecrypt(row.getEmergencyContact()));
                            } catch (Exception e) {
                                log.warn("🔓 내담자 비상연락처(이름) 복호화 실패: userId={}, error={}",
                                        user.getId(), e.getMessage());
                                client.setEmergencyContact(row.getEmergencyContact());
                            }
                        }
                        if (row.getEmergencyPhone() != null && !row.getEmergencyPhone().trim().isEmpty()) {
                            try {
                                client.setEmergencyPhone(encryptionUtil.safeDecrypt(row.getEmergencyPhone()));
                            } catch (Exception e) {
                                log.warn("🔓 내담자 비상연락처 전화 복호화 실패: userId={}, error={}",
                                        user.getId(), e.getMessage());
                                client.setEmergencyPhone(row.getEmergencyPhone());
                            }
                        }
                    });
        }

        return client;
    }

    /**
     * API 단일 메모 UX: {@code notes} 우선, 비어 있으면 레거시 {@code memo}를 표시용으로 사용.
     *
     * @param user 내담자 User
     * @return 표시용 메모 또는 null
     */
    private String resolveDisplayNotes(com.coresolution.consultation.entity.User user) {
        if (user == null) {
            return null;
        }
        String n = user.getNotes();
        if (n != null && !n.trim().isEmpty()) {
            return n.trim();
        }
        String m = user.getMemo();
        if (m != null && !m.trim().isEmpty()) {
            return m.trim();
        }
        return null;
    }
    
     /**
     * Client 엔티티를 Map으로 변환
     *
     * @param client 복호화·clients 행 보강된 Client
     * @param user   나이 fallback 등 users 컬럼 참조
     */
    private Map<String, Object> convertClientToMap(Client client,
            com.coresolution.consultation.entity.User user) {
        Map<String, Object> clientMap = new HashMap<>();
        clientMap.put("id", client.getId());
        clientMap.put("name", client.getName());
        clientMap.put("email", client.getEmail());
        clientMap.put("phone", client.getPhone());
        clientMap.put("birthDate", client.getBirthDate());
        clientMap.put("gender", client.getGender());
        Integer ageYears = null;
        if (client.getBirthDate() != null) {
            ageYears = Period.between(client.getBirthDate(), LocalDate.now()).getYears();
        } else if (user != null && user.getAge() != null) {
            ageYears = user.getAge();
        }
        clientMap.put("age", ageYears);
        clientMap.put("address", client.getAddress());
        clientMap.put("addressDetail", client.getAddressDetail());
        clientMap.put("postalCode", client.getPostalCode());
        clientMap.put("vehiclePlate", client.getVehiclePlate());
        clientMap.put("emergencyContact", client.getEmergencyContact());
        clientMap.put("emergencyPhone", client.getEmergencyPhone());
        clientMap.put("consultationPurpose", client.getConsultationPurpose());
        clientMap.put("consultationHistory", client.getConsultationHistory());
        clientMap.put("role", UserRole.CLIENT.name());
        clientMap.put("isDeleted", client.getIsDeleted());
        clientMap.put("createdAt", client.getCreatedAt());
        clientMap.put("updatedAt", client.getUpdatedAt());
        return clientMap;
    }
    
     /**
     * 캐시 무효화 (매핑 변경 시 호출).
     * {@link #getClientWithStats} 캐시 키는 {@code tenant:{tenantId}:client:{clientId}} 와 정합.
     * {@code clientCurrentConsultants} 는 기존 {@code client:{id}} 키를 유지한다.
     *
     * @param tenantId 테넌트 ID
     * @param clientId 내담자 ID
     */
    @Caching(evict = {
        @CacheEvict(value = "clientsWithStats", key = "'tenant:' + #tenantId + ':client:' + #clientId"),
        @CacheEvict(value = "clientCurrentConsultants", key = "'client:' + #clientId")
    })
    public void evictClientStatsCache(String tenantId, Long clientId) {
        log.info("🗑️ 캐시 무효화: tenantId={}, clientId={}", tenantId, clientId);
    }
    
     /**
     * 전체 캐시 무효화
     */
    @CacheEvict(value = {"clientsWithStats", "clientCurrentConsultants"}, allEntries = true)
    public void evictAllClientStatsCache() {
        log.info("🗑️ 전체 내담자 캐시 무효화");
    }
}

