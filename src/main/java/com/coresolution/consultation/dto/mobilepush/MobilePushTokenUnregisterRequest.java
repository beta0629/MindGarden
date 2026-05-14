package com.coresolution.consultation.dto.mobilepush;

import com.coresolution.consultation.constant.MobilePushConstants;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * {@code POST /api/v1/mobile/push-token/unregister} 요청.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MobilePushTokenUnregisterRequest {

    private Long userId;

    @NotBlank
    @Size(max = MobilePushConstants.PUSH_TOKEN_MAX_CHARS)
    private String token;

    @NotBlank
    private String platform;
}
