package com.coresolution.consultation.dto.mobilepush;

import com.coresolution.consultation.constant.MobilePushConstants;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * {@code POST /api/v1/mobile/push-token/register} 요청.
 * <p>tenantId는 바디에 있어도 서버가 무시한다(헤더·JWT·세션 컨텍스트만 신뢰).</p>
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class MobilePushTokenRegisterRequest {

    /**
     * 선택. 전달 시 반드시 세션 사용자와 동일해야 한다.
     */
    private Long userId;

    @NotBlank
    @Size(max = MobilePushConstants.PUSH_TOKEN_MAX_CHARS)
    private String token;

    @NotBlank
    private String platform;

    private JsonNode deviceInfo;
}
