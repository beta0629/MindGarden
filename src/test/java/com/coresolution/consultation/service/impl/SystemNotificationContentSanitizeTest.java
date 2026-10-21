package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.entity.SystemNotification;
import com.coresolution.consultation.repository.SystemNotificationReadRepository;
import com.coresolution.consultation.repository.SystemNotificationRepository;
import com.coresolution.core.context.TenantContextHolder;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 시스템 공지 생성·수정 시 content 가 저장 전에 정화되는지 확인한다.
 *
 * @author MindGarden
 * @since 2026-10-21
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SystemNotificationServiceImpl — 본문 정화")
class SystemNotificationContentSanitizeTest {

    private static final String TENANT = "tenant-notice-xss";

    @Mock
    private SystemNotificationRepository systemNotificationRepository;

    @Mock
    private SystemNotificationReadRepository systemNotificationReadRepository;

    @InjectMocks
    private SystemNotificationServiceImpl systemNotificationService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("createNotification 은 script 를 제거한 본문을 저장한다")
    void createNotificationStripsScript() {
        SystemNotification input = new SystemNotification();
        input.setTargetType("ALL");
        input.setTitle("신규 공지");
        input.setContent("<p>안녕</p><script>alert(1)</script>");
        when(systemNotificationRepository.save(any(SystemNotification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        SystemNotification created = systemNotificationService.createNotification(input);

        ArgumentCaptor<SystemNotification> captor = ArgumentCaptor.forClass(SystemNotification.class);
        verify(systemNotificationRepository).save(captor.capture());
        assertThat(created.getContent()).contains("안녕");
        assertThat(created.getContent().toLowerCase()).doesNotContain("<script", "alert(1)");
        assertThat(captor.getValue().getContent()).isEqualTo(created.getContent());
        assertThat(created.getTenantId()).isEqualTo(TENANT);
    }

    @Test
    @DisplayName("updateNotification 은 javascript: iframe 을 제거한 본문을 저장한다")
    void updateNotificationStripsIframe() {
        SystemNotification existing = new SystemNotification();
        existing.setId(5L);
        existing.setTenantId(TENANT);
        when(systemNotificationRepository.findByTenantIdAndId(eq(TENANT), eq(5L)))
                .thenReturn(Optional.of(existing));
        when(systemNotificationRepository.save(any(SystemNotification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        SystemNotification patch = new SystemNotification();
        patch.setTitle("수정");
        patch.setTargetType("CLIENT");
        patch.setNotificationType("GENERAL");
        patch.setIsImportant(false);
        patch.setIsUrgent(false);
        patch.setContent("<iframe src=\"javascript:alert(1)\"></iframe><p>본문</p>");

        SystemNotification updated = systemNotificationService.updateNotification(5L, patch);

        assertThat(updated.getContent()).contains("본문");
        assertThat(updated.getContent().toLowerCase()).doesNotContain("<iframe", "javascript:");
        assertThat(updated.getTitle()).isEqualTo("수정");
    }
}
