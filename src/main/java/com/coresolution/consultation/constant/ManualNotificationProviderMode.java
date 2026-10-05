package com.coresolution.consultation.constant;

import java.util.Locale;

/**
 * 수동 발송 프로바이더 모드. {@code notification.manual.job.provider-mode} 로 고른다.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
public enum ManualNotificationProviderMode {
    /** 프로바이더 실호출. */
    REAL,
    /** 기록 경로는 같고 프로바이더 호출만 생략(.dev). */
    DRY_RUN;

    /**
     * 설정 문자열을 모드로 바꾼다. 알 수 없는 값은 실발송을 막기 위해 DRY_RUN 으로 본다.
     *
     * @param value 설정값
     * @return 모드
     */
    public static ManualNotificationProviderMode fromConfig(String value) {
        if (value == null || value.isBlank()) {
            return DRY_RUN;
        }
        try {
            return valueOf(value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return DRY_RUN;
        }
    }
}
