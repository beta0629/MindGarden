package com.coresolution.core.scheduler;

import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.service.statistics.StatisticsMetadataService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 통계 자동 생성 스케줄러
 * 매일 자정에 전날 통계를 자동으로 생성
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-25
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StatisticsGenerationScheduler {
    
    private final StatisticsMetadataService statisticsMetadataService;
    private final TenantRepository tenantRepository;
    
    /**
     * 매일 새벽 1시에 전날 통계 자동 생성
     */
    @Scheduled(cron = "0 0 1 * * ?") // 매일 새벽 1시
    public void generateDailyStatistics() {
        log.info("📊 일별 통계 자동 생성 배치 시작");
        
        LocalDate yesterday = LocalDate.now().minusDays(1);
        
        // 활성 테넌트 목록 조회
        List<String> tenantIds = tenantRepository.findAllActive()
            .stream()
            .map(tenant -> tenant.getTenantId())
            .collect(Collectors.toList());
        
        log.info("통계 생성 대상 테넌트 수: {}", tenantIds.size());
        
        int totalSuccess = 0;
        int totalFailure = 0;
        
        for (String tenantId : tenantIds) {
            try {
                statisticsMetadataService.generateDailyStatistics(tenantId, yesterday);
                totalSuccess++;
                log.debug("✅ 통계 생성 완료: tenantId={}, date={}", tenantId, yesterday);
            } catch (Exception e) {
                totalFailure++;
                log.error("❌ 통계 생성 실패: tenantId={}, date={}", tenantId, yesterday, e);
            }
        }
        
        log.info("📊 일별 통계 자동 생성 배치 완료: success={}, failure={}", totalSuccess, totalFailure);
    }
    
    /**
     * 매시간 정각에 실시간 통계 캐시 갱신 (선택적)
     */
    @Scheduled(cron = "0 0 * * * ?") // 매시간 정각
    public void refreshRealtimeStatistics() {
        log.debug("🔄 실시간 통계 캐시 갱신 시작");
        
        LocalDate today = LocalDate.now();
        
        // 활성 테넌트 목록 조회
        List<String> tenantIds = tenantRepository.findAllActive()
            .stream()
            .map(tenant -> tenant.getTenantId())
            .collect(Collectors.toList());
        
        for (String tenantId : tenantIds) {
            try {
                // 실시간 통계만 갱신 (aggregationPeriod = REALTIME)
                statisticsMetadataService.generateDailyStatistics(tenantId, today);
            } catch (Exception e) {
                log.warn("실시간 통계 캐시 갱신 실패: tenantId={}", tenantId, e);
            }
        }
        
        log.debug("🔄 실시간 통계 캐시 갱신 완료");
    }
}


