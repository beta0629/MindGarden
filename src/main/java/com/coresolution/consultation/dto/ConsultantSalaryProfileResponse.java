package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import com.coresolution.consultation.entity.ConsultantSalaryOption;
import com.coresolution.consultation.entity.ConsultantSalaryProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 급여 프로필 조회 응답 (엔티티 필드 + optionTypes — 프론트 SalaryProfileFormModal 등 호환)
 *
 * @author CoreSolution
 * @since 2026-04-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantSalaryProfileResponse {

    private Long id;
    private String tenantId;
    private Long consultantId;
    private String salaryType;
    private BigDecimal baseSalary;
    private BigDecimal hourlyRate;
    private LocalDateTime contractStartDate;
    private LocalDateTime contractEndDate;
    private String contractTerms;
    private String paymentCycle;
    private Boolean isBusinessRegistered;
    private String businessRegistrationNumber;
    private String businessName;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * 프론트 호환: { type, amount, name } 목록
     */
    @Builder.Default
    private List<ConsultantSalaryOptionRowResponse> optionTypes = new ArrayList<>();

    /**
     * 엔티티와 DB 옵션 행으로 응답 DTO 생성
     *
     * @param profile 급여 프로필
     * @param options 활성 옵션 목록
     * @return 응답 DTO
     */
    public static ConsultantSalaryProfileResponse fromEntity(ConsultantSalaryProfile profile,
            List<ConsultantSalaryOption> options) {
        if (profile == null) {
            return null;
        }
        List<ConsultantSalaryOptionRowResponse> rows = options == null ? List.of() : options.stream()
                .map(ConsultantSalaryOptionRowResponse::fromEntity)
                .collect(Collectors.toList());
        return ConsultantSalaryProfileResponse.builder()
                .id(profile.getId())
                .tenantId(profile.getTenantId())
                .consultantId(profile.getConsultantId())
                .salaryType(profile.getSalaryType())
                .baseSalary(profile.getBaseSalary())
                .hourlyRate(profile.getHourlyRate())
                .contractStartDate(profile.getContractStartDate())
                .contractEndDate(profile.getContractEndDate())
                .contractTerms(profile.getContractTerms())
                .paymentCycle(profile.getPaymentCycle())
                .isBusinessRegistered(profile.getIsBusinessRegistered())
                .businessRegistrationNumber(profile.getBusinessRegistrationNumber())
                .businessName(profile.getBusinessName())
                .isActive(profile.getIsActive())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .optionTypes(rows)
                .build();
    }
}
