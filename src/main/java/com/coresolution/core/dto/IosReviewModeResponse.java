package com.coresolution.core.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * iOS 심사 모드(커뮤니티 iOS 숨김) 상태 응답.
 *
 * @author MindGarden
 * @since 2026-09-12
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IosReviewModeResponse {

    /**
     * CLIENT·CONSULTANT 커뮤니티 모두 iOS 숨김이면 true.
     */
    private boolean enabled;

    /**
     * 이번 요청으로 갱신·생성한 권한 행 수(조회 API에서는 0).
     */
    private int updatedCount;
}
