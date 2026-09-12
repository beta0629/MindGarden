package com.coresolution.core.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * iOS 심사 모드(커뮤니티 iOS 숨김) 원버튼 요청.
 *
 * <p>{@code enabled=true} → CLIENT/CONSULTANT 커뮤니티 {@code canViewIos=false}.
 * {@code enabled=false} → 동일 메뉴 {@code canViewIos=true}. Android/웹은 변경하지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-12
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IosReviewModeRequest {

    /**
     * true면 iOS에서 커뮤니티 숨김(심사 모드 ON), false면 iOS 다시 보이기.
     */
    @NotNull(message = "enabled는 필수입니다")
    private Boolean enabled;
}
