package com.coresolution.consultation.dto;

import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 회기 승계·이관 이력 목록 응답.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionTransferHistoryResponse {

    /** 최신순 이력 */
    @Builder.Default
    private List<SessionTransferHistoryItemResponse> items = new ArrayList<>();
}
