package com.coresolution.consultation.controller;

import com.coresolution.consultation.constant.MobilePushPlatform;
import com.coresolution.consultation.dto.mobilepush.MobilePushSettingsPatchRequest;
import com.coresolution.consultation.dto.mobilepush.MobilePushSettingsPayload;
import com.coresolution.consultation.dto.mobilepush.MobilePushTokenRegisterRequest;
import com.coresolution.consultation.dto.mobilepush.MobilePushTokenUnregisterRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.MobilePushService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Expo {@code PUSH_API} — 푸시 토큰 등록/해제·카테고리 설정.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@RestController
@RequestMapping("/api/v1/mobile")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class MobilePushController extends BaseApiController {

    private final MobilePushService mobilePushService;

    /**
     * 푸시 토큰 등록(멱등). tenantId 바디 필드는 무시한다.
     *
     * @param session 세션
     * @param request 등록 요청
     * @return 성공 시 본문 없음
     */
    @PostMapping("/push-token/register")
    public ResponseEntity<ApiResponse<Void>> registerToken(
            HttpSession session,
            @Valid @RequestBody MobilePushTokenRegisterRequest request) {

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("로그인이 필요합니다."));
        }
        if (isUserIdSpoofed(currentUser, request.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("본인 계정만 푸시 토큰을 등록할 수 있습니다."));
        }
        Optional<MobilePushPlatform> platform = MobilePushPlatform.parse(request.getPlatform());
        if (platform.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("platform은 ios 또는 android 만 허용됩니다."));
        }

        String tenantId = requireUserTenant(currentUser);
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        if (isTenantHeaderMismatch(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("요청 테넌트와 계정 테넌트가 일치하지 않습니다."));
        }

        try {
            TenantContextHolder.setTenantId(tenantId);
            mobilePushService.registerToken(
                    tenantId,
                    currentUser.getId(),
                    request.getToken().trim(),
                    platform.get(),
                    request.getDeviceInfo());
            return ResponseEntity.ok(ApiResponse.success());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 푸시 토큰 해제(멱등).
     *
     * @param session 세션
     * @param request 해제 요청
     * @return 성공 시 본문 없음
     */
    @PostMapping("/push-token/unregister")
    public ResponseEntity<ApiResponse<Void>> unregisterToken(
            HttpSession session,
            @Valid @RequestBody MobilePushTokenUnregisterRequest request) {

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("로그인이 필요합니다."));
        }
        if (isUserIdSpoofed(currentUser, request.getUserId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("본인 계정만 푸시 토큰을 해제할 수 있습니다."));
        }

        String tenantId = requireUserTenant(currentUser);
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        if (isTenantHeaderMismatch(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("요청 테넌트와 계정 테넌트가 일치하지 않습니다."));
        }

        try {
            TenantContextHolder.setTenantId(tenantId);
            mobilePushService.unregisterToken(tenantId, currentUser.getId(), request.getToken().trim());
            return ResponseEntity.ok(ApiResponse.success());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 카테고리별 푸시 설정 조회 — 미저장 시 모두 true.
     *
     * @param session 세션
     * @return 설정
     */
    @GetMapping("/push-settings")
    public ResponseEntity<ApiResponse<MobilePushSettingsPayload>> getPushSettings(HttpSession session) {
        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("로그인이 필요합니다."));
        }
        String tenantId = requireUserTenant(currentUser);
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        if (isTenantHeaderMismatch(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("요청 테넌트와 계정 테넌트가 일치하지 않습니다."));
        }

        try {
            TenantContextHolder.setTenantId(tenantId);
            MobilePushSettingsPayload data = mobilePushService.getSettings(tenantId, currentUser.getId());
            return success(data);
        } finally {
            TenantContextHolder.clear();
        }
    }

    /**
     * 카테고리별 푸시 설정 부분 갱신.
     * <p>{@code null} 필드는 변경하지 않는다. 응답은 갱신 후 전체 스냅샷이다.</p>
     *
     * @param session 세션
     * @param patch 부분 요청
     * @return 병합된 설정
     */
    @PutMapping("/push-settings")
    public ResponseEntity<ApiResponse<MobilePushSettingsPayload>> putPushSettings(
            HttpSession session,
            @RequestBody MobilePushSettingsPatchRequest patch) {

        User currentUser = SessionUtils.getCurrentUser(session);
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("로그인이 필요합니다."));
        }
        String tenantId = requireUserTenant(currentUser);
        if (tenantId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("테넌트 정보가 없습니다."));
        }
        if (isTenantHeaderMismatch(currentUser)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("요청 테넌트와 계정 테넌트가 일치하지 않습니다."));
        }

        MobilePushSettingsPatchRequest body = patch != null ? patch : new MobilePushSettingsPatchRequest();

        try {
            TenantContextHolder.setTenantId(tenantId);
            MobilePushSettingsPayload data = mobilePushService.patchSettings(tenantId, currentUser.getId(), body);
            return success(data);
        } finally {
            TenantContextHolder.clear();
        }
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String requireUserTenant(User user) {
        return trimToNull(user.getTenantId());
    }

    /**
     * {@code X-Tenant-Id}(또는 컨텍스트)가 계정 테넌트와 다르면 true.
     */
    private static boolean isTenantHeaderMismatch(User user) {
        String ctx = trimToNull(TenantContextHolder.getTenantId());
        if (ctx == null) {
            return false;
        }
        String userTenant = requireUserTenant(user);
        return userTenant == null || !ctx.equals(userTenant);
    }

    private static boolean isUserIdSpoofed(User currentUser, Long bodyUserId) {
        return bodyUserId != null && !bodyUserId.equals(currentUser.getId());
    }
}
