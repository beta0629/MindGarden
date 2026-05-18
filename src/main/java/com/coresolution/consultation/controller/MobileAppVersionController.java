package com.coresolution.consultation.controller;

import com.coresolution.consultation.dto.mobileversion.MobileAppVersionCheckResponse;
import com.coresolution.consultation.service.MobileAppVersionService;
import com.coresolution.core.controller.BaseApiController;
import com.coresolution.core.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 모바일 네이티브 버전 검사 (인증·테넌트 불필요).
 *
 * @author MindGarden
 * @since 2026-05-18
 */
@RestController
@RequestMapping("/api/v1/mobile/app-version")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class MobileAppVersionController extends BaseApiController {

    private final MobileAppVersionService mobileAppVersionService;

    /**
     * @param platform    {@code android} | {@code ios}
     * @param version     앱 semver
     * @param versionCode Android 빌드 번호 (선택, 제공 시 semver보다 우선)
     * @return 업데이트 필요 여부
     */
    @GetMapping("/check")
    public ResponseEntity<ApiResponse<MobileAppVersionCheckResponse>> check(
            @RequestParam String platform,
            @RequestParam String version,
            @RequestParam(required = false) Integer versionCode) {

        MobileAppVersionCheckResponse body =
                mobileAppVersionService.check(platform, version, versionCode);
        return success(body);
    }
}
