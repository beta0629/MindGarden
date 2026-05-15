package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 상담사 맥락 내담자 상세 — 메모 항목 (현재는 빈 목록 기본).
 *
 * @author MindGarden
 * @since 2026-05-15
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultantClientMemoItemResponse {

    private Long id;
    private String content;
    private String createdAt;
    private String updatedAt;
}
