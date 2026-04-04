package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 로그인 식별자 조회({@link com.coresolution.consultation.service.impl.UserServiceImpl#findByEmail},
 * {@link com.coresolution.consultation.service.impl.UserServiceImpl#findByLoginPrincipal},
 * {@link com.coresolution.consultation.service.impl.UserServiceImpl#findByPhone})가
 * {@link TenantContextHolder} 기준으로 격리되는지 단위 검증한다.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl 로그인 조회 테넌트 스코프")
class UserServiceImplLoginLookupTenantScopeTest {

    private static final String TENANT_A = "tenant-login-scope-a-" + UUID.randomUUID();
    private static final String TENANT_B = "tenant-login-scope-b-" + UUID.randomUUID();

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private EmailService emailService;
    @Mock
    private BranchService branchService;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    void setTenantA() {
        TenantContextHolder.setTenantId(TENANT_A);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("findByEmail: 테넌트 컨텍스트 없으면 IllegalStateException")
    void findByEmail_noTenant_throws() {
        TenantContextHolder.clear();
        assertThatThrownBy(() -> userService.findByEmail("any@test.com"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Tenant ID");
    }

    @Test
    @DisplayName("findByEmail: 현재 테넌트·소문자 정규화로 findByTenantIdAndEmail만 조회")
    void findByEmail_usesTenantScopedRepository() {
        User u = baseUser("u1", "user@test.com");
        u.setTenantId(TENANT_A);
        when(userRepository.findByTenantIdAndEmail(eq(TENANT_A), eq("user@test.com")))
            .thenReturn(Optional.of(u));

        Optional<User> result = userService.findByEmail("  User@Test.COM  ");

        assertThat(result).contains(u);
        verify(userRepository).findByTenantIdAndEmail(TENANT_A, "user@test.com");
        verify(userRepository, never()).findByTenantIdAndEmail(eq(TENANT_B), anyString());
    }

    @Test
    @DisplayName("findByEmail: 평문 매칭 실패 시 같은 테넌트 사용자만 순회·복호화 비교")
    void findByEmail_encryptedLegacy_sameTenantOnly() {
        when(userRepository.findByTenantIdAndEmail(TENANT_A, "legacy@test.com"))
            .thenReturn(Optional.empty());

        User encUser = baseUser("u2", "cipherblob");
        encUser.setTenantId(TENANT_A);
        when(userRepository.findByTenantId(TENANT_A)).thenReturn(List.of(encUser));
        when(encryptionUtil.decrypt("cipherblob")).thenReturn("legacy@test.com");

        Optional<User> result = userService.findByEmail("legacy@test.com");

        assertThat(result).contains(encUser);
        verify(userRepository).findByTenantId(TENANT_A);
        verify(userRepository, never()).findByTenantId(TENANT_B);
    }

    @Test
    @DisplayName("findByLoginPrincipal: 이메일 형태는 findByEmail(테넌트 스코프) 경로")
    void findByLoginPrincipal_email_usesTenantEmailLookup() {
        User u = baseUser("u3", "mail@test.com");
        u.setTenantId(TENANT_A);
        when(userRepository.findByTenantIdAndEmail(TENANT_A, "mail@test.com"))
            .thenReturn(Optional.of(u));

        Optional<User> result = userService.findByLoginPrincipal("Mail@Test.com");

        assertThat(result).contains(u);
    }

    @Test
    @DisplayName("findByLoginPrincipal: 휴대폰 형태는 테넌트 내 복호화·정규화 매칭만")
    void findByLoginPrincipal_phone_tenantScopedDecrypt() {
        User u = baseUser("u4", "p@test.com");
        u.setTenantId(TENANT_A);
        u.setPhone("enc-phone");
        when(userRepository.findByTenantId(TENANT_A)).thenReturn(List.of(u));
        when(encryptionUtil.safeDecrypt("enc-phone")).thenReturn("010-1234-5678");

        Optional<User> result = userService.findByLoginPrincipal("01012345678");

        assertThat(result).contains(u);
        verify(userRepository).findByTenantId(TENANT_A);
        verify(userRepository, never()).findByTenantId(TENANT_B);
    }

    @Test
    @DisplayName("findByLoginPrincipal: 휴대폰 경로에서 테넌트 없으면 IllegalStateException")
    void findByLoginPrincipal_phone_noTenant_throws() {
        TenantContextHolder.clear();
        assertThatThrownBy(() -> userService.findByLoginPrincipal("01012345678"))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("Tenant ID");
    }

    @Test
    @DisplayName("findByPhone: tenantId 없으면 전역 조회 금지·빈 결과")
    void findByPhone_noTenant_returnsEmpty() {
        TenantContextHolder.clear();
        Optional<User> result = userService.findByPhone("01000000000");
        assertThat(result).isEmpty();
        verify(userRepository, never()).findByTenantId(anyString());
    }

    @Test
    @DisplayName("findByPhone: 테넌트 있으면 정규화 후 테넌트 내 전화 매칭")
    void findByPhone_withTenant_usesNormalizedTenantScan() {
        User u = baseUser("u5", "x@test.com");
        u.setTenantId(TENANT_A);
        u.setPhone("ph-cipher");
        when(userRepository.findByTenantId(TENANT_A)).thenReturn(List.of(u));
        when(encryptionUtil.safeDecrypt("ph-cipher")).thenReturn("01000000000");

        Optional<User> result = userService.findByPhone("010-0000-0000");

        assertThat(result).contains(u);
    }

    @Test
    @DisplayName("existsPhoneDuplicateForPublicSignup: 무효 숫자열이면 false·리포지토리 미호출")
    void existsPhoneDuplicate_invalid_returnsFalse() {
        assertThat(userService.existsPhoneDuplicateForPublicSignup("", TENANT_A)).isFalse();
        assertThat(userService.existsPhoneDuplicateForPublicSignup("123", TENANT_A)).isFalse();
        verify(userRepository, never()).findByTenantId(anyString());
        verify(userRepository, never()).findAllWithNonBlankPhone();
    }

    @Test
    @DisplayName("existsPhoneDuplicateForPublicSignup: 테넌트 ID 있으면 테넌트 사용자만 스캔")
    void existsPhoneDuplicate_tenantScoped_matchesDecrypt() {
        User u = baseUser("u6", "z@test.com");
        u.setTenantId(TENANT_A);
        u.setPhone("enc-p");
        when(userRepository.findByTenantId(TENANT_A)).thenReturn(List.of(u));
        when(encryptionUtil.safeDecrypt("enc-p")).thenReturn("010-9999-8888");

        assertThat(userService.existsPhoneDuplicateForPublicSignup("01099998888", TENANT_A)).isTrue();
        verify(userRepository, never()).findAllWithNonBlankPhone();
    }

    @Test
    @DisplayName("existsPhoneDuplicateForPublicSignup: 테넌트 없으면 전역 후보 로드·복호화 비교")
    void existsPhoneDuplicate_global_usesFindAllWithNonBlankPhone() {
        User u = baseUser("u7", "g@test.com");
        u.setPhone("g-cipher");
        when(userRepository.findAllWithNonBlankPhone()).thenReturn(List.of(u));
        when(encryptionUtil.safeDecrypt("g-cipher")).thenReturn("01011112222");

        assertThat(userService.existsPhoneDuplicateForPublicSignup("01011112222", null)).isTrue();
        assertThat(userService.existsPhoneDuplicateForPublicSignup("01011112222", "")).isTrue();
        verify(userRepository, never()).findByTenantId(anyString());
    }

    private static User baseUser(String userId, String email) {
        return User.builder()
            .userId(userId)
            .email(email)
            .password("{bcrypt}$2a$10$0000000000000000000000e")
            .name("n")
            .role(UserRole.CONSULTANT)
            .isActive(true)
            .isPasswordChanged(true)
            .build();
    }
}
