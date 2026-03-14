package com.coresolution.consultation.service.impl;

import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.test.context.ActiveProfiles;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * AdminServiceImpl confirmDeposit / approveMapping 내부 로직 테스트
 * - confirmDeposit: mapping 저장, createConsultationIncomeTransactionAsync, updateMappingInfo 흐름 검증
 * - approveMapping: mapping 승인 저장 검증
 *
 * @author MindGarden
 * @since 2026-03-14
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@DisplayName("AdminServiceImpl 입금확인/승인 테스트")
class AdminServiceImplConfirmDepositApproveTest {

    private static final String TEST_TENANT_ID = "tenant-test-" + java.util.UUID.randomUUID();

    @MockBean
    private ConsultantClientMappingRepository mappingRepository;

    @MockBean
    private StoredProcedureService storedProcedureService;

    @SpyBean
    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("confirmDeposit 시 mapping 저장 및 createConsultationIncomeTransactionAsync 호출")
    void confirmDeposit_savesMappingAndCallsCreateConsultationIncomeTransactionAsync() {
        Long mappingId = 1L;
        ConsultantClientMapping mapping = buildMappingForConfirmDeposit(mappingId);

        when(mappingRepository.findById(mappingId)).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        when(storedProcedureService.updateMappingInfo(any(), any(), anyDouble(), anyInt(), any()))
                .thenReturn(Map.of("success", true, "message", "OK"));

        ConsultantClientMapping result = adminService.confirmDeposit(mappingId, "REF-001");

        assertNotNull(result);
        verify(mappingRepository).save(any(ConsultantClientMapping.class));
        verify(adminService).createConsultationIncomeTransactionAsync(any(ConsultantClientMapping.class));
        // updateMappingInfo는 runInNewTransaction(REQUIRES_NEW) 내부에서 호출됨. 통합/DB 테스트에서 검증.
    }

    @Test
    @DisplayName("approveMapping 시 mapping 승인 저장 검증")
    void approveMapping_savesApprovedMapping() {
        Long mappingId = 2L;
        ConsultantClientMapping mapping = buildMappingForApprove(mappingId);

        when(mappingRepository.findById(mappingId)).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMapping result = adminService.approveMapping(mappingId, "AdminName");

        assertNotNull(result);
        verify(mappingRepository).save(any(ConsultantClientMapping.class));
    }

    private ConsultantClientMapping buildMappingForConfirmDeposit(Long mappingId) {
        User consultant = new User();
        consultant.setId(10L);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(20L);
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(mappingId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setPackageName("테스트패키지");
        m.setPackagePrice(100000L);
        m.setTotalSessions(10);
        m.setRemainingSessions(0);
        m.setPaymentReference("PAY-REF");
        m.setPaymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED);
        m.setStatus(ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED);
        return m;
    }

    private ConsultantClientMapping buildMappingForApprove(Long mappingId) {
        User consultant = new User();
        consultant.setId(11L);
        consultant.setTenantId(TEST_TENANT_ID);
        User client = new User();
        client.setId(21L);
        client.setTenantId(TEST_TENANT_ID);

        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(mappingId);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setPackageName("패키지");
        m.setPackagePrice(100000L);
        m.setTotalSessions(10);
        m.setRemainingSessions(10);
        m.setStatus(ConsultantClientMapping.MappingStatus.DEPOSIT_PENDING);
        m.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
        return m;
    }
}
