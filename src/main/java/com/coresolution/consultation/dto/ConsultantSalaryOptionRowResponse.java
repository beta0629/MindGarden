package com.coresolution.consultation.dto;

import java.math.BigDecimal;
import com.coresolution.consultation.entity.ConsultantSalaryOption;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 급여 옵션 한 행 (조회용, 프론트 optionTypes 항목과 필드명 맞춤)
 *
 * @author CoreSolution
 * @since 2026-04-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantSalaryOptionRowResponse {

    private String type;
    private BigDecimal amount;
    private String name;

    /**
     * 엔티티를 프론트 호환 행으로 변환
     *
     * @param entity 옵션 엔티티
     * @return 행 DTO
     */
    public static ConsultantSalaryOptionRowResponse fromEntity(ConsultantSalaryOption entity) {
        if (entity == null) {
            return null;
        }
        return ConsultantSalaryOptionRowResponse.builder()
                .type(entity.getOptionType())
                .amount(entity.getOptionAmount())
                .name(entity.getOptionDescription())
                .build();
    }
}
