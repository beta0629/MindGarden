package com.coresolution.consultation.dto.mobilepush;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * {@code GET|PUT /api/v1/mobile/push-settings} 응답·전체 교체 시 요청 스키마.
 * Expo {@code NotificationSettings} 와 필드명 정합.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MobilePushSettingsPayload {

    private boolean schedule;
    private boolean payment;
    private boolean message;
    private boolean wellness;
    private boolean system;

    /**
     * 서버 기본값(미저장 사용자).
     *
     * @return 모두 true
     */
    public static MobilePushSettingsPayload allEnabledDefaults() {
        return MobilePushSettingsPayload.builder()
                .schedule(true)
                .payment(true)
                .message(true)
                .wellness(true)
                .system(true)
                .build();
    }
}
