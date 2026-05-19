package com.coresolution.consultation.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 체크아웃 시 선택 가능한 활성 상담사-내담자 매핑 (PII 최소).
 *
 * @author MindGarden
 * @since 2026-05-20
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopConsultantMappingOption {

    private Long mappingId;

    private String consultantDisplayName;

    /**
     * 패키지명 등 부가 라벨 (선택).
     */
    private String label;
}
