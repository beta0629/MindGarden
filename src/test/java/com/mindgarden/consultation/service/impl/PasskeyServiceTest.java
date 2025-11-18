package com.mindgarden.consultation.service.impl;

import com.mindgarden.consultation.entity.User;
import com.mindgarden.consultation.entity.UserPasskey;
import com.mindgarden.consultation.repository.UserPasskeyRepository;
import com.mindgarden.consultation.repository.UserRepository;
import com.mindgarden.consultation.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Passkey 서비스 테스트
 * Week 17-18: Passkey 인증 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@ExtendWith(MockitoExtension.class)
class PasskeyServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserPasskeyRepository passkeyRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private PasskeyServiceImpl passkeyService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setName("Test User");
    }

    @Test
    void testStartRegistration() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When
        var result = passkeyService.startRegistration(1L, "내 iPhone");

        // Then
        assertNotNull(result);
        assertTrue((Boolean) result.get("success"));
        assertNotNull(result.get("options"));
    }

    @Test
    void testStartAuthentication() {
        // Given
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(passkeyRepository.findActivePasskeysByUserId(1L)).thenReturn(java.util.Collections.emptyList());

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            passkeyService.startAuthentication("test@example.com");
        });
    }

    @Test
    void testListPasskeys() {
        // Given
        UserPasskey passkey = UserPasskey.builder()
                .id(1L)
                .user(testUser)
                .credentialId("test-credential-id")
                .publicKey("test-public-key")
                .deviceName("내 iPhone")
                .build();

        when(passkeyRepository.findActivePasskeysByUserId(1L))
                .thenReturn(java.util.Collections.singletonList(passkey));

        // When
        var result = passkeyService.listPasskeys(1L);

        // Then
        assertNotNull(result);
        assertTrue((Boolean) result.get("success"));
        assertNotNull(result.get("passkeys"));
    }

    @Test
    void testDeletePasskey() {
        // Given
        UserPasskey passkey = UserPasskey.builder()
                .id(1L)
                .user(testUser)
                .credentialId("test-credential-id")
                .publicKey("test-public-key")
                .deviceName("내 iPhone")
                .isActive(true)
                .isDeleted(false)
                .build();

        when(passkeyRepository.findById(1L)).thenReturn(Optional.of(passkey));

        // When
        var result = passkeyService.deletePasskey(1L, 1L);

        // Then
        assertNotNull(result);
        assertTrue((Boolean) result.get("success"));
        verify(passkeyRepository, times(1)).save(any(UserPasskey.class));
    }
}

