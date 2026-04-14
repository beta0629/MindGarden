package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 급여 프로필 저장 시 동기화할 옵션 행 (프론트 options / optionTypes 페이로드 호환)
 *
 * @author CoreSolution
 * @since 2026-04-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantSalaryOptionItemRequest {

    @JsonAlias({"optionType"})
    @Size(max = 50, message = "옵션 타입은 50자 이하여야 합니다.")
    private String type;

    @JsonAlias({"optionAmount"})
    @DecimalMin(value = "0.0", message = "옵션 금액은 0 이상이어야 합니다.")
    private BigDecimal amount;

    @JsonAlias({"optionName"})
    @Size(max = 500, message = "옵션 설명은 500자 이하여야 합니다.")
    private String name;

    /**
     * 저장용 옵션 타입 코드 (type 또는 레거시 별칭)
     *
     * @return 공백이 아닌 타입 코드, 없으면 null
     */
    public String resolveOptionType() {
        if (type == null || type.isBlank()) {
            return null;
        }
        return type.trim();
    }
}
