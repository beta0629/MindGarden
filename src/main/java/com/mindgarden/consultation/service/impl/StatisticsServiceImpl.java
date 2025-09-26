package com.mindgarden.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import com.mindgarden.consultation.constant.ScheduleStatus;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.ConsultantPerformance;
import com.mindgarden.consultation.entity.DailyStatistics;
import com.mindgarden.consultation.entity.PerformanceAlert;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.ConsultantPerformanceRepository;
import com.mindgarden.consultation.repository.ConsultantRatingRepository;
import com.mindgarden.consultation.repository.DailyStatisticsRepository;
import com.mindgarden.consultation.repository.FinancialTransactionRepository;
import com.mindgarden.consultation.repository.PerformanceAlertRepository;
import com.mindgarden.consultation.repository.ScheduleRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.StatisticsService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 통계 서비스 구현체
 * PL/SQL 도입을 위한 통계 처리 서비스 구현
 * 
 * @author MindGarden
 * @version 1.0.0
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

    // ==================== 일별 통계 관리 ====================

    @Override
    public DailyStatistics updateDailyStatistics(LocalDate date, String branchCode) {
        log.info("📊 일별 통계 업데이트 시작: date={}, branchCode={}", date, branchCode);

        try {
            // 기존 통계 조회 또는 새로 생성
            DailyStatistics statistics = dailyStatisticsRepository
                .findByStatDateAndBranchCode(date, branchCode)
                .orElse(DailyStatistics.builder()
                    .statDate(date)
                    .branchCode(branchCode)
                    .build());

            // 해당 날짜의 스케줄 조회
            List<Schedule> daySchedules = scheduleRepository.findByDateAndBranchCode(date, branchCode);
            log.debug("🔍 조회된 스케줄 수: {}", daySchedules.size());

            // 스케줄 통계 계산
            statistics.setTotalConsultations(daySchedules.size());
            
            long completedCount = daySchedules.stream()
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .count();
            statistics.setCompletedConsultations((int) completedCount);

            long cancelledCount = daySchedules.stream()
                .filter(s -> ScheduleStatus.CANCELLED.equals(s.getStatus()))
                .count();
            statistics.setCancelledConsultations((int) cancelledCount);

            // 수익 계산 (완료된 스케줄의 기본 세션 비용 합계)
            BigDecimal totalRevenue = daySchedules.stream()
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .map(s -> BigDecimal.valueOf(50000)) // 기본 세션비 50,000원으로 설정
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            statistics.setTotalRevenue(totalRevenue);

            // 평균 평점 계산 (해당 날짜에 평가받은 상담사들의 평균)
            BigDecimal avgRating = BigDecimal.ZERO;
            if (!daySchedules.isEmpty()) {
                // 해당 날짜의 상담사들의 평점 계산
                List<Long> consultantIds = daySchedules.stream()
                    .map(Schedule::getConsultantId)
                    .distinct()
                    .collect(Collectors.toList());
                
                if (!consultantIds.isEmpty()) {
                    // 해당 날짜의 상담사들의 평균 평점 계산
                    Double totalAvgRating = consultantIds.stream()
                        .mapToDouble(consultantId -> {
                            Double rating = consultantRatingRepository.getAverageHeartScoreByConsultant(
                                consultantId, 
                                com.mindgarden.consultation.entity.ConsultantRating.RatingStatus.ACTIVE
                            );
                            return rating != null ? rating : 0.0;
                        })
                        .average()
                        .orElse(0.0);
                    
                    avgRating = BigDecimal.valueOf(totalAvgRating);
                }
            }
            statistics.setAvgRating(avgRating);

            // 상담사 수 계산
            long consultantCount = daySchedules.stream()
                .map(Schedule::getConsultantId)
                .distinct()
                .count();
            statistics.setConsultantCount((int) consultantCount);

            // 내담자 수 계산
            long clientCount = daySchedules.stream()
                .map(Schedule::getClientId)
                .distinct()
                .count();
            statistics.setClientCount((int) clientCount);

            // 업데이트 시간 설정
            if (statistics.getId() != null) {
                statistics.setUpdatedAt(LocalDateTime.now());
            }

            DailyStatistics savedStatistics = dailyStatisticsRepository.save(statistics);
            log.info("✅ 일별 통계 업데이트 완료: date={}, branchCode={}, consultations={}", 
                date, branchCode, savedStatistics.getTotalConsultations());

            return savedStatistics;

        } catch (Exception e) {
            log.error("❌ 일별 통계 업데이트 실패: date={}, branchCode={}", date, branchCode, e);
            throw new RuntimeException("일별 통계 업데이트 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public DailyStatistics getDailyStatistics(LocalDate date, String branchCode) {
        return dailyStatisticsRepository.findByStatDateAndBranchCode(date, branchCode)
            .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DailyStatistics> getDailyStatistics(LocalDate startDate, LocalDate endDate, String branchCode) {
        if (branchCode != null) {
            return dailyStatisticsRepository.findByBranchCodeAndStatDateBetweenOrderByStatDateDesc(
                branchCode, startDate, endDate);
        } else {
            return dailyStatisticsRepository.findByStatDateBetweenOrderByStatDateDesc(startDate, endDate);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlyAggregatedStatistics(String yearMonth, String branchCode) {
        log.info("📊 월별 집계 통계 조회: yearMonth={}, branchCode={}", yearMonth, branchCode);

        try {
            LocalDate startDate = LocalDate.parse(yearMonth + "-01", DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

            List<Object[]> results = dailyStatisticsRepository.getMonthlyAggregatedStatistics(
                startDate, endDate, branchCode);

            Map<String, Object> aggregatedStats = new HashMap<>();
            
            if (!results.isEmpty()) {
                Object[] result = results.get(0);
                aggregatedStats.put("branchCode", result[0]);
                aggregatedStats.put("totalConsultations", result[1]);
                aggregatedStats.put("completedConsultations", result[2]);
                aggregatedStats.put("totalRevenue", result[3]);
                aggregatedStats.put("avgRating", result[4]);
            } else {
                // 기본값 설정
                aggregatedStats.put("branchCode", branchCode);
                aggregatedStats.put("totalConsultations", 0);
                aggregatedStats.put("completedConsultations", 0);
                aggregatedStats.put("totalRevenue", BigDecimal.ZERO);
                aggregatedStats.put("avgRating", BigDecimal.ZERO);
            }

            aggregatedStats.put("period", yearMonth);
            
            return aggregatedStats;

        } catch (Exception e) {
            log.error("❌ 월별 집계 통계 조회 실패: yearMonth={}, branchCode={}", yearMonth, branchCode, e);
            throw new RuntimeException("월별 집계 통계 조회 중 오류가 발생했습니다.", e);
        }
    }

    // ==================== 상담사 성과 관리 ====================

    @Override
    public ConsultantPerformance updateConsultantPerformance(Long consultantId, LocalDate date) {
        log.info("📊 상담사 성과 업데이트 시작: consultantId={}, date={}", consultantId, date);

        try {
            // 기존 성과 조회 또는 새로 생성
            ConsultantPerformance performance = consultantPerformanceRepository
                .findById(new com.mindgarden.consultation.entity.ConsultantPerformanceId(consultantId, date))
                .orElse(ConsultantPerformance.builder()
                    .consultantId(consultantId)
                    .performanceDate(date)
                    .build());

            // 해당 날짜의 상담사 스케줄 조회
            List<Schedule> consultantSchedules = scheduleRepository.findByConsultantIdAndDate(consultantId, date);
            
            // 기본 스케줄 통계 계산
            performance.setTotalSchedules(consultantSchedules.size());
            
            long completedCount = consultantSchedules.stream()
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .count();
            performance.setCompletedSchedules((int) completedCount);

            long cancelledCount = consultantSchedules.stream()
                .filter(s -> ScheduleStatus.CANCELLED.equals(s.getStatus()))
                .count();
            performance.setCancelledSchedules((int) cancelledCount);

            // NO_SHOW 상태 처리 (현재는 기본값, 향후 ScheduleStatus.NO_SHOW 추가 시 자동 적용)
            long noShowCount = consultantSchedules.stream()
                .filter(s -> s.getStatus() != null && s.getStatus().toString().equals("NO_SHOW"))
                .count();
            performance.setNoShowSchedules((int) noShowCount);

            // 수익 계산 (기본 세션비 기준)
            BigDecimal totalRevenue = consultantSchedules.stream()
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .map(s -> BigDecimal.valueOf(50000)) // 기본 세션비 50,000원으로 설정
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            performance.setTotalRevenue(totalRevenue);

            // 고객 관련 통계 (실제 데이터 기반 자동 계산)
            long uniqueClientCount = consultantSchedules.stream()
                .map(Schedule::getClientId)
                .distinct()
                .count();
            performance.setUniqueClients((int) uniqueClientCount);
            
            // 재방문 고객 계산 (해당 상담사를 2회 이상 이용한 고객)
            long repeatClientCount = consultantSchedules.stream()
                .collect(Collectors.groupingBy(Schedule::getClientId, Collectors.counting()))
                .entrySet()
                .stream()
                .filter(entry -> entry.getValue() > 1)
                .count();
            performance.setRepeatClients((int) repeatClientCount);

            // 평점 관련 통계 (ConsultantRating 기반 실제 평점 계산)
            Double avgRating = consultantRatingRepository.getAverageHeartScoreByConsultant(
                consultantId, 
                com.mindgarden.consultation.entity.ConsultantRating.RatingStatus.ACTIVE
            );
            Long totalRatings = consultantRatingRepository.getTotalRatingCountByConsultant(
                consultantId, 
                com.mindgarden.consultation.entity.ConsultantRating.RatingStatus.ACTIVE
            );
            
            performance.setAvgRating(avgRating != null ? BigDecimal.valueOf(avgRating) : BigDecimal.ZERO);
            performance.setTotalRatings(totalRatings != null ? totalRatings.intValue() : 0);

            // 성과 점수 자동 계산
            performance.calculatePerformanceScore();

            // 업데이트 시간 설정
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
        return consultantPerformanceRepository
            .findById(new com.mindgarden.consultation.entity.ConsultantPerformanceId(consultantId, date))
            .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConsultantPerformance> getTopPerformers(LocalDate startDate, LocalDate endDate, String branchCode, int limit) {
        if (branchCode != null) {
            return consultantPerformanceRepository.findTopPerformersByBranch(
                startDate, endDate, branchCode, org.springframework.data.domain.PageRequest.of(0, limit))
                .getContent();
        } else {
            return consultantPerformanceRepository.findTopPerformers(
                startDate, endDate, org.springframework.data.domain.PageRequest.of(0, limit))
                .getContent();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConsultantPerformance> getUnderperformingConsultants(LocalDate date, String branchCode) {
        // 완료율 70% 미만인 상담사 조회
        return consultantPerformanceRepository.findUnderperformingConsultants(date, 70.0, branchCode);
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

    // ==================== 알림 관리 ====================

    @Override
    public PerformanceAlert createPerformanceAlert(Long consultantId, PerformanceAlert.AlertLevel level, String message) {
        log.info("🚨 성과 알림 생성: consultantId={}, level={}", consultantId, level);

        try {
            // 중복 알림 방지 (최근 1시간 내 동일 레벨 알림 체크)
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            Long recentAlertCount = performanceAlertRepository.countRecentSimilarAlerts(
                consultantId, level, oneHourAgo);

            if (recentAlertCount > 0) {
                log.warn("⚠️ 중복 알림 방지: consultantId={}, level={}", consultantId, level);
                return null;
            }

            // 상담사 정보 조회
            Optional<User> consultantOpt = userRepository.findById(consultantId);
            String consultantName = consultantOpt.map(User::getName).orElse("알 수 없음");

            PerformanceAlert alert = PerformanceAlert.builder()
                .consultantId(consultantId)
                .consultantName(consultantName)
                .alertLevel(level)
                .alertMessage(message)
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
        performanceAlertRepository.findById(alertId).ifPresent(alert -> {
            alert.markAsRead();
            performanceAlertRepository.save(alert);
            log.info("📖 알림 읽음 처리: alertId={}", alertId);
        });
    }

    // ==================== 배치 처리 ====================

    @Override
    public void updateAllDailyStatistics(LocalDate date) {
        log.info("🔄 전체 일별 통계 배치 업데이트 시작: date={}", date);

        try {
            // 모든 활성 지점 조회
            List<String> branchCodes = userRepository.findAll().stream()
                .map(User::getBranchCode)
                .filter(code -> code != null && !code.isEmpty())
                .distinct()
                .collect(Collectors.toList());

            for (String branchCode : branchCodes) {
                try {
                    updateDailyStatistics(date, branchCode);
                } catch (Exception e) {
                    log.error("❌ 지점별 통계 업데이트 실패: branchCode={}", branchCode, e);
                }
            }

            log.info("✅ 전체 일별 통계 배치 업데이트 완료: date={}, 처리된 지점 수={}", date, branchCodes.size());

        } catch (Exception e) {
            log.error("❌ 전체 일별 통계 배치 업데이트 실패: date={}", date, e);
            throw new RuntimeException("전체 일별 통계 배치 업데이트 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    public void updateAllConsultantPerformance(LocalDate date) {
        log.info("🔄 전체 상담사 성과 배치 업데이트 시작: date={}", date);

        try {
            // 모든 활성 상담사 조회
            List<User> consultants = userRepository.findByRoleAndIsActiveTrue(UserRole.CONSULTANT);

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
            // 성과 저하 상담사 조회 (모든 지점)
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

    // ==================== 대시보드용 통계 ====================

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStatistics(String branchCode) {
        log.info("📊 대시보드 통계 조회: branchCode={}", branchCode);

        try {
            Map<String, Object> dashboard = new HashMap<>();
            LocalDate today = LocalDate.now();

            // 오늘의 통계
            DailyStatistics todayStats = getDailyStatistics(today, branchCode);
            dashboard.put("today", todayStats != null ? todayStats : new HashMap<>());

            // 최근 7일 통계
            LocalDate weekAgo = today.minusDays(7);
            List<DailyStatistics> weekStats = getDailyStatistics(weekAgo, today, branchCode);
            dashboard.put("week", weekStats);

            // 이번 달 통계
            String thisMonth = today.format(DateTimeFormatter.ofPattern("yyyy-MM"));
            Map<String, Object> monthlyStats = getMonthlyAggregatedStatistics(thisMonth, branchCode);
            dashboard.put("month", monthlyStats);

            // 상위 성과자 (최근 30일)
            LocalDate monthAgo = today.minusDays(30);
            List<ConsultantPerformance> topPerformers = getTopPerformers(monthAgo, today, branchCode, 5);
            dashboard.put("topPerformers", topPerformers);

            // 미처리 알림 수
            List<PerformanceAlert> pendingAlerts = getPendingAlerts();
            dashboard.put("pendingAlertsCount", pendingAlerts.size());

            return dashboard;

        } catch (Exception e) {
            log.error("❌ 대시보드 통계 조회 실패: branchCode={}", branchCode, e);
            throw new RuntimeException("대시보드 통계 조회 중 오류가 발생했습니다.", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getRealTimePerformanceIndicators(String branchCode) {
        log.info("📊 실시간 성과 지표 조회: branchCode={}", branchCode);
        
        try {
            Map<String, Object> indicators = new HashMap<>();
            LocalDateTime now = LocalDateTime.now();
            LocalDate today = now.toLocalDate();
            
            // 오늘의 실시간 지표
            DailyStatistics todayStats = getDailyStatistics(today, branchCode);
            
            // 실시간 상담 진행 상황
            List<Schedule> todaySchedules = scheduleRepository.findByDateAndBranchCode(today, branchCode);
            long inProgressCount = todaySchedules.stream()
                .filter(s -> ScheduleStatus.BOOKED.equals(s.getStatus()) || ScheduleStatus.CONFIRMED.equals(s.getStatus()))
                .count();
            
            // 실시간 완료율
            long completedCount = todaySchedules.stream()
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .count();
            double completionRate = todaySchedules.isEmpty() ? 0.0 : 
                (double) completedCount / todaySchedules.size() * 100;
            
            // 실시간 수익 (오늘 완료된 상담 기준)
            BigDecimal realTimeRevenue = todaySchedules.stream()
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .map(s -> BigDecimal.valueOf(50000)) // 기본 세션비
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // 활성 상담사 수
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
            
            // 기간별 일별 통계 조회
            List<DailyStatistics> dailyStats = getDailyStatistics(startDate, endDate, branchCode);
            
            // 트렌드 데이터 생성
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
            
            // 평균값 계산
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
            
            // 트렌드 방향 분석 (최근 7일 vs 이전 7일)
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
            
            // 기간별 일별 통계 조회
            List<DailyStatistics> dailyStats = getDailyStatistics(startDate, endDate, branchCode);
            
            // 월간 집계 계산
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
}
