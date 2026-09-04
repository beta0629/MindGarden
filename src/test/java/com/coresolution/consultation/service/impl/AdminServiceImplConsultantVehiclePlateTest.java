package com.coresolution.consultation.service.impl;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ConsultantRegistrationRequest;
import com.coresolution.consultation.dto.ResolvedProfessionalRegistration;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.service.ProfessionalProviderTypeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.UserLifecycleService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.VehiclePlateText;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.util.StatusCodeHelper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link AdminServiceImpl} 상담사 등록/수정 시 {@code vehiclePlate} 정규화·저장 검증.
 * 내담자 {@link AdminServiceImplUpdateClientTest} 차량번호 경로와 대칭.
 *
 * @author CoreSolution
 * @since 2026-09-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminServiceImpl 상담사 vehiclePlate")
class AdminServiceImplConsultantVehiclePlateTest {

    private static final String TENANT_ID = "tenant-consultant-plate-" + UUID.randomUUID();
    private static final String RAW_PLATE = "  12가  3456  ";

    @Mock private UserRepository userRepository;
    @Mock private ConsultantRepository consultantRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private ConsultantRatingRepository consultantRatingRepository;
    @Mock private ConsultantRatingService consultantRatingService;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock private CommonCodeRepository commonCodeRepository;
    @Mock private CommonCodeService commonCodeService;
    @Mock private PasswordService passwordService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private BranchService branchService;
    @Mock private NotificationService notificationService;
    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private CardMerchantFeeResolutionService cardMerchantFeeResolutionService;
    @Mock private PaymentMethodSsotService paymentMethodSsotService;
    @Mock private RealTimeStatisticsService realTimeStatisticsService;
    @Mock private FinancialTransactionRepository financialTransactionRepository;
    @Mock private AmountManagementService amountManagementService;
    @Mock private StoredProcedureService storedProcedureService;
    @Mock private UserRoleAssignmentRepository userRoleAssignmentRepository;
    @Mock private TenantRoleRepository tenantRoleRepository;
    @Mock private UserRoleQueryService userRoleQueryService;
    @Mock private StatusCodeHelper statusCodeHelper;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private ConsultantStatsService consultantStatsService;
    @Mock private ClientStatsService clientStatsService;
    @Mock private NotificationChannelPreferenceResolutionService notificationChannelPreferenceResolutionService;
    @Mock private PasswordResetService passwordResetService;
    @Mock private PlatformTransactionManager transactionManager;
    @Mock private UserIdGenerator userIdGenerator;
    @Mock private UserService userService;
    @Mock private ConsultantSalaryProfileRepository consultantSalaryProfileRepository;
    @Mock private ScheduleService scheduleService;
    @Mock private com.coresolution.consultation.service.SalaryLateSessionAutoSyncService salaryLateSessionAutoSyncService;
    @Mock private ProfessionalProviderTypeService professionalProviderTypeService;
    @Mock private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private RefundAutoCancelNotificationService refundAutoCancelNotificationService;
    @Mock private UserLifecycleService userLifecycleService;
    @Mock private com.coresolution.consultation.service.AdminRequestIdempotencyService adminRequestIdempotencyService;
    @Mock private com.coresolution.consultation.service.SalaryTaxRateLookupService salaryTaxRateLookupService;

    @InjectMocks
    private AdminServiceImpl adminService;

    @BeforeEach
    void setTenantContext() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("registerConsultant: vehiclePlate가 정규화되어 Consultant에 저장된다")
    void registerConsultant_normalizesAndPersistsVehiclePlate() {
        ConsultantRegistrationRequest request = ConsultantRegistrationRequest.builder()
                .email("consultant-plate-" + UUID.randomUUID() + "@test.com")
                .name("상담사차량")
                .vehiclePlate(RAW_PLATE)
                .build();

        when(professionalProviderTypeService.resolve(eq(TENANT_ID), any(), any()))
                .thenReturn(new ResolvedProfessionalRegistration("CONSULTANT", UserRole.CONSULTANT));
        when(userIdGenerator.generateUniqueUserId(anyString(), eq(TENANT_ID))).thenReturn("uid-c-plate-1");
        when(userRepository.findByTenantIdAndUserIdAndIsActive(eq(TENANT_ID), anyString(), eq(false)))
                .thenReturn(Optional.empty());
        when(encryptionUtil.safeEncrypt(anyString())).thenAnswer(inv -> "enc:" + inv.getArgument(0));
        when(passwordService.encodeSecret(anyString())).thenReturn("hashed-temp");
        when(tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(userPersonalDataCacheService.decryptAndCacheUserPersonalData(any(User.class)))
                .thenReturn(Collections.emptyMap());
        doNothing().when(consultantStatsService).evictAllConsultantStatsCache();
        when(passwordResetService.sendPasswordResetEmail(anyString())).thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(88_001L);
            return u;
        });

        User result = adminService.registerConsultant(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved).isInstanceOf(Consultant.class);
        assertThat(((Consultant) saved).getVehiclePlate())
                .isEqualTo(VehiclePlateText.normalizeOrNull(RAW_PLATE));
        assertThat(result).isInstanceOf(Consultant.class);
        assertThat(((Consultant) result).getVehiclePlate())
                .isEqualTo(VehiclePlateText.normalizeOrNull(RAW_PLATE));
    }

    @Test
    @DisplayName("updateConsultant: vehiclePlate가 정규화되어 기존 Consultant에 반영된다")
    void updateConsultant_normalizesAndPersistsVehiclePlate() {
        Long id = 55_101L;
        Consultant existing = new Consultant();
        existing.setId(id);
        existing.setTenantId(TENANT_ID);
        existing.setRole(UserRole.CONSULTANT);
        existing.setIsActive(true);
        existing.setVehiclePlate(null);

        ConsultantRegistrationRequest request = new ConsultantRegistrationRequest();
        request.setVehiclePlate(RAW_PLATE);

        when(consultantRepository.findByTenantIdAndId(TENANT_ID, id)).thenReturn(Optional.of(existing));
        when(consultantRepository.save(any(Consultant.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(userPersonalDataCacheService).evictUserPersonalDataCache(TENANT_ID, id);
        doNothing().when(consultantStatsService).evictAllConsultantStatsCache();

        User result = adminService.updateConsultant(id, request);

        ArgumentCaptor<Consultant> captor = ArgumentCaptor.forClass(Consultant.class);
        verify(consultantRepository).save(captor.capture());
        Consultant saved = captor.getValue();
        assertThat(saved.getVehiclePlate()).isEqualTo(VehiclePlateText.normalizeOrNull(RAW_PLATE));
        assertThat(result).isInstanceOf(Consultant.class);
        assertThat(((Consultant) result).getVehiclePlate())
                .isEqualTo(VehiclePlateText.normalizeOrNull(RAW_PLATE));
    }

    @Test
    @DisplayName("updateConsultant: vehiclePlate가 null이면 기존 값을 유지한다")
    void updateConsultant_nullPlate_keepsExisting() {
        Long id = 55_102L;
        String existingPlate = "서울12가3456";
        Consultant existing = new Consultant();
        existing.setId(id);
        existing.setTenantId(TENANT_ID);
        existing.setRole(UserRole.CONSULTANT);
        existing.setIsActive(true);
        existing.setVehiclePlate(existingPlate);

        ConsultantRegistrationRequest request = new ConsultantRegistrationRequest();
        request.setVehiclePlate(null);

        when(consultantRepository.findByTenantIdAndId(TENANT_ID, id)).thenReturn(Optional.of(existing));
        when(consultantRepository.save(any(Consultant.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(userPersonalDataCacheService).evictUserPersonalDataCache(TENANT_ID, id);
        doNothing().when(consultantStatsService).evictAllConsultantStatsCache();

        User result = adminService.updateConsultant(id, request);

        assertThat(((Consultant) result).getVehiclePlate()).isEqualTo(existingPlate);
    }

    @Test
    @DisplayName("updateConsultant: 공백만 vehiclePlate면 null로 정규화되어 저장된다")
    void updateConsultant_blankPlate_clearsToNull() {
        Long id = 55_103L;
        Consultant existing = new Consultant();
        existing.setId(id);
        existing.setTenantId(TENANT_ID);
        existing.setRole(UserRole.CONSULTANT);
        existing.setIsActive(true);
        existing.setVehiclePlate("12가 3456");

        ConsultantRegistrationRequest request = new ConsultantRegistrationRequest();
        request.setVehiclePlate("   ");

        when(consultantRepository.findByTenantIdAndId(TENANT_ID, id)).thenReturn(Optional.of(existing));
        when(consultantRepository.save(any(Consultant.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(userPersonalDataCacheService).evictUserPersonalDataCache(TENANT_ID, id);
        doNothing().when(consultantStatsService).evictAllConsultantStatsCache();

        User result = adminService.updateConsultant(id, request);

        assertThat(((Consultant) result).getVehiclePlate()).isNull();
    }
}
