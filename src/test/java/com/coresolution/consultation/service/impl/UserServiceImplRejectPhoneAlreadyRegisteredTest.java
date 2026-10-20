package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ClientRegistrationConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.dto.ErrorResponse;
import com.coresolution.core.security.PasswordService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * 상담사 등록 전화번호 중복 — {@link UserServiceImpl#rejectIfPhoneAlreadyRegistered}.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl 상담사 등록 전화번호 중복")
class UserServiceImplRejectPhoneAlreadyRegisteredTest {

    private static final String TENANT = "tph-" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);
    private static final String OTHER_TENANT = "otp-" + UUID.randomUUID().toString().replace("-", "").substring(0, 32);

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

    private final GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler();

    @BeforeEach
    void setTenant() {
        com.coresolution.core.context.TenantContextHolder.setTenantId(TENANT);
    }

    @AfterEach
    void clearTenant() {
        com.coresolution.core.context.TenantContextHolder.clear();
    }

    @Test
    @DisplayName("같은 테넌트에 번호가 있으면 400과 이미 등록된 전화번호 문구")
    void duplicateInTenant_returns400WithMessage() {
        User existing = userRow("cipher-dup");
        when(userRepository.findByTenantId(TENANT)).thenReturn(List.of(existing));
        when(encryptionUtil.safeDecrypt("cipher-dup")).thenReturn("01012345678");

        IllegalArgumentException ex = org.assertj.core.api.Assertions.catchThrowableOfType(
                () -> userService.rejectIfPhoneAlreadyRegistered("01012345678", TENANT, null),
                IllegalArgumentException.class);

        assertThat(ex).isNotNull();
        assertThat(ex.getMessage()).isEqualTo(ClientRegistrationConstants.MSG_PHONE_ALREADY_REGISTERED);

        HttpServletRequest request = Mockito.mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/v1/admin/consultants");
        when(request.getMethod()).thenReturn("POST");
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleIllegalArgument(ex, request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getStatus()).isEqualTo(400);
        assertThat(response.getBody().getErrorCode()).isEqualTo("ILLEGAL_ARGUMENT");
        assertThat(response.getBody().getMessage())
                .isEqualTo(ClientRegistrationConstants.MSG_PHONE_ALREADY_REGISTERED);
    }

    @Test
    @DisplayName("다른 테넌트의 같은 번호는 허용한다")
    void sameNumberInOtherTenant_isAllowed() {
        when(userRepository.findByTenantId(TENANT)).thenReturn(List.of());

        assertThatCode(() -> userService.rejectIfPhoneAlreadyRegistered("01012345678", TENANT, null))
                .doesNotThrowAnyException();

        verify(userRepository).findByTenantId(TENANT);
        verify(userRepository, never()).findByTenantId(OTHER_TENANT);
        verify(userRepository, never()).findAllByTenantIdIncludingDeleted(anyString());
    }

    @Test
    @DisplayName("삭제된 행은 조회하지 않아 중복으로 보지 않는다")
    void deletedRow_isIgnored() {
        when(userRepository.findByTenantId(TENANT)).thenReturn(List.of());

        assertThatCode(() -> userService.rejectIfPhoneAlreadyRegistered("010-9999-0000", TENANT, null))
                .doesNotThrowAnyException();

        verify(userRepository).findByTenantId(TENANT);
        verify(userRepository, never()).findAllByTenantIdIncludingDeleted(anyString());
    }

    @Test
    @DisplayName("하이픈 입력은 숫자만 남겨 저장된 번호와 같은 중복으로 본다")
    void hyphenatedInput_matchesNormalizedStoredNumber() {
        User existing = userRow("cipher-hyphen");
        when(userRepository.findByTenantId(TENANT)).thenReturn(List.of(existing));
        when(encryptionUtil.safeDecrypt("cipher-hyphen")).thenReturn("01012345678");

        assertThatThrownBy(() -> userService.rejectIfPhoneAlreadyRegistered("010-1234-5678", TENANT, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(ClientRegistrationConstants.MSG_PHONE_ALREADY_REGISTERED);
    }

    private static User userRow(String phoneCipher) {
        User user = User.builder()
                .userId("phone-user")
                .email("phone-user@example.com")
                .password("{bcrypt}$2a$10$0000000000000000000000e")
                .name("상담사")
                .role(UserRole.CONSULTANT)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        user.setTenantId(TENANT);
        user.setPhone(phoneCipher);
        user.setIsDeleted(false);
        return user;
    }
}
