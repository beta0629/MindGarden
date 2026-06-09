package com.coresolution.consultation.controller;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.constant.ProfileImageStorageConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ProfileImageStorageService;
import com.coresolution.consultation.service.UserProfileService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * 사용자 프로필 이미지 multipart 업로드 컨트롤러.
 *
 * <p>P0 영구 대책 Phase 2 — 2026-06-09. base64 dataURI 를 더 이상 {@code users.profile_image_url}
 * 컬럼(longtext)에 직접 저장하지 않도록, 로컬 디스크 + multipart 업로드 endpoint 를 신설한다.
 * 업로드된 파일은 {@code /api/v1/files/profile-images/{fileName}} 으로 서빙된다
 * (구현: {@link com.coresolution.core.controller.FileController#getProfileImage}).</p>
 *
 * <h3>권한 (사용자 결정 D4)</h3>
 * <ul>
 *   <li>본인({@code caller.id == userId})</li>
 *   <li>관리자({@code caller.role.isAdmin()}) — admin override</li>
 * </ul>
 * 그 외는 {@link AccessDeniedException} 403 으로 응답한다.
 *
 * <h3>검증</h3>
 * <ul>
 *   <li>사이즈: 최대 5MB ({@link ProfileImageStorageConstants#MAX_FILE_SIZE_BYTES})</li>
 *   <li>MIME: PNG / JPEG / WEBP</li>
 *   <li>매직바이트 — content-type 위조 차단 (storage 서비스 내부 검증)</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/users/profile")
@RequiredArgsConstructor
public class ProfileImageUploadController extends BaseApiController {

    /** 응답 body 의 URL 키. 테스트·FE 가 단일 출처를 참조하도록 상수로 노출. */
    public static final String RESPONSE_KEY_PROFILE_IMAGE_URL = "profileImageUrl";

    private final ProfileImageStorageService storage;
    private final UserProfileService userProfileService;
    private final UserRepository userRepository;

    /**
     * 프로필 이미지 업로드 — multipart {@code file} 필드 1개.
     *
     * <p>흐름:
     * <ol>
     *   <li>세션·테넌트에서 호출자 식별 ({@link SessionUtils#getCurrentUser})</li>
     *   <li>본인 또는 admin 권한 확인 (위반 시 403)</li>
     *   <li>대상 사용자 조회 (테넌트 격리)</li>
     *   <li>새 파일 저장 → URL 획득</li>
     *   <li>{@code users.profile_image_url} 영속화 (실패 시 방금 저장한 파일 즉시 unlink)</li>
     *   <li>이전 파일 unlink (D5 — 우리 URL_PREFIX 로 시작할 때만)</li>
     * </ol></p>
     *
     * @param userId 대상 사용자 PK
     * @param file   multipart 파일
     * @return {@code {"profileImageUrl": "/api/v1/files/profile-images/..."}}
     */
    @PostMapping(value = "/{userId}/image", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadProfileImage(
        @PathVariable Long userId,
        @RequestParam("file") MultipartFile file
    ) {
        User caller = SessionUtils.getCurrentUser(null);
        if (caller == null || caller.getId() == null) {
            throw new AccessDeniedException(ProfileImageStorageConstants.MSG_LOGIN_REQUIRED);
        }
        assertSelfOrAdmin(caller, userId);

        String tenantId = TenantContextHolder.getTenantId();
        if (tenantId == null || tenantId.isBlank()) {
            // 호출 컨텍스트에 테넌트가 없으면 호출자의 tenantId 로 fallback (자기 자신 수정 정합).
            tenantId = caller.getTenantId();
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new AccessDeniedException(ProfileImageStorageConstants.MSG_FORBIDDEN);
        }

        User target = userRepository.findByTenantIdAndId(tenantId, userId)
            .orElseThrow(() -> new AccessDeniedException(ProfileImageStorageConstants.MSG_FORBIDDEN));

        String previousUrl = target.getProfileImageUrl();
        log.info("프로필 이미지 업로드 요청: userId={}, callerId={}, originalSize={}",
            userId, caller.getId(), file != null ? file.getSize() : 0);

        String newUrl = storage.store(tenantId, userId, file);
        try {
            userProfileService.updateProfileImageUrl(userId, newUrl);
        } catch (RuntimeException e) {
            // 영속화 실패 시 방금 저장한 파일은 고아 파일이 되므로 즉시 unlink (D5 정책과 동일).
            log.warn("프로필 이미지 URL 영속화 실패 — 방금 저장한 파일을 unlink: userId={}, newUrl={}, error={}",
                userId, newUrl, e.getMessage());
            storage.deleteByUrl(newUrl);
            throw e;
        }

        // D5 — 새 업로드 성공 후 이전 파일 즉시 unlink (우리 URL_PREFIX 로 시작할 때만).
        if (previousUrl != null && !previousUrl.equals(newUrl)) {
            storage.deleteByUrl(previousUrl);
        }

        Map<String, String> body = new HashMap<>();
        body.put(RESPONSE_KEY_PROFILE_IMAGE_URL, newUrl);
        return success("프로필 이미지를 업로드했습니다.", body);
    }

    private void assertSelfOrAdmin(User caller, Long targetUserId) {
        if (caller.getId().equals(targetUserId)) {
            return;
        }
        UserRole role = caller.getRole();
        if (role == null || !role.isAdmin()) {
            throw new AccessDeniedException(ProfileImageStorageConstants.MSG_FORBIDDEN);
        }
    }
}
