package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.ConsultantRating;
import com.coresolution.consultation.entity.FinancialTransaction;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.FinancialTransactionRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.StatisticsTestDataService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 통계 시스템 테스트용 데이터 생성 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class StatisticsTestDataServiceImpl implements StatisticsTestDataService {
    
    private final ScheduleRepository scheduleRepository;
    private final UserRepository userRepository;
    private final FinancialTransactionRepository financialTransactionRepository;
    private final ConsultantRatingRepository consultantRatingRepository;
    private final BranchService branchService;
    
    private final Random random = new Random();
    
    @Override
    public Map<String, Object> createTestSchedules(LocalDate targetDate, String branchCode, int scheduleCount) {
        // 브랜치 개념 제거: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음 (표준화 2025-12-05)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("📅 테스트 스케줄 데이터 생성 시작: date={}, tenantId={}, count={}", 
                 targetDate, tenantId, scheduleCount);
        
        Map<String, Object> result = new HashMap<>();
        List<Long> createdScheduleIds = new ArrayList<>();
        
        try {
            // 테넌트 전체 상담사들 조회
            List<User> consultants = userRepository.findByTenantIdAndRole(tenantId, UserRole.CONSULTANT);
            // isActive = true 필터링 (Java 스트림)
            consultants = consultants.stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .collect(java.util.stream.Collectors.toList());
            
            if (consultants.isEmpty()) {
                result.put("success", false);
                result.put("message", "테넌트에 활성 상담사가 없습니다: " + tenantId);
                return result;
            }
            
            // 테넌트 전체 내담자들 조회 (없으면 상담사를 내담자로 사용)
            List<User> clients = userRepository.findByTenantIdAndRole(tenantId, UserRole.CLIENT);
            // isActive = true 필터링 (Java 스트림)
            clients = clients.stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                .collect(java.util.stream.Collectors.toList());
            
            if (clients.isEmpty()) {
                // 테스트용으로 상담사를 내담자로 사용
                clients = consultants;
            }
            
            for (int i = 0; i < scheduleCount; i++) {
                User consultant = consultants.get(random.nextInt(consultants.size()));
                User client = clients.get(random.nextInt(clients.size()));
                
                // 스케줄 시간 생성 (9시~18시 사이)
                LocalTime startTime = LocalTime.of(9 + random.nextInt(8), random.nextInt(60));
                LocalTime endTime = startTime.plusHours(1);
                
                Schedule schedule = new Schedule();
                schedule.setConsultantId(consultant.getId());
                schedule.setClientId(client.getId());
                // branchCode는 레거시 호환을 위해 유지 (필드가 있으면 설정)
                if (branchCode != null && !branchCode.trim().isEmpty()) {
                    schedule.setBranchCode(branchCode);
                }
                schedule.setDate(targetDate);
                schedule.setStartTime(startTime);
                schedule.setEndTime(endTime);
                schedule.setTitle("테스트 상담 " + (i + 1));
                schedule.setDescription("통계 테스트용 상담 세션");
                schedule.setStatus(ScheduleStatus.CONFIRMED);
                schedule.setConsultationType("INDIVIDUAL");
                schedule.setConsultationMethod("FACE_TO_FACE");
                schedule.setDurationMinutes(60);
                schedule.setIsDeleted(false);
                schedule.setCreatedAt(LocalDateTime.now());
                schedule.setUpdatedAt(LocalDateTime.now());
                
                Schedule savedSchedule = scheduleRepository.save(schedule);
                createdScheduleIds.add(savedSchedule.getId());
            }
            
            result.put("success", true);
            result.put("message", "테스트 스케줄 생성 완료");
            result.put("createdCount", scheduleCount);
            result.put("scheduleIds", createdScheduleIds);
            result.put("targetDate", targetDate.toString());
            result.put("branchCode", branchCode);
            
            log.info("✅ 테스트 스케줄 데이터 생성 완료: {}개 생성", scheduleCount);
            
        } catch (Exception e) {
            log.error("❌ 테스트 스케줄 데이터 생성 실패: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "스케줄 생성 실패: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> createCompletedConsultations(LocalDate targetDate, String branchCode, int completedCount) {
        // 브랜치 개념 제거: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음 (표준화 2025-12-05)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("✅ 완료된 상담 데이터 생성 시작: date={}, tenantId={}, count={}", 
                 targetDate, tenantId, completedCount);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 해당 날짜의 CONFIRMED 스케줄들 조회 (테넌트 기반)
            List<Schedule> confirmedSchedules = scheduleRepository.findByTenantIdAndDate(tenantId, targetDate)
                .stream()
                .filter(s -> s.getStatus() == ScheduleStatus.CONFIRMED)
                .collect(java.util.stream.Collectors.toList());
            
            if (confirmedSchedules.isEmpty()) {
                result.put("success", false);
                result.put("message", "완료 처리할 CONFIRMED 스케줄이 없습니다");
                return result;
            }
            
            int actualCompleted = Math.min(completedCount, confirmedSchedules.size());
            List<Long> completedScheduleIds = new ArrayList<>();
            
            for (int i = 0; i < actualCompleted; i++) {
                Schedule schedule = confirmedSchedules.get(i);
                schedule.setStatus(ScheduleStatus.COMPLETED);
                schedule.setUpdatedAt(LocalDateTime.now());
                
                scheduleRepository.save(schedule);
                completedScheduleIds.add(schedule.getId());
            }
            
            result.put("success", true);
            result.put("message", "상담 완료 처리 완료");
            result.put("completedCount", actualCompleted);
            result.put("completedScheduleIds", completedScheduleIds);
            
            log.info("✅ 완료된 상담 데이터 생성 완료: {}개 완료 처리", actualCompleted);
            
        } catch (Exception e) {
            log.error("❌ 완료된 상담 데이터 생성 실패: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "상담 완료 처리 실패: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> createTestFinancialTransactions(LocalDate targetDate, String branchCode, int transactionCount) {
        log.info("💰 테스트 재무 거래 데이터 생성 시작: date={}, branch={}, count={}", 
                 targetDate, branchCode, transactionCount);
        
        Map<String, Object> result = new HashMap<>();
        List<Long> createdTransactionIds = new ArrayList<>();
        
        try {
            // 해당 날짜/지점의 완료된 스케줄들 조회
            List<Schedule> completedSchedules = scheduleRepository.findByDateAndBranchCode(targetDate, branchCode)
                .stream()
                .filter(s -> s.getStatus() == ScheduleStatus.COMPLETED)
                .collect(java.util.stream.Collectors.toList());
            
            if (completedSchedules.isEmpty()) {
                result.put("success", false);
                result.put("message", "재무 거래를 생성할 완료된 스케줄이 없습니다");
                return result;
            }
            
            int actualTransactions = Math.min(transactionCount, completedSchedules.size());
            
            for (int i = 0; i < actualTransactions; i++) {
                Schedule schedule = completedSchedules.get(i);
                
                // 상담료 거래 생성 (50,000 ~ 100,000원 사이)
                BigDecimal amount = BigDecimal.valueOf(50000 + random.nextInt(50001));
                
                FinancialTransaction transaction = new FinancialTransaction();
                // branchCode는 레거시 호환을 위해 유지 (필드가 있으면 설정)
                if (branchCode != null && !branchCode.trim().isEmpty()) {
                    transaction.setBranchCode(branchCode);
                }
                transaction.setAmount(amount);
                transaction.setTransactionType(FinancialTransaction.TransactionType.INCOME);
                transaction.setRelatedEntityType("CONSULTATION_INCOME");
                transaction.setRelatedEntityId(schedule.getId());
                transaction.setDescription("테스트 상담료 결제 - 스케줄 " + schedule.getId() + " (Client: " + schedule.getClientId() + ", Consultant: " + schedule.getConsultantId() + ")");
                transaction.setStatus(FinancialTransaction.TransactionStatus.COMPLETED);
                transaction.setIsDeleted(false);
                transaction.setTransactionDate(targetDate);
                transaction.setCategory("상담료");
                transaction.setSubcategory("개인상담");
                
                FinancialTransaction savedTransaction = financialTransactionRepository.save(transaction);
                createdTransactionIds.add(savedTransaction.getId());
            }
            
            result.put("success", true);
            result.put("message", "테스트 재무 거래 생성 완료");
            result.put("createdCount", actualTransactions);
            result.put("transactionIds", createdTransactionIds);
            
            log.info("✅ 테스트 재무 거래 데이터 생성 완료: {}개 생성", actualTransactions);
            
        } catch (Exception e) {
            log.error("❌ 테스트 재무 거래 데이터 생성 실패: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "재무 거래 생성 실패: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> createTestRatings(LocalDate targetDate, String branchCode, int ratingCount) {
        log.info("⭐ 테스트 평점 데이터 생성 시작: date={}, branch={}, count={}", 
                 targetDate, branchCode, ratingCount);
        
        Map<String, Object> result = new HashMap<>();
        List<Long> createdRatingIds = new ArrayList<>();
        
        try {
            // 해당 날짜/지점의 완료된 스케줄들 조회
            List<Schedule> completedSchedules = scheduleRepository.findByDateAndBranchCode(targetDate, branchCode)
                .stream()
                .filter(s -> s.getStatus() == ScheduleStatus.COMPLETED)
                .collect(java.util.stream.Collectors.toList());
            
            if (completedSchedules.isEmpty()) {
                result.put("success", false);
                result.put("message", "평점을 생성할 완료된 스케줄이 없습니다");
                return result;
            }
            
            int actualRatings = Math.min(ratingCount, completedSchedules.size());
            
            for (int i = 0; i < actualRatings; i++) {
                Schedule schedule = completedSchedules.get(i);
                
                // 이미 평점이 있는지 확인
                String tenantId = TenantContextHolder.getRequiredTenantId();
                boolean hasRating = consultantRatingRepository.findByTenantId(tenantId).stream()
                    .anyMatch(r -> r.getSchedule().getId().equals(schedule.getId()) && 
                                  r.getStatus() == ConsultantRating.RatingStatus.ACTIVE);
                
                if (hasRating) {
                    continue;
                }
                
                // 상담사와 내담자 조회
                User consultant = userRepository.findById(schedule.getConsultantId()).orElse(null);
                User client = userRepository.findById(schedule.getClientId()).orElse(null);
                
                if (consultant == null || client == null) {
                    continue;
                }
                
                // 평점 생성 (3~5점 사이, 평균 4점 정도)
                int heartScore = 3 + random.nextInt(3); // 3, 4, 5
                if (random.nextDouble() < 0.7) { // 70% 확률로 4~5점
                    heartScore = 4 + random.nextInt(2);
                }
                
                String comment = "테스트 평점 " + heartScore + "점 - 만족스러운 상담이었습니다.";
                
                ConsultantRating rating = new ConsultantRating();
                rating.setConsultant(consultant);
                rating.setClient(client);
                rating.setSchedule(schedule);
                rating.setHeartScore(heartScore);
                rating.setComment(comment);
                rating.setIsAnonymous(random.nextBoolean());
                rating.setStatus(ConsultantRating.RatingStatus.ACTIVE);
                rating.setRatedAt(LocalDateTime.now());
                
                ConsultantRating savedRating = consultantRatingRepository.save(rating);
                createdRatingIds.add(savedRating.getId());
            }
            
            result.put("success", true);
            result.put("message", "테스트 평점 생성 완료");
            result.put("createdCount", createdRatingIds.size());
            result.put("ratingIds", createdRatingIds);
            
            log.info("✅ 테스트 평점 데이터 생성 완료: {}개 생성", createdRatingIds.size());
            
        } catch (Exception e) {
            log.error("❌ 테스트 평점 데이터 생성 실패: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "평점 생성 실패: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> createCompleteTestDataSet(LocalDate targetDate, String branchCode) {
        log.info("🎯 종합 테스트 데이터 세트 생성 시작: date={}, branch={}", targetDate, branchCode);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 1. 스케줄 생성 (10개)
            Map<String, Object> scheduleResult = createTestSchedules(targetDate, branchCode, 10);
            
            // 2. 상담 완료 처리 (7개)
            Map<String, Object> completedResult = createCompletedConsultations(targetDate, branchCode, 7);
            
            // 3. 재무 거래 생성 (완료된 상담에 대해)
            Map<String, Object> transactionResult = createTestFinancialTransactions(targetDate, branchCode, 7);
            
            // 4. 평점 생성 (완료된 상담의 80%)
            Map<String, Object> ratingResult = createTestRatings(targetDate, branchCode, 5);
            
            result.put("success", true);
            result.put("message", "종합 테스트 데이터 세트 생성 완료");
            result.put("scheduleResult", scheduleResult);
            result.put("completedResult", completedResult);
            result.put("transactionResult", transactionResult);
            result.put("ratingResult", ratingResult);
            result.put("targetDate", targetDate.toString());
            result.put("branchCode", branchCode);
            
            log.info("✅ 종합 테스트 데이터 세트 생성 완료");
            
        } catch (Exception e) {
            log.error("❌ 종합 테스트 데이터 세트 생성 실패: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "종합 테스트 데이터 생성 실패: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> cleanupTestData(LocalDate targetDate, String branchCode) {
        log.info("🧹 테스트 데이터 정리 시작: date={}, branch={}", targetDate, branchCode);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            int deletedSchedules = 0;
            int deletedTransactions = 0;
            int deletedRatings = 0;
            
            // 해당 날짜의 테스트 스케줄들 조회 및 삭제
            List<Schedule> testSchedules;
            if (branchCode != null) {
                testSchedules = scheduleRepository.findByDateAndBranchCode(targetDate, branchCode);
            } else {
                testSchedules = scheduleRepository.findByDate(targetDate);
            }
            
            for (Schedule schedule : testSchedules) {
                if (schedule.getTitle() != null && schedule.getTitle().contains("테스트")) {
                    // 관련 평점 삭제
                    String tenantId = TenantContextHolder.getRequiredTenantId();
                    List<ConsultantRating> ratings = consultantRatingRepository.findByTenantId(tenantId).stream()
                        .filter(r -> r.getSchedule().getId().equals(schedule.getId()))
                        .collect(java.util.stream.Collectors.toList());
                    for (ConsultantRating rating : ratings) {
                        consultantRatingRepository.delete(rating);
                        deletedRatings++;
                    }
                    
                    // 관련 재무 거래 삭제
                    List<FinancialTransaction> transactions = financialTransactionRepository.findByTenantId(tenantId).stream()
                        .filter(t -> t.getRelatedEntityId() != null && t.getRelatedEntityId().equals(schedule.getId()))
                        .collect(java.util.stream.Collectors.toList());
                    for (FinancialTransaction transaction : transactions) {
                        if (transaction.getDescription() != null && transaction.getDescription().contains("테스트")) {
                            financialTransactionRepository.delete(transaction);
                            deletedTransactions++;
                        }
                    }
                    
                    // 스케줄 삭제
                    scheduleRepository.delete(schedule);
                    deletedSchedules++;
                }
            }
            
            result.put("success", true);
            result.put("message", "테스트 데이터 정리 완료");
            result.put("deletedSchedules", deletedSchedules);
            result.put("deletedTransactions", deletedTransactions);
            result.put("deletedRatings", deletedRatings);
            
            log.info("✅ 테스트 데이터 정리 완료: 스케줄{}개, 거래{}개, 평점{}개 삭제", 
                     deletedSchedules, deletedTransactions, deletedRatings);
            
        } catch (Exception e) {
            log.error("❌ 테스트 데이터 정리 실패: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "테스트 데이터 정리 실패: " + e.getMessage());
        }
        
        return result;
    }
    
    @Override
    public Map<String, Object> createDiverseTestScenarios(LocalDate targetDate, String branchCode) {
        // 브랜치 개념 제거: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음 (표준화 2025-12-05)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("🎭 다양한 시나리오 테스트 데이터 생성 시작: date={}, tenantId={}", targetDate, tenantId);
        
        Map<String, Object> result = new HashMap<>();
        
        try {
            // 1. 정상 완료 시나리오 (60%)
            createTestSchedules(targetDate, branchCode, 6);
            createCompletedConsultations(targetDate, branchCode, 6);
            createTestFinancialTransactions(targetDate, branchCode, 6);
            createTestRatings(targetDate, branchCode, 5);
            
            // 2. 취소 시나리오 (20%)
            Map<String, Object> cancelledResult = createTestSchedules(targetDate, branchCode, 2);
            @SuppressWarnings("unchecked")
            List<Long> cancelledIds = (List<Long>) cancelledResult.get("scheduleIds");
            if (cancelledIds != null) {
                for (Long scheduleId : cancelledIds) {
                    Schedule schedule = scheduleRepository.findById(scheduleId).orElse(null);
                    if (schedule != null) {
                        schedule.setStatus(ScheduleStatus.CANCELLED);
                        schedule.setUpdatedAt(LocalDateTime.now());
                        scheduleRepository.save(schedule);
                    }
                }
            }
            
            // 3. 노쇼 시나리오 (20%)
            Map<String, Object> noShowResult = createTestSchedules(targetDate, branchCode, 2);
            @SuppressWarnings("unchecked")
            List<Long> noShowIds = (List<Long>) noShowResult.get("scheduleIds");
            if (noShowIds != null) {
                for (Long scheduleId : noShowIds) {
                    Schedule schedule = scheduleRepository.findById(scheduleId).orElse(null);
                    if (schedule != null) {
                        schedule.setStatus(ScheduleStatus.CANCELLED); // NO_SHOW 대신 CANCELLED 사용
                        schedule.setUpdatedAt(LocalDateTime.now());
                        scheduleRepository.save(schedule);
                    }
                }
            }
            
            result.put("success", true);
            result.put("message", "다양한 시나리오 테스트 데이터 생성 완료");
            result.put("scenarios", Map.of(
                "completed", "6개 (60%)",
                "cancelled", "2개 (20%)",
                "noShow", "2개 (20%)"
            ));
            
            log.info("✅ 다양한 시나리오 테스트 데이터 생성 완료");
            
        } catch (Exception e) {
            log.error("❌ 다양한 시나리오 테스트 데이터 생성 실패: {}", e.getMessage(), e);
            result.put("success", false);
            result.put("message", "시나리오 테스트 데이터 생성 실패: " + e.getMessage());
        }
        
        return result;
    }
}
