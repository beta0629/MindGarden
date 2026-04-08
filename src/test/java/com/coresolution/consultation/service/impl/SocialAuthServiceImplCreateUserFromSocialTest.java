package com.coresolution.consultation.service.impl;

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
}
