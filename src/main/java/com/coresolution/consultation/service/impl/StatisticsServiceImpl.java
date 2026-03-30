package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantPerformance;
import com.coresolution.consultation.entity.DailyStatistics;
import com.coresolution.consultation.entity.PerformanceAlert;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantPerformanceRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.DailyStatisticsRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.repository.PerformanceAlertRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.consultation.service.CommonCodeService;
import java.math.RoundingMode;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

 /**
 * 통계 서비스 구현체
 /**
 * PL/SQL 도입을 위한 통계 처리 서비스 구현
 /**
 * 
 /**
 * @author MindGarden
 /**
 * @version 1.0.0
 /**
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class StatisticsServiceImpl implements StatisticsService {

    private final DailyStatisticsRepository dailyStatisticsRepository;
    private final ConsultantPerformanceRepository consultantPerformanceRepository;
    private final PerformanceAlertRepository performanceAlertRepository;
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final ConsultantRatingRepository consultantRatingRepository;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final ConsultantClientMappingRepository mappingRepository;
    private final CommonCodeService commonCodeService;


    /**
     * 일별 통계 업데이트
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    public DailyStatistics updateDailyStatistics(LocalDate date, String branchCode) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        log.info("📊 일별 통계 업데이트 시작: date={}", date);

        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            
            DailyStatistics statistics = dailyStatisticsRepository
                .findByTenantIdAndStatDate(tenantId, date)
                .orElse(DailyStatistics.builder()
                    .statDate(date)
                    .tenantId(tenantId)
                    .build());

            List<Schedule> daySchedules = scheduleRepository.findByTenantIdAndDate(tenantId, date);
            log.debug("🔍 조회된 스케줄 수: {}", daySchedules.size());

            statistics.setTotalConsultations(daySchedules.size());
            
            long completedCount = daySchedules.stream()
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .count();
            statistics.setCompletedConsultations((int) completedCount);

            long cancelledCount = daySchedules.stream()
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .filter(s -> ScheduleStatus.CANCELLED.equals(s.getStatus()))
                .count();
            statistics.setCancelledConsultations((int) cancelledCount);

            BigDecimal totalRevenue = daySchedules.stream()
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .map(this::getSessionFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            statistics.setTotalRevenue(totalRevenue);

            BigDecimal avgRating = BigDecimal.ZERO;
            if (!daySchedules.isEmpty()) {
                List<Long> consultantIds = daySchedules.stream()
                    .map(Schedule::getConsultantId)
                    .distinct()
                    .collect(Collectors.toList());
                
                if (!consultantIds.isEmpty()) {
                    Double totalAvgRating = consultantIds.stream()
                        .mapToDouble(consultantId -> {
                            Double rating = consultantRatingRepository.getAverageHeartScoreByConsultant(
                                consultantId, 
                                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                                com.coresolution.consultation.entity.ConsultantRating.RatingStatus.ACTIVE
                            );
                            return rating != null ? rating : 0.0;
                        })
                        .average()
                        .orElse(0.0);
                    
                    avgRating = BigDecimal.valueOf(totalAvgRating);
                }
            }
            statistics.setAvgRating(avgRating);

            long consultantCount = daySchedules.stream()
                .map(Schedule::getConsultantId)
                .distinct()
                .count();
            statistics.setConsultantCount((int) consultantCount);

            long clientCount = daySchedules.stream()
                .map(Schedule::getClientId)
                .distinct()
                .count();
            statistics.setClientCount((int) clientCount);

            if (statistics.getId() != null) {
                statistics.setUpdatedAt(LocalDateTime.now());
            }

            DailyStatistics savedStatistics = dailyStatisticsRepository.save(statistics);
            log.info("✅ 일별 통계 업데이트 완료: date={}, tenantId={}, consultations={}", 
                date, tenantId, savedStatistics.getTotalConsultations());

            return savedStatistics;

        } catch (Exception e) {
            log.error("❌ 일별 통계 업데이트 실패: date={}", date, e);
            throw new RuntimeException("일별 통계 업데이트 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    /**
     * 일별 통계 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    public DailyStatistics getDailyStatistics(LocalDate date, String branchCode) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return dailyStatisticsRepository.findByTenantIdAndStatDate(tenantId, date)
            .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    /**
     * 일별 통계 조회 (기간 지정)
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    public List<DailyStatistics> getDailyStatistics(LocalDate startDate, LocalDate endDate, String branchCode) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return dailyStatisticsRepository.findByTenantIdAndStatDateBetween(tenantId, startDate, endDate);
    }

    @Override
    @Transactional(readOnly = true)
    /**
     * 월별 집계 통계 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    public Map<String, Object> getMonthlyAggregatedStatistics(String yearMonth, String branchCode) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📊 월별 집계 통계 조회: yearMonth={}, tenantId={}", yearMonth, tenantId);

        try {
            LocalDate startDate = LocalDate.parse(yearMonth + "-01", DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

            List<DailyStatistics> statisticsList = dailyStatisticsRepository.findByTenantIdAndStatDateBetween(
                tenantId, startDate, endDate);

            Map<String, Object> aggregatedStats = new HashMap<>();
            
            if (!statisticsList.isEmpty()) {
                int totalConsultations = statisticsList.stream()
                    .mapToInt(DailyStatistics::getTotalConsultations)
                    .sum();
                int completedConsultations = statisticsList.stream()
                    .mapToInt(DailyStatistics::getCompletedConsultations)
                    .sum();
                BigDecimal totalRevenue = statisticsList.stream()
                    .map(DailyStatistics::getTotalRevenue)
                    .filter(r -> r != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal avgRating = statisticsList.stream()
                    .map(DailyStatistics::getAvgRating)
                    .filter(r -> r != null)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(statisticsList.size()), 2, RoundingMode.HALF_UP);

                aggregatedStats.put("tenantId", tenantId);
                aggregatedStats.put("totalConsultations", totalConsultations);
                aggregatedStats.put("completedConsultations", completedConsultations);
                aggregatedStats.put("totalRevenue", totalRevenue);
                aggregatedStats.put("avgRating", avgRating);
            } else {
                aggregatedStats.put("tenantId", tenantId);
                aggregatedStats.put("totalConsultations", 0);
                aggregatedStats.put("completedConsultations", 0);
                aggregatedStats.put("totalRevenue", BigDecimal.ZERO);
                aggregatedStats.put("avgRating", BigDecimal.ZERO);
            }

            aggregatedStats.put("period", yearMonth);
            
            return aggregatedStats;

        } catch (Exception e) {
            log.error("❌ 월별 집계 통계 조회 실패: yearMonth={}, tenantId={}", yearMonth, tenantId, e);
            throw new RuntimeException("월별 집계 통계 조회 중 오류가 발생했습니다.", e);
        }
    }


    @Override
    public ConsultantPerformance updateConsultantPerformance(Long consultantId, LocalDate date) {
        log.info("📊 상담사 성과 업데이트 시작: consultantId={}, date={}", consultantId, date);

        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            ConsultantPerformance performance = consultantPerformanceRepository
                .findByTenantIdAndConsultantIdAndPerformanceDate(tenantId, consultantId, date)
                .orElse(ConsultantPerformance.builder()
                    .tenantId(tenantId)
                    .consultantId(consultantId)
                    .performanceDate(date)
                    .build());

            List<Schedule> consultantSchedules = scheduleRepository.findByConsultantIdAndDate(consultantId, date);
            
            performance.setTotalSchedules(consultantSchedules.size());
            
            long completedCount = consultantSchedules.stream()
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .count();
            performance.setCompletedSchedules((int) completedCount);

            long cancelledCount = consultantSchedules.stream()
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .filter(s -> ScheduleStatus.CANCELLED.equals(s.getStatus()))
                .count();
            performance.setCancelledSchedules((int) cancelledCount);

            long noShowCount = consultantSchedules.stream()
                .filter(s -> s.getStatus() != null && s.getStatus().toString().equals("NO_SHOW"))
                .count();
            performance.setNoShowSchedules((int) noShowCount);

            BigDecimal totalRevenue = consultantSchedules.stream()
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .map(this::getSessionFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            performance.setTotalRevenue(totalRevenue);

            long uniqueClientCount = consultantSchedules.stream()
                .map(Schedule::getClientId)
                .distinct()
                .count();
            performance.setUniqueClients((int) uniqueClientCount);
            
            long repeatClientCount = consultantSchedules.stream()
                .collect(Collectors.groupingBy(Schedule::getClientId, Collectors.counting()))
                .entrySet()
                .stream()
                .filter(entry -> entry.getValue() > 1)
                .count();
            performance.setRepeatClients((int) repeatClientCount);

            Double avgRating = consultantRatingRepository.getAverageHeartScoreByConsultant(
                consultantId, 
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                com.coresolution.consultation.entity.ConsultantRating.RatingStatus.ACTIVE
            );
            Long totalRatings = consultantRatingRepository.getTotalRatingCountByConsultant(
                consultantId, 
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                com.coresolution.consultation.entity.ConsultantRating.RatingStatus.ACTIVE
            );
            
            performance.setAvgRating(avgRating != null ? BigDecimal.valueOf(avgRating) : BigDecimal.ZERO);
            performance.setTotalRatings(totalRatings != null ? totalRatings.intValue() : 0);

            performance.calculatePerformanceScore();

            performance.updateTimestamp();

            ConsultantPerformance savedPerformance = consultantPerformanceRepository.save(performance);
            log.info("✅ 상담사 성과 업데이트 완료: consultantId={}, date={}, score={}", 
                consultantId, date, savedPerformance.getPerformanceScore());

            return savedPerformance;

        } catch (Exception e) {
            log.error("❌ 상담사 성과 업데이트 실패: consultantId={}, date={}", consultantId, date, e);
            throw new RuntimeException("상담사 성과 업데이트 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ConsultantPerformance getConsultantPerformance(Long consultantId, LocalDate date) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultantPerformanceRepository
            .findByTenantIdAndConsultantIdAndPerformanceDate(tenantId, consultantId, date)
            .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    /**
     * 최고 성과 상담사 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    public List<ConsultantPerformance> getTopPerformers(LocalDate startDate, LocalDate endDate, String branchCode, int limit) {
        // 표준화 2025-12-06: branchCode 무시, tenantId 기반으로만 조회
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = TenantContextHolder.getRequiredTenantId();
        return consultantPerformanceRepository.findTopPerformers(
            startDate, endDate, org.springframework.data.domain.PageRequest.of(0, limit))
            .getContent();
    }

    @Override
    @Transactional(readOnly = true)
    /**
     * 저성과 상담사 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    public List<ConsultantPerformance> getUnderperformingConsultants(LocalDate date, String branchCode) {
        // 표준화 2025-12-06: branchCode 무시, tenantId 기반으로만 조회
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = TenantContextHolder.getRequiredTenantId();
        // 표준화 2025-12-06: branchCode를 null로 전달 (Repository에서 tenantId 사용)
        return consultantPerformanceRepository.findUnderperformingConsultants(date, 70.0, null);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getPerformanceTrend(Long consultantId, LocalDate startDate, LocalDate endDate) {
        List<Object[]> trendData = consultantPerformanceRepository.getPerformanceTrend(
            consultantId, startDate, endDate);

        Map<String, Object> trend = new HashMap<>();
        trend.put("consultantId", consultantId);
        trend.put("period", Map.of("start", startDate, "end", endDate));
        trend.put("trendData", trendData);

        return trend;
    }


    @Override
    public PerformanceAlert createPerformanceAlert(Long consultantId, PerformanceAlert.AlertLevel level, String message) {
        log.info("🚨 성과 알림 생성: consultantId={}, level={}", consultantId, level);

        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            Long recentAlertCount = performanceAlertRepository.countRecentSimilarAlerts(
                consultantId, level, oneHourAgo);

            if (recentAlertCount > 0) {
                log.warn("⚠️ 중복 알림 방지: consultantId={}, level={}", consultantId, level);
                return null;
            }

            Optional<User> consultantOpt = userRepository.findByTenantIdAndId(tenantId, consultantId);
            String consultantName = consultantOpt.map(User::getName).orElse("알 수 없음");

            PerformanceAlert alert = PerformanceAlert.builder()
                .consultantId(consultantId)
                .consultantName(consultantName)
                .alertLevel(level)
                .alertMessage(message)
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .status(PerformanceAlert.AlertStatus.PENDING)
                .build();

            PerformanceAlert savedAlert = performanceAlertRepository.save(alert);
            log.info("✅ 성과 알림 생성 완료: id={}, consultantId={}, level={}", 
                savedAlert.getId(), consultantId, level);

            return savedAlert;

        } catch (Exception e) {
            log.error("❌ 성과 알림 생성 실패: consultantId={}, level={}", consultantId, level, e);
            throw new RuntimeException("성과 알림 생성 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<PerformanceAlert> getPendingAlerts() {
        return performanceAlertRepository.findPendingAlerts();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PerformanceAlert> getCriticalAlerts() {
        return performanceAlertRepository.findCriticalAlerts();
    }

    @Override
    public void markAlertAsRead(Long alertId) {
        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isEmpty()) {
            log.warn("⚠️ tenantId가 설정되지 않아 알림 읽음 처리를 건너뜁니다: alertId={}", alertId);
            return;
        }
        performanceAlertRepository.findByTenantIdAndId(tenantId, alertId).ifPresent(alert -> {
            alert.markAsRead();
            performanceAlertRepository.save(alert);
            log.info("📖 알림 읽음 처리: alertId={}", alertId);
        });
    }


    @Override
    public void updateAllDailyStatistics(LocalDate date) {
        log.info("🔄 전체 일별 통계 배치 업데이트 시작: date={}", date);

        try {
            String tenantId = TenantContextHolder.getRequiredTenantId();
            
            // 표준화 2025-12-06: branchCode는 더 이상 사용하지 않음, tenantId 기반으로만 통계 업데이트
            try {
                updateDailyStatistics(date, null); // branchCode 무시
            } catch (Exception e) {
                log.error("❌ 테넌트별 통계 업데이트 실패: tenantId={}, date={}", tenantId, date, e);
                throw e;
            }

            log.info("✅ 전체 일별 통계 배치 업데이트 완료: date={}, tenantId={}", date, tenantId);

        } catch (Exception e) {
            log.error("❌ 전체 일별 통계 배치 업데이트 실패: date={}", date, e);
            throw new RuntimeException("전체 일별 통계 배치 업데이트 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    public void updateAllConsultantPerformance(LocalDate date) {
        log.info("🔄 전체 상담사 성과 배치 업데이트 시작: date={}", date);

        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return;
            }
            
            List<User> consultants = userRepository.findByRoleAndIsActiveTrue(tenantId, UserRole.CONSULTANT);

            for (User consultant : consultants) {
                try {
                    updateConsultantPerformance(consultant.getId(), date);
                } catch (Exception e) {
                    log.error("❌ 상담사 성과 업데이트 실패: consultantId={}", consultant.getId(), e);
                }
            }

            log.info("✅ 전체 상담사 성과 배치 업데이트 완료: date={}, 처리된 상담사 수={}", date, consultants.size());

        } catch (Exception e) {
            log.error("❌ 전체 상담사 성과 배치 업데이트 실패: date={}", date, e);
            throw new RuntimeException("전체 상담사 성과 배치 업데이트 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    public void detectPerformanceIssuesAndCreateAlerts(LocalDate date) {
        log.info("🔍 성과 이슈 감지 및 알림 생성 시작: date={}", date);

        try {
            List<ConsultantPerformance> underperformers = consultantPerformanceRepository
                .findUnderperformingConsultants(date, 70.0, null);

            for (ConsultantPerformance performance : underperformers) {
                try {
                    String message = String.format("상담사 %s의 %s 완료율이 %.1f%%로 기준(70%%) 미달입니다.",
                        performance.getConsultant() != null ? performance.getConsultant().getName() : "알 수 없음",
                        date.toString(),
                        performance.getCompletionRate().doubleValue());

                    PerformanceAlert.AlertLevel level = performance.getCompletionRate().doubleValue() < 50.0 ?
                        PerformanceAlert.AlertLevel.CRITICAL : PerformanceAlert.AlertLevel.WARNING;

                    createPerformanceAlert(performance.getConsultantId(), level, message);

                } catch (Exception e) {
                    log.error("❌ 개별 알림 생성 실패: consultantId={}", performance.getConsultantId(), e);
                }
            }

            log.info("✅ 성과 이슈 감지 및 알림 생성 완료: date={}, 감지된 이슈 수={}", date, underperformers.size());

        } catch (Exception e) {
            log.error("❌ 성과 이슈 감지 및 알림 생성 실패: date={}", date, e);
            throw new RuntimeException("성과 이슈 감지 및 알림 생성 중 오류가 발생했습니다.", e);
        }
    }


    /**
     * 대시보드 통계 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStatistics(String branchCode) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📊 대시보드 통계 조회: tenantId={}", tenantId);

        try {
            Map<String, Object> dashboard = new HashMap<>();
            LocalDate today = LocalDate.now();

            DailyStatistics todayStats = getDailyStatistics(today, null); // branchCode 무시
            dashboard.put("today", todayStats != null ? todayStats : new HashMap<>());

            LocalDate weekAgo = today.minusDays(7);
            List<DailyStatistics> weekStats = getDailyStatistics(weekAgo, today, null); // branchCode 무시
            dashboard.put("week", weekStats);

            String thisMonth = today.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            Map<String, Object> monthlyStats = getMonthlyAggregatedStatistics(thisMonth, null); // branchCode 무시
            dashboard.put("month", monthlyStats);

            LocalDate monthAgo = today.minusDays(30);
            List<ConsultantPerformance> topPerformers = getTopPerformers(monthAgo, today, null, 5); // branchCode 무시
            dashboard.put("topPerformers", topPerformers);

            List<PerformanceAlert> pendingAlerts = getPendingAlerts();
            dashboard.put("pendingAlertsCount", pendingAlerts.size());

            return dashboard;

        } catch (Exception e) {
            log.error("❌ 대시보드 통계 조회 실패: tenantId={}", tenantId, e);
            throw new RuntimeException("대시보드 통계 조회 중 오류가 발생했습니다.", e);
        }
    }

    /**
     * 실시간 성과 지표 조회
     * 표준화 2025-12-06: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음
     */
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getRealTimePerformanceIndicators(String branchCode) {
        // 표준화 2025-12-06: branchCode 무시
        if (branchCode != null) {
            log.warn("⚠️ Deprecated 파라미터: branchCode는 더 이상 사용하지 않음. branchCode={}", branchCode);
        }
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📊 실시간 성과 지표 조회: tenantId={}", tenantId);
        
        try {
            Map<String, Object> indicators = new HashMap<>();
            LocalDateTime now = LocalDateTime.now();
            LocalDate today = now.toLocalDate();
            
            DailyStatistics todayStats = getDailyStatistics(today, null); // branchCode 무시
            
            // 표준화 2025-12-06: branchCode 무시, tenantId 기반으로만 조회
            List<Schedule> todaySchedules = scheduleRepository.findByTenantIdAndDateAndIsDeletedFalse(tenantId, today);
            long inProgressCount = todaySchedules.stream()
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .filter(s -> ScheduleStatus.BOOKED.equals(s.getStatus()) || ScheduleStatus.CONFIRMED.equals(s.getStatus()))
                .count();
            
            long completedCount = todaySchedules.stream()
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .count();
            double completionRate = todaySchedules.isEmpty() ? 0.0 : 
                (double) completedCount / todaySchedules.size() * 100;
            
            BigDecimal realTimeRevenue = todaySchedules.stream()
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .map(this::getSessionFee)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            long activeConsultants = todaySchedules.stream()
                .map(Schedule::getConsultantId)
                .distinct()
                .count();
            
            indicators.put("timestamp", now);
            indicators.put("todayStats", todayStats);
            indicators.put("inProgressConsultations", inProgressCount);
            indicators.put("completionRate", Math.round(completionRate * 100.0) / 100.0);
            indicators.put("realTimeRevenue", realTimeRevenue);
            indicators.put("activeConsultants", activeConsultants);
            indicators.put("totalTodayConsultations", todaySchedules.size());
            
            return indicators;
            
        } catch (Exception e) {
            log.error("❌ 실시간 성과 지표 조회 실패: branchCode={}", branchCode, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "실시간 성과 지표 조회 중 오류가 발생했습니다.");
            return errorResponse;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTrendAnalysisData(LocalDate startDate, LocalDate endDate, String branchCode) {
        log.info("📊 트렌드 분석 데이터 조회: startDate={}, endDate={}, branchCode={}", startDate, endDate, branchCode);
        
        try {
            Map<String, Object> trends = new HashMap<>();
            
            List<DailyStatistics> dailyStats = getDailyStatistics(startDate, endDate, branchCode);
            
            List<Map<String, Object>> consultationTrend = dailyStats.stream()
                .map(stat -> {
                    Map<String, Object> dayData = new HashMap<>();
                    dayData.put("date", stat.getStatDate());
                    dayData.put("totalConsultations", stat.getTotalConsultations());
                    dayData.put("completedConsultations", stat.getCompletedConsultations());
                    dayData.put("totalRevenue", stat.getTotalRevenue());
                    dayData.put("avgRating", stat.getAvgRating());
                    return dayData;
                })
                .collect(Collectors.toList());
            
            double avgConsultationsPerDay = dailyStats.stream()
                .mapToInt(DailyStatistics::getTotalConsultations)
                .average()
                .orElse(0.0);
            
            double avgCompletionRate = dailyStats.stream()
                .filter(stat -> stat.getTotalConsultations() > 0)
                .mapToDouble(stat -> (double) stat.getCompletedConsultations() / stat.getTotalConsultations() * 100)
                .average()
                .orElse(0.0);
            
            BigDecimal totalRevenue = dailyStats.stream()
                .map(DailyStatistics::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            double avgRating = dailyStats.stream()
                .filter(stat -> stat.getAvgRating() != null && stat.getAvgRating().compareTo(BigDecimal.ZERO) > 0)
                .mapToDouble(stat -> stat.getAvgRating().doubleValue())
                .average()
                .orElse(0.0);
            
            List<DailyStatistics> recentWeek = dailyStats.stream()
                .filter(stat -> stat.getStatDate().isAfter(endDate.minusDays(7)))
                .collect(Collectors.toList());
            
            List<DailyStatistics> previousWeek = dailyStats.stream()
                .filter(stat -> stat.getStatDate().isAfter(endDate.minusDays(14)) && 
                               stat.getStatDate().isBefore(endDate.minusDays(7)))
                .collect(Collectors.toList());
            
            Map<String, Object> trendAnalysis = new HashMap<>();
            if (!recentWeek.isEmpty() && !previousWeek.isEmpty()) {
                double recentAvg = recentWeek.stream().mapToInt(DailyStatistics::getTotalConsultations).average().orElse(0.0);
                double previousAvg = previousWeek.stream().mapToInt(DailyStatistics::getTotalConsultations).average().orElse(0.0);
                
                double consultationTrendPercent = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0.0;
                trendAnalysis.put("consultationTrend", Math.round(consultationTrendPercent * 100.0) / 100.0);
                trendAnalysis.put("consultationDirection", consultationTrendPercent > 0 ? "증가" : "감소");
            }
            
            trends.put("period", Map.of("start", startDate, "end", endDate));
            trends.put("dailyTrends", consultationTrend);
            trends.put("summary", Map.of(
                "avgConsultationsPerDay", Math.round(avgConsultationsPerDay * 100.0) / 100.0,
                "avgCompletionRate", Math.round(avgCompletionRate * 100.0) / 100.0,
                "totalRevenue", totalRevenue,
                "avgRating", Math.round(avgRating * 100.0) / 100.0
            ));
            trends.put("trendAnalysis", trendAnalysis);
            
            return trends;
            
        } catch (Exception e) {
            log.error("❌ 트렌드 분석 데이터 조회 실패: startDate={}, endDate={}, branchCode={}", startDate, endDate, branchCode, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "트렌드 분석 데이터 조회 중 오류가 발생했습니다.");
            return errorResponse;
        }
    }
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyStatistics(LocalDate startDate, LocalDate endDate, String branchCode) {
        log.info("📊 월간 통계 조회: startDate={}, endDate={}, branchCode={}", startDate, endDate, branchCode);
        try {
            Map<String, Object> monthlyStats = new HashMap<>();
            
            List<DailyStatistics> dailyStats = getDailyStatistics(startDate, endDate, branchCode);
            
            int totalConsultations = dailyStats.stream()
                .mapToInt(DailyStatistics::getTotalConsultations)
                .sum();
            
            int completedConsultations = dailyStats.stream()
                .mapToInt(DailyStatistics::getCompletedConsultations)
                .sum();
            
            BigDecimal totalRevenue = dailyStats.stream()
                .map(DailyStatistics::getTotalRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            double avgRating = dailyStats.stream()
                .filter(stat -> stat.getAvgRating() != null && stat.getAvgRating().compareTo(BigDecimal.ZERO) > 0)
                .mapToDouble(stat -> stat.getAvgRating().doubleValue())
                .average()
                .orElse(0.0);
            
            monthlyStats.put("totalConsultations", totalConsultations);
            monthlyStats.put("completedConsultations", completedConsultations);
            monthlyStats.put("totalRevenue", totalRevenue);
            monthlyStats.put("avgRating", avgRating);
            monthlyStats.put("period", Map.of("start", startDate, "end", endDate));
            monthlyStats.put("branchCode", branchCode);
            
            return monthlyStats;
        } catch (Exception e) {
            log.error("❌ 월간 통계 조회 실패: startDate={}, endDate={}, branchCode={}", startDate, endDate, branchCode, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "error");
            errorResponse.put("message", "월간 통계 조회 중 오류가 발생했습니다.");
            return errorResponse;
        }
    }
    
    
    @Override
    public Map<String, Object> getOverallStatistics() {
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return new HashMap<>();
            }
            
            Map<String, Object> statistics = new HashMap<>();
            
            long totalClients = userRepository.countByRole(tenantId, UserRole.CLIENT);
            statistics.put("totalClients", totalClients);
            
            long totalConsultants = userRepository.countByRole(tenantId, UserRole.CONSULTANT);
            statistics.put("totalConsultants", totalConsultants);
            
            long totalSessions = scheduleRepository.count();
            statistics.put("totalSessions", totalSessions);
            
            long activeMappings = 0; // TODO: ConsultantClientMappingRepository에서 조회
            statistics.put("activeMappings", activeMappings);
            
            long completedSessions = 0; // TODO: ConsultationRecordRepository에서 조회
            double completionRate = totalSessions > 0 ? (double) completedSessions / totalSessions * 100 : 0;
            statistics.put("completionRate", Math.round(completionRate * 10.0) / 10.0);
            
            Long totalRevenue = 0L; // TODO: PaymentRepository에서 조회
            statistics.put("totalRevenue", totalRevenue != null ? totalRevenue : 0);
            
            return statistics;
        } catch (Exception e) {
            log.error("전체 통계 조회 오류", e);
            return getDefaultOverallStatistics();
        }
    }
    
    @Override
    public Map<String, Object> getTrendStatistics() {
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return new HashMap<>();
            }
            
            Map<String, Object> trends = new HashMap<>();
            
            LocalDate now = LocalDate.now();
            LocalDate lastYear = now.minusYears(1);
            
            long currentClients = userRepository.countByTenantIdAndCreatedAtAfterAndRole(tenantId, lastYear.atStartOfDay(), UserRole.CLIENT);
            long lastYearClients = userRepository.countByTenantIdAndCreatedAtBeforeAndRole(tenantId, lastYear.atStartOfDay(), UserRole.CLIENT);
            double clientGrowth = lastYearClients > 0 ? (double) (currentClients - lastYearClients) / lastYearClients * 100 : 0;
            trends.put("clientGrowth", Math.round(clientGrowth * 10.0) / 10.0);
            
            long currentConsultants = userRepository.countByTenantIdAndCreatedAtAfterAndRole(tenantId, lastYear.atStartOfDay(), UserRole.CONSULTANT);
            long lastYearConsultants = userRepository.countByTenantIdAndCreatedAtBeforeAndRole(tenantId, lastYear.atStartOfDay(), UserRole.CONSULTANT);
            double consultantGrowth = lastYearConsultants > 0 ? (double) (currentConsultants - lastYearConsultants) / lastYearConsultants * 100 : 0;
            trends.put("consultantGrowth", Math.round(consultantGrowth * 10.0) / 10.0);
            
            long currentSessions = scheduleRepository.countByTenantIdAndCreatedAtAfter(tenantId, lastYear.atStartOfDay());
            long lastYearSessions = scheduleRepository.countByTenantIdAndCreatedAtBefore(tenantId, lastYear.atStartOfDay());
            double sessionGrowth = lastYearSessions > 0 ? (double) (currentSessions - lastYearSessions) / lastYearSessions * 100 : 0;
            trends.put("sessionGrowth", Math.round(sessionGrowth * 10.0) / 10.0);
            
            Long currentRevenue = 0L; // TODO: PaymentRepository에서 조회
            Long lastYearRevenue = 0L; // TODO: PaymentRepository에서 조회
            double revenueGrowth = (lastYearRevenue != null && lastYearRevenue > 0) ? 
                (double) ((currentRevenue != null ? currentRevenue : 0) - lastYearRevenue) / lastYearRevenue * 100 : 0;
            trends.put("revenueGrowth", Math.round(revenueGrowth * 10.0) / 10.0);
            
            return trends;
        } catch (Exception e) {
            log.error("트렌드 통계 조회 오류", e);
            return getDefaultTrendStatistics();
        }
    }
    
    @Override
    public Map<String, Object> getChartData() {
        try {
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.error("❌ tenantId가 설정되지 않았습니다");
                return new HashMap<>();
            }
            
            Map<String, Object> chartData = new HashMap<>();
            
            List<String> labels = new ArrayList<>();
            List<Integer> clientData = new ArrayList<>();
            List<Integer> sessionData = new ArrayList<>();
            
            LocalDate now = LocalDate.now();
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("M월");
            
            for (int i = 5; i >= 0; i--) {
                LocalDate month = now.minusMonths(i);
                labels.add(month.format(formatter));
                
                LocalDateTime monthStart = month.withDayOfMonth(1).atStartOfDay();
                LocalDateTime monthEnd = month.withDayOfMonth(month.lengthOfMonth()).atTime(23, 59, 59);
                
                long monthlyClients = userRepository.countByTenantIdAndCreatedAtBetweenAndRole(tenantId, monthStart, monthEnd, UserRole.CLIENT);
                clientData.add((int) monthlyClients);
                
                long monthlySessions = scheduleRepository.countByTenantIdAndCreatedAtBetween(tenantId, monthStart, monthEnd);
                sessionData.add((int) monthlySessions);
            }
            
            chartData.put("labels", labels);
            
            List<Map<String, Object>> datasets = new ArrayList<>();
            
            Map<String, Object> clientDataset = new HashMap<>();
            clientDataset.put("label", "내담자 수");
            clientDataset.put("data", clientData);
            clientDataset.put("borderColor", "var(--color-primary)");
            clientDataset.put("backgroundColor", "var(--color-primary-light)");
            clientDataset.put("tension", 0.1);
            datasets.add(clientDataset);
            
            Map<String, Object> sessionDataset = new HashMap<>();
            sessionDataset.put("label", "상담 세션");
            sessionDataset.put("data", sessionData);
            sessionDataset.put("borderColor", "var(--status-success)");
            sessionDataset.put("backgroundColor", "var(--status-success-light)");
            sessionDataset.put("tension", 0.1);
            datasets.add(sessionDataset);
            
            chartData.put("datasets", datasets);
            
            return chartData;
        } catch (Exception e) {
            log.error("차트 데이터 조회 오류", e);
            return getDefaultChartData();
        }
    }
    
    @Override
    public Map<String, Object> getRecentActivity() {
        try {
            Map<String, Object> activity = new HashMap<>();
            
            List<Map<String, Object>> activities = new ArrayList<>();
            
            List<Object[]> recentClients = userRepository.findRecentClients(5);
            for (Object[] client : recentClients) {
                Map<String, Object> activityItem = new HashMap<>();
                activityItem.put("type", "client");
                activityItem.put("message", "새로운 내담자 등록: " + client[0]);
                activityItem.put("time", formatTimeAgo((LocalDateTime) client[1]));
                activities.add(activityItem);
            }
            
            
            activities.sort((a, b) -> {
                String timeA = (String) a.get("time");
                String timeB = (String) b.get("time");
                return timeB.compareTo(timeA);
            });
            
            if (activities.size() > 10) {
                activities = activities.subList(0, 10);
            }
            
            activity.put("activities", activities);
            
            return activity;
        } catch (Exception e) {
            log.error("최근 활동 조회 오류", e);
            return getDefaultRecentActivity();
        }
    }
    
    private String formatTimeAgo(LocalDateTime dateTime) {
        LocalDateTime now = LocalDateTime.now();
        long minutes = java.time.Duration.between(dateTime, now).toMinutes();
        
        if (minutes < 1) {
            return "방금 전";
        } else if (minutes < 60) {
            return minutes + "분 전";
        } else if (minutes < 1440) {
            return (minutes / 60) + "시간 전";
        } else {
            return (minutes / 1440) + "일 전";
        }
    }
    
    private Map<String, Object> getDefaultOverallStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalClients", 0);
        stats.put("totalConsultants", 0);
        stats.put("totalSessions", 0);
        stats.put("activeMappings", 0);
        stats.put("completionRate", 0.0);
        stats.put("totalRevenue", 0);
        return stats;
    }
    
    private Map<String, Object> getDefaultTrendStatistics() {
        Map<String, Object> trends = new HashMap<>();
        trends.put("clientGrowth", 0.0);
        trends.put("consultantGrowth", 0.0);
        trends.put("sessionGrowth", 0.0);
        trends.put("revenueGrowth", 0.0);
        return trends;
    }
    
    private Map<String, Object> getDefaultChartData() {
        Map<String, Object> chartData = new HashMap<>();
        chartData.put("labels", Arrays.asList("1월", "2월", "3월", "4월", "5월", "6월"));
        chartData.put("datasets", new ArrayList<>());
        return chartData;
    }
    
    private Map<String, Object> getDefaultRecentActivity() {
        Map<String, Object> activity = new HashMap<>();
        activity.put("activities", new ArrayList<>());
        return activity;
    }
    
    
     /**
     * 스케줄의 세션비 조회 (메타데이터 기반)
     /**
     * 우선순위: 1. 매핑에서 회기당 단가 조회 → 2. CommonCode에서 기본값 조회 → 3. Fallback
     */
    private BigDecimal getSessionFee(Schedule schedule) {
        if (schedule.getConsultantId() != null && schedule.getClientId() != null) {
            // 표준화 2025-12-05: tenantId 필터링 필수
            String tenantId = TenantContextHolder.getTenantId();
            if (tenantId == null) {
                log.warn("⚠️ tenantId가 설정되지 않아 매핑 조회를 건너뜁니다");
                return null;
            }
            
            Optional<ConsultantClientMapping> mappingOpt = mappingRepository
                .findByTenantIdAndConsultantAndClient(
                    tenantId,
                    userRepository.findByTenantIdAndId(tenantId, schedule.getConsultantId()).orElse(null),
                    userRepository.findByTenantIdAndId(tenantId, schedule.getClientId()).orElse(null)
                )
                .stream()
                // ⚠️ 표준화 2025-12-05: 하드코딩된 상태값을 공통코드에서 동적 조회하세요. CommonCodeService 사용
                .filter(m -> m.getStatus() == ConsultantClientMapping.MappingStatus.ACTIVE)
                .findFirst();
            
            if (mappingOpt.isPresent()) {
                ConsultantClientMapping mapping = mappingOpt.get();
                if (mapping.getPackagePrice() != null && 
                    mapping.getTotalSessions() != null && 
                    mapping.getTotalSessions() > 0) {
                    
                    BigDecimal sessionFee = BigDecimal.valueOf(mapping.getPackagePrice())
                        .divide(BigDecimal.valueOf(mapping.getTotalSessions()), 2, RoundingMode.HALF_UP);
                    log.debug("✅ 매핑에서 세션비 조회: scheduleId={}, sessionFee={}", 
                        schedule.getId(), sessionFee);
                    return sessionFee;
                }
            }
        }
        
        return getDefaultSessionFeeFromCommonCode();
    }
    
     /**
     * CommonCode에서 기본 세션비 조회
     */
    private BigDecimal getDefaultSessionFeeFromCommonCode() {
        try {
            CommonCode code = commonCodeService.getCommonCodeByGroupAndValue("SYSTEM_CONFIG", "DEFAULT_SESSION_FEE");
            if (code != null && code.getExtraData() != null) {
                try {
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    com.fasterxml.jackson.databind.JsonNode jsonNode = mapper.readTree(code.getExtraData());
                    if (jsonNode.has("value")) {
                        BigDecimal defaultFee = jsonNode.get("value").decimalValue();
                        log.debug("✅ CommonCode에서 기본 세션비 조회: {}", defaultFee);
                        return defaultFee;
                    }
                } catch (Exception e) {
                    log.warn("⚠️ CommonCode extra_data 파싱 실패: {}", code.getExtraData(), e);
                }
            }
        } catch (Exception e) {
            log.warn("⚠️ CommonCode 기본 세션비 조회 실패, Fallback 사용", e);
        }
        
        log.warn("⚠️ 기본 세션비를 찾을 수 없어 Fallback 값(50000) 사용. CommonCode에 SYSTEM_CONFIG.DEFAULT_SESSION_FEE를 추가하세요.");
        return BigDecimal.valueOf(50000);
    }
}
