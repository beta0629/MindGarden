package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.OAuthExistingUserResolution;
import com.coresolution.consultation.dto.SocialUserInfo;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSocialAccount;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AbstractOAuth2Service createUserFromSocial")
class AbstractOAuth2ServiceCreateUserFromSocialTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private UserSocialAccountRepository userSocialAccountRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private DynamicPermissionService dynamicPermissionService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private PasswordService passwordService;
    @Mock
    private UserService userService;

    private TestOAuth2Service oauth2Service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId("tenant-oauth-ut");
        lenient().when(userSocialAccountRepository.findByTenantId(anyString())).thenReturn(Collections.emptyList());
        lenient().when(
            userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(
                anyString(), anyString(), anyString())
        ).thenReturn(Optional.empty());
        lenient().when(passwordService.encodeSecret(anyString())).thenAnswer(inv -> "ENC(" + inv.getArgument(0) + ")");
        oauth2Service = new TestOAuth2Service(
            userRepository,
            clientRepository,
            userSocialAccountRepository,
            jwtService,
            dynamicPermissionService,
            encryptionUtil,
            passwordService,
            userService
        );
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("성공: users 선저장 후 clients 저장, 마지막에 social account 저장")
    void createUserFromSocial_success_savesInExpectedOrder() {
        SocialUserInfo socialUserInfo = SocialUserInfo.builder()
            .providerUserId("provider-111")
            .email("oauth@test.com")
            .name("oauth-name")
            .nickname("oauth-nick")
            .profileImageUrl("https://profile")
            .accessToken("token-1")
            .build();

        when(encryptionUtil.safeEncrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(9001L);
            return user;
        });
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        Long userId = oauth2Service.createUserFromSocial(socialUserInfo);

        assertThat(userId).isEqualTo(9001L);
        InOrder inOrder = inOrder(userRepository, clientRepository, userSocialAccountRepository);
        inOrder.verify(userRepository).saveAndFlush(any(User.class));
        inOrder.verify(clientRepository).saveAndFlush(any(Client.class));
        inOrder.verify(userSocialAccountRepository).save(any(UserSocialAccount.class));
    }

    @Test
    @DisplayName("실패: users tenantId 불일치면 clients 저장 전에 예외를 던진다")
    void createUserFromSocial_tenantMismatch_throwsBeforeClientSave() {
        SocialUserInfo socialUserInfo = SocialUserInfo.builder()
            .providerUserId("provider-222")
            .email("oauth@test.com")
            .name("oauth-name")
            .build();

        when(encryptionUtil.safeEncrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(9002L);
            user.setTenantId("other-tenant");
            return user;
        });

        assertThatThrownBy(() -> oauth2Service.createUserFromSocial(socialUserInfo))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("tenantId 정합성 오류");

        verify(clientRepository, never()).saveAndFlush(any(Client.class));
    }

    @Test
    @DisplayName("findExistingUserByEmail은 소문자 정규형으로 저장소를 조회한다")
    void findExistingUserByEmail_usesNormalizedEmailForRepository() {
        User existing = User.builder()
            .userId("oauth-user-55")
            .email("a@b.com")
            .password("password123")
            .name("n")
            .role(UserRole.CLIENT)
            .build();
        existing.setId(55L);
        existing.setCreatedAt(LocalDateTime.now());

        when(userService.findAllUsersMatchingEmailInCurrentTenant("A@B.Com"))
            .thenReturn(Collections.singletonList(existing));

        Long found = oauth2Service.exposeFindExistingUserByEmail("A@B.Com");

        assertThat(found).isEqualTo(55L);
        verify(userService).findAllUsersMatchingEmailInCurrentTenant("A@B.Com");
    }

    @Test
    @DisplayName("findExistingUserByEmail: 빈 이메일이면 저장소를 호출하지 않는다")
    void findExistingUserByEmail_blankEmail_skipsRepository() {
        assertThat(oauth2Service.exposeFindExistingUserByEmail("  ")).isNull();
        verify(userService, never()).findAllUsersMatchingEmailInCurrentTenant(anyString());
    }

    @Test
    @DisplayName("createUserFromSocial: 혼합 대소문자 이메일은 암호화 전 소문자로 정규화된다")
    void createUserFromSocial_encryptsNormalizedLowercaseEmail() {
        SocialUserInfo socialUserInfo = SocialUserInfo.builder()
            .providerUserId("provider-333")
            .email("OAuth@Test.COM")
            .name("oauth-name")
            .nickname("oauth-nick")
            .profileImageUrl("https://profile")
            .accessToken("token-1")
            .build();

        when(encryptionUtil.safeEncrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(9101L);
            return user;
        });
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        Long userId = oauth2Service.createUserFromSocial(socialUserInfo);

        assertThat(userId).isEqualTo(9101L);
        verify(encryptionUtil).safeEncrypt(eq("oauth@test.com"));
    }

    @Test
    @DisplayName("resolveExistingUserForSocialLinkOrLogin: 전화가 이메일보다 우선하고, 전화 일치 시 이메일 조회를 하지 않는다")
    void resolveExistingUserForSocialLinkOrLogin_phonePreferredOverEmail() {
        SocialUserInfo socialUserInfo = SocialUserInfo.builder()
            .providerUserId("sns-new-1")
            .email("sns-email@provider.com")
            .phone("010-1111-2222")
            .build();
        socialUserInfo.normalizeData();

        User phoneUser = User.builder()
            .userId("phone-user")
            .email("admin@tenant.com")
            .password("p")
            .name("n")
            .role(UserRole.CLIENT)
            .build();
        phoneUser.setId(500L);
        phoneUser.setCreatedAt(LocalDateTime.now());

        when(userService.findAllUsersMatchingPhoneInCurrentTenant(eq("01011112222")))
            .thenReturn(Collections.singletonList(phoneUser));

        OAuthExistingUserResolution found =
            oauth2Service.resolveExistingUserForSocialLinkOrLogin(socialUserInfo);

        assertThat(found.getExistingUserId()).isEqualTo(500L);
        assertThat(found.isRequiresPhoneAccountSelection()).isFalse();
        verify(userService).findAllUsersMatchingPhoneInCurrentTenant(eq("01011112222"));
        verify(userService, never()).findAllUsersMatchingEmailInCurrentTenant(anyString());
    }

    @Test
    @DisplayName("resolveExistingUserForSocialLinkOrLogin: 전화 없음·동일 정규화 이메일에 상담사·내담자면 선택 필요(전화 선택 플로우 재사용)")
    void resolveExistingUserForSocialLinkOrLogin_emailAmbiguousConsultantAndClient_noPhone() {
        SocialUserInfo socialUserInfo = SocialUserInfo.builder()
            .providerUserId("sns-email-ambiguous-1")
            .email("Shared@Tenant.Com")
            .phone(null)
            .build();
        socialUserInfo.normalizeData();

        User consultant = User.builder()
            .userId("ec1")
            .email("c@t.com")
            .password("p")
            .name("n")
            .role(UserRole.CONSULTANT)
            .build();
        consultant.setId(1201L);
        consultant.setCreatedAt(LocalDateTime.now());

        User client = User.builder()
            .userId("ecl1")
            .email("cl@t.com")
            .password("p")
            .name("n2")
            .role(UserRole.CLIENT)
            .build();
        client.setId(1202L);
        client.setCreatedAt(LocalDateTime.now());

        when(userService.findAllUsersMatchingEmailInCurrentTenant(eq("shared@tenant.com")))
            .thenReturn(Arrays.asList(consultant, client));

        OAuthExistingUserResolution res = oauth2Service.resolveExistingUserForSocialLinkOrLogin(socialUserInfo);

        assertThat(res.isRequiresPhoneAccountSelection()).isTrue();
        assertThat(res.getPhoneMatchCandidateUserIds()).containsExactlyInAnyOrder(1201L, 1202L);
        assertThat(res.getExistingUserId()).isNull();
        verify(userService, never()).findAllUsersMatchingPhoneInCurrentTenant(anyString());
    }

    @Test
    @DisplayName("resolveExistingUserForSocialLinkOrLogin: 전화 미일치 시 이메일로 조회한다")
    void resolveExistingUserForSocialLinkOrLogin_fallsBackToEmailWhenNoPhoneMatch() {
        SocialUserInfo socialUserInfo = SocialUserInfo.builder()
            .providerUserId("sns-new-2")
            .email("only@email.com")
            .phone(null)
            .build();
        socialUserInfo.normalizeData();

        User emailUser = User.builder()
            .userId("email-only")
            .email("only@email.com")
            .password("p")
            .name("n")
            .role(UserRole.CLIENT)
            .build();
        emailUser.setId(600L);
        emailUser.setCreatedAt(LocalDateTime.now());

        when(userService.findAllUsersMatchingEmailInCurrentTenant(eq("only@email.com")))
            .thenReturn(Collections.singletonList(emailUser));

        OAuthExistingUserResolution found =
            oauth2Service.resolveExistingUserForSocialLinkOrLogin(socialUserInfo);

        assertThat(found.getExistingUserId()).isEqualTo(600L);
        verify(userService, never()).findAllUsersMatchingPhoneInCurrentTenant(anyString());
    }

    @Test
    @DisplayName("resolveExistingUserForSocialLinkOrLogin: 동일 전화에 상담사·내담자가 있으면 선택 필요(이메일 폴백 없음)")
    void resolveExistingUserForSocialLinkOrLogin_phoneAmbiguousConsultantAndClient() {
        SocialUserInfo socialUserInfo = SocialUserInfo.builder()
            .providerUserId("sns-new-3")
            .email("overlap@provider.com")
            .phone("010-2222-3333")
            .build();
        socialUserInfo.normalizeData();

        User consultant = User.builder()
            .userId("c1")
            .email("c@t.com")
            .password("p")
            .name("n")
            .role(UserRole.CONSULTANT)
            .build();
        consultant.setId(801L);
        consultant.setCreatedAt(LocalDateTime.now());

        User client = User.builder()
            .userId("cl1")
            .email("cl@t.com")
            .password("p")
            .name("n2")
            .role(UserRole.CLIENT)
            .build();
        client.setId(802L);
        client.setCreatedAt(LocalDateTime.now());

        when(userService.findAllUsersMatchingPhoneInCurrentTenant(eq("01022223333")))
            .thenReturn(Arrays.asList(consultant, client));

        OAuthExistingUserResolution res = oauth2Service.resolveExistingUserForSocialLinkOrLogin(socialUserInfo);

        assertThat(res.isRequiresPhoneAccountSelection()).isTrue();
        assertThat(res.getPhoneMatchCandidateUserIds()).containsExactlyInAnyOrder(801L, 802L);
        assertThat(res.getExistingUserId()).isNull();
        verify(userService, never()).findAllUsersMatchingEmailInCurrentTenant(anyString());
    }

    @Test
    @DisplayName("resolveExistingUserForSocialLinkOrLogin: 동일 전화에 관리자·상담사·내담자가 있으면 선택 필요")
    void resolveExistingUserForSocialLinkOrLogin_phoneAmbiguousAdminConsultantAndClient() {
        SocialUserInfo socialUserInfo = SocialUserInfo.builder()
            .providerUserId("sns-new-4")
            .email("triple@provider.com")
            .phone("010-5555-6666")
            .build();
        socialUserInfo.normalizeData();

        User admin = User.builder()
            .userId("adm1")
            .email("a@t.com")
            .password("p")
            .name("na")
            .role(UserRole.ADMIN)
            .build();
        admin.setId(901L);
        admin.setCreatedAt(LocalDateTime.now());

        User consultant = User.builder()
            .userId("c2")
            .email("c@t.com")
            .password("p")
            .name("nc")
            .role(UserRole.CONSULTANT)
            .build();
        consultant.setId(902L);
        consultant.setCreatedAt(LocalDateTime.now());

        User client = User.builder()
            .userId("cl2")
            .email("cl@t.com")
            .password("p")
            .name("ncl")
            .role(UserRole.CLIENT)
            .build();
        client.setId(903L);
        client.setCreatedAt(LocalDateTime.now());

        when(userService.findAllUsersMatchingPhoneInCurrentTenant(eq("01055556666")))
            .thenReturn(Arrays.asList(admin, consultant, client));

        OAuthExistingUserResolution res = oauth2Service.resolveExistingUserForSocialLinkOrLogin(socialUserInfo);

        assertThat(res.isRequiresPhoneAccountSelection()).isTrue();
        assertThat(res.getPhoneMatchCandidateUserIds()).containsExactlyInAnyOrder(901L, 902L, 903L);
        assertThat(res.getExistingUserId()).isNull();
        verify(userService, never()).findAllUsersMatchingEmailInCurrentTenant(anyString());
    }

    @Test
    @DisplayName("resolveExistingUserForSocialLinkOrLogin: 동일 전화에 내담자만 2명이면 자동 1명 확정")
    void resolveExistingUserForSocialLinkOrLogin_phoneTwoClients_autoSelectOne() {
        SocialUserInfo socialUserInfo = SocialUserInfo.builder()
            .providerUserId("sns-new-5")
            .email("two-cli@p.com")
            .phone("010-6666-7777")
            .build();
        socialUserInfo.normalizeData();

        User client1 = User.builder()
            .userId("cl-a")
            .email("a@t.com")
            .password("p")
            .name("n1")
            .role(UserRole.CLIENT)
            .build();
        client1.setId(1001L);
        client1.setCreatedAt(LocalDateTime.now().minusDays(1));

        User client2 = User.builder()
            .userId("cl-b")
            .email("b@t.com")
            .password("p")
            .name("n2")
            .role(UserRole.CLIENT)
            .build();
        client2.setId(1002L);
        client2.setCreatedAt(LocalDateTime.now());

        when(userService.findAllUsersMatchingPhoneInCurrentTenant(eq("01066667777")))
            .thenReturn(Arrays.asList(client1, client2));

        OAuthExistingUserResolution res = oauth2Service.resolveExistingUserForSocialLinkOrLogin(socialUserInfo);

        assertThat(res.isRequiresPhoneAccountSelection()).isFalse();
        assertThat(res.getExistingUserId()).isNotNull();
        verify(userService, never()).findAllUsersMatchingEmailInCurrentTenant(anyString());
    }

    @Test
    @DisplayName("resolveExistingUserForSocialLinkOrLogin(oauthAccountLinkMode=true): 전화·이메일 매칭을 하지 않는다")
    void resolveExistingUserForSocialLinkOrLogin_linkMode_skipsPhoneAndEmail() {
        SocialUserInfo socialUserInfo = SocialUserInfo.builder()
            .providerUserId("sns-link-only")
            .email("only@email.com")
            .phone("010-7777-8888")
            .build();
        socialUserInfo.normalizeData();

        OAuthExistingUserResolution res =
            oauth2Service.resolveExistingUserForSocialLinkOrLogin(socialUserInfo, true);

        assertThat(res.getExistingUserId()).isNull();
        assertThat(res.isRequiresPhoneAccountSelection()).isFalse();
        verify(userService, never()).findAllUsersMatchingPhoneInCurrentTenant(anyString());
        verify(userService, never()).findAllUsersMatchingEmailInCurrentTenant(anyString());
    }

    @Test
    @DisplayName("findExistingUserByPhoneForOAuth는 정규화된 숫자열로 전화 매칭을 조회한다")
    void findExistingUserByPhoneForOAuth_passesNormalizedDigitsToUserService() {
        User phoneUser = User.builder()
            .userId("u-phone")
            .email("a@b.com")
            .password("p")
            .name("n")
            .role(UserRole.CLIENT)
            .build();
        phoneUser.setId(700L);
        phoneUser.setCreatedAt(LocalDateTime.now());

        when(userService.findAllUsersMatchingPhoneInCurrentTenant(eq("01033334444")))
            .thenReturn(Collections.singletonList(phoneUser));

        Long found = oauth2Service.exposeFindExistingUserByPhoneForOAuth("  010-3333-4444  ");

        assertThat(found).isEqualTo(700L);
        verify(userService).findAllUsersMatchingPhoneInCurrentTenant(eq("01033334444"));
    }

    @Test
    @DisplayName("SocialUserInfo.normalizeData: 전화는 trim 후 정규화한다")
    void socialUserInfo_normalizeData_trimsAndNormalizesPhone() {
        SocialUserInfo info = SocialUserInfo.builder().phone("  010-9999-8888  ").build();
        info.normalizeData();
        assertThat(info.getPhone()).isEqualTo("01099998888");
    }

    @Test
    @DisplayName("SocialUserInfo.normalizeData: 공백만 있는 전화는 null로 둔다")
    void socialUserInfo_normalizeData_blankPhoneBecomesNull() {
        SocialUserInfo info = SocialUserInfo.builder().phone("   ").build();
        info.normalizeData();
        assertThat(info.getPhone()).isNull();
    }

    private static class TestOAuth2Service extends AbstractOAuth2Service {
        TestOAuth2Service(
            UserRepository userRepository,
            ClientRepository clientRepository,
            UserSocialAccountRepository userSocialAccountRepository,
            JwtService jwtService,
            DynamicPermissionService dynamicPermissionService,
            PersonalDataEncryptionUtil encryptionUtil,
            PasswordService passwordService,
            UserService userService
        ) {
            super(userRepository, clientRepository, userSocialAccountRepository, jwtService, dynamicPermissionService,
                encryptionUtil, passwordService, userService);
        }

        @Override
        public String getProviderName() {
            return "TEST";
        }

        @Override
        public String getAccessToken(String code) {
            return "token";
        }

        @Override
        public SocialUserInfo getUserInfo(String accessToken) {
            return SocialUserInfo.builder().providerUserId("provider-user").build();
        }

        @Override
        protected SocialUserInfo convertToSocialUserInfo(Map<String, Object> rawUserInfo) {
            return SocialUserInfo.builder().providerUserId("provider-user").build();
        }

        Long exposeFindExistingUserByEmail(String email) {
            return findExistingUserByEmail(email);
        }

        Long exposeFindExistingUserByPhoneForOAuth(String phone) {
            return findExistingUserByPhoneForOAuth(phone);
        }
    }
}
