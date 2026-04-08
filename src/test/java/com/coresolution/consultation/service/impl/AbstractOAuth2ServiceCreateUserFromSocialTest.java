package com.coresolution.consultation.service.impl;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.SocialUserInfo;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSocialAccount;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
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

    private TestOAuth2Service oauth2Service;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId("tenant-oauth-ut");
        lenient().when(passwordService.encodeSecret(anyString())).thenAnswer(inv -> "ENC(" + inv.getArgument(0) + ")");
        oauth2Service = new TestOAuth2Service(
            userRepository,
            clientRepository,
            userSocialAccountRepository,
            jwtService,
            dynamicPermissionService,
            encryptionUtil,
            passwordService
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

        when(userRepository.findAllByTenantIdAndEmail("tenant-oauth-ut", "a@b.com"))
            .thenReturn(Collections.singletonList(existing));

        Long found = oauth2Service.exposeFindExistingUserByEmail("A@B.Com");

        assertThat(found).isEqualTo(55L);
        verify(userRepository).findAllByTenantIdAndEmail("tenant-oauth-ut", "a@b.com");
    }

    @Test
    @DisplayName("findExistingUserByEmail: 빈 이메일이면 저장소를 호출하지 않는다")
    void findExistingUserByEmail_blankEmail_skipsRepository() {
        assertThat(oauth2Service.exposeFindExistingUserByEmail("  ")).isNull();
        verify(userRepository, never()).findAllByTenantIdAndEmail(anyString(), anyString());
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

    private static class TestOAuth2Service extends AbstractOAuth2Service {
        TestOAuth2Service(
            UserRepository userRepository,
            ClientRepository clientRepository,
            UserSocialAccountRepository userSocialAccountRepository,
            JwtService jwtService,
            DynamicPermissionService dynamicPermissionService,
            PersonalDataEncryptionUtil encryptionUtil,
            PasswordService passwordService
        ) {
            super(userRepository, clientRepository, userSocialAccountRepository, jwtService, dynamicPermissionService,
                encryptionUtil, passwordService);
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
    }
}
