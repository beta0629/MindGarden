package com.coresolution.consultation.dto;

import java.time.LocalDateTime;
import com.coresolution.consultation.entity.SystemConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 알림 자동 발송 스케줄러 ON/OFF 플래그 응답 DTO.
 *
 * <p>{@code system_config} 전역 행({@code tenant_id = ''}) 4 종을 어드민 토글 UI 로
 * 전달하기 위한 단순 DTO. 라벨/설명은 프론트(i18n) 가 키를 기준으로 매핑하므로
 * 백엔드는 키·값·메타만 반환한다.
 *
 * <p>키 SSOT: {@link com.coresolution.consultation.constant.NotificationSchedulerFlagKeys}.
 *
 * @author MindGarden
 * @since 2026-05-25
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSchedulerFlagDto {

    /** 변경자 라벨 — 시드/스케줄러 등 시스템 변경. */
    public static final String ACTOR_LABEL_SYSTEM = "SYSTEM";

    /** 변경자 라벨 — 사람(관리자) 변경. 이메일·ID 대신 역할만 노출. */
    public static final String ACTOR_LABEL_ADMIN = "ADMIN";

    /** 플래그 키 (notification.scheduler.*.enabled). */
    private String key;

    /** 현재 값 (true=ON, false=OFF). 행이 없으면 기본값(true) 으로 응답. */
    private boolean value;

    /** {@code system_config.description} 원문 (디버깅/감사용 보조 정보). */
    private String description;

    /**
     * 마지막 변경자 라벨. 시드 직후 행은 {@code SYSTEM}, 사람이 바꾼 행은 역할 라벨({@code ADMIN}).
     *
     * <p>P0 보안(2026-10-03): {@code system_config.updated_by} 에는 변경한 관리자의 이메일이
     * 저장되므로 응답에 그대로 내보내면 다른 관리자의 개인정보가 노출된다. 역할 라벨로만 치환한다.
     */
    private String updatedBy;

    /** 마지막 변경 시각 (system_config.updated_at). */
    private LocalDateTime updatedAt;

    /**
     * 엔티티 → DTO 변환. value 는 {@code "true"|"1"|"yes"|"on"} 만 ON 으로 인식.
     *
     * @param key    플래그 키 (행이 없을 때도 응답에 키를 보존하기 위해 별도 전달)
     * @param entity 전역 system_config 엔티티 (없으면 null)
     * @param defaultValue 행이 없을 때 사용할 기본값
     * @return DTO
     */
    public static NotificationSchedulerFlagDto fromEntity(
            String key, SystemConfig entity, boolean defaultValue) {
        if (entity == null) {
            return NotificationSchedulerFlagDto.builder()
                    .key(key)
                    .value(defaultValue)
                    .description(null)
                    .updatedBy(null)
                    .updatedAt(null)
                    .build();
        }
        return NotificationSchedulerFlagDto.builder()
                .key(key)
                .value(parseBoolean(entity.getConfigValue(), defaultValue))
                .description(entity.getDescription())
                .updatedBy(toActorLabel(entity.getUpdatedBy()))
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    /**
     * 변경자 식별자를 역할 라벨로 치환한다 (이메일·사용자 ID 미노출).
     *
     * @param rawUpdatedBy {@code system_config.updated_by} 원문
     * @return {@code SYSTEM} 또는 {@code ADMIN}. 값이 없으면 null
     */
    private static String toActorLabel(String rawUpdatedBy) {
        if (rawUpdatedBy == null || rawUpdatedBy.isBlank()) {
            return null;
        }
        return ACTOR_LABEL_SYSTEM.equalsIgnoreCase(rawUpdatedBy.trim())
                ? ACTOR_LABEL_SYSTEM
                : ACTOR_LABEL_ADMIN;
    }

    private static boolean parseBoolean(String raw, boolean defaultValue) {
        if (raw == null) {
            return defaultValue;
        }
        String normalized = raw.trim().toLowerCase();
        return "true".equals(normalized)
                || "1".equals(normalized)
                || "yes".equals(normalized)
                || "on".equals(normalized)
                || "y".equals(normalized)
                || "t".equals(normalized);
    }
}
