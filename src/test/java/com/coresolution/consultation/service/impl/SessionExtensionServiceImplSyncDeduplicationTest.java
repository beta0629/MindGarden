package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.SessionExtensionRequestRepository;
import com.coresolution.consultation.service.EmailService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * SessionExtensionServiceImpl — Phase 1 (1A) Java 단일 sync 경로 검증.
 *
 * <p>PL/SQL {@code AddSessionsToMapping} 폐기 후 {@code syncAfterSessionExtension} 만 1회 호출.</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionExtensionServiceImpl Java 단일 sync 경로 테스트")
class SessionExtensionServiceImplSyncDeduplicationTest {

    private static final String TENANT_ID = "tenant-test-sse";
    private static final Long REQUEST_ID = 100L;
    private static final Long MAPPING_ID = 200L;
    private static final Integer ADDITIONAL_SESSIONS = 5;
    private static final Long ADMIN_ID = 40L;

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
    @DisplayName("completeRequest: Java sync(syncAfterSessionExtension) 정확히 1회 호출")
    void completeRequest_callsJavaSyncExactlyOnce() {
        SessionExtensionRequest request = buildApprovedRequest();
        when(requestRepository.findByTenantIdAndId(eq(TENANT_ID), eq(REQUEST_ID)))
                .thenReturn(Optional.of(request));
        when(requestRepository.save(any(SessionExtensionRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        sessionExtensionService.completeRequest(REQUEST_ID);

        verify(sessionSyncService, times(1)).syncAfterSessionExtension(any(SessionExtensionRequest.class));
    }

    @Test
    @DisplayName("confirmPayment: 동일 요청 재확인 시 회기를 중복 합산하지 않는다")
    void confirmPayment_preventsDuplicateSessionSync() {
        SessionExtensionRequest request = buildPendingRequest();
        User admin = new User();
        admin.setId(ADMIN_ID);
        when(requestRepository.findByTenantIdAndIdForUpdate(eq(TENANT_ID), eq(REQUEST_ID)))
                .thenReturn(Optional.of(request));
        when(userService.findActiveById(ADMIN_ID)).thenReturn(Optional.of(admin));
        when(requestRepository.save(any(SessionExtensionRequest.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        sessionExtensionService.confirmPayment(
                REQUEST_ID,
                ADMIN_ID,
                "BANK_TRANSFER",
                "TEST-REFERENCE");

        assertThrows(
                IllegalStateException.class,
                () -> sessionExtensionService.confirmPayment(
                        REQUEST_ID,
                        ADMIN_ID,
                        "BANK_TRANSFER",
                        "TEST-REFERENCE"));
        verify(sessionSyncService, times(1)).syncAfterSessionExtension(any(SessionExtensionRequest.class));
    }

    @Test
    @DisplayName("pendingPayment: 현재 테넌트 조건으로만 대기 요청을 조회한다")
    void getPendingPaymentRequests_usesCurrentTenant() {
        when(requestRepository.findPendingPaymentRequests(TENANT_ID))
                .thenReturn(Collections.emptyList());

        sessionExtensionService.getPendingPaymentRequests();

        verify(requestRepository).findPendingPaymentRequests(TENANT_ID);
    }

    private SessionExtensionRequest buildApprovedRequest() {
        return buildRequest(SessionExtensionRequest.ExtensionStatus.ADMIN_APPROVED);
    }

    private SessionExtensionRequest buildPendingRequest() {
        return buildRequest(SessionExtensionRequest.ExtensionStatus.PENDING);
    }

    private SessionExtensionRequest buildRequest(SessionExtensionRequest.ExtensionStatus status) {
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

        return SessionExtensionRequest.builder()
                .id(REQUEST_ID)
                .tenantId(TENANT_ID)
                .mapping(mapping)
                .requester(requester)
                .additionalSessions(ADDITIONAL_SESSIONS)
                .packageName("테스트패키지")
                .packagePrice(new BigDecimal("100000"))
                .status(status)
                .reason("단위 테스트 - Phase 1 1A")
                .build();
    }
}
