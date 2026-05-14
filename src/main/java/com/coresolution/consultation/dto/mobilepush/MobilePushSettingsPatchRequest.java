package com.coresolution.consultation.dto.mobilepush;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

/**
 * {@code PUT /api/v1/mobile/push-settings} 부분 갱신 요청.
 * null 필드는 기존 값을 유지한다.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MobilePushSettingsPatchRequest {

    private Boolean schedule;
    private Boolean payment;
    private Boolean message;
    private Boolean wellness;
    private Boolean system;
}
