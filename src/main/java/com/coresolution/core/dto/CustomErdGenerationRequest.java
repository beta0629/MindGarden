package com.coresolution.core.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 커스텀 ERD 생성 요청 DTO
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "커스텀 ERD 생성 요청")
public class CustomErdGenerationRequest {

    /**
     * 포함할 테이블 이름 목록
     */
    @NotEmpty(message = "테이블 목록은 필수입니다.")
    @Schema(description = "포함할 테이블 이름 목록", required = true, example = "[\"users\", \"orders\", \"products\"]")
    private List<String> tableNames;

    /**
     * ERD 이름
     */
    @NotNull(message = "ERD 이름은 필수입니다.")
    @Schema(description = "ERD 이름", required = true, example = "주문 관리 ERD")
    private String name;

    /**
     * ERD 설명
     */
    @Schema(description = "ERD 설명", example = "주문, 결제, 상품 관련 테이블만 포함한 ERD")
    private String description;

    /**
     * 스키마 이름 (선택)
     */
    @Schema(description = "스키마 이름", example = "core_solution")
    private String schemaName;
}

