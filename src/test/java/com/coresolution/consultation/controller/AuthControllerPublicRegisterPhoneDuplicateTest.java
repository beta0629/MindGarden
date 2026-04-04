package com.coresolution.consultation.controller;

import java.util.UUID;

import com.coresolution.consultation.dto.RegisterRequest;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRepository;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.service.PermissionGroupService;
import com.coresolution.core.service.UserRoleQueryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

/**
 * 공개 회원가입 POST {@code /api/v1/auth/register} 에서
 * {@link UserService#existsPhoneDuplicateForPublicSignup(String, String)} 가 true 이면
 * 가입이 거절되고 {@link UserService#registerUser} 가 호출되지 않아야 한다.
 *
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthController 공개 회원가입 전화 중복 거절")
class AuthControllerPublicRegisterPhoneDuplicateTest {

    private static final String TENANT_ID = UUID.randomUUID().toString();

    @Mock
    private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserSocialAccountRepository userSocialAccountRepository;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private AuthService authService;
    @Mock
    private BranchService branchService;
    @Mock
    private UserSessionService userSessionService;
    @Mock
    private DynamicPermissionService dynamicPermissionService;
    @Mock
    private UserService userService;
    @Mock
    private UserRoleQueryService userRoleQueryService;
    @Mock
    private TenantRoleRepository tenantRoleRepository;
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock
    private PermissionGroupService permissionGroupService;
    @Mock
    private Environment environment;

    @InjectMocks
    private AuthController authController;

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("전화번호가 테넌트 내 중복이면 IllegalArgumentException 및 registerUser 미호출")
    void register_whenPhoneDuplicate_throwsAndDoesNotRegister() {
        String email = "reg-phone-dup-" + UUID.randomUUID() + "@example.com";
        RegisterRequest request = RegisterRequest.builder()
            .email(email)
            .password("SecretPass1!")
            .confirmPassword("SecretPass1!")
            .name("가입자")
            .phone("010-9999-8888")
            .agreeTerms(true)
            .agreePrivacy(true)
            .build();

        when(userRepository.existsByTenantIdAndEmail(TENANT_ID, email.toLowerCase())).thenReturn(false);
        when(userService.existsPhoneDuplicateForPublicSignup("01099998888", TENANT_ID)).thenReturn(true);

        try (MockedStatic<TenantContextHolder> tenant = org.mockito.Mockito.mockStatic(TenantContextHolder.class)) {
            tenant.when(TenantContextHolder::getTenantId).thenReturn(TENANT_ID);

            assertThatThrownBy(() -> authController.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("전화");

            verify(userService).existsPhoneDuplicateForPublicSignup("01099998888", TENANT_ID);
            verify(userService, never()).registerUser(any());
            verifyNoMoreInteractions(userService);
        }
    }
}
