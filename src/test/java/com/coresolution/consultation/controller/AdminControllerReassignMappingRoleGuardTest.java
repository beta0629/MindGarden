package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ScheduleReassignMappingCandidateResponse;
import com.coresolution.consultation.dto.ScheduleReassignMappingPreviewResponse;
import com.coresolution.consultation.dto.ScheduleReassignMappingRequest;
import com.coresolution.consultation.dto.ScheduleReassignMappingResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.consultation.service.support.ResourceOwnerAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 배정 변경(회기 정정) API — ADMIN only, STAFF·CONSULTANT 403.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminController 배정 변경 — ADMIN only 역할 가드")
class AdminControllerReassignMappingRoleGuardTest {

    private static final String TENANT_ID = "tenant-reassign-admin";
    private static final Long SCHEDULE_ID = 501L;
    private static final Long TARGET_MAPPING_ID = 200L;

    @Mock private ScheduleService scheduleService;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private AdminController controller;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        ClientPathAccessGuard clientPathAccessGuard = spy(new ClientPathAccessGuard(mappingRepository, userRepository));
        ResourceOwnerAccessGuard resourceOwnerAccessGuard =
                mock(ResourceOwnerAccessGuard.class, Answers.CALLS_REAL_METHODS);
        ReflectionTestUtils.setField(resourceOwnerAccessGuard, "clientPathAccessGuard", clientPathAccessGuard);
        ReflectionTestUtils.setField(resourceOwnerAccessGuard, "mappingRepository", mappingRepository);
        ReflectionTestUtils.setField(controller, "clientPathAccessGuard", clientPathAccessGuard);
        ReflectionTestUtils.setField(controller, "resourceOwnerAccessGuard", resourceOwnerAccessGuard);

        when(scheduleService.reassignScheduleMapping(anyLong(), anyLong(), any(), any()))
                .thenReturn(ScheduleReassignMappingResponse.builder()
                        .scheduleId(SCHEDULE_ID)
                        .originMappingId(100L)
                        .targetMappingId(TARGET_MAPPING_ID)
                        .cancelRecommended(true)
                        .build());
        when(scheduleService.findReassignMappingCandidates(SCHEDULE_ID))
                .thenReturn(List.of(ScheduleReassignMappingCandidateResponse.builder()
                        .mappingId(TARGET_MAPPING_ID)
                        .totalSessions(10)
                        .usedSessions(0)
                        .remainingSessions(10)
                        .status("ACTIVE")
                        .build()));
        when(scheduleService.previewReassignMapping(eq(SCHEDULE_ID), eq(TARGET_MAPPING_ID)))
                .thenReturn(ScheduleReassignMappingPreviewResponse.builder()
                        .scheduleId(SCHEDULE_ID)
                        .targetMappingId(TARGET_MAPPING_ID)
                        .cancelRecommended(true)
                        .build());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("ADMIN — POST reassign-mapping 200")
    void admin_reassign_ok() {
        ScheduleReassignMappingRequest request = ScheduleReassignMappingRequest.builder()
                .targetMappingId(TARGET_MAPPING_ID)
                .reason("패키지 정정")
                .build();

        ResponseEntity<ApiResponse<ScheduleReassignMappingResponse>> response =
                controller.reassignScheduleMapping(SCHEDULE_ID, request, sessionOf(1L, UserRole.ADMIN));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getTargetMappingId()).isEqualTo(TARGET_MAPPING_ID);
        verify(scheduleService).reassignScheduleMapping(
                eq(SCHEDULE_ID), eq(TARGET_MAPPING_ID), eq("패키지 정정"), eq(1L));
    }

    @Test
    @DisplayName("STAFF — POST reassign-mapping 403, 서비스 미호출")
    void staff_reassign_forbidden() {
        ScheduleReassignMappingRequest request = ScheduleReassignMappingRequest.builder()
                .targetMappingId(TARGET_MAPPING_ID)
                .reason("패키지 정정")
                .build();

        assertThatThrownBy(() ->
                controller.reassignScheduleMapping(SCHEDULE_ID, request, sessionOf(2L, UserRole.STAFF)))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).reassignScheduleMapping(anyLong(), anyLong(), any(), any());
    }

    @Test
    @DisplayName("CONSULTANT — candidates·preview 403")
    void consultant_candidatesAndPreview_forbidden() {
        MockHttpSession session = sessionOf(3L, UserRole.CONSULTANT);

        assertThatThrownBy(() -> controller.getReassignMappingCandidates(SCHEDULE_ID, session))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> controller.previewReassignMappingGet(SCHEDULE_ID, TARGET_MAPPING_ID, session))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).findReassignMappingCandidates(anyLong());
        verify(scheduleService, never()).previewReassignMapping(anyLong(), anyLong());
    }

    @Test
    @DisplayName("ADMIN — candidates·preview GET 200")
    void admin_candidatesAndPreview_ok() {
        MockHttpSession session = sessionOf(1L, UserRole.ADMIN);

        ResponseEntity<ApiResponse<List<ScheduleReassignMappingCandidateResponse>>> candidates =
                controller.getReassignMappingCandidates(SCHEDULE_ID, session);
        ResponseEntity<ApiResponse<ScheduleReassignMappingPreviewResponse>> preview =
                controller.previewReassignMappingGet(SCHEDULE_ID, TARGET_MAPPING_ID, session);

        assertThat(candidates.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(preview.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(scheduleService).findReassignMappingCandidates(SCHEDULE_ID);
        verify(scheduleService).previewReassignMapping(SCHEDULE_ID, TARGET_MAPPING_ID);
    }

    private MockHttpSession sessionOf(Long userId, UserRole role) {
        User user = new User();
        user.setId(userId);
        user.setRole(role);
        user.setTenantId(TENANT_ID);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        session.setAttribute(SessionConstants.TENANT_ID, TENANT_ID);
        return session;
    }
}
