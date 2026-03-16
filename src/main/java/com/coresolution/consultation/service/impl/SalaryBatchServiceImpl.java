package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Branch;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.PlSqlSalaryManagementService;
import com.coresolution.consultation.service.SalaryBatchService;
import com.coresolution.consultation.service.SalaryScheduleService;
import com.coresolution.core.context.TenantContextHolder;
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
    private final SalaryCalculationRepository salaryCalculationRepository;
    private final PlSqlSalaryManagementService plSqlSalaryManagementService;
    private final SalaryScheduleService salaryScheduleService;
    private final CommonCodeService commonCodeService;
    private final BranchService branchService;
    
    @Override
    @Transactional
    public BatchResult executeMonthlySalaryBatch(int targetYear, int targetMonth, String branchCode) {
        // 브랜치 개념 제거: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음 (표준화 2025-12-05)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("🚀 급여 배치 실행 시작: {}-{}, tenantId={}", targetYear, targetMonth, tenantId);
        
        try {
            // 1. 배치 실행 가능 여부 확인
            LocalDate targetDate = LocalDate.of(targetYear, targetMonth, 1);
            if (!canExecuteBatch(targetDate)) {
                return new BatchResult(false, "배치 실행 가능 시간이 아닙니다.");
            }
            
            // 2. 대상 상담사 조회 (branchCode 필터링 제거)
            List<User> consultants = getTargetConsultants(null); // branchCode는 레거시 호환용
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
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.info("🔍 급여 배치 상태 조회: {}-{}, tenantId={}", targetYear, targetMonth, tenantId);
        
        List<User> consultants = getTargetConsultants(null);
        
        // 해당 월의 급여 계산 기록 조회: 배치 실행과 동일한 기산일 기준 기간 사용 (테넌트 격리)
        LocalDate[] period = salaryScheduleService.getCalculationPeriod(targetYear, targetMonth);
        LocalDate periodStart = period[0];
        LocalDate periodEnd = period[1];
        List<SalaryCalculation> existingCalculations = salaryCalculationRepository
                .findByTenantIdAndStatusAndCalculationPeriodStartBetween(
                    tenantId, SalaryCalculation.SalaryStatus.CALCULATED, periodStart, periodEnd);
        
        int processedConsultants = existingCalculations.size();
        int totalConsultants = consultants.size();
        
        // 공통 코드에서 배치 상태 조회
        String status;
        if (processedConsultants == 0) {
            status = commonCodeService.getCodeValue("BATCH_STATUS", "PENDING");
        } else if (processedConsultants == totalConsultants) {
            status = commonCodeService.getCodeValue("BATCH_STATUS", "COMPLETED");
        } else {
            status = commonCodeService.getCodeValue("BATCH_STATUS", "IN_PROGRESS");
        }
        
        // 공통 코드에 값이 없으면 기본값 사용
        if (status == null) {
            if (processedConsultants == 0) {
                status = "PENDING";
            } else if (processedConsultants == totalConsultants) {
                status = "COMPLETED";
            } else {
                status = "IN_PROGRESS";
            }
        }
        
        BatchStatus batchStatus = new BatchStatus(status);
        batchStatus.setTotalConsultants(totalConsultants);
        batchStatus.setProcessedConsultants(processedConsultants);
        batchStatus.setLastExecuted(
            existingCalculations.stream()
                .map(SalaryCalculation::getCreatedAt)
                .max(LocalDateTime::compareTo)
                .map(LocalDateTime::toLocalDate)
                .orElse(null)
        );
        
        log.info("✅ 배치 상태 조회 완료: 상태={}, 전체={}, 처리됨={}", 
                status, totalConsultants, processedConsultants);
        
        return batchStatus;
    }
    
    /**
     * 대상 상담사 조회
     */
    private List<User> getTargetConsultants(String branchCode) {
        // 브랜치 개념 제거: branchCode 파라미터는 레거시 호환용으로 유지되지만 사용하지 않음 (표준화 2025-12-05)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        // 테넌트 전체 상담사 조회
        return userRepository.findByRoleAndIsActiveTrue(tenantId, UserRole.CONSULTANT);
    }
}
