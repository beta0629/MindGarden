package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@code UserServiceImpl#partialUpdate} 의 Phase B 보안 결함 동봉 가드 회귀 테스트.
 *
 * <p>이메일은 사용자 키이므로 raw {@code user.setEmail(...)} 직접 호출은 차단되어야 한다.
 * 변경은 {@code MyPageServiceImpl#changeEmail} 경로(OTP·AuditLog·JWT 회수)로만 허용한다.
 * 단, 동일 이메일(정규화 후 일치)을 다시 보낸 경우는 no-op 으로 통과시켜 partialUpdate 호출자
 * (관리자 폼 등) 가 다른 필드만 변경할 때 회귀를 일으키지 않도록 한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-11
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserServiceImpl#partialUpdate 이메일 raw setEmail 가드 (Phase B 보안)")
class UserServiceImplPartialUpdateEmailGuardTest {

    private static final String TENANT = "tenant-guard-" + UUID.randomUUID();
    private static final Long USER_ID = 7L;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserServiceImpl userService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT);
        lenient().when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("다른 이메일로 변경 시도 → IllegalStateException 으로 차단 & save 호출 없음")
    void rejectsEmailChangeViaPartialUpdate() {
        when(userRepository.findByTenantIdAndId(TENANT, USER_ID)).thenReturn(Optional.of(existing("old@example.com")));

        User update = new User();
        update.setEmail("new@example.com");

        assertThatThrownBy(() -> userService.partialUpdate(USER_ID, update))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("MyPageService#changeEmail");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("대소문자만 다른 동일 이메일 → no-op 으로 허용 (정규화 후 동일)")
    void allowsCaseInsensitiveSameEmailNoOp() {
        when(userRepository.findByTenantIdAndId(TENANT, USER_ID)).thenReturn(Optional.of(existing("user@example.com")));

        User update = new User();
        update.setEmail("USER@Example.com");

        assertThatCode(() -> userService.partialUpdate(USER_ID, update))
                .doesNotThrowAnyException();

        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    @DisplayName("email 필드 null → 가드 미작동 & 다른 필드만 정상 저장")
    void allowsNullEmailUpdate() {
        when(userRepository.findByTenantIdAndId(TENANT, USER_ID)).thenReturn(Optional.of(existing("user@example.com")));

        User update = new User();
        update.setName("새이름");
        // email 은 명시적으로 설정하지 않음 → null

        assertThatCode(() -> userService.partialUpdate(USER_ID, update))
                .doesNotThrowAnyException();

        verify(userRepository, times(1)).save(any(User.class));
    }

    private User existing(String email) {
        User u = User.builder()
                .userId("u" + USER_ID)
                .email(email)
                .name("n")
                .role(UserRole.CLIENT)
                .isActive(true)
                .build();
        u.setId(USER_ID);
        u.setTenantId(TENANT);
        u.setIsDeleted(false);
        u.setVersion(0L);
        return u;
    }
}
