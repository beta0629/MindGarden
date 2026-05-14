package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.SocialSignupRequest;
import com.coresolution.consultation.dto.SocialSignupResponse;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSocialAccount;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.UserSocialAccountRepository;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordPolicy;
import com.coresolution.core.security.PasswordService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentCaptor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("SocialAuthServiceImpl createUserFromSocial")
class SocialAuthServiceImplCreateUserFromSocialTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private UserSocialAccountRepository userSocialAccountRepository;
    @Mock
    private PasswordService passwordService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @InjectMocks
    private SocialAuthServiceImpl socialAuthService;

    @BeforeEach
    void setTenantContext() {
        TenantContextHolder.setTenantId("tenant-social-ut");
    }

    @AfterEach
    void clearTenantContext() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("성공: users 선저장 후 clients 저장 순서로 완료된다")
    void createUserFromSocial_success_savesUserThenClient() {
        SocialSignupRequest request = SocialSignupRequest.builder()
            .email("social-user@test.com")
            .name("홍길동")
            .password("ValidPass123!")
            .phone("01012345678")
            .provider("KAKAO")
            .providerUserId("kakao-123")
            .providerUsername("kakao-name")
            .providerProfileImage("https://img")
            .privacyConsent(true)
            .termsConsent(true)
            .marketingConsent(false)
            .build();

        when(userRepository.existsByTenantIdAndEmail("tenant-social-ut", request.getEmail())).thenReturn(false);
        when(passwordService.encodePassword(anyString())).thenReturn("encoded");
        when(encryptionUtil.encrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(7001L);
            return user;
        });
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        SocialSignupResponse response = socialAuthService.createUserFromSocial(request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getUserId()).isEqualTo(7001L);
        InOrder inOrder = inOrder(userRepository, clientRepository);
        inOrder.verify(userRepository).saveAndFlush(any(User.class));
        inOrder.verify(clientRepository).saveAndFlush(any(Client.class));
    }

    @Test
    @DisplayName("성공: providerUsername이 비어 있으면 name을 암호화 대상 평문으로 사용한다")
    void createUserFromSocial_blankProviderUsername_fallsBackToNameForEncrypt() {
        SocialSignupRequest request = SocialSignupRequest.builder()
            .email("social-user@test.com")
            .name("폴백표시명")
            .password("ValidPass123!")
            .phone("01012345678")
            .provider("KAKAO")
            .providerUserId("kakao-123")
            .providerUsername(null)
            .providerProfileImage("https://img")
            .privacyConsent(true)
            .termsConsent(true)
            .marketingConsent(false)
            .build();

        when(userRepository.existsByTenantIdAndEmail("tenant-social-ut", request.getEmail())).thenReturn(false);
        when(passwordService.encodePassword(anyString())).thenReturn("encoded");
        when(encryptionUtil.encrypt("폴백표시명")).thenReturn("enc-name");
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(7002L);
            return user;
        });
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        SocialSignupResponse response = socialAuthService.createUserFromSocial(request);

        assertThat(response.isSuccess()).isTrue();
        verify(encryptionUtil).encrypt("폴백표시명");
        verify(userSocialAccountRepository).save(any(UserSocialAccount.class));
    }

    @Test
    @DisplayName("실패: users tenantId 불일치면 IllegalStateException이 발생하고 clients는 저장하지 않는다")
    void createUserFromSocial_tenantMismatch_throwsBeforeClientSave() {
        SocialSignupRequest request = SocialSignupRequest.builder()
            .email("social-user@test.com")
            .name("홍길동")
            .password("ValidPass123!")
            .phone("01012345678")
            .privacyConsent(true)
            .termsConsent(true)
            .build();

        when(userRepository.existsByTenantIdAndEmail("tenant-social-ut", request.getEmail())).thenReturn(false);
        when(passwordService.encodePassword(anyString())).thenReturn("encoded");
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(8002L);
            user.setTenantId("other-tenant");
            return user;
        });

        assertThatThrownBy(() -> socialAuthService.createUserFromSocial(request))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("tenantId");
        verify(clientRepository, never()).saveAndFlush(any(Client.class));
    }

    @Test
    @DisplayName("성공: provider·이메일 대소문자 혼합 입력 시 저장은 대문자·소문자 정규형")
    void createUserFromSocial_normalizesProviderAndEmail() {
        SocialSignupRequest request = SocialSignupRequest.builder()
            .email("User@Test.COM")
            .name("홍길동")
            .password("ValidPass123!")
            .phone("01012345678")
            .provider("naver")
            .providerUserId("nv-1")
            .providerUsername("nv-name")
            .providerProfileImage("https://img")
            .privacyConsent(true)
            .termsConsent(true)
            .marketingConsent(false)
            .build();

        when(userRepository.existsByTenantIdAndEmail("tenant-social-ut", "user@test.com")).thenReturn(false);
        when(passwordService.encodePassword(anyString())).thenReturn("encoded");
        when(encryptionUtil.encrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(7003L);
            return user;
        });
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        SocialSignupResponse response = socialAuthService.createUserFromSocial(request);

        assertThat(response.isSuccess()).isTrue();
        ArgumentCaptor<User> userCap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(userCap.capture());
        assertThat(userCap.getValue().getEmail()).isEqualTo("user@test.com");

        ArgumentCaptor<UserSocialAccount> socialCap = ArgumentCaptor.forClass(UserSocialAccount.class);
        verify(userSocialAccountRepository).save(socialCap.capture());
        assertThat(socialCap.getValue().getProvider()).isEqualTo("NAVER");
    }

    @Test
    @DisplayName("성공: 비밀번호 미입력(SNS A안) 시 정책 만족 난수가 encodePassword로 전달된다")
    void createUserFromSocial_blankPassword_generatesCompliantRandomSecret() {
        SocialSignupRequest request = SocialSignupRequest.builder()
            .email("blank-pw-social@test.com")
            .name("소셜사용자")
            .password(null)
            .phone("01012345678")
            .provider("KAKAO")
            .providerUserId("kakao-999")
            .providerUsername("kakao-nick")
            .providerProfileImage("https://img")
            .privacyConsent(true)
            .termsConsent(true)
            .marketingConsent(false)
            .build();

        when(userRepository.existsByTenantIdAndEmail("tenant-social-ut", request.getEmail())).thenReturn(false);
        when(passwordService.encodePassword(anyString())).thenAnswer(inv -> {
            String plain = inv.getArgument(0);
            assertThat(PasswordPolicy.firstLoginStorageViolationMessage(plain))
                .as("내부 생성 비밀번호는 로그인 저장 정책을 통과해야 함")
                .isNull();
            return "encoded";
        });
        when(encryptionUtil.encrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(7010L);
            return user;
        });
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        SocialSignupResponse response = socialAuthService.createUserFromSocial(request);

        assertThat(response.isSuccess()).isTrue();
        ArgumentCaptor<String> pwCap = ArgumentCaptor.forClass(String.class);
        verify(passwordService).encodePassword(pwCap.capture());
        assertThat(pwCap.getValue()).isNotBlank();
        assertThat(pwCap.getValue().length()).isGreaterThanOrEqualTo(PasswordPolicy.LOGIN_PASSWORD_MIN_LENGTH);
    }

    @Test
    @DisplayName("성공: 비밀번호 앞뒤 공백은 trim 후 encodePassword에 전달된다")
    void createUserFromSocial_passwordTrimmedBeforeEncode() {
        SocialSignupRequest request = SocialSignupRequest.builder()
            .email("social-user@test.com")
            .name("홍길동")
            .password("  ValidPass123!  ")
            .phone("01012345678")
            .provider("NAVER")
            .providerUserId("nv-456")
            .providerUsername("nv-name")
            .providerProfileImage("https://img")
            .privacyConsent(true)
            .termsConsent(true)
            .marketingConsent(false)
            .build();

        when(userRepository.existsByTenantIdAndEmail("tenant-social-ut", request.getEmail())).thenReturn(false);
        when(passwordService.encodePassword(anyString())).thenReturn("encoded");
        when(encryptionUtil.encrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setId(7004L);
            return user;
        });
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        SocialSignupResponse response = socialAuthService.createUserFromSocial(request);

        assertThat(response.isSuccess()).isTrue();
        verify(passwordService).encodePassword("ValidPass123!");
    }

    @Test
    @DisplayName("실패: 이메일이 공백뿐이면 검증 실패 응답")
    void createUserFromSocial_blankEmail_returnsFailure() {
        SocialSignupRequest request = SocialSignupRequest.builder()
            .email("   ")
            .name("홍길동")
            .password("ValidPass123!")
            .phone("01012345678")
            .provider("KAKAO")
            .privacyConsent(true)
            .termsConsent(true)
            .build();

        SocialSignupResponse response = socialAuthService.createUserFromSocial(request);

        assertThat(response.isSuccess()).isFalse();
        verify(userRepository, never()).existsByTenantIdAndEmail(anyString(), anyString());
    }

    @Test
    @DisplayName("미완성(이메일 미인증·전화 없음) + 동일 이메일: User INSERT 없이 소셜 연동 성공")
    void createUserFromSocial_incompleteExistingEmail_linksSocialWithoutNewUser() {
        SocialSignupRequest request = SocialSignupRequest.builder()
            .email("pending@test.com")
            .name("연동사용자")
            .password(null)
            .phone("01012345678")
            .provider("KAKAO")
            .providerUserId("kakao-link-1")
            .providerUsername("kakao-nick")
            .providerProfileImage("https://img/kakao")
            .privacyConsent(true)
            .termsConsent(true)
            .marketingConsent(false)
            .build();

        User existing = User.builder()
            .userId("legacy_pending")
            .password("encoded-existing")
            .name("enc-name")
            .email("pending@test.com")
            .phone(null)
            .role(UserRole.CLIENT)
            .isEmailVerified(false)
            .isSocialAccount(false)
            .build();
        existing.setId(9101L);
        existing.setTenantId("tenant-social-ut");

        when(userRepository.existsByTenantIdAndEmail("tenant-social-ut", "pending@test.com")).thenReturn(true);
        when(userRepository.findByTenantIdAndEmail("tenant-social-ut", "pending@test.com"))
            .thenReturn(java.util.Optional.of(existing));
        when(userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(
            eq("tenant-social-ut"), eq("KAKAO"), eq("kakao-link-1")))
            .thenReturn(java.util.Optional.empty());
        when(encryptionUtil.encrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(encryptionUtil.safeEncrypt(anyString())).thenAnswer(inv -> "enc:" + inv.getArgument(0));
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clientRepository.findById(9101L)).thenReturn(java.util.Optional.empty());
        when(clientRepository.saveAndFlush(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        SocialSignupResponse response = socialAuthService.createUserFromSocial(request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getUserId()).isEqualTo(9101L);
        assertThat(response.getMessage()).contains("연동");
        verify(userRepository).saveAndFlush(any(User.class));
        verify(userSocialAccountRepository).save(any(UserSocialAccount.class));
        verify(clientRepository).saveAndFlush(any(Client.class));
    }

    @Test
    @DisplayName("이메일 인증 완료된 기존 사용자: 동일 이메일로 소셜 간편가입 차단")
    void createUserFromSocial_existingVerifiedEmail_blocks() {
        SocialSignupRequest request = SocialSignupRequest.builder()
            .email("done@test.com")
            .name("홍길동")
            .password("ValidPass123!")
            .phone("01012345678")
            .provider("KAKAO")
            .providerUserId("k-1")
            .privacyConsent(true)
            .termsConsent(true)
            .build();

        User existing = User.builder()
            .userId("u1")
            .password("enc")
            .name("n")
            .email("done@test.com")
            .phone(null)
            .role(UserRole.CLIENT)
            .isEmailVerified(true)
            .build();
        existing.setId(9201L);
        existing.setTenantId("tenant-social-ut");

        when(userRepository.existsByTenantIdAndEmail("tenant-social-ut", "done@test.com")).thenReturn(true);
        when(userRepository.findByTenantIdAndEmail("tenant-social-ut", "done@test.com"))
            .thenReturn(java.util.Optional.of(existing));

        SocialSignupResponse response = socialAuthService.createUserFromSocial(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("이미 가입된 이메일입니다.");
        verify(userSocialAccountRepository, never()).save(any(UserSocialAccount.class));
    }

    @Test
    @DisplayName("이메일 미인증이나 전화가 이미 있으면: 동일 이메일로 소셜 간편가입 차단")
    void createUserFromSocial_existingUnverifiedButHasPhone_blocks() {
        SocialSignupRequest request = SocialSignupRequest.builder()
            .email("hasphone@test.com")
            .name("홍길동")
            .password("ValidPass123!")
            .phone("01012345678")
            .provider("KAKAO")
            .providerUserId("k-2")
            .privacyConsent(true)
            .termsConsent(true)
            .build();

        User existing = User.builder()
            .userId("u2")
            .password("enc")
            .name("n")
            .email("hasphone@test.com")
            .phone("enc-phone")
            .role(UserRole.CLIENT)
            .isEmailVerified(false)
            .build();
        existing.setId(9202L);
        existing.setTenantId("tenant-social-ut");

        when(userRepository.existsByTenantIdAndEmail("tenant-social-ut", "hasphone@test.com")).thenReturn(true);
        when(userRepository.findByTenantIdAndEmail("tenant-social-ut", "hasphone@test.com"))
            .thenReturn(java.util.Optional.of(existing));
        when(encryptionUtil.safeDecrypt("enc-phone")).thenReturn("01099998888");

        SocialSignupResponse response = socialAuthService.createUserFromSocial(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).isEqualTo("이미 가입된 이메일입니다.");
        verify(userSocialAccountRepository, never()).save(any(UserSocialAccount.class));
    }

    @Test
    @DisplayName("미완성 사용자인데 동일 소셜 ID가 다른 유저에 연결된 경우: 실패")
    void createUserFromSocial_incompleteButSocialOwnedByOther_fails() {
        SocialSignupRequest request = SocialSignupRequest.builder()
            .email("inc@test.com")
            .name("홍길동")
            .password("ValidPass123!")
            .phone("01012345678")
            .provider("NAVER")
            .providerUserId("nv-shared")
            .privacyConsent(true)
            .termsConsent(true)
            .build();

        User existing = User.builder()
            .userId("u-inc")
            .password("enc")
            .name("n")
            .email("inc@test.com")
            .phone(null)
            .role(UserRole.CLIENT)
            .isEmailVerified(false)
            .build();
        existing.setId(9301L);
        existing.setTenantId("tenant-social-ut");

        User other = User.builder()
            .userId("other")
            .password("enc")
            .name("n2")
            .email("other@test.com")
            .role(UserRole.CLIENT)
            .build();
        other.setId(9302L);
        other.setTenantId("tenant-social-ut");

        UserSocialAccount taken = UserSocialAccount.builder()
            .user(other)
            .provider("NAVER")
            .providerUserId("nv-shared")
            .build();

        when(userRepository.existsByTenantIdAndEmail("tenant-social-ut", "inc@test.com")).thenReturn(true);
        when(userRepository.findByTenantIdAndEmail("tenant-social-ut", "inc@test.com"))
            .thenReturn(java.util.Optional.of(existing));
        when(userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(
            eq("tenant-social-ut"), eq("NAVER"), eq("nv-shared")))
            .thenReturn(java.util.Optional.of(taken));

        SocialSignupResponse response = socialAuthService.createUserFromSocial(request);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("다른 사용자");
        verify(userRepository, never()).saveAndFlush(any(User.class));
        verify(userSocialAccountRepository, never()).save(any(UserSocialAccount.class));
    }

    @Test
    @DisplayName("미완성 사용자 + 이미 동일 소셜 연동됨: 멱등 성공, UserSocialAccount 추가 저장 없음")
    void createUserFromSocial_incompleteAlreadyLinked_idempotent() {
        SocialSignupRequest request = SocialSignupRequest.builder()
            .email("idem@test.com")
            .name("홍길동")
            .password("ValidPass123!")
            .phone(null)
            .provider("KAKAO")
            .providerUserId("k-idem")
            .providerProfileImage("https://same")
            .privacyConsent(true)
            .termsConsent(true)
            .build();

        User existing = User.builder()
            .userId("u-idem")
            .password("enc")
            .name("n")
            .email("idem@test.com")
            .phone(null)
            .role(UserRole.CLIENT)
            .isEmailVerified(false)
            .isSocialAccount(true)
            .socialProvider("KAKAO")
            .socialProviderUserId("k-idem")
            .profileImageUrl("https://same")
            .build();
        existing.setId(9401L);
        existing.setTenantId("tenant-social-ut");
        existing.setSocialLinkedAt(java.time.LocalDateTime.now().minusDays(1));

        UserSocialAccount link = UserSocialAccount.builder()
            .user(existing)
            .provider("KAKAO")
            .providerUserId("k-idem")
            .build();

        Client clientRow = Client.builder()
            .id(9401L)
            .tenantId("tenant-social-ut")
            .name("n")
            .email("idem@test.com")
            .phone(null)
            .build();

        when(userRepository.existsByTenantIdAndEmail("tenant-social-ut", "idem@test.com")).thenReturn(true);
        when(userRepository.findByTenantIdAndEmail("tenant-social-ut", "idem@test.com"))
            .thenReturn(java.util.Optional.of(existing));
        when(userSocialAccountRepository.findByTenantIdAndProviderAndProviderUserIdAndIsDeletedFalse(
            eq("tenant-social-ut"), eq("KAKAO"), eq("k-idem")))
            .thenReturn(java.util.Optional.of(link));
        when(encryptionUtil.safeDecrypt(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(clientRepository.findById(9401L)).thenReturn(java.util.Optional.of(clientRow));

        SocialSignupResponse response = socialAuthService.createUserFromSocial(request);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).contains("이미");
        verify(userSocialAccountRepository, never()).save(any(UserSocialAccount.class));
        verify(userRepository, never()).saveAndFlush(any(User.class));
        verify(clientRepository, never()).saveAndFlush(any(Client.class));
    }
}
