package com.coresolution.consultation.dto.community;

import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Apple T2 (1.2 UGC) — 사용자 차단 요청.
 *
 * <p>{@code reason} 은 운영 통계용 선택 필드이며 사용자 화면에서는 노출하지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Data
public class CommunityUserBlockRequest {

    /** 차단 사유 메모(선택, 500자). */
    @Size(max = 500)
    private String reason;
}
