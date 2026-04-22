package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.PasswordService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link UserServiceImpl#existsPhoneDuplicate(String, String, Long)} 및
 * {@link UserServiceImpl#isDuplicateExcludingId(Long, String, String)} 의 전화 분기가
 * 동일 테넌트·exclude 규칙에서 일치하는지 검증한다.
 * (Auth {@code duplicate-check/phone} vs UserController 경로의 서비스 시맨틱 스모크 대체)
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl 전화 중복·excludeUserId")
class UserServiceImplPhoneDuplicateTest {

    private static final String TENANT = "tenant-phone-dup-" + UUID.randomUUID();

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordService passwordService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private EmailService emailService;
    @Mock
    private BranchService branchService;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("existsPhoneDuplicate: 테넌트 내 동일 정규화 번호가 있으면 true")
    void existsPhoneDuplicate_sameTenant_returnsTrue() {
        User u = userRow("u-dup-1", "cipher-a");
        when(userRepository.findByTenantId(TENANT)).thenReturn(List.of(u));
        when(encryptionUtil.safeDecrypt("cipher-a")).thenReturn("010-2000-3000");

        assertThat(userService.existsPhoneDuplicate("01020003000", TENANT, null)).isTrue();
    }

    @Test
    @DisplayName("existsPhoneDuplicate: excludeUserId가 유일 일치 사용자면 false")
    void existsPhoneDuplicate_excludeOnlyMatch_returnsFalse() {
        User u = userRow("u-self", "cipher-s");
        u.setId(501L);
        when(userRepository.findByTenantId(TENANT)).thenReturn(List.of(u));

        assertThat(userService.existsPhoneDuplicate("01020004000", TENANT, 501L)).isFalse();
    }

    @Test
    @DisplayName("existsPhoneDuplicate: 다른 사용자가 같은 번호를 쓰면 exclude 후에도 true")
    void existsPhoneDuplicate_otherUserStillDuplicate_returnsTrue() {
        User self = userRow("u-self-2", "c1");
        self.setId(1L);
        User other = userRow("u-other", "c2");
        other.setId(2L);
        when(userRepository.findByTenantId(TENANT)).thenReturn(List.of(self, other));
        when(encryptionUtil.safeDecrypt("c2")).thenReturn("010-2000-5000");

        assertThat(userService.existsPhoneDuplicate("01020005000", TENANT, 1L)).isTrue();
    }

    @Test
    @DisplayName("existsPhoneDuplicate: 빈·무효 정규화 번호면 false·테넌트 조회 없음")
    void existsPhoneDuplicate_invalidDigits_returnsFalseWithoutLookup() {
        assertThat(userService.existsPhoneDuplicate("", TENANT, null)).isFalse();
        assertThat(userService.existsPhoneDuplicate("02-1234-5678", TENANT, null)).isFalse();
        verify(userRepository, never()).findByTenantId(anyString());
        verify(userRepository, never()).findAllWithNonBlankPhone();
    }

    @Test
    @DisplayName("existsPhoneDuplicate: tenantId 없을 때 exclude만 제외하고 전역 후보 스캔")
    void existsPhoneDuplicate_globalScope_respectsExclude() {
        User u = userRow("u-global", "g-cipher");
        u.setId(99L);
        when(userRepository.findAllWithNonBlankPhone()).thenReturn(List.of(u));

        assertThat(userService.existsPhoneDuplicate("01020006000", null, 99L)).isFalse();
        assertThat(userService.existsPhoneDuplicate("01020006000", "", 99L)).isFalse();

        when(encryptionUtil.safeDecrypt("g-cipher")).thenReturn("010-2000-6000");
        assertThat(userService.existsPhoneDuplicate("01020006000", null, null)).isTrue();
    }

    @Test
    @DisplayName("exclude 없을 때 existsPhoneDuplicate와 isDuplicateExcludingId(phone) 결과 동일")
    void phoneDuplicateParity_withoutExclude_matches() {
        User u = userRow("u-parity", "p-cipher");
        when(userRepository.findByTenantId(TENANT)).thenReturn(List.of(u));
        when(encryptionUtil.safeDecrypt("p-cipher")).thenReturn("010-2000-7000");

        assertThat(userService.existsPhoneDuplicate("01020007000", TENANT, null)).isTrue();
        assertThat(userService.isDuplicateExcludingId(null, "phone", "010-2000-7000")).isTrue();
    }

    @Test
    @DisplayName("excludeUserId가 같을 때 existsPhoneDuplicate와 isDuplicateExcludingId(phone) 결과 동일")
    void phoneDuplicateParity_withExclude_matches() {
        User u = userRow("u-edit", "e-cipher");
        u.setId(77L);
        when(userRepository.findByTenantId(TENANT)).thenReturn(List.of(u));

        assertThat(userService.existsPhoneDuplicate("01020008000", TENANT, 77L)).isFalse();
        assertThat(userService.isDuplicateExcludingId(77L, "phone", "010-2000-8000")).isFalse();
    }

    private static User userRow(String userId, String phoneCipher) {
        User u = User.builder()
            .userId(userId)
            .email(userId + "@example.com")
            .password("{bcrypt}$2a$10$0000000000000000000000e")
            .name("n")
            .role(UserRole.CLIENT)
            .isActive(true)
            .isPasswordChanged(true)
            .build();
        u.setTenantId(TENANT);
        u.setPhone(phoneCipher);
        return u;
    }
}
