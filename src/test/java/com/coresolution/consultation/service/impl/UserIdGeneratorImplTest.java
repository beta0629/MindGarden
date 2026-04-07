package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link UserIdGeneratorImpl} 전화·이메일 기반 userId 생성 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserIdGeneratorImpl")
class UserIdGeneratorImplTest {

    private static final String TENANT = "tenant-ut";

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserIdGeneratorImpl generator;

    @Test
    @DisplayName("generateUniqueUserIdFromPhone: 중복 없으면 정규화 번호 그대로 반환")
    void fromPhone_noCollision_returnsDigits() {
        when(userRepository.existsByUserId("01012345678")).thenReturn(false);

        assertThat(generator.generateUniqueUserIdFromPhone("01012345678", TENANT)).isEqualTo("01012345678");
    }

    @Test
    @DisplayName("generateUniqueUserIdFromPhone: 전역 중복 시 숫자 접미사 부여")
    void fromPhone_collision_appendsSuffix() {
        when(userRepository.existsByUserId("01012345678")).thenReturn(true);
        when(userRepository.existsByUserId("010123456781")).thenReturn(false);

        assertThat(generator.generateUniqueUserIdFromPhone("01012345678", TENANT)).isEqualTo("010123456781");
    }

    @Test
    @DisplayName("generateUniqueUserIdFromPhone: 빈 번호면 IllegalArgumentException")
    void fromPhone_blankPhone_throws() {
        assertThatThrownBy(() -> generator.generateUniqueUserIdFromPhone("", TENANT))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("휴대폰");
    }

    @Test
    @DisplayName("generateUniqueUserIdFromPhone: 빈 테넌트면 IllegalArgumentException")
    void fromPhone_blankTenant_throws() {
        assertThatThrownBy(() -> generator.generateUniqueUserIdFromPhone("01012345678", ""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("테넌트");
    }

    @Test
    @DisplayName("generateUniqueUserId: 이메일 로컬파트로 base 생성 후 중복 시 접미사")
    void fromEmail_collision_appendsSuffix() {
        when(userRepository.existsByUserId("localuser")).thenReturn(true);
        when(userRepository.existsByUserId("localuser1")).thenReturn(false);

        assertThat(generator.generateUniqueUserId("LocalUser@example.com", TENANT)).isEqualTo("localuser1");
    }
}
