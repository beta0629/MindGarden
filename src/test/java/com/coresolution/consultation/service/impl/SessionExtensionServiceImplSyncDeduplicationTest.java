package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.SessionExtensionRequestRepository;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.PlSqlMappingSyncService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
 * SessionExtensionServiceImpl - PL/SQL + Java sync 이중 적용 방지 단위 테스트.
 *
 * <p>SSOT 핫픽스 2026-05-26 (P0-A): {@code completeRequest} 에서 PL/SQL 성공 시 Java sync
 * 가 추가로 호출되어 {@code mapping.addSessions()} 가 두 번 적용되던 회귀를 방지한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionExtensionServiceImpl PL/SQL + Java sync 이중 적용 방지 테스트")
class SessionExtensionServiceImplSyncDeduplicationTest {

    private static final String TENANT_ID = "tenant-test-sse";
    private static final Long REQUEST_ID = 100L;
    private static final Long MAPPING_ID = 200L;
    private static final Integer ADDITIONAL_SESSIONS = 5;

    @Mock
    private SessionExtensionRequestRepository requestRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private UserService userService;
    @Mock
    private SessionSyncService sessionSyncService;
    @Mock
    private EmailService emailService;
    @Mock
    private RealTimeStatisticsService realTimeStatisticsService;
    @Mock
    private PlSqlMappingSyncService plSqlMappingSyncService;

    @InjectMocks
    private SessionExtensionServiceImpl sessionExtensionService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("completeRequest: PL/SQL 성공 시 Java sync(syncAfterSessionExtension) 미호출 (이중 적용 방지)")
    void completeRequest_whenPlSqlSucceeds_doesNotCallJavaSync() {
        SessionExtensionRequest request = buildPendingRequest();
        when(requestRepository.findByTenantIdAndId(eq(TENANT_ID), eq(REQUEST_ID)))
                .thenReturn(Optional.of(request));
        when(requestRepository.save(any(SessionExtensionRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(plSqlMappingSyncService.addSessionsToMapping(
                eq(MAPPING_ID), eq(ADDITIONAL_SESSIONS), anyString(), anyLong(), anyString()))
                .thenReturn(Map.of("success", true, "message", "PL/SQL OK"));

        sessionExtensionService.completeRequest(REQUEST_ID);

        verify(plSqlMappingSyncService, times(1)).addSessionsToMapping(
                eq(MAPPING_ID), eq(ADDITIONAL_SESSIONS), anyString(), anyLong(), anyString());
        verify(sessionSyncService, never()).syncAfterSessionExtension(any(SessionExtensionRequest.class));
    }

    @Test
    @DisplayName("completeRequest: PL/SQL 실패 시 Java sync 폴백을 정확히 1회 호출")
    void completeRequest_whenPlSqlFails_callsJavaSyncExactlyOnce() {
        SessionExtensionRequest request = buildPendingRequest();
        when(requestRepository.findByTenantIdAndId(eq(TENANT_ID), eq(REQUEST_ID)))
                .thenReturn(Optional.of(request));
        when(requestRepository.save(any(SessionExtensionRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(plSqlMappingSyncService.addSessionsToMapping(
                eq(MAPPING_ID), eq(ADDITIONAL_SESSIONS), anyString(), anyLong(), anyString()))
                .thenReturn(Map.of("success", false, "message", "프로시저 없음"));

        sessionExtensionService.completeRequest(REQUEST_ID);

        verify(plSqlMappingSyncService, times(1)).addSessionsToMapping(
                eq(MAPPING_ID), eq(ADDITIONAL_SESSIONS), anyString(), anyLong(), anyString());
        verify(sessionSyncService, times(1)).syncAfterSessionExtension(any(SessionExtensionRequest.class));
    }

    @Test
    @DisplayName("completeRequest: PL/SQL 성공 시 mapping.addSessions 누적 결과는 +n 한 번만 (Java sync 미호출)")
    void completeRequest_whenPlSqlSucceeds_mappingAddSessionsNotInvokedByJava() {
        SessionExtensionRequest request = buildPendingRequest();
        ConsultantClientMapping mapping = request.getMapping();
        int initialTotal = mapping.getTotalSessions();
        int initialRemaining = mapping.getRemainingSessions();

        when(requestRepository.findByTenantIdAndId(eq(TENANT_ID), eq(REQUEST_ID)))
                .thenReturn(Optional.of(request));
        when(requestRepository.save(any(SessionExtensionRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(plSqlMappingSyncService.addSessionsToMapping(
                eq(MAPPING_ID), anyInt(), anyString(), anyLong(), anyString()))
                .thenReturn(Map.of("success", true, "message", "PL/SQL OK"));

        sessionExtensionService.completeRequest(REQUEST_ID);

        // Java sync 가 호출되지 않으므로 mapping.addSessions() 가 추가 적용되지 않아야 한다.
        // (PL/SQL 은 DB 직접 수정이므로 in-memory mapping entity 는 변경되지 않음이 정상)
        org.assertj.core.api.Assertions.assertThat(mapping.getTotalSessions()).isEqualTo(initialTotal);
        org.assertj.core.api.Assertions.assertThat(mapping.getRemainingSessions()).isEqualTo(initialRemaining);
        verify(sessionSyncService, never()).syncAfterSessionExtension(any(SessionExtensionRequest.class));
    }

    private SessionExtensionRequest buildPendingRequest() {
        User consultant = new User();
        consultant.setId(10L);
        User client = new User();
        client.setId(20L);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(0);
        mapping.setRemainingSessions(10);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        mapping.setTenantId(TENANT_ID);

        User requester = new User();
        requester.setId(30L);

        SessionExtensionRequest request = SessionExtensionRequest.builder()
                .id(REQUEST_ID)
                .tenantId(TENANT_ID)
                .mapping(mapping)
                .requester(requester)
                .additionalSessions(ADDITIONAL_SESSIONS)
                .packageName("테스트패키지")
                .packagePrice(new BigDecimal("100000"))
                .status(SessionExtensionRequest.ExtensionStatus.ADMIN_APPROVED)
                .reason("단위 테스트 - 핫픽스 P0-A")
                .build();
        return request;
    }
}
