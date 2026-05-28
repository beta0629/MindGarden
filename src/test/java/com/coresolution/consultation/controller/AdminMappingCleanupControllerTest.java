package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.PendingPaymentBulkCleanupRequest;
import com.coresolution.consultation.dto.PendingPaymentCleanupRequest;
import com.coresolution.consultation.dto.PendingPaymentCleanupResult;
import com.coresolution.consultation.dto.PendingPaymentDirtyMappingItem;
import com.coresolution.consultation.dto.PendingPaymentDirtyMappingPage;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AdminMappingCleanupService;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 옵션 B R4 — AdminMappingCleanupController 단위 테스트.
 *
 * <p>합의서: {@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN.md}.
 *
 * <p>매트릭스 (총 9 시나리오):
 * <ol>
 *   <li>조회 0건 — 200 + items=[]</li>
 *   <li>조회 5건 — 200 + items.size()=5</li>
 *   <li>페이지네이션 — page/size 파라미터가 서비스로 그대로 전달</li>
 *   <li>권한 거부 — 본 테스트는 컨트롤러 단위, Spring Security 어노테이션 검증은 통합 테스트에서</li>
 *   <li>tenantId 격리 — 서비스 IllegalStateException 발생 시 컨트롤러는 전파 (전역 핸들러 위임)</li>
 *   <li>단건 정리 — 200 + 결과 반환</li>
 *   <li>단건 정리 409 — IllegalStateException 발생 시 HTTP 409</li>
 *   <li>일괄 50건 — 정상 처리</li>
 *   <li>일괄 51건 — 서비스 단계의 IllegalArgumentException 전파</li>
 * </ol>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminMappingCleanupController (R4 PENDING_PAYMENT 매핑 정리 컨트롤러)")
class AdminMappingCleanupControllerTest {

    private static final String ACTOR_NAME = "관리자K";
    private static final String CLEANUP_REASON = "결제 미입금 24h 경과 정리합니다";

    @Mock private AdminMappingCleanupService adminMappingCleanupService;
    @Mock private HttpSession session;

    @InjectMocks
    private AdminMappingCleanupController controller;

    private User adminUser;
    private MockedStatic<com.coresolution.consultation.utils.SessionUtils> sessionUtilsStatic;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(999L);
        adminUser.setName(ACTOR_NAME);

        sessionUtilsStatic = Mockito.mockStatic(
                com.coresolution.consultation.utils.SessionUtils.class);
        sessionUtilsStatic.when(() ->
                        com.coresolution.consultation.utils.SessionUtils.getCurrentUser(any()))
                .thenReturn(adminUser);
    }

    @AfterEach
    void tearDown() {
        sessionUtilsStatic.close();
    }

    @Test
    @DisplayName("조회 0건 — 200 + 빈 items")
    void getDirtyPendingPaymentMappings_emptyResult() {
        PendingPaymentDirtyMappingPage page = PendingPaymentDirtyMappingPage.builder()
                .items(Collections.emptyList())
                .totalElements(0)
                .totalPages(0)
                .page(0)
                .size(20)
                .ageHours(24L)
                .build();
        when(adminMappingCleanupService.getDirtyPendingPaymentMappings(eq(24L), eq(0), eq(20)))
                .thenReturn(page);

        ResponseEntity<ApiResponse<PendingPaymentDirtyMappingPage>> response =
                controller.getDirtyPendingPaymentMappings(24L, 0, 20);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData().getItems()).isEmpty();
    }

    @Test
    @DisplayName("조회 5건 — items.size()=5")
    void getDirtyPendingPaymentMappings_fiveItems() {
        List<PendingPaymentDirtyMappingItem> items = Arrays.asList(
                buildItem(1L), buildItem(2L), buildItem(3L), buildItem(4L), buildItem(5L));
        PendingPaymentDirtyMappingPage page = PendingPaymentDirtyMappingPage.builder()
                .items(items)
                .totalElements(5)
                .totalPages(1)
                .page(0)
                .size(20)
                .ageHours(24L)
                .build();
        when(adminMappingCleanupService.getDirtyPendingPaymentMappings(anyLong(), eq(0), eq(20)))
                .thenReturn(page);

        ResponseEntity<ApiResponse<PendingPaymentDirtyMappingPage>> response =
                controller.getDirtyPendingPaymentMappings(24L, 0, 20);

        assertThat(response.getBody().getData().getItems()).hasSize(5);
        assertThat(response.getBody().getData().getTotalElements()).isEqualTo(5);
    }

    @Test
    @DisplayName("페이지네이션 — page=2, size=10 파라미터가 서비스로 그대로 전달")
    void getDirtyPendingPaymentMappings_pagination() {
        when(adminMappingCleanupService.getDirtyPendingPaymentMappings(eq(48L), eq(2), eq(10)))
                .thenReturn(PendingPaymentDirtyMappingPage.builder()
                        .items(Collections.emptyList())
                        .page(2)
                        .size(10)
                        .ageHours(48L)
                        .build());

        controller.getDirtyPendingPaymentMappings(48L, 2, 10);

        verify(adminMappingCleanupService, times(1))
                .getDirtyPendingPaymentMappings(48L, 2, 10);
    }

    @Test
    @DisplayName("tenantId 격리 — 서비스 IllegalStateException 발생 시 전파 (전역 핸들러 위임)")
    void getDirtyPendingPaymentMappings_tenantMissing_propagates() {
        when(adminMappingCleanupService.getDirtyPendingPaymentMappings(anyLong(), anyInt(), anyInt()))
                .thenAnswer(inv -> { throw new IllegalStateException("Tenant ID missing"); });

        try {
            controller.getDirtyPendingPaymentMappings(24L, 0, 20);
            assertThat(false).as("Expected IllegalStateException").isTrue();
        } catch (IllegalStateException ex) {
            assertThat(ex.getMessage()).contains("Tenant");
        }
    }

    @Test
    @DisplayName("단건 정리 — 200 + 결과 반환 + 세션 actor 가 서비스 호출에 전달")
    void cleanupPendingPaymentMapping_success() {
        PendingPaymentCleanupResult expected = PendingPaymentCleanupResult.builder()
                .mappingId(101L)
                .successMappingIds(List.of(101L))
                .failedMappingIds(List.of())
                .cancelledScheduleCount(1)
                .notifiedClientCount(1)
                .message("ok")
                .build();
        when(adminMappingCleanupService.cleanupPendingPaymentMapping(
                eq(101L), anyString(), any(), eq(ACTOR_NAME))).thenReturn(expected);

        PendingPaymentCleanupRequest req = PendingPaymentCleanupRequest.builder()
                .reason(CLEANUP_REASON)
                .notifyClient(true)
                .build();
        ResponseEntity<ApiResponse<PendingPaymentCleanupResult>> response =
                controller.cleanupPendingPaymentMapping(101L, req, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getMappingId()).isEqualTo(101L);
        verify(adminMappingCleanupService).cleanupPendingPaymentMapping(
                101L, CLEANUP_REASON, Boolean.TRUE, ACTOR_NAME);
    }

    @Test
    @DisplayName("단건 정리 409 — IllegalStateException 발생 시 HTTP 409 응답")
    void cleanupPendingPaymentMapping_conflict() {
        when(adminMappingCleanupService.cleanupPendingPaymentMapping(
                anyLong(), anyString(), any(), anyString()))
                .thenThrow(new IllegalStateException("PENDING_PAYMENT 상태가 아닌 매칭"));

        PendingPaymentCleanupRequest req = PendingPaymentCleanupRequest.builder()
                .reason(CLEANUP_REASON)
                .notifyClient(false)
                .build();
        ResponseEntity<ApiResponse<PendingPaymentCleanupResult>> response =
                controller.cleanupPendingPaymentMapping(202L, req, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
        assertThat(response.getBody().isSuccess()).isFalse();
    }

    @Test
    @DisplayName("일괄 정리 — 50건 정상 처리 + 결과 successMappingIds/failedMappingIds 분리")
    void bulkCleanupPendingPaymentMappings_50_success() {
        List<Long> ids = java.util.stream.LongStream.rangeClosed(1, 50).boxed().toList();
        PendingPaymentCleanupResult expected = PendingPaymentCleanupResult.builder()
                .successMappingIds(ids)
                .failedMappingIds(List.of())
                .cancelledScheduleCount(0)
                .notifiedClientCount(0)
                .message("총 50건 정리")
                .build();
        when(adminMappingCleanupService.bulkCleanupPendingPaymentMappings(
                eq(ids), anyString(), any(), anyString())).thenReturn(expected);

        PendingPaymentBulkCleanupRequest req = PendingPaymentBulkCleanupRequest.builder()
                .mappingIds(ids)
                .reason(CLEANUP_REASON)
                .notifyClient(false)
                .build();
        ResponseEntity<ApiResponse<PendingPaymentCleanupResult>> response =
                controller.bulkCleanupPendingPaymentMappings(req, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData().getSuccessMappingIds()).hasSize(50);
        verify(adminMappingCleanupService).bulkCleanupPendingPaymentMappings(
                ids, CLEANUP_REASON, Boolean.FALSE, ACTOR_NAME);
    }

    @Test
    @DisplayName("일괄 정리 51건 — 서비스의 IllegalArgumentException 전파")
    void bulkCleanupPendingPaymentMappings_51_throws() {
        List<Long> ids = java.util.stream.LongStream.rangeClosed(1, 51).boxed().toList();
        when(adminMappingCleanupService.bulkCleanupPendingPaymentMappings(
                eq(ids), anyString(), any(), anyString()))
                .thenThrow(new IllegalArgumentException("최대 50건"));

        PendingPaymentBulkCleanupRequest req = PendingPaymentBulkCleanupRequest.builder()
                .mappingIds(ids)
                .reason(CLEANUP_REASON)
                .notifyClient(false)
                .build();
        try {
            controller.bulkCleanupPendingPaymentMappings(req, session);
            assertThat(false).as("Expected IllegalArgumentException").isTrue();
        } catch (IllegalArgumentException ex) {
            assertThat(ex.getMessage()).contains("50");
        }
    }

    @Test
    @DisplayName("세션 actor 없음 — 'ADMIN_CLEANUP' 기본 식별자로 서비스 호출")
    void cleanupPendingPaymentMapping_noSessionActor_usesDefault() {
        sessionUtilsStatic.reset();
        sessionUtilsStatic.when(() ->
                        com.coresolution.consultation.utils.SessionUtils.getCurrentUser(any()))
                .thenReturn(null);
        when(adminMappingCleanupService.cleanupPendingPaymentMapping(
                anyLong(), anyString(), any(), eq("ADMIN_CLEANUP")))
                .thenReturn(PendingPaymentCleanupResult.builder().mappingId(303L).build());

        PendingPaymentCleanupRequest req = PendingPaymentCleanupRequest.builder()
                .reason(CLEANUP_REASON)
                .notifyClient(true)
                .build();
        ResponseEntity<ApiResponse<PendingPaymentCleanupResult>> response =
                controller.cleanupPendingPaymentMapping(303L, req, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(adminMappingCleanupService).cleanupPendingPaymentMapping(
                303L, CLEANUP_REASON, Boolean.TRUE, "ADMIN_CLEANUP");
    }

    private PendingPaymentDirtyMappingItem buildItem(Long id) {
        return PendingPaymentDirtyMappingItem.builder()
                .mappingId(id)
                .consultantName("상담사" + id)
                .clientName("내담자" + id)
                .packageName("패키지" + id)
                .packagePrice(500_000L)
                .totalSessions(10)
                .elapsedHours(30L)
                .status("PENDING_PAYMENT")
                .paymentStatus("PENDING")
                .build();
    }
}
