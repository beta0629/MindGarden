package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Client;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.util.StatusCodeHelper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

/**
 * TestDataController local-only fail-closed 단위 테스트.
 *
 * <p>증명 목표:
 * <ul>
 *   <li>non-local 프로필 → mutating API 403, repository/passwordService 미호출</li>
 *   <li>local + 기존 seed email → 비밀번호 encode/set/save 미수행 (재사용)</li>
 *   <li>위험 엔드포인트(reset/delete/verify) 메서드 부재</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-09-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("TestDataController — local-only fail-closed")
class TestDataControllerLocalOnlyTest {

    private static final String SEED_ADMIN_EMAIL = "admin@mindgarden.com";
    private static final String SEED_CONSULTANT_EMAIL = "consultant1@mindgarden.com";
    private static final String SEED_CLIENT_EMAIL = "client1@example.com";

    @Mock private AdminService adminService;
    @Mock private UserRepository userRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private ConsultationRepository consultationRepository;
    @Mock private PasswordService passwordService;
    @Mock private StatusCodeHelper statusCodeHelper;
    @Mock private Environment environment;

    @InjectMocks
    private TestDataController testDataController;

    @Test
    @DisplayName("non-local — createTestData 는 403 이고 repository/passwordService 미호출")
    void createTestData_nonLocal_returns403_withoutSideEffects() {
        when(environment.acceptsProfiles("local")).thenReturn(false);

        ResponseEntity<?> response = testDataController.createTestData();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(userRepository, never()).save(any(User.class));
        verify(userRepository, never()).findAllByEmail(anyString());
        verify(passwordService, never()).encodeSecret(anyString());
        verify(passwordService, never()).encodePassword(anyString());
        verify(adminService, never()).registerConsultant(any());
        verify(adminService, never()).registerClient(any());
    }

    @Test
    @DisplayName("non-local — createConsultant 도 403 이고 adminService 미호출")
    void createConsultant_nonLocal_returns403_withoutSideEffects() {
        when(environment.acceptsProfiles("local")).thenReturn(false);

        ResponseEntity<?> response = testDataController.createConsultant(
                com.coresolution.consultation.dto.ConsultantRegistrationRequest.builder()
                        .email("new@example.com")
                        .name("신규")
                        .build());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(adminService, never()).registerConsultant(any());
        verify(userRepository, never()).findAllByEmail(anyString());
        verify(passwordService, never()).encodeSecret(anyString());
    }

    @Test
    @DisplayName("local + 기존 seed email — createTestData 가 비밀번호를 덮어쓰지 않음")
    void createTestData_local_reusesExistingUsers_withoutPasswordOverwrite() {
        when(environment.acceptsProfiles("local")).thenReturn(true);

        User existingAdmin = userEntity(1L, SEED_ADMIN_EMAIL, UserRole.ADMIN, "EXISTING_ADMIN_HASH");
        User existingConsultant = userEntity(2L, SEED_CONSULTANT_EMAIL, UserRole.CONSULTANT, "EXISTING_CONSULTANT_HASH");
        Client existingClient = clientEntity(3L, SEED_CLIENT_EMAIL, "이내담");

        when(userRepository.findAllByEmail(SEED_ADMIN_EMAIL)).thenReturn(List.of(existingAdmin));
        when(userRepository.findAllByEmail(SEED_CONSULTANT_EMAIL)).thenReturn(List.of(existingConsultant));
        when(clientRepository.findByEmailAndIsDeletedFalse(SEED_CLIENT_EMAIL))
                .thenReturn(Optional.of(existingClient));
        // getStatusCode 결과는 null 이어도 status 문자열은 "ACTIVE" 로 고정됨

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(99L);
        when(adminService.createMapping(any())).thenReturn(mapping);

        ResponseEntity<?> response = testDataController.createTestData();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        verify(passwordService, never()).encodeSecret(anyString());
        verify(passwordService, never()).encodePassword(anyString());
        verify(userRepository, never()).save(any(User.class));
        verify(adminService, never()).registerConsultant(any());
        verify(adminService, never()).registerClient(any());
        verify(adminService).createMapping(any());

        assertThat(existingAdmin.getPassword()).isEqualTo("EXISTING_ADMIN_HASH");
        assertThat(existingConsultant.getPassword()).isEqualTo("EXISTING_CONSULTANT_HASH");
    }

    @Test
    @DisplayName("위험 엔드포인트 메서드(reset/delete/verify) 가 클래스에 없음")
    void dangerousEndpoints_areRemoved() {
        Set<String> methodNames = Arrays.stream(TestDataController.class.getDeclaredMethods())
                .map(Method::getName)
                .collect(Collectors.toSet());

        assertThat(methodNames)
                .doesNotContain("resetTestUserPassword", "deleteTestUser", "verifyPassword");
    }

    private static User userEntity(Long id, String email, UserRole role, String passwordHash) {
        User user = User.builder()
                .userId(email)
                .email(email)
                .password(passwordHash)
                .name("seed-" + id)
                .role(role)
                .isActive(true)
                .build();
        user.setId(id);
        return user;
    }

    private static Client clientEntity(Long id, String email, String name) {
        Client client = Client.builder()
                .id(id)
                .email(email)
                .name(name)
                .build();
        return client;
    }
}
