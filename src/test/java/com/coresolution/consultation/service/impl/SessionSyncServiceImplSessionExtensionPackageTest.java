package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;

import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.SessionExtensionRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.SessionExtensionRequestRepository;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * syncAfterSessionExtension — 동일 패키지 승계·가변 회기/금액 분리 검증.
 *
 * @author CoreSolution
 * @since 2026-07-17
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SessionSyncServiceImpl.syncAfterSessionExtension 패키지 승계")
class SessionSyncServiceImplSessionExtensionPackageTest {

    private static final String TENANT_ID = "tenant-ext-pkg";

    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private SessionExtensionRequestRepository requestRepository;
    @Mock
    private ScheduleRepository scheduleRepository;

    @InjectMocks
    private SessionSyncServiceImpl sessionSyncService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("입금확인 동기화: 하이브리드 패키지명 유지, +N만 합산, used 유지")
    void syncAfterSessionExtension_keepsHybridPackage_addsVariableSessions() {
        User consultant = new User();
        consultant.setId(1L);
        User client = new User();
        client.setId(2L);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(32L);
        mapping.setTenantId(TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setPackageName("기본10회 + 커플상담");
        mapping.setPackagePrice(800_000L);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(2);
        mapping.setRemainingSessions(8);
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);

        User requester = new User();
        requester.setId(3L);

        // PENDING #1/#2 호환: 요청에 다른 packageName/금액이 있어도 매핑 패키지는 덮어쓰지 않음
        SessionExtensionRequest extensionRequest = SessionExtensionRequest.builder()
                .id(101L)
                .tenantId(TENANT_ID)
                .mapping(mapping)
                .requester(requester)
                .additionalSessions(5)
                .packageName("다른패키지선택값")
                .packagePrice(new BigDecimal("400000"))
                .status(SessionExtensionRequest.ExtensionStatus.COMPLETED)
                .reason("5회만 추가")
                .build();

        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        sessionSyncService.syncAfterSessionExtension(extensionRequest);

        assertThat(mapping.getPackageName()).isEqualTo("기본10회 + 커플상담");
        assertThat(mapping.getPackagePrice()).isEqualTo(800_000L);
        assertThat(mapping.getUsedSessions()).isEqualTo(2);
        assertThat(mapping.getTotalSessions()).isEqualTo(15);
        assertThat(mapping.getRemainingSessions()).isEqualTo(13);
        verify(mappingRepository).save(mapping);
    }
}
