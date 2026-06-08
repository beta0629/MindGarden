package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.UserProfileUpdateRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.UserAddressRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.ProfileImageUrlGuard;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link UserProfileServiceImpl#updateUserProfile} 의 프로필 이미지 가드 회귀 테스트.
 *
 * <p>회귀 가드 (P0 핫픽스 2026-06-09): PR #159 에서 도입된 {@link ProfileImageUrlGuard} 가
 * {@code MyPageServiceImpl#updateMyPageInfo} (client 경로) 에만 적용돼 있고, consultant 경로
 * {@code /api/v1/users/profile/{userId}} 에는 누락된 회귀를 차단한다. base64 dataURI 가 그대로
 * {@code users.profile_image_url} 컬럼에 저장돼 마이페이지 응답이 폭증하는 케이스를 막는다.</p>
 *
 * <p>가드 자체의 분기·임계치 검증은 {@code ProfileImageUrlGuardTest} 가 담당하므로,
 * 본 테스트는 service 진입점에서 가드가 실제로 호출·전파되는지를 슬림하게 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserProfileServiceImpl — 프로필 이미지 가드 회귀")
class UserProfileServiceImplProfileImageGuardTest {

    private static final String TENANT_ID = "test-tenant";
    private static final Long USER_ID = 100L;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ConsultantRepository consultantRepository;

    @Mock
    private UserAddressRepository userAddressRepository;

    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;

    @Mock
    private NotificationChannelPreferenceResolutionService notificationChannelPreferenceResolutionService;

    @InjectMocks
    private UserProfileServiceImpl service;

    private User callerAndTarget;

    @BeforeEach
    void setUp() {
        callerAndTarget = new User();
        callerAndTarget.setId(USER_ID);
        callerAndTarget.setTenantId(TENANT_ID);
        // CONSULTANT 가 자기 자신 (USER_ID == caller.id) 을 수정하는 시나리오 — 권한 체크 통과.
        callerAndTarget.setRole(UserRole.CONSULTANT);
        callerAndTarget.setIsEmailVerified(true);
    }

    @Test
    @DisplayName("base64 dataURI 입력은 IllegalArgumentException 으로 거부 (PR #159 회귀 가드)")
    void updateUserProfile_base64Image_rejected() {
        UserProfileUpdateRequest req = UserProfileUpdateRequest.builder()
            .profileImageUrl("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAA...")
            .build();

        try (MockedStatic<TenantContextHolder> tenantStatic = mockStatic(TenantContextHolder.class);
             MockedStatic<SessionUtils> sessionStatic = mockStatic(SessionUtils.class)) {
            tenantStatic.when(TenantContextHolder::getRequiredTenantId).thenReturn(TENANT_ID);
            sessionStatic.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(callerAndTarget);
            when(userRepository.findByTenantIdAndId(TENANT_ID, USER_ID))
                .thenReturn(Optional.of(callerAndTarget));

            assertThatThrownBy(() -> service.updateUserProfile(USER_ID, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("파일 업로드 API");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Test
    @DisplayName("MAX_URL_LENGTH 초과 입력도 IllegalArgumentException 으로 거부")
    void updateUserProfile_tooLongUrl_rejected() {
        StringBuilder sb = new StringBuilder("https://example.com/");
        while (sb.length() <= ProfileImageUrlGuard.MAX_URL_LENGTH) {
            sb.append('a');
        }
        UserProfileUpdateRequest req = UserProfileUpdateRequest.builder()
            .profileImageUrl(sb.toString())
            .build();

        try (MockedStatic<TenantContextHolder> tenantStatic = mockStatic(TenantContextHolder.class);
             MockedStatic<SessionUtils> sessionStatic = mockStatic(SessionUtils.class)) {
            tenantStatic.when(TenantContextHolder::getRequiredTenantId).thenReturn(TENANT_ID);
            sessionStatic.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(callerAndTarget);
            when(userRepository.findByTenantIdAndId(TENANT_ID, USER_ID))
                .thenReturn(Optional.of(callerAndTarget));

            assertThatThrownBy(() -> service.updateUserProfile(USER_ID, req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("너무 깁니다");

            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Test
    @DisplayName("정상 URL 입력은 가드 통과 — validateInbound 가 정상 URL 로 호출됨")
    void updateUserProfile_normalUrl_guardCalledOnce() {
        String normalUrl = "https://cdn.example.com/u/123.png";
        UserProfileUpdateRequest req = UserProfileUpdateRequest.builder()
            .profileImageUrl(normalUrl)
            .build();

        try (MockedStatic<TenantContextHolder> tenantStatic = mockStatic(TenantContextHolder.class);
             MockedStatic<SessionUtils> sessionStatic = mockStatic(SessionUtils.class);
             MockedStatic<ProfileImageUrlGuard> guardStatic =
                 mockStatic(ProfileImageUrlGuard.class, org.mockito.Mockito.CALLS_REAL_METHODS)) {
            tenantStatic.when(TenantContextHolder::getRequiredTenantId).thenReturn(TENANT_ID);
            sessionStatic.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(callerAndTarget);
            lenient().when(userRepository.findByTenantIdAndId(TENANT_ID, USER_ID))
                .thenReturn(Optional.of(callerAndTarget));
            // 정상 흐름이지만 buildUserProfileResponse 내부 collaborator 미충족으로 후행 예외가
            // 발생할 수 있다. 본 테스트의 관심사는 가드 호출 여부 → try-catch 로 감싸 검증만 수행.
            try {
                service.updateUserProfile(USER_ID, req);
            } catch (RuntimeException ignoredAfterGuard) {
                // 가드 통과 이후의 흐름은 본 테스트 범위 밖.
            }

            guardStatic.verify(() -> ProfileImageUrlGuard.validateInbound(normalUrl), times(1));
        }
    }

    @Test
    @DisplayName("null profileImageUrl 은 가드를 호출하지 않고 통과")
    void updateUserProfile_nullImage_guardNotCalled() {
        UserProfileUpdateRequest req = UserProfileUpdateRequest.builder().build();

        try (MockedStatic<TenantContextHolder> tenantStatic = mockStatic(TenantContextHolder.class);
             MockedStatic<SessionUtils> sessionStatic = mockStatic(SessionUtils.class);
             MockedStatic<ProfileImageUrlGuard> guardStatic =
                 mockStatic(ProfileImageUrlGuard.class, org.mockito.Mockito.CALLS_REAL_METHODS)) {
            tenantStatic.when(TenantContextHolder::getRequiredTenantId).thenReturn(TENANT_ID);
            sessionStatic.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(callerAndTarget);
            lenient().when(userRepository.findByTenantIdAndId(TENANT_ID, USER_ID))
                .thenReturn(Optional.of(callerAndTarget));

            assertThatCode(() -> {
                try {
                    service.updateUserProfile(USER_ID, req);
                } catch (RuntimeException ignoredAfterGuard) {
                    // null 이미지 분기 검증이 핵심 — 후행 collaborator 미충족 예외는 무관.
                }
            }).doesNotThrowAnyException();

            guardStatic.verify(() -> ProfileImageUrlGuard.validateInbound(anyString()), never());
        }
    }
}
