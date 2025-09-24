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
            // TODO: 실제 평점 계산 로직 구현 필요
            statistics.setAvgRating(BigDecimal.valueOf(4.5)); // 임시값

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

            // TODO: NO_SHOW 상태 추가 시 구현
            performance.setNoShowSchedules(0);

            // 수익 계산 (기본 세션비 기준)
            BigDecimal totalRevenue = consultantSchedules.stream()
                .filter(s -> ScheduleStatus.COMPLETED.equals(s.getStatus()))
                .map(s -> BigDecimal.valueOf(50000)) // 기본 세션비 50,000원으로 설정
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            performance.setTotalRevenue(totalRevenue);

            // 고객 관련 통계 (임시로 기본값 설정)
            // TODO: 실제 고객 데이터 기반으로 계산 구현
            performance.setUniqueClients(consultantSchedules.size() > 0 ? 
                (int) consultantSchedules.stream().map(Schedule::getClientId).distinct().count() : 0);
            performance.setRepeatClients(0); // TODO: 실제 재방문 고객 계산

            // 평점 관련 통계 (임시로 기본값 설정)
            // TODO: ConsultantRating 기반으로 실제 평점 계산
            performance.setAvgRating(BigDecimal.valueOf(4.5));
            performance.setTotalRatings(0);

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
        // TODO: 실시간 성과 지표 구현
        Map<String, Object> indicators = new HashMap<>();
        indicators.put("status", "개발 예정");
        return indicators;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getTrendAnalysisData(LocalDate startDate, LocalDate endDate, String branchCode) {
        // TODO: 트렌드 분석 데이터 구현
        Map<String, Object> trends = new HashMap<>();
        trends.put("status", "개발 예정");
        return trends;
    }
}
