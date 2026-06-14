package com.coresolution.consultation.dto.security;

import lombok.Builder;
import lombok.Data;

/**
 * PII 회전 진행률 조회 응답.
 *
 * <p>{@code GET /api/v1/admin/pii-rotation/progress} 의 표준 응답. chunk 상태별 카운트와
 * 현재 활성 / 목표 키 ID 를 노출한다. 평문/암호문 PII 노출 0건.</p>
 *
 * @author CoreSolution
 * @since 2026-06-15
 */
@Data
@Builder
public class PiiRotationProgressResponse {

    private final String table;
    private final int totalChunks;
    private final int done;
    private final int inProgress;
    private final int pending;
    private final int failed;
    private final int skipped;
    private final String activeKeyId;
    private final String targetKeyId;
}
