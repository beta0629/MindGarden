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

    /**
     * 상담사 사용자 ID — 동일 상담사 다중 패키지 그룹핑용.
     */
    private Long consultantId;

    private String consultantDisplayName;

    /**
     * 패키지명 등 부가 라벨 (선택).
     */
    private String label;

    /**
     * 자동 바인딩된 대표 매핑(동일 상담사·유일 배정 상담사 등)일 때 true. 목록당 최대 1건.
     * 체크아웃 UI는 distinct 상담사가 1명이면 피커를 숨긴다.
     */
    private boolean preselected;
}
