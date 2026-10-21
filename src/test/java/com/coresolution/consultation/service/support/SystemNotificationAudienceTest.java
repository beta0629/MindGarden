package com.coresolution.consultation.service.support;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.SystemNotification;
import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 목록 JPQL과 동일한 게시·대상 판정 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */
@DisplayName("SystemNotificationAudience — 게시·대상·관리자 미리보기")
class SystemNotificationAudienceTest {

    private static final String TENANT = "tenant-a";
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 10, 21, 12, 0);

    @Test
    @DisplayName("PUBLISHED + publishedAt/expiresAt null → 게시 중")
    void publishedWithNullWindow_isPublished() {
        SystemNotification notice = notice("PUBLISHED", null, null, false);
        assertThat(SystemNotificationAudience.isPublishedForAudience(notice, NOW)).isTrue();
    }

    @Test
    @DisplayName("DRAFT → 비게시")
    void draft_isNotPublished() {
        SystemNotification notice = notice("DRAFT", null, null, false);
        assertThat(SystemNotificationAudience.isPublishedForAudience(notice, NOW)).isFalse();
    }

    @Test
    @DisplayName("ARCHIVED → 비게시")
    void archived_isNotPublished() {
        SystemNotification notice = notice("ARCHIVED", null, null, false);
        assertThat(SystemNotificationAudience.isPublishedForAudience(notice, NOW)).isFalse();
    }

    @Test
    @DisplayName("publishedAt 미래 → 비게시")
    void futurePublishedAt_isNotPublished() {
        SystemNotification notice = notice("PUBLISHED", NOW.plusMinutes(1), null, false);
        assertThat(SystemNotificationAudience.isPublishedForAudience(notice, NOW)).isFalse();
    }

    @Test
    @DisplayName("expiresAt == now → 비게시 (목록 JPQL expiresAt > now)")
    void expiresAtEqualNow_isNotPublished() {
        SystemNotification notice = notice("PUBLISHED", null, NOW, false);
        assertThat(SystemNotificationAudience.isPublishedForAudience(notice, NOW)).isFalse();
    }

    @Test
    @DisplayName("expiresAt 과거 → 비게시")
    void pastExpiresAt_isNotPublished() {
        SystemNotification notice = notice("PUBLISHED", null, NOW.minusSeconds(1), false);
        assertThat(SystemNotificationAudience.isPublishedForAudience(notice, NOW)).isFalse();
    }

    @Test
    @DisplayName("CLIENT + CONSULTANT 대상 + 게시 → 비노출")
    void client_consultantTarget_notVisible() {
        SystemNotification notice = notice("PUBLISHED", null, null, false);
        notice.setTargetType("CONSULTANT");
        assertThat(SystemNotificationAudience.isVisibleForRecipient(
                notice, TENANT, UserRole.CLIENT.name(), NOW)).isFalse();
    }

    @Test
    @DisplayName("CONSULTANT + CONSULTANT 대상 + 게시 → 노출")
    void consultant_consultantTarget_visible() {
        SystemNotification notice = notice("PUBLISHED", null, null, false);
        notice.setTargetType("CONSULTANT");
        assertThat(SystemNotificationAudience.isVisibleForRecipient(
                notice, TENANT, UserRole.CONSULTANT.name(), NOW)).isTrue();
    }

    @Test
    @DisplayName("수신자: DRAFT 는 대상이 맞아도 비노출")
    void recipient_draft_notVisible() {
        SystemNotification notice = notice("DRAFT", null, null, false);
        notice.setTargetType("ALL");
        assertThat(SystemNotificationAudience.isVisibleForRecipient(
                notice, TENANT, UserRole.CLIENT.name(), NOW)).isFalse();
    }

    @Test
    @DisplayName("관리자 미리보기: DRAFT·CONSULTANT 대상·같은 테넌트 → 허용")
    void adminPreview_draftConsultantTarget_allowed() {
        SystemNotification notice = notice("DRAFT", null, null, false);
        notice.setTargetType("CONSULTANT");
        assertThat(SystemNotificationAudience.canAdminPreviewSameTenant(notice, TENANT)).isTrue();
    }

    @Test
    @DisplayName("관리자 미리보기: 삭제 → 거부")
    void adminPreview_deleted_denied() {
        SystemNotification notice = notice("PUBLISHED", null, null, true);
        assertThat(SystemNotificationAudience.canAdminPreviewSameTenant(notice, TENANT)).isFalse();
    }

    @Test
    @DisplayName("관리자 미리보기: 다른 테넌트 → 거부")
    void adminPreview_otherTenant_denied() {
        SystemNotification notice = notice("PUBLISHED", null, null, false);
        notice.setTenantId("other-tenant");
        assertThat(SystemNotificationAudience.canAdminPreviewSameTenant(notice, TENANT)).isFalse();
    }

    private static SystemNotification notice(
            String status, LocalDateTime publishedAt, LocalDateTime expiresAt, boolean deleted) {
        SystemNotification n = new SystemNotification();
        n.setId(1L);
        n.setTenantId(TENANT);
        n.setTargetType("ALL");
        n.setTitle("t");
        n.setContent("c");
        n.setAuthorId(1L);
        n.setStatus(status);
        n.setPublishedAt(publishedAt);
        n.setExpiresAt(expiresAt);
        n.setIsDeleted(deleted);
        return n;
    }
}
