package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.util.Optional;
import com.mindgarden.consultation.entity.ConsultantPerformance;
import com.mindgarden.consultation.entity.ConsultantPerformanceId;
import com.mindgarden.consultation.entity.DailyStatistics;
import com.mindgarden.consultation.entity.Schedule;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.ConsultantPerformanceRepository;
import com.mindgarden.consultation.repository.DailyStatisticsRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.RealTimeStatisticsService;
import com.mindgarden.consultation.service.StatisticsConfigService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 실시간 통계 업데이트 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RealTimeStatisticsServiceImpl implements RealTimeStatisticsService {
    
    private final DailyStatisticsRepository dailyStatisticsRepository;
    private final ConsultantPerformanceRepository consultantPerformanceRepository;
    private final UserRepository userRepository;
    private final StatisticsConfigService statisticsConfigService;
    
    @Override
    public void updateStatisticsOnScheduleCompletion(Schedule schedule) {
        log.info("📊 스케줄 완료시 실시간 통계 업데이트 시작: scheduleId={}, consultantId={}", 
                 schedule.getId(), schedule.getConsultantId());
        
        try {
            // 1. 상담사 정보 조회
            Optional<User> consultantOpt = userRepository.findById(schedule.getConsultantId());
            if (consultantOpt.isEmpty()) {
                log.warn("상담사 정보를 찾을 수 없습니다: consultantId={}", schedule.getConsultantId());
                return;
            }
            
            User consultant = consultantOpt.get();
            String branchCode = consultant.getBranchCode();
            LocalDate scheduleDate = schedule.getDate();
            
            // 2. 일별 통계 업데이트
            updateDailyStatistics(branchCode, scheduleDate);
            
            // 3. 상담사별 성과 업데이트
            updateConsultantPerformance(schedule.getConsultantId(), scheduleDate);
            
            log.info("✅ 스케줄 완료시 실시간 통계 업데이트 완료: scheduleId={}", schedule.getId());
            
        } catch (Exception e) {
            log.error("❌ 스케줄 완료시 실시간 통계 업데이트 실패: scheduleId={}, 오류={}", 
                     schedule.getId(), e.getMessage(), e);
        }
    }
    
    @Override
    public void updateConsultantPerformance(Long consultantId, LocalDate date) {
        log.debug("📈 상담사별 성과 실시간 업데이트: consultantId={}, date={}", consultantId, date);
        
        try {
            // 기존 성과 데이터 조회 (복합키 사용)
            ConsultantPerformanceId performanceId = new ConsultantPerformanceId();
            performanceId.setConsultantId(consultantId);
            performanceId.setPerformanceDate(date);
            
            Optional<ConsultantPerformance> existingPerformance = 
                consultantPerformanceRepository.findById(performanceId);
            
            if (existingPerformance.isPresent()) {
                // 기존 데이터 업데이트
                ConsultantPerformance performance = existingPerformance.get();
                recalculatePerformanceMetrics(performance, consultantId, date);
                consultantPerformanceRepository.save(performance);
                log.debug("✅ 기존 상담사 성과 업데이트 완료: consultantId={}", consultantId);
            } else {
                // 새로운 성과 데이터 생성
                ConsultantPerformance newPerformance = createNewPerformance(consultantId, date);
                consultantPerformanceRepository.save(newPerformance);
                log.debug("✅ 새로운 상담사 성과 생성 완료: consultantId={}", consultantId);
            }
            
        } catch (Exception e) {
            log.error("❌ 상담사별 성과 업데이트 실패: consultantId={}, date={}, 오류={}", 
                     consultantId, date, e.getMessage(), e);
        }
    }
    
    @Override
    public void updateDailyStatistics(String branchCode, LocalDate date) {
        log.debug("📊 지점별 일별 통계 실시간 업데이트: branchCode={}, date={}", branchCode, date);
        
        try {
            // 기존 일별 통계 조회
            Optional<DailyStatistics> existingStats = 
                dailyStatisticsRepository.findByStatDateAndBranchCode(date, branchCode);
            
            if (existingStats.isPresent()) {
                // 기존 데이터 업데이트
                DailyStatistics stats = existingStats.get();
                recalculateDailyMetrics(stats, branchCode, date);
                dailyStatisticsRepository.save(stats);
                log.debug("✅ 기존 일별 통계 업데이트 완료: branchCode={}", branchCode);
            } else {
                // 새로운 일별 통계 생성
                DailyStatistics newStats = createNewDailyStatistics(branchCode, date);
                dailyStatisticsRepository.save(newStats);
                log.debug("✅ 새로운 일별 통계 생성 완료: branchCode={}", branchCode);
            }
            
        } catch (Exception e) {
            log.error("❌ 일별 통계 업데이트 실패: branchCode={}, date={}, 오류={}", 
                     branchCode, date, e.getMessage(), e);
        }
    }
    
    @Override
    public void updateStatisticsOnMappingChange(Long consultantId, Long clientId, String branchCode) {
        log.info("🔗 매핑 변경시 통계 업데이트: consultantId={}, clientId={}, branchCode={}", 
                 consultantId, clientId, branchCode);
        
        try {
            LocalDate today = LocalDate.now();
            
            // 오늘 날짜 기준으로 통계 업데이트
            updateDailyStatistics(branchCode, today);
            updateConsultantPerformance(consultantId, today);
            
            log.info("✅ 매핑 변경시 통계 업데이트 완료");
            
        } catch (Exception e) {
            log.error("❌ 매핑 변경시 통계 업데이트 실패: 오류={}", e.getMessage(), e);
        }
    }
    
    @Override
    public void updateFinancialStatisticsOnPayment(String branchCode, Long amount, LocalDate date) {
        log.info("💰 결제 완료시 재무 통계 업데이트: branchCode={}, amount={}, date={}", 
                 branchCode, amount, date);
        
        try {
            updateDailyStatistics(branchCode, date);
            log.info("✅ 결제 완료시 재무 통계 업데이트 완료");
            
        } catch (Exception e) {
            log.error("❌ 결제 완료시 재무 통계 업데이트 실패: 오류={}", e.getMessage(), e);
        }
    }
    
    @Override
    public void updateStatisticsOnRefund(Long consultantId, String branchCode, Long refundAmount, LocalDate date) {
        log.info("💸 환불 발생시 통계 업데이트: consultantId={}, branchCode={}, refundAmount={}, date={}", 
                 consultantId, branchCode, refundAmount, date);
        
        try {
            updateDailyStatistics(branchCode, date);
            updateConsultantPerformance(consultantId, date);
            log.info("✅ 환불 발생시 통계 업데이트 완료");
            
        } catch (Exception e) {
            log.error("❌ 환불 발생시 통계 업데이트 실패: 오류={}", e.getMessage(), e);
        }
    }
    
    // ==================== Private 헬퍼 메서드 ====================
    
    /**
     * 성과 지표 재계산
     */
    private void recalculatePerformanceMetrics(ConsultantPerformance performance, Long consultantId, LocalDate date) {
        // TODO: 실제 스케줄, 평점, 매핑 데이터를 기반으로 성과 지표 재계산
        // 현재는 기본 로직만 구현
        
        // 완료율 계산 예시
        if (performance.getTotalSchedules() != null && performance.getTotalSchedules() > 0) {
            double completionRate = (double) performance.getCompletedSchedules() / performance.getTotalSchedules() * 100;
            performance.setCompletionRate(java.math.BigDecimal.valueOf(completionRate));
        }
        
        // 성과 점수 계산 (공통코드 기반)
        try {
            // 임시로 기본 계산 방식 사용 (추후 StatisticsConfigService 연동)
            if (performance.getCompletionRate() != null) {
                performance.setPerformanceScore(performance.getCompletionRate());
            }
            
            // 등급 계산
            if (performance.getPerformanceScore() != null) {
                double score = performance.getPerformanceScore().doubleValue();
                if (score >= 90) performance.setGrade("S급");
                else if (score >= 80) performance.setGrade("A급");
                else if (score >= 70) performance.setGrade("B급");
                else if (score >= 60) performance.setGrade("C급");
                else performance.setGrade("D급");
            }
        } catch (Exception e) {
            log.warn("성과 점수 계산 실패, 기본값 사용: consultantId={}", consultantId);
        }
    }
    
    /**
     * 일별 지표 재계산
     */
    private void recalculateDailyMetrics(DailyStatistics stats, String branchCode, LocalDate date) {
        // TODO: 실제 스케줄, 매핑, 거래 데이터를 기반으로 일별 지표 재계산
        // 현재는 기본 로직만 구현
        
        // 예시: 총 상담 수 증가
        if (stats.getTotalConsultations() == null) {
            stats.setTotalConsultations(0);
        }
        stats.setTotalConsultations(stats.getTotalConsultations() + 1);
        
        // 완료된 상담 수 증가
        if (stats.getCompletedConsultations() == null) {
            stats.setCompletedConsultations(0);
        }
        stats.setCompletedConsultations(stats.getCompletedConsultations() + 1);
        
        // 수익 계산 (기본 세션비 50,000원)
        if (stats.getTotalRevenue() == null) {
            stats.setTotalRevenue(java.math.BigDecimal.ZERO);
        }
        stats.setTotalRevenue(stats.getTotalRevenue().add(java.math.BigDecimal.valueOf(50000)));
    }
    
    /**
     * 새로운 성과 데이터 생성
     */
    private ConsultantPerformance createNewPerformance(Long consultantId, LocalDate date) {
        ConsultantPerformance performance = new ConsultantPerformance();
        performance.setConsultantId(consultantId);
        performance.setPerformanceDate(date);
        performance.setTotalSchedules(1);
        performance.setCompletedSchedules(1);
        performance.setCancelledSchedules(0);
        performance.setNoShowSchedules(0);
        performance.setCompletionRate(java.math.BigDecimal.valueOf(100.0));
        performance.setTotalRevenue(java.math.BigDecimal.valueOf(50000));
        performance.setUniqueClients(1);
        performance.setRepeatClients(0);
        performance.setClientRetentionRate(java.math.BigDecimal.ZERO);
        performance.setRefundRate(java.math.BigDecimal.ZERO);
        
        // 성과 점수 및 등급 계산
        try {
            // 임시로 기본 계산 방식 사용 (추후 StatisticsConfigService 연동)
            performance.setPerformanceScore(java.math.BigDecimal.valueOf(80.0));
            performance.setGrade("B급");
        } catch (Exception e) {
            log.warn("새로운 성과 데이터 점수 계산 실패, 기본값 사용: consultantId={}", consultantId);
            performance.setPerformanceScore(java.math.BigDecimal.valueOf(80.0));
            performance.setGrade("B급");
        }
        
        return performance;
    }
    
    /**
     * 새로운 일별 통계 생성
     */
    private DailyStatistics createNewDailyStatistics(String branchCode, LocalDate date) {
        DailyStatistics stats = new DailyStatistics();
        stats.setStatDate(date);
        stats.setBranchCode(branchCode);
        stats.setTotalConsultations(1);
        stats.setCompletedConsultations(1);
        stats.setCancelledConsultations(0);
        stats.setTotalRevenue(java.math.BigDecimal.valueOf(50000));
        stats.setConsultantCount(1);
        stats.setClientCount(1);
        stats.setTotalRefunds(0);
        stats.setRefundAmount(java.math.BigDecimal.ZERO);
        stats.setAvgRating(java.math.BigDecimal.valueOf(4.5));
        
        return stats;
    }
}
