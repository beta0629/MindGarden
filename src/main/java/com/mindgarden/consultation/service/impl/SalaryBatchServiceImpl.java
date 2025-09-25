package com.mindgarden.consultation.service.impl;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import com.mindgarden.consultation.constant.UserRole;
import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.PlSqlSalaryManagementService;
import com.mindgarden.consultation.service.SalaryBatchService;
import com.mindgarden.consultation.service.SalaryScheduleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 급여 배치 처리 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-25
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SalaryBatchServiceImpl implements SalaryBatchService {
    
    private final UserRepository userRepository;
    private final PlSqlSalaryManagementService plSqlSalaryManagementService;
    private final SalaryScheduleService salaryScheduleService;
    
    @Override
    @Transactional
    public BatchResult executeMonthlySalaryBatch(int targetYear, int targetMonth, String branchCode) {
        log.info("🚀 급여 배치 실행 시작: {}-{}, 지점={}", targetYear, targetMonth, branchCode);
        
        try {
            // 1. 배치 실행 가능 여부 확인
            LocalDate targetDate = LocalDate.of(targetYear, targetMonth, 1);
            if (!canExecuteBatch(targetDate)) {
                return new BatchResult(false, "배치 실행 가능 시간이 아닙니다.");
            }
            
            // 2. 대상 상담사 조회
            List<User> consultants = getTargetConsultants(branchCode);
            if (consultants.isEmpty()) {
                return new BatchResult(false, "처리할 상담사가 없습니다.");
            }
            
            // 3. 계산 기간 설정
            LocalDate[] period = salaryScheduleService.getCalculationPeriod(targetYear, targetMonth);
            LocalDate periodStart = period[0];
            LocalDate periodEnd = period[1];
            
            log.info("📅 계산 기간: {} ~ {}", periodStart, periodEnd);
            
            // 4. 배치 실행
            int successCount = 0;
            int errorCount = 0;
            List<String> errorMessages = new ArrayList<>();
            
            for (User consultant : consultants) {
                try {
                    log.info("💰 상담사 급여 계산: ID={}, 이름={}", consultant.getId(), consultant.getName());
                    
                    // PL/SQL 통합 급여 계산 (실제 저장)
                    var result = plSqlSalaryManagementService.processIntegratedSalaryCalculation(
                        consultant.getId(), 
                        periodStart, 
                        periodEnd, 
                        "BATCH_SYSTEM"
                    );
                    
                    if ((Boolean) result.get("success")) {
                        successCount++;
                        log.info("✅ 상담사 급여 계산 완료: ID={}, 이름={}", consultant.getId(), consultant.getName());
                    } else {
                        errorCount++;
                        String errorMsg = String.format("상담사 %s(%d) 급여 계산 실패: %s", 
                            consultant.getName(), consultant.getId(), result.get("message"));
                        errorMessages.add(errorMsg);
                        log.error("❌ {}", errorMsg);
                    }
                    
                } catch (Exception e) {
                    errorCount++;
                    String errorMsg = String.format("상담사 %s(%d) 급여 계산 중 예외 발생: %s", 
                        consultant.getName(), consultant.getId(), e.getMessage());
                    errorMessages.add(errorMsg);
                    log.error("❌ {}", errorMsg, e);
                }
            }
            
            // 5. 결과 생성
            boolean overallSuccess = errorCount == 0;
            String message = String.format("급여 배치 완료: 총 %d명 처리, 성공 %d명, 실패 %d명", 
                consultants.size(), successCount, errorCount);
            
            if (!errorMessages.isEmpty()) {
                message += "\n실패 상세:\n" + String.join("\n", errorMessages);
            }
            
            log.info("🎉 급여 배치 실행 완료: {}", message);
            
            return new BatchResult(overallSuccess, message, consultants.size(), successCount, errorCount);
            
        } catch (Exception e) {
            log.error("❌ 급여 배치 실행 중 예외 발생", e);
            return new BatchResult(false, "급여 배치 실행 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
    
    @Override
    @Transactional
    public BatchResult executeCurrentMonthBatch() {
        LocalDate now = LocalDate.now();
        return executeMonthlySalaryBatch(now.getYear(), now.getMonthValue(), null);
    }
    
    @Override
    public boolean canExecuteBatch(LocalDate targetDate) {
        LocalDate cutoffDate = salaryScheduleService.getCutoffDate(targetDate.getYear(), targetDate.getMonthValue());
        LocalDate now = LocalDate.now();
        
        // 마감일 이후에만 실행 가능
        boolean canExecute = now.isAfter(cutoffDate) || now.isEqual(cutoffDate);
        
        log.debug("배치 실행 가능 여부 확인: 현재일={}, 마감일={}, 실행가능={}", 
            now, cutoffDate, canExecute);
        
        return canExecute;
    }
    
    @Override
    public BatchStatus getBatchStatus(int targetYear, int targetMonth) {
        // TODO: 실제 배치 상태 테이블에서 조회
        // 현재는 간단한 구현
        
        LocalDate targetDate = LocalDate.of(targetYear, targetMonth, 1);
        List<User> consultants = getTargetConsultants(null);
        
        BatchStatus status = new BatchStatus("PENDING");
        status.setTotalConsultants(consultants.size());
        
        // 이미 처리된 상담사 수 확인 (salary_calculations 테이블에서)
        // TODO: 실제 DB 조회 구현
        
        return status;
    }
    
    /**
     * 대상 상담사 조회
     */
    private List<User> getTargetConsultants(String branchCode) {
        if (branchCode == null) {
            // 전체 지점
            return userRepository.findByRoleAndIsActiveTrue(UserRole.CONSULTANT);
        } else {
            // 특정 지점
            return userRepository.findByRoleAndIsActiveTrueAndBranchCode(UserRole.CONSULTANT, branchCode);
        }
    }
}
