package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Optional;

import com.coresolution.consultation.constant.ClientRegistrationConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ClientRegistrationRequest;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.util.StatusCodeHelper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * {@link AdminServiceImpl#registerClient} 연락처(이메일·휴대폰) 분기 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-04-07
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl registerClient 연락처")
class AdminServiceImplRegisterClientContactTest {

    private static final String TENANT = "tenant-reg-1";

    @Mock
    private UserRepository userRepository;
    @Mock
    private ConsultantRepository consultantRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ConsultantRatingRepository consultantRatingRepository;
    @Mock
    private ConsultantRatingService consultantRatingService;
    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private CommonCodeRepository commonCodeRepository;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private PasswordService passwordService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock
    private ConsultationMessageService consultationMessageService;
    @Mock
    private BranchService branchService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private FinancialTransactionService financialTransactionService;
    @Mock
    private RealTimeStatisticsService realTimeStatisticsService;
    @Mock
    private FinancialTransactionRepository financialTransactionRepository;
    @Mock
    private AmountManagementService amountManagementService;
    @Mock
    private StoredProcedureService storedProcedureService;
    @Mock
    private UserRoleAssignmentRepository userRoleAssignmentRepository;
    @Mock
    private TenantRoleRepository tenantRoleRepository;
    @Mock
    private UserRoleQueryService userRoleQueryService;
    @Mock
    private StatusCodeHelper statusCodeHelper;
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock
    private ConsultantStatsService consultantStatsService;
    @Mock
    private ClientStatsService clientStatsService;
    @Mock
    private PasswordResetService passwordResetService;
    @Mock
    private PlatformTransactionManager transactionManager;
    @Mock
    private UserIdGenerator userIdGenerator;
    @Mock
    private UserService userService;

    @InjectMocks
    private AdminServiceImpl adminService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("전화만: 합성 이메일·generateUniqueUserIdFromPhone 사용")
    void phoneOnly_usesSyntheticEmailAndPhoneUserId() {
        ClientRegistrationRequest request = new ClientRegistrationRequest();
        request.setPhone("010-9876-5432");
        request.setPassword("");

        when(userService.existsPhoneDuplicateForPublicSignup("01098765432", TENANT)).thenReturn(false);
        when(userRepository.existsByTenantIdAndEmail(eq(TENANT), anyString())).thenReturn(false);
        when(userIdGenerator.generateUniqueUserIdFromPhone("01098765432", TENANT)).thenReturn("01098765432");
        when(passwordService.encodeSecret(anyString())).thenReturn("hashed");
        when(encryptionUtil.safeEncrypt(anyString())).thenAnswer(inv -> "enc:" + inv.getArgument(0));
        when(tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(userPersonalDataCacheService.decryptAndCacheUserPersonalData(any(User.class)))
                .thenReturn(Collections.emptyMap());
        doNothing().when(clientStatsService).evictAllClientStatsCache();
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(501L);
            return u;
        });

        Client result = adminService.registerClient(request);

        assertThat(result.getId()).isEqualTo(501L);
        verify(userIdGenerator).generateUniqueUserIdFromPhone("01098765432", TENANT);
        verify(userIdGenerator, never()).generateUniqueUserId(anyString(), anyString());
        verify(userRepository).saveAndFlush(any(User.class));
    }

    @Test
    @DisplayName("이메일 중복 시 IllegalArgumentException")
    void duplicateEmail_rejects() {
        ClientRegistrationRequest request = new ClientRegistrationRequest();
        request.setEmail("dup@example.com");

        when(encryptionUtil.safeEncrypt("dup@example.com")).thenReturn("enc:dup@example.com");
        when(userRepository.existsByTenantIdAndEmail(TENANT, "enc:dup@example.com")).thenReturn(true);

        assertThatThrownBy(() -> adminService.registerClient(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(ClientRegistrationConstants.MSG_DUPLICATE_EMAIL);

        verify(userRepository, never()).saveAndFlush(any(User.class));
    }

    @Test
    @DisplayName("휴대폰 중복 시 IllegalArgumentException")
    void duplicatePhone_rejects() {
        ClientRegistrationRequest request = new ClientRegistrationRequest();
        request.setPhone("010-1111-2222");

        when(userService.existsPhoneDuplicateForPublicSignup("01011112222", TENANT)).thenReturn(true);

        assertThatThrownBy(() -> adminService.registerClient(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(ClientRegistrationConstants.MSG_DUPLICATE_PHONE);

        verify(userRepository, never()).saveAndFlush(any(User.class));
        verify(userIdGenerator, never()).generateUniqueUserIdFromPhone(anyString(), anyString());
    }

    @Test
    @DisplayName("휴대폰 형식 오류 시 IllegalArgumentException")
    void invalidPhone_rejects() {
        ClientRegistrationRequest request = new ClientRegistrationRequest();
        request.setPhone("02-1234-5678");

        assertThatThrownBy(() -> adminService.registerClient(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(ClientRegistrationConstants.MSG_INVALID_PHONE);

        verify(userService, never()).existsPhoneDuplicateForPublicSignup(anyString(), anyString());
        verify(userRepository, never()).saveAndFlush(any(User.class));
    }

    @Test
    @DisplayName("이메일만: generateUniqueUserId 사용, 전화 중복 검사 생략")
    void emailOnly_usesEmailUserId() {
        String uniqueEmail = "only-email-" + java.util.UUID.randomUUID() + "@test.com";
        ClientRegistrationRequest request = new ClientRegistrationRequest();
        request.setEmail(uniqueEmail);
        request.setPassword("");

        when(userRepository.existsByTenantIdAndEmail(TENANT, "enc:" + uniqueEmail)).thenReturn(false);
        when(userIdGenerator.generateUniqueUserId(uniqueEmail, TENANT)).thenReturn("uid-email-1");
        when(passwordService.encodeSecret(anyString())).thenReturn("hashed");
        when(encryptionUtil.safeEncrypt(anyString())).thenAnswer(inv -> "enc:" + inv.getArgument(0));
        when(tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(userPersonalDataCacheService.decryptAndCacheUserPersonalData(any(User.class)))
                .thenReturn(Collections.emptyMap());
        doNothing().when(clientStatsService).evictAllClientStatsCache();
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(502L);
            return u;
        });

        Client result = adminService.registerClient(request);

        assertThat(result.getId()).isEqualTo(502L);
        verify(userIdGenerator).generateUniqueUserId(uniqueEmail, TENANT);
        verify(userIdGenerator, never()).generateUniqueUserIdFromPhone(anyString(), anyString());
        verify(userService, never()).existsPhoneDuplicateForPublicSignup(anyString(), anyString());
    }

    @Test
    @DisplayName("이메일·휴대폰 모두: 전화 중복 검사 수행 후 이메일 기반 userId")
    void emailAndPhone_checksPhoneDuplicate_usesEmailUserId() {
        String uniqueEmail = "both-" + java.util.UUID.randomUUID() + "@test.com";
        ClientRegistrationRequest request = new ClientRegistrationRequest();
        request.setEmail(uniqueEmail);
        request.setPhone("010-2000-3000");
        request.setPassword("");

        when(userService.existsPhoneDuplicateForPublicSignup("01020003000", TENANT)).thenReturn(false);
        when(userRepository.existsByTenantIdAndEmail(TENANT, "enc:" + uniqueEmail)).thenReturn(false);
        when(userIdGenerator.generateUniqueUserId(uniqueEmail, TENANT)).thenReturn("uid-both-1");
        when(passwordService.encodeSecret(anyString())).thenReturn("hashed");
        when(encryptionUtil.safeEncrypt(anyString())).thenAnswer(inv -> "enc:" + inv.getArgument(0));
        when(tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(userPersonalDataCacheService.decryptAndCacheUserPersonalData(any(User.class)))
                .thenReturn(Collections.emptyMap());
        doNothing().when(clientStatsService).evictAllClientStatsCache();
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(503L);
            return u;
        });

        Client result = adminService.registerClient(request);

        assertThat(result.getId()).isEqualTo(503L);
        verify(userService).existsPhoneDuplicateForPublicSignup("01020003000", TENANT);
        verify(userIdGenerator).generateUniqueUserId(uniqueEmail, TENANT);
        verify(userIdGenerator, never()).generateUniqueUserIdFromPhone(anyString(), anyString());
    }
}
