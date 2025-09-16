package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.mindgarden.consultation.entity.Branch;
import com.mindgarden.consultation.entity.ConsultationRecord;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.BranchRepository;
import com.mindgarden.consultation.repository.ConsultationRecordRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.BranchStatisticsService;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 지점별 통계 및 성과 관리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-16
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BranchStatisticsServiceImpl implements BranchStatisticsService {
    
    private final BranchRepository branchRepository;
    private final ConsultationRecordRepository consultationRecordRepository;
    private final UserRepository userRepository;
    
    @Override
    public Map<String, Object> getConsultationStatistics(Long branchId, LocalDate startDate, LocalDate endDate) {
        log.info("지점별 상담 건수 통계 조회: 지점 ID={}, 기간={} ~ {}", branchId, startDate, endDate);
        
        Branch branch = branchRepository.findById(branchId)
            .orElseThrow(() -> new IllegalArgumentException("지점을 찾을 수 없습니다: " + branchId));
        
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
        
        // 지점의 상담사들 조회 (기존 구현 방식 사용)
        List<User> consultants = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUsername(
                branch, "CONSULTANT");
        
        // 상담 기록 통계 (기존 구현 방식 사용)
        List<ConsultationRecord> records = consultationRecordRepository
            .findAll(); // TODO: 기간별 필터링 구현
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("branchId", branchId);
        statistics.put("branchName", branch.getBranchName());
        statistics.put("period", startDate + " ~ " + endDate);
        statistics.put("totalConsultations", records.size());
        statistics.put("totalConsultants", consultants.size());
        statistics.put("averageConsultationsPerConsultant", 
            consultants.isEmpty() ? 0 : (double) records.size() / consultants.size());
        
        // 일별 상담 건수
        Map<String, Long> dailyStats = records.stream()
            .collect(Collectors.groupingBy(
                record -> record.getCreatedAt().toLocalDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                Collectors.counting()
            ));
        statistics.put("dailyStatistics", dailyStats);
        
        // 상담사별 상담 건수 (지점코드 기반 필터링)
        Map<String, Long> consultantStats = records.stream()
            .filter(record -> {
                // TODO: 상담사 지점코드와 사용자 지점코드 비교
                return true; // 임시로 true 반환
            })
            .collect(Collectors.groupingBy(
                record -> "상담사_" + record.getConsultantId(), // 임시로 상담사 ID 사용
                Collectors.counting()
            ));
        statistics.put("consultantStatistics", consultantStats);
        
        log.info("지점별 상담 건수 통계 완료: 총 상담 건수={}", records.size());
        
        return statistics;
    }
    
    @Override
    public Map<String, Object> getRevenueStatistics(Long branchId, LocalDate startDate, LocalDate endDate) {
        log.info("지점별 매출 통계 조회: 지점 ID={}, 기간={} ~ {}", branchId, startDate, endDate);
        
        Branch branch = branchRepository.findById(branchId)
            .orElseThrow(() -> new IllegalArgumentException("지점을 찾을 수 없습니다: " + branchId));
        
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
        
        // 지점의 상담사들 조회 (기존 구현 방식 사용)
        List<User> consultants = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUsername(
                branch, "CONSULTANT");
        
        // 상담 기록에서 결제 정보 조회 (기존 구현 방식 사용)
        List<ConsultationRecord> records = consultationRecordRepository
            .findAll(); // TODO: 기간별 필터링 구현
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("branchId", branchId);
        statistics.put("branchName", branch.getBranchName());
        statistics.put("period", startDate + " ~ " + endDate);
        
        // TODO: 실제 결제 데이터와 연동하여 매출 계산
        // 현재는 상담 건수 기반으로 추정 매출 계산
        double estimatedRevenue = records.size() * 50000; // 상담 1건당 5만원 추정
        
        statistics.put("totalRevenue", estimatedRevenue);
        statistics.put("averageRevenuePerConsultation", records.isEmpty() ? 0 : estimatedRevenue / records.size());
        statistics.put("totalConsultations", records.size());
        
        // 일별 매출 (추정)
        Map<String, Double> dailyRevenue = records.stream()
            .collect(Collectors.groupingBy(
                record -> record.getCreatedAt().toLocalDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                Collectors.collectingAndThen(
                    Collectors.counting(),
                    count -> count * 50000.0
                )
            ));
        statistics.put("dailyRevenue", dailyRevenue);
        
        log.info("지점별 매출 통계 완료: 추정 매출={}", estimatedRevenue);
        
        return statistics;
    }
    
    @Override
    public Map<String, Object> getConsultantPerformanceStatistics(Long branchId, LocalDate startDate, LocalDate endDate) {
        log.info("지점별 상담사 성과 통계 조회: 지점 ID={}, 기간={} ~ {}", branchId, startDate, endDate);
        
        Branch branch = branchRepository.findById(branchId)
            .orElseThrow(() -> new IllegalArgumentException("지점을 찾을 수 없습니다: " + branchId));
        
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
        
        // 지점의 상담사들 조회 (기존 구현 방식 사용)
        List<User> consultants = userRepository.findByBranchAndRoleAndIsDeletedFalseOrderByUsername(
                branch, "CONSULTANT");
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("branchId", branchId);
        statistics.put("branchName", branch.getBranchName());
        statistics.put("period", startDate + " ~ " + endDate);
        statistics.put("totalConsultants", consultants.size());
        
        // 상담사별 성과 데이터
        List<Map<String, Object>> consultantPerformance = new ArrayList<>();
        
        for (User consultant : consultants) {
            // TODO: 상담사별 상담 기록 조회 구현
            Page<ConsultationRecord> consultantRecordsPage = consultationRecordRepository
                .findByConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(consultant.getId(), null);
            List<ConsultationRecord> consultantRecords = consultantRecordsPage.getContent();
            
            Map<String, Object> performance = new HashMap<>();
            performance.put("consultantId", consultant.getId());
            performance.put("consultantName", consultant.getUsername());
            performance.put("totalConsultations", consultantRecords.size());
            performance.put("averageConsultationsPerDay", 
                consultantRecords.size() / Math.max(1, startDate.until(endDate).getDays()));
            
            // TODO: 실제 만족도 데이터와 연동
            performance.put("averageSatisfaction", 4.2); // 임시 데이터
            
            consultantPerformance.add(performance);
        }
        
        statistics.put("consultantPerformance", consultantPerformance);
        
        log.info("지점별 상담사 성과 통계 완료: 상담사 수={}", consultants.size());
        
        return statistics;
    }
    
    @Override
    public Map<String, Object> getCustomerSatisfactionStatistics(Long branchId, LocalDate startDate, LocalDate endDate) {
        log.info("지점별 고객 만족도 통계 조회: 지점 ID={}, 기간={} ~ {}", branchId, startDate, endDate);
        
        Branch branch = branchRepository.findById(branchId)
            .orElseThrow(() -> new IllegalArgumentException("지점을 찾을 수 없습니다: " + branchId));
        
        // TODO: 실제 만족도 데이터와 연동
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("branchId", branchId);
        statistics.put("branchName", branch.getBranchName());
        statistics.put("period", startDate + " ~ " + endDate);
        statistics.put("averageSatisfaction", 4.2);
        statistics.put("totalResponses", 150);
        statistics.put("satisfactionDistribution", Map.of(
            "5점", 45,
            "4점", 60,
            "3점", 30,
            "2점", 10,
            "1점", 5
        ));
        
        log.info("지점별 고객 만족도 통계 완료: 평균 만족도=4.2");
        
        return statistics;
    }
    
    @Override
    public Map<String, Object> getBranchDashboardData(Long branchId, String period) {
        log.info("지점별 대시보드 데이터 조회: 지점 ID={}, 기간={}", branchId, period);
        
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = calculateStartDate(endDate, period);
        
        Map<String, Object> dashboard = new HashMap<>();
        
        // 상담 통계
        Map<String, Object> consultationStats = getConsultationStatistics(branchId, startDate, endDate);
        dashboard.put("consultationStatistics", consultationStats);
        
        // 매출 통계
        Map<String, Object> revenueStats = getRevenueStatistics(branchId, startDate, endDate);
        dashboard.put("revenueStatistics", revenueStats);
        
        // 상담사 성과
        Map<String, Object> consultantStats = getConsultantPerformanceStatistics(branchId, startDate, endDate);
        dashboard.put("consultantPerformance", consultantStats);
        
        // 고객 만족도
        Map<String, Object> satisfactionStats = getCustomerSatisfactionStatistics(branchId, startDate, endDate);
        dashboard.put("customerSatisfaction", satisfactionStats);
        
        log.info("지점별 대시보드 데이터 완료: 지점 ID={}", branchId);
        
        return dashboard;
    }
    
    @Override
    public Map<String, Object> getAllBranchesComparisonData(LocalDate startDate, LocalDate endDate) {
        log.info("모든 지점 성과 비교 데이터 조회: 기간={} ~ {}", startDate, endDate);
        
        List<Branch> allBranches = branchRepository.findByIsDeletedFalseOrderByBranchName();
        
        Map<String, Object> comparison = new HashMap<>();
        comparison.put("period", startDate + " ~ " + endDate);
        comparison.put("totalBranches", allBranches.size());
        
        List<Map<String, Object>> branchComparison = new ArrayList<>();
        
        for (Branch branch : allBranches) {
            Map<String, Object> branchData = new HashMap<>();
            branchData.put("branchId", branch.getId());
            branchData.put("branchName", branch.getBranchName());
            branchData.put("branchType", branch.getBranchType());
            branchData.put("branchStatus", branch.getBranchStatus());
            
            // 상담 통계
            Map<String, Object> consultationStats = getConsultationStatistics(branch.getId(), startDate, endDate);
            branchData.put("totalConsultations", consultationStats.get("totalConsultations"));
            
            // 매출 통계
            Map<String, Object> revenueStats = getRevenueStatistics(branch.getId(), startDate, endDate);
            branchData.put("totalRevenue", revenueStats.get("totalRevenue"));
            
            branchComparison.add(branchData);
        }
        
        comparison.put("branchComparison", branchComparison);
        
        log.info("모든 지점 성과 비교 데이터 완료: 지점 수={}", allBranches.size());
        
        return comparison;
    }
    
    @Override
    public Map<String, Object> getMonthlyTrendData(Long branchId, int year) {
        log.info("지점별 월별 성과 트렌드 조회: 지점 ID={}, 연도={}", branchId, year);
        
        Map<String, Object> trend = new HashMap<>();
        trend.put("branchId", branchId);
        trend.put("year", year);
        
        Map<String, Object> monthlyData = new HashMap<>();
        
        for (int month = 1; month <= 12; month++) {
            LocalDate startDate = LocalDate.of(year, month, 1);
            LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
            
            Map<String, Object> monthStats = getConsultationStatistics(branchId, startDate, endDate);
            monthlyData.put(String.format("%02d", month), monthStats.get("totalConsultations"));
        }
        
        trend.put("monthlyTrend", monthlyData);
        
        log.info("지점별 월별 성과 트렌드 완료: 지점 ID={}", branchId);
        
        return trend;
    }
    
    @Override
    public Map<String, Object> getConsultantDetailPerformance(Long branchId, Long consultantId, LocalDate startDate, LocalDate endDate) {
        log.info("상담사 상세 성과 조회: 지점 ID={}, 상담사 ID={}, 기간={} ~ {}", branchId, consultantId, startDate, endDate);
        
        User consultant = userRepository.findById(consultantId)
            .orElseThrow(() -> new IllegalArgumentException("상담사를 찾을 수 없습니다: " + consultantId));
        
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
        
        // TODO: 상담사별 상담 기록 조회 구현
        Page<ConsultationRecord> recordsPage = consultationRecordRepository
            .findByConsultantIdAndIsDeletedFalseOrderBySessionDateDesc(consultantId, null);
        List<ConsultationRecord> records = recordsPage.getContent();
        
        Map<String, Object> performance = new HashMap<>();
        performance.put("consultantId", consultantId);
        performance.put("consultantName", consultant.getUsername());
        performance.put("branchId", branchId);
        performance.put("period", startDate + " ~ " + endDate);
        performance.put("totalConsultations", records.size());
        performance.put("averageConsultationsPerDay", 
            records.size() / Math.max(1, startDate.until(endDate).getDays()));
        
        // 일별 상담 건수
        Map<String, Long> dailyStats = records.stream()
            .collect(Collectors.groupingBy(
                record -> record.getCreatedAt().toLocalDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                Collectors.counting()
            ));
        performance.put("dailyStatistics", dailyStats);
        
        log.info("상담사 상세 성과 완료: 상담사={}, 총 상담 건수={}", consultant.getUsername(), records.size());
        
        return performance;
    }
    
    /**
     * 기간에 따른 시작일 계산
     */
    private LocalDate calculateStartDate(LocalDate endDate, String period) {
        return switch (period.toUpperCase()) {
            case "DAY" -> endDate;
            case "WEEK" -> endDate.minusWeeks(1);
            case "MONTH" -> endDate.minusMonths(1);
            case "YEAR" -> endDate.minusYears(1);
            default -> endDate.minusDays(7); // 기본값: 7일
        };
    }
}
