package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 수동 발송 화면 설정(서버 단일 상한).
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualNotificationConfigResponse {

    private int maxRecipients;
    private int previewSize;
    private int maxExclusions;
}
