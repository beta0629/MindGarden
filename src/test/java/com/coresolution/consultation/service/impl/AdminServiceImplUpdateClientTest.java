package com.coresolution.consultation.service.impl;

import java.util.Collections;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ClientRegistrationRequest;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
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
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.VehiclePlateText;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link AdminServiceImpl#updateClient} — clients 행이 없을 때 신규 저장 및 차량번호 반영 검증.
 *
 * @author MindGarden
 * @since 2026-03-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl updateClient")
class AdminServiceImplUpdateClientTest {

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
    private PasswordEncoder passwordEncoder;
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
    void setTenantContext() {
        TenantContextHolder.setTenantId("tenant-ut-1");
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("Client 행이 없으면 save 호출되며 vehiclePlate가 정규화되어 저장된다")
    void updateClient_whenNoClientRow_savesNewClientWithVehiclePlate() {
        Long id = 42L;
        String tenantId = "tenant-ut-1";

        User clientUser = User.builder()
                .userId("u1")
                .email("enc-mail")
                .password("x")
                .name("enc-name")
                .role(UserRole.CLIENT)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        clientUser.setId(id);
        clientUser.setTenantId(tenantId);

        ClientRegistrationRequest request = new ClientRegistrationRequest();
        request.setVehiclePlate("  12가  3456  ");

        when(userRepository.findByTenantIdAndId(tenantId, id)).thenReturn(Optional.of(clientUser));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(tenantId, id)).thenReturn(Optional.empty());
        when(clientRepository.findById(id)).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(userPersonalDataCacheService).evictUserPersonalDataCache(tenantId, id);
        doNothing().when(clientStatsService).evictAllClientStatsCache();

        Client result = adminService.updateClient(id, request);

        ArgumentCaptor<Client> captor = ArgumentCaptor.forClass(Client.class);
        verify(clientRepository).save(captor.capture());
        Client saved = captor.getValue();
        assertThat(saved.getId()).isEqualTo(id);
        assertThat(saved.getTenantId()).isEqualTo(tenantId);
        assertThat(saved.getVehiclePlate()).isEqualTo(VehiclePlateText.normalizeOrNull(request.getVehiclePlate()));
        assertThat(result.getVehiclePlate()).isEqualTo(saved.getVehiclePlate());
    }

    @Test
    @DisplayName("Client 신규 저장 시 User와 동일한 긴 암호문(500자 근접)이 Client에 그대로 복사된다")
    void updateClient_whenNoClientRow_copiesLongEncryptedPiiFromUser() {
        Long id = 99L;
        String tenantId = "tenant-ut-1";
        String longVal = "c".repeat(480);

        User clientUser = User.builder()
                .userId("u-long")
                .email(longVal)
                .password("x")
                .name(longVal)
                .phone(longVal)
                .role(UserRole.CLIENT)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        clientUser.setId(id);
        clientUser.setTenantId(tenantId);
        clientUser.setGender(longVal);
        clientUser.setAddress(longVal);

        ClientRegistrationRequest request = new ClientRegistrationRequest();

        when(userRepository.findByTenantIdAndId(tenantId, id)).thenReturn(Optional.of(clientUser));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(tenantId, id)).thenReturn(Optional.empty());
        when(clientRepository.findById(id)).thenReturn(Optional.empty());
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(userPersonalDataCacheService).evictUserPersonalDataCache(tenantId, id);
        doNothing().when(clientStatsService).evictAllClientStatsCache();

        adminService.updateClient(id, request);

        ArgumentCaptor<Client> captor = ArgumentCaptor.forClass(Client.class);
        verify(clientRepository).save(captor.capture());
        Client saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo(longVal);
        assertThat(saved.getName()).isEqualTo(longVal);
        assertThat(saved.getPhone()).isEqualTo(longVal);
        assertThat(saved.getGender()).isEqualTo(longVal);
        assertThat(saved.getAddress()).isEqualTo(longVal);
    }

    @Test
    @DisplayName("Client 행이 소프트 삭제만 되어 있으면 restore 후 UPDATE 경로로 저장된다 (신규 INSERT FK 실패 방지)")
    void updateClient_whenClientRowSoftDeleted_restoresAndUpdates() {
        Long id = 715L;
        String tenantId = "tenant-ut-1";

        User clientUser = User.builder()
                .userId("u715")
                .email("enc-e")
                .password("x")
                .name("enc-n")
                .phone("enc-p")
                .role(UserRole.CLIENT)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        clientUser.setId(id);
        clientUser.setTenantId(tenantId);

        Client existing = new Client();
        existing.setId(id);
        existing.setTenantId(tenantId);
        existing.setIsDeleted(true);
        existing.setEmail("old");
        existing.setName("old");
        existing.setPhone("old");

        ClientRegistrationRequest request = new ClientRegistrationRequest();

        when(userRepository.findByTenantIdAndId(tenantId, id)).thenReturn(Optional.of(clientUser));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(tenantId, id)).thenReturn(Optional.of(existing));
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(userPersonalDataCacheService).evictUserPersonalDataCache(tenantId, id);
        doNothing().when(clientStatsService).evictAllClientStatsCache();

        adminService.updateClient(id, request);

        assertThat(existing.getIsDeleted()).isFalse();
        assertThat(existing.getDeletedAt()).isNull();
        assertThat(existing.getName()).isEqualTo("enc-n");
        assertThat(existing.getEmail()).isEqualTo("enc-e");
        assertThat(existing.getPhone()).isEqualTo("enc-p");
    }

    @Test
    @DisplayName("IncludingDeleted가 비어도 findById로 같은 PK 행이 있으면 UPDATE이며 tenant_id를 users에 맞춘다")
    void updateClient_whenTenantIdMismatchOnClientRow_repairsTenantAndUpdates() {
        Long id = 715L;
        String tenantId = "tenant-ut-1";

        User clientUser = User.builder()
                .userId("u715")
                .email("enc-e")
                .password("x")
                .name("enc-n")
                .phone("enc-p")
                .role(UserRole.CLIENT)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        clientUser.setId(id);
        clientUser.setTenantId(tenantId);

        Client existing = new Client();
        existing.setId(id);
        existing.setTenantId("legacy-wrong-tenant");
        existing.setIsDeleted(false);
        existing.setEmail("old");
        existing.setName("old");
        existing.setPhone("old");

        ClientRegistrationRequest request = new ClientRegistrationRequest();

        when(userRepository.findByTenantIdAndId(tenantId, id)).thenReturn(Optional.of(clientUser));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clientRepository.findByTenantIdAndIdIncludingDeleted(tenantId, id)).thenReturn(Optional.empty());
        when(clientRepository.findById(id)).thenReturn(Optional.of(existing));
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));
        doNothing().when(userPersonalDataCacheService).evictUserPersonalDataCache(tenantId, id);
        doNothing().when(clientStatsService).evictAllClientStatsCache();

        adminService.updateClient(id, request);

        assertThat(existing.getTenantId()).isEqualTo(tenantId);
        assertThat(existing.getName()).isEqualTo("enc-n");
        verify(clientRepository).save(existing);
    }

    @Test
    @DisplayName("registerClient: 저장되는 Client의 id가 User와 동일(users FK 정합)")
    void registerClient_savedClientIdMatchesUserId() {
        long assignedUserId = 94_001L;

        ClientRegistrationRequest request = new ClientRegistrationRequest();
        request.setEmail("NewClientReg@test.com");

        when(userIdGenerator.generateUniqueUserId(anyString(), anyString())).thenReturn("uid-reg-1");
        when(userRepository.existsByTenantIdAndEmail(anyString(), anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-pw");
        when(encryptionUtil.safeEncrypt(anyString())).thenAnswer(inv -> "enc:" + inv.getArgument(0));
        when(tenantRoleRepository.findByTenantIdAndNameEnAndIsDeletedFalse(anyString(), anyString()))
                .thenReturn(Optional.empty());
        when(userPersonalDataCacheService.decryptAndCacheUserPersonalData(any(User.class)))
                .thenReturn(Collections.emptyMap());
        doNothing().when(clientStatsService).evictAllClientStatsCache();
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(assignedUserId);
            return u;
        });

        Client result = adminService.registerClient(request);

        ArgumentCaptor<Client> captor = ArgumentCaptor.forClass(Client.class);
        verify(clientRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(assignedUserId);
        assertThat(result.getId()).isEqualTo(assignedUserId);
        verify(userRepository).saveAndFlush(any(User.class));
    }
}
