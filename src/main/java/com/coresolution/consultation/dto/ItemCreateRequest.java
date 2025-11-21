package com.coresolution.consultation.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * 아이템 생성 요청 DTO
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-10
 */
@Data
public class ItemCreateRequest {
    
    @NotBlank(message = "아이템명은 필수입니다.")
    @Size(max = 100, message = "아이템명은 100자를 초과할 수 없습니다.")
    private String name;
    
    @Size(max = 500, message = "설명은 500자를 초과할 수 없습니다.")
    private String description;
    
    @NotBlank(message = "카테고리는 필수입니다.")
    @Size(max = 50, message = "카테고리는 50자를 초과할 수 없습니다.")
    private String category;
    
    @NotNull(message = "단가는 필수입니다.")
    @DecimalMin(value = "0.0", inclusive = false, message = "단가는 0보다 커야 합니다.")
    @Digits(integer = 10, fraction = 2, message = "단가는 정수 10자리, 소수 2자리까지 입력 가능합니다.")
    private java.math.BigDecimal unitPrice;
    
    @NotNull(message = "재고 수량은 필수입니다.")
    @Min(value = 0, message = "재고 수량은 0 이상이어야 합니다.")
    private Integer stockQuantity;
    
    @Size(max = 100, message = "공급업체명은 100자를 초과할 수 없습니다.")
    private String supplier;
}
