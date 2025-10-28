package com.mindgarden.consultation.service.impl;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.entity.Consultant;
import com.mindgarden.consultation.entity.ConsultantClientMapping;
import com.mindgarden.consultation.repository.ConsultantClientMappingRepository;
import com.mindgarden.consultation.repository.ConsultantRepository;
import com.mindgarden.consultation.repository.ScheduleRepository;
import com.mindgarden.consultation.service.ConsultantRatingService;
import com.mindgarden.consultation.service.ConsultantStatsService;
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

    @Override
    @Cacheable(value = "consultantsWithStats", key = "'consultant:' + #consultantId")
    public Map<String, Object> getConsultantWithStats(Long consultantId) {
        log.info("📊 상담사 통계 조회 (DB): consultantId={}", consultantId);
        
        Consultant consultant = consultantRepository.findById(consultantId)
                .orElseThrow(() -> new RuntimeException("상담사를 찾을 수 없습니다: " + consultantId));
        
        // 활성 매핑 수 계산
        long currentClients = calculateCurrentClients(consultantId);
        
        // 최근 매핑 정보 (최대 5개)
        List<ConsultantClientMapping> recentMappings = mappingRepository
                .findByConsultantId(consultantId).stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .limit(5)
                .collect(Collectors.toList());
        
        // 통계 정보
        Map<String, Object> stats = calculateConsultantStats(consultantId);
        
        // Map.of()는 null을 허용하지 않으므로 HashMap 사용
        Map<String, Object> result = new HashMap<>();
        result.put("consultant", consultant);
        result.put("currentClients", currentClients);
        result.put("maxClients", consultant.getMaxClients() != null ? consultant.getMaxClients() : 0);
        result.put("totalClients", consultant.getTotalClients() != null ? consultant.getTotalClients() : 0);
        result.put("recentMappings", recentMappings.stream().map(this::mappingToMap).collect(Collectors.toList()));
        result.put("statistics", stats);
        
        return result;
    }

    @Override
    @CacheEvict(value = "consultantsWithStats", allEntries = true) // 캐시 무효화 후
    @Cacheable(value = "consultantsWithStats", key = "'all:active'") // 새 키로 캐싱
    public List<Map<String, Object>> getAllConsultantsWithStats() {
        log.info("📊 전체 상담사 통계 조회 (DB)");
        
        // 삭제되지 않고 활성인 상담사만 조회
        List<Consultant> consultants = consultantRepository.findByIsDeletedFalse().stream()
                .filter(c -> c.getIsActive() != null && c.getIsActive())
                .collect(Collectors.toList());
        
        return consultants.stream()
                .map(consultant -> {
                    long currentClients = calculateCurrentClients(consultant.getId());
                    Map<String, Object> stats = calculateConsultantStats(consultant.getId());
                    
                    // Map.of()는 null을 허용하지 않으므로 HashMap 사용
                    Map<String, Object> result = new HashMap<>();
                    result.put("consultant", consultant);
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
        return mappingRepository.countByConsultantIdAndStatusIn(
            consultantId,
            Arrays.asList(
                ConsultantClientMapping.MappingStatus.ACTIVE,
                ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED
            )
        );
    }

    @Override
    public Map<String, Object> calculateConsultantStats(Long consultantId) {
        // 총 상담 횟수
        long totalSessions = scheduleRepository.countByConsultantId(consultantId);
        
        // 완료된 상담 횟수 - ScheduleRepository에 상태별 카운트 메서드가 없으므로 전체 카운트 사용
        long completedSessions = scheduleRepository.countByConsultantId(consultantId);
        
        // 완료율 계산
        double completionRate = totalSessions > 0 
            ? (double) completedSessions / totalSessions * 100 
            : 0;
        
        // 평점 정보
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
