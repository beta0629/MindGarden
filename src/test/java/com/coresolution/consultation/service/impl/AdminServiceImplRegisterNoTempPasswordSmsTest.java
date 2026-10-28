package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ClientRegistrationRequest;
import com.coresolution.consultation.dto.ConsultantRegistrationRequest;
import com.coresolution.consultation.dto.ResolvedProfessionalRegistration;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.PartnerInstitutionRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.ProfessionalProviderTypeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.support.TemporaryPasswordGenerator;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * 내담자·상담사 등록 시 임시 비밀번호 SMS 미발송 정책.
 * {@code ClientCredentialNotificationService} 필드/호출이 AdminServiceImpl 등록 경로에서 제거되었으므로
 * 등록 결과의 {@code smsSent} 가 설정되지 않고 {@code isPasswordChanged=false} 로 남는지 검증한다.
 *
 * @author MindGarden
 * @since 2026-10-28
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminServiceImpl 등록 — 임시 비밀번호 SMS 미발송")
class AdminServiceImplRegisterNoTempPasswordSmsTest {

    private static final String TENANT = "tenant-reg-no-sms";

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
    @Mock private PasswordResetService passwordResetService;
    @Mock private PlatformTransactionManager transactionManager;
    @Mock private UserIdGenerator userIdGenerator;
    @Mock private UserService userService;
    @Mock private PartnerInstitutionRepository partnerInstitutionRepository;
    @Mock private TemporaryPasswordGenerator temporaryPasswordGenerator;
    @Mock private ProfessionalProviderTypeService professionalProviderTypeService;

    @InjectMocks
    private AdminServiceImpl adminService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT);
        lenient().when(temporaryPasswordGenerator.generate()).thenReturn("Kp9@mxzw");
        ReflectionTestUtils.setField(adminService, "temporaryPasswordGenerator", temporaryPasswordGenerator);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("registerClient: 임시 비밀번호는 저장하되 smsSent 미설정(문자 미발송)")
    void registerClient_doesNotMarkSmsSent() {
        ClientRegistrationRequest request = new ClientRegistrationRequest();
        request.setPhone("010-1111-2222");
        request.setPassword("");

        when(userService.existsPhoneDuplicateForPublicSignup("01011112222", TENANT)).thenReturn(false);
        when(userRepository.existsByTenantIdAndEmail(eq(TENANT), anyString())).thenReturn(false);
        when(userIdGenerator.generateUniqueUserIdFromPhone("01011112222", TENANT)).thenReturn("01011112222");
        when(passwordService.encodeSecret(anyString())).thenReturn("hashed-temp");
        when(encryptionUtil.safeEncrypt(anyString())).thenAnswer(inv -> "enc:" + inv.getArgument(0));
        when(tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(userPersonalDataCacheService.decryptAndCacheUserPersonalData(any(User.class)))
                .thenReturn(Collections.emptyMap());
        doNothing().when(clientStatsService).evictAllClientStatsCache();
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(701L);
            return u;
        });

        Client result = adminService.registerClient(request);

        assertThat(result.getId()).isEqualTo(701L);
        assertThat(result.getSmsSent()).isNull();
        assertThat(result.getSmsSkipReason()).isNull();
        verify(userRepository).saveAndFlush(any(User.class));
        assertThat(hasClientCredentialNotificationField())
                .as("등록 SMS 전용 주입 필드가 없어야 함(deliverAfterCommit 경로 없음)")
                .isFalse();
    }

    @Test
    @DisplayName("registerConsultant: 임시 비밀번호는 저장하되 smsSent 미설정(문자 미발송)")
    void registerConsultant_doesNotMarkSmsSent() {
        ConsultantRegistrationRequest request = ConsultantRegistrationRequest.builder()
                .email("consultant-nosms-" + UUID.randomUUID() + "@test.com")
                .name("상담사문자미발송")
                .phone("01033334444")
                .build();

        when(professionalProviderTypeService.resolve(eq(TENANT), any(), any()))
                .thenReturn(new ResolvedProfessionalRegistration("CONSULTANT", UserRole.CONSULTANT));
        when(userIdGenerator.generateUniqueUserId(anyString(), eq(TENANT))).thenReturn("uid-c-nosms");
        when(userRepository.findByTenantIdAndUserIdAndIsActive(eq(TENANT), anyString(), eq(false)))
                .thenReturn(Optional.empty());
        when(encryptionUtil.safeEncrypt(anyString())).thenAnswer(inv -> "enc:" + inv.getArgument(0));
        when(passwordService.encodeSecret(anyString())).thenReturn("hashed-temp");
        when(tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(userPersonalDataCacheService.decryptAndCacheUserPersonalData(any(User.class)))
                .thenReturn(Collections.emptyMap());
        doNothing().when(consultantStatsService).evictAllConsultantStatsCache();
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(88_002L);
            return u;
        });

        User result = adminService.registerConsultant(request);

        assertThat(result.getId()).isEqualTo(88_002L);
        assertThat(result.getIsPasswordChanged()).isFalse();
        assertThat(result.getSmsSent()).isNull();
        assertThat(result.getSmsSkipReason()).isNull();
        assertThat(hasClientCredentialNotificationField())
                .as("등록 SMS 전용 주입 필드가 없어야 함(deliverAfterCommit 경로 없음)")
                .isFalse();
    }

    private static boolean hasClientCredentialNotificationField() {
        try {
            AdminServiceImpl.class.getDeclaredField("clientCredentialNotificationService");
            return true;
        } catch (NoSuchFieldException ex) {
            return false;
        }
    }
}
