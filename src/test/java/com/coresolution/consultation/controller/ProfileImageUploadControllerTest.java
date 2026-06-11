package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ProfileImageStorageConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ProfileImageStorageService;
import com.coresolution.consultation.service.UserProfileService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import com.coresolution.testsupport.SecurityContextIsolationExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.multipart.MultipartFile;

/**
 * {@link ProfileImageUploadController} 권한 가드·정상 흐름·롤백 unlink 동작을 검증한다.
 *
 * <p>P0 영구 대책 Phase 2 — 2026-06-09. 본 테스트는 라이트한 단위 계열로 storage / userProfileService /
 * userRepository 를 mock 하고 SessionUtils·TenantContextHolder 정적 호출만 모킹한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@ExtendWith({MockitoExtension.class, SecurityContextIsolationExtension.class})
@DisplayName("ProfileImageUploadController — multipart 업로드 권한·롤백")
class ProfileImageUploadControllerTest {

    private static final String TENANT_ID = "tenant-img-upload";
    private static final Long SELF_USER_ID = 1001L;
    private static final Long OTHER_USER_ID = 1002L;
    private static final Long ADMIN_USER_ID = 1100L;
    private static final String STORED_URL =
        ProfileImageStorageConstants.URL_PREFIX + TENANT_ID + "_" + SELF_USER_ID + "_abc.png";

    @Mock
    private ProfileImageStorageService storageService;

    @Mock
    private UserProfileService userProfileService;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ProfileImageUploadController controller;

    private MultipartFile validPng;

    @BeforeEach
    void setUp() {
        validPng = new MockMultipartFile("file", "avatar.png", "image/png", new byte[] {1, 2, 3});
    }

    private User buildUser(Long id, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setTenantId(TENANT_ID);
        user.setRole(role);
        return user;
    }

    @Test
    @DisplayName("본인 업로드는 성공하고 응답에 새 URL 이 포함된다")
    void uploadSelf_ok() {
        User self = buildUser(SELF_USER_ID, UserRole.CLIENT);

        try (MockedStatic<SessionUtils> sessionStatic = mockStatic(SessionUtils.class);
             MockedStatic<TenantContextHolder> tenantStatic = mockStatic(TenantContextHolder.class)) {
            sessionStatic.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(self);
            tenantStatic.when(TenantContextHolder::getTenantId).thenReturn(TENANT_ID);
            when(userRepository.findByTenantIdAndId(TENANT_ID, SELF_USER_ID)).thenReturn(Optional.of(self));
            when(storageService.store(eq(TENANT_ID), eq(SELF_USER_ID), any(MultipartFile.class)))
                .thenReturn(STORED_URL);
            when(userProfileService.updateProfileImageUrl(SELF_USER_ID, STORED_URL)).thenReturn(STORED_URL);

            ResponseEntity<ApiResponse<Map<String, String>>> response =
                controller.uploadProfileImage(SELF_USER_ID, validPng);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().isSuccess()).isTrue();
            assertThat(response.getBody().getData())
                .containsEntry(ProfileImageUploadController.RESPONSE_KEY_PROFILE_IMAGE_URL, STORED_URL);
            verify(userProfileService, times(1)).updateProfileImageUrl(SELF_USER_ID, STORED_URL);
        }
    }

    @Test
    @DisplayName("admin 의 타인 업로드는 성공한다 (admin override)")
    void uploadAdmin_otherUser_ok() {
        User admin = buildUser(ADMIN_USER_ID, UserRole.ADMIN);
        User target = buildUser(OTHER_USER_ID, UserRole.CLIENT);

        try (MockedStatic<SessionUtils> sessionStatic = mockStatic(SessionUtils.class);
             MockedStatic<TenantContextHolder> tenantStatic = mockStatic(TenantContextHolder.class)) {
            sessionStatic.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(admin);
            tenantStatic.when(TenantContextHolder::getTenantId).thenReturn(TENANT_ID);
            when(userRepository.findByTenantIdAndId(TENANT_ID, OTHER_USER_ID)).thenReturn(Optional.of(target));
            when(storageService.store(eq(TENANT_ID), eq(OTHER_USER_ID), any(MultipartFile.class)))
                .thenReturn(STORED_URL);
            when(userProfileService.updateProfileImageUrl(OTHER_USER_ID, STORED_URL)).thenReturn(STORED_URL);

            ResponseEntity<ApiResponse<Map<String, String>>> response =
                controller.uploadProfileImage(OTHER_USER_ID, validPng);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        }
    }

    @Test
    @DisplayName("일반 사용자(CLIENT)가 타인 업로드 시 AccessDeniedException")
    void uploadOther_nonAdmin_forbidden() {
        User caller = buildUser(SELF_USER_ID, UserRole.CLIENT);

        try (MockedStatic<SessionUtils> sessionStatic = mockStatic(SessionUtils.class)) {
            sessionStatic.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(caller);

            assertThatThrownBy(() -> controller.uploadProfileImage(OTHER_USER_ID, validPng))
                .isInstanceOf(AccessDeniedException.class);

            verify(storageService, never()).store(anyString(), anyLong(), any(MultipartFile.class));
            verify(userProfileService, never()).updateProfileImageUrl(anyLong(), anyString());
        }
    }

    @Test
    @DisplayName("비로그인 호출은 AccessDeniedException")
    void uploadNoSession_forbidden() {
        try (MockedStatic<SessionUtils> sessionStatic = mockStatic(SessionUtils.class)) {
            sessionStatic.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(null);

            assertThatThrownBy(() -> controller.uploadProfileImage(SELF_USER_ID, validPng))
                .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Test
    @DisplayName("CONSULTANT 의 타인 업로드는 거부 (admin 만 override 가능)")
    void uploadConsultant_otherUser_forbidden() {
        User caller = buildUser(SELF_USER_ID, UserRole.CONSULTANT);

        try (MockedStatic<SessionUtils> sessionStatic = mockStatic(SessionUtils.class)) {
            sessionStatic.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(caller);

            assertThatThrownBy(() -> controller.uploadProfileImage(OTHER_USER_ID, validPng))
                .isInstanceOf(AccessDeniedException.class);
        }
    }

    @Test
    @DisplayName("URL 영속화 실패 시 신규 파일을 즉시 unlink (롤백)")
    void uploadPersistFailed_rollsBackStoredFile() {
        User self = buildUser(SELF_USER_ID, UserRole.CLIENT);
        String previousUrl = ProfileImageStorageConstants.URL_PREFIX + "old.png";
        self.setProfileImageUrl(previousUrl);

        try (MockedStatic<SessionUtils> sessionStatic = mockStatic(SessionUtils.class);
             MockedStatic<TenantContextHolder> tenantStatic = mockStatic(TenantContextHolder.class)) {
            sessionStatic.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(self);
            tenantStatic.when(TenantContextHolder::getTenantId).thenReturn(TENANT_ID);
            lenient().when(userRepository.findByTenantIdAndId(TENANT_ID, SELF_USER_ID))
                .thenReturn(Optional.of(self));
            when(storageService.store(eq(TENANT_ID), eq(SELF_USER_ID), any(MultipartFile.class)))
                .thenReturn(STORED_URL);
            when(userProfileService.updateProfileImageUrl(SELF_USER_ID, STORED_URL))
                .thenThrow(new IllegalArgumentException("db down"));

            assertThatThrownBy(() -> controller.uploadProfileImage(SELF_USER_ID, validPng))
                .isInstanceOf(IllegalArgumentException.class);

            verify(storageService, times(1)).deleteByUrl(STORED_URL);
            verify(storageService, never()).deleteByUrl(previousUrl);
        }
    }

    @Test
    @DisplayName("정상 업로드 시 이전 파일이 있으면 unlink 한다 (D5)")
    void uploadOk_previousFileUnlinked() {
        User self = buildUser(SELF_USER_ID, UserRole.CLIENT);
        String previousUrl = ProfileImageStorageConstants.URL_PREFIX + "previous.png";
        self.setProfileImageUrl(previousUrl);

        try (MockedStatic<SessionUtils> sessionStatic = mockStatic(SessionUtils.class);
             MockedStatic<TenantContextHolder> tenantStatic = mockStatic(TenantContextHolder.class)) {
            sessionStatic.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(self);
            tenantStatic.when(TenantContextHolder::getTenantId).thenReturn(TENANT_ID);
            when(userRepository.findByTenantIdAndId(TENANT_ID, SELF_USER_ID)).thenReturn(Optional.of(self));
            when(storageService.store(eq(TENANT_ID), eq(SELF_USER_ID), any(MultipartFile.class)))
                .thenReturn(STORED_URL);
            when(userProfileService.updateProfileImageUrl(SELF_USER_ID, STORED_URL)).thenReturn(STORED_URL);

            controller.uploadProfileImage(SELF_USER_ID, validPng);

            verify(storageService, times(1)).deleteByUrl(previousUrl);
        }
    }
}
