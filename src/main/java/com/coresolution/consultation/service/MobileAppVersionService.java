package com.coresolution.consultation.service;

import com.coresolution.consultation.dto.mobileversion.MobileAppVersionCheckResponse;

/**
 * 모바일 네이티브 버전 게이트 (테넌트 무관).
 *
 * @author MindGarden
 * @since 2026-05-18
 */
public interface MobileAppVersionService {

    /**
     * 클라이언트 버전이 최소 요구사항 미만인지 검사한다.
     *
     * @param platform    {@code android} 또는 {@code ios}
     * @param version     semver 문자열
     * @param versionCode Android 빌드 번호 (선택)
     * @return 검사 결과
     */
    MobileAppVersionCheckResponse check(String platform, String version, Integer versionCode);
}
