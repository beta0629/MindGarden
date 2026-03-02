package com.coresolution.consultation.service.impl;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 상담사 통계 정보 조회 서비스 구현
 * - 상담사 정보와 통계를 통합 조회
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
public class ConsultantStatsServiceImpl implements ConsultantStatsService {

    private final ConsultantRepository consultantRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final ScheduleRepository scheduleRepository;
    private final ConsultantRatingService consultantRatingService;
    private final PersonalDataEncryptionUtil encryptionUtil;

    @Override
    @Cacheable(value = "consultantsWithStats", key = "'consultant:' + #consultantId")
    public Map<String, Object> getConsultantWithStats(Long consultantId) {
        log.info("📊 상담사 통계 조회 (DB): consultantId={}", consultantId);
        
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + consultantId));
        
        String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return new HashMap<>();
        }
        
        long currentClients = calculateCurrentClients(consultantId);
        
        List<ConsultantClientMapping> recentMappings = mappingRepository
                .findByConsultantId(tenantId, consultantId).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .collect(Collectors.toList());
        
        Map<String, Object> stats = calculateConsultantStats(consultantId);
        
        // 표준화 2025-12-08: 개인정보 복호화
        Map<String, Object> consultantMap = convertConsultantToMap(consultant);
        
        Map<String, Object> result = new HashMap<>();
        result.put("consultant", consultantMap);
        result.put("currentClients", currentClients);
        result.put("maxClients", consultant.getMaxClients() != null ? consultant.getMaxClients() : 0);
        result.put("totalClients", consultant.getTotalClients() != null ? consultant.getTotalClients() : 0);
        result.put("recentMappings", recentMappings.stream().map(this::mappingToMap).collect(Collectors.toList()));
        result.put("statistics", stats);
        
        return result;
    }

    @Override
    @Cacheable(value = "consultantsWithStats", key = "'all:active'")
    public List<Map<String, Object>> getAllConsultantsWithStats() {
        log.info("📊 전체 상담사 통계 조회 (DB) - 레거시 호환");
        
        // 표준화 2025-12-06: deprecated 메서드 대체
        String tenantId = TenantContextHolder.getRequiredTenantId();
        List<Consultant> consultants = consultantRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .filter(c -> c.getIsActive() != null && c.getIsActive())
                .collect(Collectors.toList());
        
        return buildConsultantStatsList(consultants);
    }
    
    /**
     * 테넌트별 상담사 통계 조회 (신규 추가)
     */
    @Cacheable(value = "consultantsWithStats", key = "'tenant:' + #tenantId + ':active'")
    public List<Map<String, Object>> getAllConsultantsWithStatsByTenant(String tenantId) {
        log.info("📊 테넌트별 상담사 통계 조회: tenantId={}", tenantId);
        
        // 표준화 2025-12-06: deprecated 메서드 대체
        List<Consultant> consultants = consultantRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .filter(c -> c.getIsActive() != null && c.getIsActive())
                .collect(Collectors.toList());
        
        log.info("📊 테넌트별 상담사 조회 완료: tenantId={}, 조회된 수={}", tenantId, consultants.size());
        
        return buildConsultantStatsList(consultants);
    }
    
    /**
     * 상담사 목록을 통계와 함께 Map 리스트로 변환 (공통 로직)
     */
    private List<Map<String, Object>> buildConsultantStatsList(List<Consultant> consultants) {
        
        return consultants.stream()
                .map(consultant -> {
                    long currentClients = calculateCurrentClients(consultant.getId());
                    Map<String, Object> stats = calculateConsultantStats(consultant.getId());
                    
                    Map<String, Object> result = new HashMap<>();
                    
                    // 표준화 2025-12-08: 개인정보 복호화
                    Map<String, Object> consultantMap = convertConsultantToMap(consultant);
                    
                    result.put("consultant", consultantMap);
                    result.put("currentClients", currentClients);
                    result.put("maxClients", consultant.getMaxClients() != null ? consultant.getMaxClients() : 0);
                    result.put("totalClients", consultant.getTotalClients() != null ? consultant.getTotalClients() : 0);
                    result.put("statistics", stats);
                    
                    return result;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "consultantCurrentClients", key = "'consultant:' + #consultantId")
    public Long calculateCurrentClients(Long consultantId) {
        String tenantId = com.coresolution.core.context.TenantContextHolder.getTenantId();
        if (tenantId == null) {
            log.error("❌ tenantId가 설정되지 않았습니다");
            return 0L;
        }
        
        return mappingRepository.countByConsultantIdAndStatusIn(
            tenantId,
            consultantId,
            Arrays.asList(
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                ConsultantClientMapping.MappingStatus.ACTIVE,
                ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED
            )
        );
    }

    @Override
    public Map<String, Object> calculateConsultantStats(Long consultantId) {
        String tenantId = TenantContextHolder.getTenantId();
        
        long totalSessions = scheduleRepository.countByConsultantId(tenantId, consultantId);
        
        long completedSessions = scheduleRepository.countByConsultantId(tenantId, consultantId);
        
        double completionRate = totalSessions > 0 
            ? (double) completedSessions / totalSessions * 100 
            : 0;
        
        Map<String, Object> ratingStats = new HashMap<>();
        try {
            Map<String, Object> stats = consultantRatingService.getConsultantRatingStats(consultantId);
            if (stats != null && !stats.isEmpty()) {
                ratingStats.put("averageRating", stats.getOrDefault("averageHeartScore", 0.0));
                ratingStats.put("totalRatings", stats.getOrDefault("totalRatingCount", 0));
            } else {
                ratingStats.put("averageRating", 0.0);
                ratingStats.put("totalRatings", 0);
            }
        } catch (Exception e) {
            log.warn("평점 데이터 조회 실패: consultantId={}, error={}", consultantId, e.getMessage());
            ratingStats.put("averageRating", 0.0);
            ratingStats.put("totalRatings", 0);
        }
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSessions", totalSessions);
        stats.put("completedSessions", completedSessions);
        stats.put("completionRate", Math.round(completionRate * 10.0) / 10.0);
        stats.put("averageRating", ratingStats.get("averageRating"));
        stats.put("totalRatings", ratingStats.get("totalRatings"));
        
        return stats;
    }
    
    /**
     * 캐시 무효화 (매핑 변경 시 호출)
     * 
     * @param consultantId 상담사 ID
     */
    @CacheEvict(value = {"consultantsWithStats", "consultantCurrentClients"}, key = "'consultant:' + #consultantId")
    public void evictConsultantStatsCache(Long consultantId) {
        log.info("🗑️ 캐시 무효화: consultantId={}", consultantId);
    }
    
    /**
     * 전체 캐시 무효화
     */
    @CacheEvict(value = {"consultantsWithStats", "consultantCurrentClients"}, allEntries = true)
    public void evictAllConsultantStatsCache() {
        log.info("🗑️ 전체 캐시 무효화");
    }
    
    /**
     * 데이터베이스에서 전문분야 상세 정보 조회
     */
    private List<Map<String, String>> getSpecializationDetailsFromDB(String specialization) {
        if (specialization == null || specialization.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        String[] codes = specialization.split(",");
        List<Map<String, String>> details = new ArrayList<>();
        
        for (String code : codes) {
            code = code.trim();
            if (!code.isEmpty()) {
                Map<String, String> detail = new HashMap<>();
                detail.put("code", code);
                detail.put("name", getSpecialtyNameByCode(code));
                details.add(detail);
            }
        }
        
        return details;
    }
    
    /**
     * 코드로 전문분야 이름 조회
     */
    private String getSpecialtyNameByCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            return "미설정";
        }
        
        if (code.matches(".*[가-힣].*")) {
            return code;
        }
        
        Map<String, String> specialtyMap = new HashMap<>();
        specialtyMap.put("DEPRESSION", "우울증");
        specialtyMap.put("ANXIETY", "불안장애");
        specialtyMap.put("STRESS", "스트레스");
        specialtyMap.put("RELATIONSHIP", "인간관계");
        specialtyMap.put("SELF_DEVELOPMENT", "자기개발");
        
        return specialtyMap.getOrDefault(code.toUpperCase(), code);
    }
    
    /**
     * 상담사 엔티티를 Map으로 변환 (개인정보 복호화 포함)
     */
    private Map<String, Object> convertConsultantToMap(Consultant consultant) {
        Map<String, Object> consultantMap = new HashMap<>();
        consultantMap.put("id", consultant.getId());
        
        // 표준화 2025-12-08: 개인정보 필드 복호화
        // 이름 복호화
        String name = consultant.getName();
        if (name != null && !name.trim().isEmpty()) {
            try {
                name = encryptionUtil.safeDecrypt(name);
            } catch (Exception e) {
                log.warn("🔓 상담사 이름 복호화 실패: consultantId={}, error={}", consultant.getId(), e.getMessage());
                // 복호화 실패 시 원본 데이터 유지
            }
        }
        consultantMap.put("name", name);
        
        // 이메일 복호화
        String email = consultant.getEmail();
        if (email != null && !email.trim().isEmpty()) {
            try {
                email = encryptionUtil.safeDecrypt(email);
            } catch (Exception e) {
                log.warn("🔓 상담사 이메일 복호화 실패: consultantId={}, error={}", consultant.getId(), e.getMessage());
                // 복호화 실패 시 원본 데이터 유지
            }
        }
        consultantMap.put("email", email);
        
        // 전화번호 복호화
        String phone = consultant.getPhone();
        if (phone != null && !phone.trim().isEmpty()) {
            try {
                phone = encryptionUtil.safeDecrypt(phone);
            } catch (Exception e) {
                log.warn("🔓 상담사 전화번호 복호화 실패: consultantId={}, error={}", consultant.getId(), e.getMessage());
                // 복호화 실패 시 원본 데이터 유지
            }
        }
        consultantMap.put("phone", phone);
        
        consultantMap.put("role", consultant.getRole() != null ? consultant.getRole().name() : null);
        consultantMap.put("isActive", consultant.getIsActive());
        consultantMap.put("isDeleted", consultant.getIsDeleted());
        
        consultantMap.put("specialty", consultant.getSpecialty());
        consultantMap.put("specialtyDetails", consultant.getSpecialtyDetails());

        String specialization = consultant.getSpecialization();
        consultantMap.put("specialization", specialization);
        consultantMap.put("specializationDetails", getSpecializationDetailsFromDB(specialization));

        consultantMap.put("address", consultant.getAddress());
        consultantMap.put("addressDetail", consultant.getAddressDetail());
        consultantMap.put("postalCode", consultant.getPostalCode());
        consultantMap.put("birthDate", consultant.getBirthDate());
        consultantMap.put("gender", consultant.getGender());
        consultantMap.put("certification", consultant.getCertification());
        consultantMap.put("workHistory", consultant.getWorkHistory());

        consultantMap.put("createdAt", consultant.getCreatedAt());
        consultantMap.put("updatedAt", consultant.getUpdatedAt());
        consultantMap.put("profileImageUrl", consultant.getProfileImageUrl());

        return consultantMap;
    }
    
    /**
     * Mapping 엔티티를 Map으로 변환
     */
    private Map<String, Object> mappingToMap(ConsultantClientMapping mapping) {
        Map<String, Object> map = new HashMap<>();
        map.put("clientId", mapping.getClient() != null ? mapping.getClient().getId() : null);
        map.put("id", mapping.getId());
        map.put("consultantId", mapping.getConsultant() != null ? mapping.getConsultant().getId() : null);
        map.put("packageName", mapping.getPackageName());
        map.put("packagePrice", mapping.getPackagePrice());
        map.put("totalSessions", mapping.getTotalSessions());
        map.put("usedSessions", mapping.getUsedSessions());
        map.put("remainingSessions", mapping.getRemainingSessions());
        map.put("paymentStatus", mapping.getPaymentStatus());
        map.put("status", mapping.getStatus());
        map.put("createdAt", mapping.getCreatedAt());
        return map;
    }
}
