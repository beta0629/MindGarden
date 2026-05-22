package com.coresolution.consultation.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.dto.ConsultantSalaryOptionItemRequest;
import com.coresolution.consultation.dto.ConsultantSalaryProfileResponse;
import com.coresolution.consultation.dto.TaxCalculateRequest;
import com.coresolution.consultation.entity.ConsultantSalaryProfile;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryTaxCalculation;

public interface SalaryManagementService {
    
    // Salary Profile 관리
    List<ConsultantSalaryProfile> getAllSalaryProfiles();
    ConsultantSalaryProfile getSalaryProfileById(Long id);
    ConsultantSalaryProfile createSalaryProfile(ConsultantSalaryProfile salaryProfile,
            List<ConsultantSalaryOptionItemRequest> optionRequests);

    ConsultantSalaryProfile updateSalaryProfile(ConsultantSalaryProfile salaryProfile,
            List<ConsultantSalaryOptionItemRequest> optionRequests);

    void deleteSalaryProfile(Long id);

    /**
     * 상담사별 활성 급여 프로필과 옵션(optionTypes) 포함 상세 조회.
     * 동일 테넌트·상담사에 활성 프로필이 복수인 경우 {@code updatedAt} 최신 1건을 사용합니다.
     *
     * @param consultantId 상담사 ID
     * @return 프로필 없으면 null
     */
    ConsultantSalaryProfileResponse getSalaryProfileDetailForConsultant(Long consultantId);
    
    // Consultant 관리 (상담사 목록은 공통 API GET /api/v1/admin/consultants/with-stats 사용)
    List<Map<String, Object>> getConsultantSalarySummary(Long consultantId, String period);
    
    // Salary Calculation 관리
    List<SalaryCalculation> getSalaryCalculations(LocalDate startDate, LocalDate endDate);
    SalaryCalculation calculateSalary(Long consultantId, Long profileId, LocalDate periodStart, LocalDate periodEnd);
    SalaryCalculation approveSalaryCalculation(Long calculationId, String approvedBy);
    SalaryCalculation markAsPaid(Long calculationId, String paidBy);

    /**
     * 어드민 급여 관리 화면 월 단위 자동 표시용. 확정 이상 상태
     * ({@code CALCULATED}, {@code APPROVED}, {@code PAID})의 급여 계산을 기간(기산일 기준)으로 조회합니다.
     * 화면이 특정 월에 진입할 때 별도 클릭 없이 확정된 내역이 보이도록 사용합니다.
     *
     * @param startDate 기산일 기준 기간 시작
     * @param endDate   기산일 기준 기간 종료
     * @return 해당 테넌트·기간 내 확정 이상 급여 계산 목록 (최신순)
     */
    List<SalaryCalculation> getConfirmedSalaryCalculationsByPeriod(LocalDate startDate, LocalDate endDate);

    // 프론트엔드 호환성을 위한 메서드들
    List<SalaryCalculation> getSalaryCalculations(Long consultantId);

    /**
     * 상담사 본인 조회 전용: 관리자 확정({@code APPROVED})·지급 완료({@code PAID}) 건만 반환합니다.
     * <p>
     * 비즈니스 정책: {@code PENDING}/{@code CALCULATED}는 내부 검토·미확정으로 노출하지 않으며,
     * {@code CANCELLED}는 폐기 건으로 노출하지 않습니다.
     * </p>
     *
     * @param consultantId 상담사(User) ID
     * @return 확정·지급 완료 급여 계산 목록 (최신순과 동일 정렬은 구현체에 따름)
     */
    List<SalaryCalculation> getSalaryCalculationsVisibleToConsultant(Long consultantId);
    Map<String, Object> getTaxDetails(Long calculationId);
    /**
     * 세금 통계 (기간별). {@code consultantId}가 있으면 해당 상담사 급여 계산만 집계.
     *
     * @param period       YYYY-MM
     * @param consultantId 선택 상담사 (null이면 테넌트 전체)
     */
    Map<String, Object> getTaxStatistics(String period, Long consultantId);
    
    /**
     * 추가 세금 계산 (POST tax/calculate). SalaryTaxCalculation 생성·저장 및 salary_calculations.deductions 반영.
     *
     * @param request calculationId, grossAmount, taxType, taxRate 등
     * @return 생성된 세금 계산 정보
     */
    SalaryTaxCalculation calculateAdditionalTax(TaxCalculateRequest request);
    
    // 통계 및 분석
    Map<String, Object> getSalaryStatistics(LocalDate startDate, LocalDate endDate);
    List<Map<String, Object>> getTopPerformers(LocalDate startDate, LocalDate endDate, int limit);
    BigDecimal calculateTotalSalaryCost(LocalDate startDate, LocalDate endDate);
}
