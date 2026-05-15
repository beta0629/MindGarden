package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 맥락 내담자 상세 — 상담 이력 항목 (현재는 빈 목록 기본, 추후 스케줄·일지 연동).
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantClientSessionHistoryItemResponse {

    private Long id;
    private String date;
    private String startTime;
    private String endTime;
    private Integer sessionNumber;
    private String sessionType;
    private String status;
    private String summary;
}
