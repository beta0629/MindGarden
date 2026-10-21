package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.coresolution.consultation.constant.NotificationType;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Notification;
import com.coresolution.consultation.entity.SystemNotification;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.NotificationRepository;
import com.coresolution.consultation.repository.SystemNotificationReadRepository;
import com.coresolution.consultation.repository.SystemNotificationRepository;
import com.coresolution.consultation.service.impl.NotificationLifecycleServiceImpl;
import com.coresolution.consultation.service.impl.SystemNotificationServiceImpl;
import com.coresolution.core.context.TenantContextHolder;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * 삭제·없는·다른 테넌트·비대상 공지와 웰니스 개인 알림 상세는 공통 404 를 반환한다.
 *
 * @author CoreSolution
 * @since 2026-10-21
 */
@DisplayName("공지·웰니스 상세 — 삭제/없음/다른 테넌트/비대상 404, 정상 200")
class NoticeDetailNotFoundMvcTest {

    private static final String SYSTEM_NOTICE_PATH = "/api/v1/system-notifications/{notificationId}";
    private static final String SYSTEM_NOTICE_READ_PATH = "/api/v1/system-notifications/{notificationId}/read";
    private static final String WELLNESS_NOTICE_PATH = "/api/v1/notifications/{notificationId}";
    private static final String ENTITY_NOT_FOUND = "ENTITY_NOT_FOUND";
    private static final String TARGET_ALL = "ALL";
    private static final String TARGET_CONSULTANT = "CONSULTANT";
    private static final String TARGET_CLIENT = "CLIENT";

    private String tenantA;
    private String tenantB;
    private long userId;
    private long noticeId;

    private SystemNotificationRepository systemNotificationRepository;
    private SystemNotificationReadRepository readRepository;
    private NotificationRepository notificationRepository;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        TenantContextHolder.clear();
        tenantA = "tenant-" + UUID.randomUUID();
        tenantB = "tenant-" + UUID.randomUUID();
        userId = positiveId(UUID.randomUUID().getMostSignificantBits());
        noticeId = positiveId(UUID.randomUUID().getLeastSignificantBits());

        systemNotificationRepository = mock(SystemNotificationRepository.class);
        readRepository = mock(SystemNotificationReadRepository.class);
        when(readRepository.findByNotificationIdAndUserId(any(), any())).thenReturn(Optional.empty());
        when(readRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        SystemNotificationServiceImpl systemNotificationService = new SystemNotificationServiceImpl();
        ReflectionTestUtils.setField(
                systemNotificationService, "systemNotificationRepository", systemNotificationRepository);
        ReflectionTestUtils.setField(
                systemNotificationService, "systemNotificationReadRepository", readRepository);

        SystemNotificationController systemNotificationController = new SystemNotificationController();
        ReflectionTestUtils.setField(
                systemNotificationController, "systemNotificationService", systemNotificationService);

        notificationRepository = mock(NotificationRepository.class);
        when(notificationRepository.save(any(Notification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        NotificationController notificationController =
                new NotificationController(new NotificationLifecycleServiceImpl(notificationRepository));

        mockMvc = MockMvcBuilders.standaloneSetup(systemNotificationController, notificationController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("삭제된 시스템 공지 상세는 404")
    void deletedSystemNotice_returns404() throws Exception {
        when(systemNotificationRepository.findByTenantIdAndId(eq(tenantA), eq(noticeId)))
                .thenReturn(Optional.of(systemNotice(tenantA, TARGET_ALL, true)));

        getSystemNotice(UserRole.CLIENT).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value(ENTITY_NOT_FOUND))
                .andExpect(jsonPath("$.status").value(404));

        verify(systemNotificationRepository, never()).incrementViewCount(any());
        verify(readRepository, never()).save(any());
    }

    @Test
    @DisplayName("없는 시스템 공지 ID 상세는 404")
    void missingSystemNotice_returns404() throws Exception {
        when(systemNotificationRepository.findByTenantIdAndId(eq(tenantA), eq(noticeId)))
                .thenReturn(Optional.empty());

        getSystemNotice(UserRole.CLIENT).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value(ENTITY_NOT_FOUND))
                .andExpect(jsonPath("$.status").value(404));

        verify(systemNotificationRepository, never()).incrementViewCount(any());
        verify(readRepository, never()).save(any());
    }

    @Test
    @DisplayName("다른 테넌트 시스템 공지 상세는 404")
    void otherTenantSystemNotice_returns404() throws Exception {
        when(systemNotificationRepository.findByTenantIdAndId(eq(tenantA), eq(noticeId)))
                .thenReturn(Optional.of(systemNotice(tenantB, TARGET_ALL, false)));

        getSystemNotice(UserRole.CLIENT).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value(ENTITY_NOT_FOUND))
                .andExpect(jsonPath("$.status").value(404));

        verify(systemNotificationRepository).findByTenantIdAndId(eq(tenantA), eq(noticeId));
        verify(systemNotificationRepository, never()).findByTenantIdAndId(eq(tenantB), eq(noticeId));
        verify(systemNotificationRepository, never()).incrementViewCount(any());
        verify(readRepository, never()).save(any());
    }

    @Test
    @DisplayName("CLIENT가 CONSULTANT 대상 공지 상세는 404, 조회수·읽음 미기록")
    void clientCaller_consultantTarget_returns404() throws Exception {
        when(systemNotificationRepository.findByTenantIdAndId(eq(tenantA), eq(noticeId)))
                .thenReturn(Optional.of(systemNotice(tenantA, TARGET_CONSULTANT, false)));

        getSystemNotice(UserRole.CLIENT).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value(ENTITY_NOT_FOUND))
                .andExpect(jsonPath("$.status").value(404));

        verify(systemNotificationRepository, never()).incrementViewCount(any());
        verify(readRepository, never()).save(any());
    }

    @Test
    @DisplayName("CONSULTANT가 CONSULTANT 대상 공지 상세는 200")
    void consultantCaller_consultantTarget_returns200() throws Exception {
        SystemNotification notice = systemNotice(tenantA, TARGET_CONSULTANT, false);
        when(systemNotificationRepository.findByTenantIdAndId(eq(tenantA), eq(noticeId)))
                .thenReturn(Optional.of(notice));

        getSystemNotice(UserRole.CONSULTANT).andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(noticeId))
                .andExpect(jsonPath("$.data.targetType").value(TARGET_CONSULTANT));

        verify(systemNotificationRepository).incrementViewCount(eq(noticeId));
    }

    @Test
    @DisplayName("CLIENT가 ALL 대상 공지 상세는 200")
    void clientCaller_allTarget_returns200() throws Exception {
        SystemNotification notice = systemNotice(tenantA, TARGET_ALL, false);
        when(systemNotificationRepository.findByTenantIdAndId(eq(tenantA), eq(noticeId)))
                .thenReturn(Optional.of(notice));

        getSystemNotice(UserRole.CLIENT).andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(noticeId))
                .andExpect(jsonPath("$.data.targetType").value(TARGET_ALL));

        verify(systemNotificationRepository).incrementViewCount(eq(noticeId));
    }

    @Test
    @DisplayName("CLIENT가 CLIENT 대상 공지 상세는 200")
    void clientCaller_clientTarget_returns200() throws Exception {
        SystemNotification notice = systemNotice(tenantA, TARGET_CLIENT, false);
        when(systemNotificationRepository.findByTenantIdAndId(eq(tenantA), eq(noticeId)))
                .thenReturn(Optional.of(notice));

        getSystemNotice(UserRole.CLIENT).andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(noticeId))
                .andExpect(jsonPath("$.data.targetType").value(TARGET_CLIENT));

        verify(systemNotificationRepository).incrementViewCount(eq(noticeId));
    }

    @Test
    @DisplayName("현재 테넌트의 시스템 공지 상세는 200")
    void visibleSystemNotice_returns200() throws Exception {
        SystemNotification notice = systemNotice(tenantA, TARGET_ALL, false);
        when(systemNotificationRepository.findByTenantIdAndId(eq(tenantA), eq(noticeId)))
                .thenReturn(Optional.of(notice));

        getSystemNotice(UserRole.CLIENT).andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(noticeId))
                .andExpect(jsonPath("$.data.title").value(notice.getTitle()))
                .andExpect(jsonPath("$.data.notificationType").value("WELLNESS"));

        verify(systemNotificationRepository).incrementViewCount(eq(noticeId));
    }

    @Test
    @DisplayName("CLIENT가 CONSULTANT 대상 공지 읽음 POST는 404, 읽음 미기록")
    void clientCaller_consultantTarget_markAsRead_returns404() throws Exception {
        when(systemNotificationRepository.findByTenantIdAndId(eq(tenantA), eq(noticeId)))
                .thenReturn(Optional.of(systemNotice(tenantA, TARGET_CONSULTANT, false)));

        postSystemNoticeRead(UserRole.CLIENT).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value(ENTITY_NOT_FOUND))
                .andExpect(jsonPath("$.status").value(404));

        verify(readRepository, never()).save(any());
        verify(systemNotificationRepository, never()).incrementViewCount(any());
    }

    @Test
    @DisplayName("삭제된 웰니스 알림 상세는 404")
    void deletedWellnessNotice_returns404() throws Exception {
        when(notificationRepository.findByTenantIdAndIdAndRecipientUserIdAndIsDeletedFalse(
                eq(tenantA), eq(noticeId), eq(userId)))
                .thenReturn(Optional.of(wellnessNotice(tenantA, userId, true)));

        getWellnessNotice().andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value(ENTITY_NOT_FOUND))
                .andExpect(jsonPath("$.status").value(404));

        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("없는 웰니스 알림 ID 상세는 404")
    void missingWellnessNotice_returns404() throws Exception {
        when(notificationRepository.findByTenantIdAndIdAndRecipientUserIdAndIsDeletedFalse(
                eq(tenantA), eq(noticeId), eq(userId)))
                .thenReturn(Optional.empty());

        getWellnessNotice().andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value(ENTITY_NOT_FOUND))
                .andExpect(jsonPath("$.status").value(404));

        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("다른 테넌트 웰니스 알림 상세는 404")
    void otherTenantWellnessNotice_returns404() throws Exception {
        when(notificationRepository.findByTenantIdAndIdAndRecipientUserIdAndIsDeletedFalse(
                eq(tenantA), eq(noticeId), eq(userId)))
                .thenReturn(Optional.of(wellnessNotice(tenantB, userId, false)));

        getWellnessNotice().andExpect(status().isNotFound())
                .andExpect(jsonPath("$.errorCode").value(ENTITY_NOT_FOUND))
                .andExpect(jsonPath("$.status").value(404));

        verify(notificationRepository).findByTenantIdAndIdAndRecipientUserIdAndIsDeletedFalse(
                eq(tenantA), eq(noticeId), eq(userId));
        verify(notificationRepository, never()).findByTenantIdAndIdAndRecipientUserIdAndIsDeletedFalse(
                eq(tenantB), any(), any());
        verify(notificationRepository, never()).save(any());
    }

    @Test
    @DisplayName("현재 테넌트 수신자의 웰니스 알림 상세는 200")
    void visibleWellnessNotice_returns200() throws Exception {
        Notification notice = wellnessNotice(tenantA, userId, false);
        when(notificationRepository.findByTenantIdAndIdAndRecipientUserIdAndIsDeletedFalse(
                eq(tenantA), eq(noticeId), eq(userId)))
                .thenReturn(Optional.of(notice));

        getWellnessNotice().andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(noticeId))
                .andExpect(jsonPath("$.data.title").value(notice.getTitle()))
                .andExpect(jsonPath("$.data.notificationType").value(NotificationType.WELLNESS.getCode()));
    }

    private ResultActions getSystemNotice(UserRole role) throws Exception {
        return mockMvc.perform(get(SYSTEM_NOTICE_PATH, noticeId)
                .session(session(caller(role)))
                .accept(MediaType.APPLICATION_JSON));
    }

    private ResultActions postSystemNoticeRead(UserRole role) throws Exception {
        return mockMvc.perform(post(SYSTEM_NOTICE_READ_PATH, noticeId)
                .session(session(caller(role)))
                .accept(MediaType.APPLICATION_JSON));
    }

    private ResultActions getWellnessNotice() throws Exception {
        return mockMvc.perform(get(WELLNESS_NOTICE_PATH, noticeId)
                .session(session(caller(UserRole.CLIENT)))
                .accept(MediaType.APPLICATION_JSON));
    }

    private User caller(UserRole role) {
        User user = new User();
        user.setId(userId);
        user.setRole(role);
        user.setTenantId(tenantA);
        return user;
    }

    private static MockHttpSession session(User user) {
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        session.setAttribute(SessionConstants.TENANT_ID, user.getTenantId());
        return session;
    }

    private SystemNotification systemNotice(String tenantId, String targetType, boolean deleted) {
        SystemNotification notice = new SystemNotification();
        notice.setId(noticeId);
        notice.setTenantId(tenantId);
        notice.setTargetType(targetType);
        notice.setTitle("웰니스 공지 " + noticeId);
        notice.setContent("본문");
        notice.setNotificationType("WELLNESS");
        notice.setIsDeleted(deleted);
        notice.setAuthorId(userId);
        notice.setViewCount(0);
        return notice;
    }

    private Notification wellnessNotice(String tenantId, Long recipientUserId, boolean deleted) {
        return Notification.builder()
                .id(noticeId)
                .tenantId(tenantId)
                .recipientUserId(recipientUserId)
                .notificationType(NotificationType.WELLNESS)
                .title("웰니스 알림 " + noticeId)
                .body("본문")
                .status(Notification.STATUS_SENT)
                .isDeleted(deleted)
                .build();
    }

    private static long positiveId(long raw) {
        long value = Math.floorMod(raw, 1_000_000_000L);
        return value == 0L ? 1L : value;
    }
}
