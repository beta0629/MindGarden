package com.coresolution.consultation.dto;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.entity.SystemConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link NotificationSchedulerFlagDto} 변경자 라벨 단위 테스트.
 *
 * <p>P0 보안(2026-10-03): 응답의 '마지막 변경자' 에 다른 관리자 이메일이 그대로 노출되던 문제를
 * 역할 라벨(SYSTEM/ADMIN)로 치환했는지 검증한다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
@DisplayName("NotificationSchedulerFlagDto — 변경자 라벨(이메일 제거)")
class NotificationSchedulerFlagDtoActorLabelTest {

    /** 테스트 픽스처 — 응답에 남아선 안 되는 다른 관리자 이메일. */
    private static final String FIXTURE_OTHER_ADMIN_EMAIL = "other-admin@example.com";

    private SystemConfig config(String updatedBy) {
        return SystemConfig.builder()
                .configKey("notification.scheduler.wellnessTip.enabled")
                .configValue("true")
                .updatedBy(updatedBy)
                .build();
    }

    @Test
    @DisplayName("관리자 이메일은 ADMIN 라벨로 치환되어 응답에 남지 않는다")
    void fromEntity_adminEmail_isReplacedWithRoleLabel() {
        NotificationSchedulerFlagDto dto = NotificationSchedulerFlagDto.fromEntity(
                "notification.scheduler.wellnessTip.enabled", config(FIXTURE_OTHER_ADMIN_EMAIL), true);

        assertThat(dto.getUpdatedBy()).isEqualTo(NotificationSchedulerFlagDto.ACTOR_LABEL_ADMIN);
        assertThat(String.valueOf(dto.getUpdatedBy())).doesNotContain(FIXTURE_OTHER_ADMIN_EMAIL);
        assertThat(String.valueOf(dto.getUpdatedBy())).doesNotContain("@");
    }

    @Test
    @DisplayName("ID 기반 식별자(user#99)도 ADMIN 라벨로 치환")
    void fromEntity_userIdActor_isReplacedWithRoleLabel() {
        NotificationSchedulerFlagDto dto = NotificationSchedulerFlagDto.fromEntity(
                "notification.scheduler.wellnessTip.enabled", config("user#99"), true);

        assertThat(dto.getUpdatedBy()).isEqualTo(NotificationSchedulerFlagDto.ACTOR_LABEL_ADMIN);
    }

    @Test
    @DisplayName("SYSTEM 은 SYSTEM 으로 유지, null·빈 값은 null")
    void fromEntity_systemAndBlankActors() {
        assertThat(NotificationSchedulerFlagDto
                .fromEntity("notification.scheduler.wellnessTip.enabled", config("SYSTEM"), true)
                .getUpdatedBy())
                .isEqualTo(NotificationSchedulerFlagDto.ACTOR_LABEL_SYSTEM);
        assertThat(NotificationSchedulerFlagDto
                .fromEntity("notification.scheduler.wellnessTip.enabled", config("system"), true)
                .getUpdatedBy())
                .isEqualTo(NotificationSchedulerFlagDto.ACTOR_LABEL_SYSTEM);
        assertThat(NotificationSchedulerFlagDto
                .fromEntity("notification.scheduler.wellnessTip.enabled", config(null), true)
                .getUpdatedBy())
                .isNull();
        assertThat(NotificationSchedulerFlagDto
                .fromEntity("notification.scheduler.wellnessTip.enabled", config("   "), true)
                .getUpdatedBy())
                .isNull();
    }
}
