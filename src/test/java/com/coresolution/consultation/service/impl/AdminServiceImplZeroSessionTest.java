package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.core.context.TenantContextHolder;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("0회기 및 커스텀 회기수 결제 시나리오 검증")
class AdminServiceImplZeroSessionTest {

    private static final String TEST_TENANT_ID = "tenant-test-zero-session";

    @Mock private UserRepository userRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private AmountManagementService amountManagementService;
    @Mock private StoredProcedureService storedProcedureService;
    @Mock private ScheduleService scheduleService;
    @Mock private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private PlatformTransactionManager transactionManager;

    // We need to spy on the injected mock to mock void methods like createConsultationIncomeTransactionAsync
    @InjectMocks
    private AdminServiceImpl adminServiceReal;

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        adminService = Mockito.spy(adminServiceReal);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("0회기 패키지 createMapping 시 remainingSessions가 0으로 유지되는지 검증")
    void createMapping_ZeroSession_MaintainsZeroRemainingSessions() {
        User consultant = new User(); consultant.setId(10L); consultant.setTenantId(TEST_TENANT_ID);
        User client = new User(); client.setId(20L); client.setTenantId(TEST_TENANT_ID);

        when(userRepository.findByTenantIdAndId(TEST_TENANT_ID, 10L)).thenReturn(Optional.of(consultant));
        when(userRepository.findByTenantIdAndId(TEST_TENANT_ID, 20L)).thenReturn(Optional.of(client));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMappingCreateRequest dto = ConsultantClientMappingCreateRequest.builder()
                .consultantId(10L)
                .clientId(20L)
                .totalSessions(0)
                .packageName("단순 검사(0회기)")
                .packagePrice(50000L)
                .paymentAmount(50000L)
                .build();

        ConsultantClientMapping result = adminService.createMapping(dto);

        assertNotNull(result);
        assertEquals(0, result.getTotalSessions());
        assertEquals(0, result.getRemainingSessions());
        assertEquals("단순 검사(0회기)", result.getPackageName());
        assertEquals(50000L, result.getPackagePrice());
    }

    @Test
    @DisplayName("0회기 패키지 confirmDeposit 시 remainingSessions가 0으로 유지되고 예외가 발생하지 않는지 검증")
    void confirmDeposit_ZeroSession_NoDivisionByZero() {
        Long mappingId = 1L;
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTotalSessions(0);
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);
        mapping.setPackagePrice(50000L);
        mapping.setPaymentAmount(50000L);
        mapping.setTenantId(TEST_TENANT_ID);
        mapping.setConsultant(new User());
        mapping.setClient(new User());

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, mappingId)).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        when(storedProcedureService.updateMappingInfo(any(), any(), anyDouble(), anyInt(), any()))
                .thenReturn(Map.of("success", true, "message", "OK"));

        ConsultantClientMapping result = adminService.confirmDeposit(mappingId, "REF-001");

        assertNotNull(result);
        assertEquals(0, result.getRemainingSessions());
        verify(adminService).createConsultationIncomeTransactionAsync(mapping);
        verify(storedProcedureService).updateMappingInfo(eq(mappingId), any(), eq(50000.0), eq(0), any());
    }

    @Test
    @DisplayName("검사(0회기) + 상담(1회기) 조합 패키지(totalSessions=1) 결제 및 트랜잭션 정상 동작 검증")
    void confirmDeposit_CustomSessionCombination_WorksCorrectly() {
        Long mappingId = 2L;
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTotalSessions(1);
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);
        mapping.setPackageName("검사 + 상담(1회기)");
        mapping.setPackagePrice(150000L);
        mapping.setPaymentAmount(150000L);
        mapping.setTenantId(TEST_TENANT_ID);
        mapping.setConsultant(new User());
        mapping.setClient(new User());

        when(mappingRepository.findByTenantIdAndId(TEST_TENANT_ID, mappingId)).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        when(storedProcedureService.updateMappingInfo(any(), any(), anyDouble(), anyInt(), any()))
                .thenReturn(Map.of("success", true, "message", "OK"));

        ConsultantClientMapping result = adminService.confirmDeposit(mappingId, "REF-002");

        assertNotNull(result);
        // totalSessions가 1이므로 remainingSessions가 1로 채워져야 함
        assertEquals(1, result.getRemainingSessions());
        verify(adminService).createConsultationIncomeTransactionAsync(mapping);
        verify(storedProcedureService).updateMappingInfo(eq(mappingId), any(), eq(150000.0), eq(1), any());
    }
}
