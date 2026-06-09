package com.coresolution.consultation.constant;

import java.util.Set;

/**
 * 사용자 프로필 이미지 업로드(로컬 디스크 기반) 상수.
 *
 * <p>P0 영구 대책 Phase 2 — 2026-06-09. {@code users.profile_image_url} 컬럼에 base64 dataURI
 * 가 저장돼 마이페이지 응답이 폭증한 회귀(PR #159 / #166 가드와 동일 정책 라인) 의 영구 해소를 위해
 * 도입한다. 로컬 디스크 + Spring {@link org.springframework.web.multipart.MultipartFile} 패턴은
 * 기존 {@code TenantLogoFileUtils} / {@code ShopCatalogSkuConstants} 와 동일 계열이다.</p>
 *
 * <p>운영 저장소(blue/green 공용 폴더)는 절대경로로 환경변수 {@code PROFILE_IMAGE_UPLOAD_DIR}
 * (예: {@code /var/mindgarden/uploads/profile-images/}) 로 주입한다. 개발 기본값은
 * {@code ./uploads/profile-images/}.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
public final class ProfileImageStorageConstants {

    /** 업로드 최대 크기 (5MB). 사용자 결정 D2. */
    public static final long MAX_FILE_SIZE_BYTES = 5L * 1024L * 1024L;

    /** 허용 MIME 타입. 사용자 결정 D3 — PNG / JPEG / WEBP. */
    public static final Set<String> ALLOWED_MIME_TYPES =
        Set.of("image/jpeg", "image/png", "image/webp");

    /** 허용 확장자(소문자, 점 제외). MIME 와 정합. */
    public static final Set<String> ALLOWED_EXTENSIONS =
        Set.of("jpg", "jpeg", "png", "webp");

    /** 서빙 URL 접두사. {@code FileController.getProfileImage} 와 정합. */
    public static final String URL_PREFIX = "/api/v1/files/profile-images/";

    /** 저장 파일명 패턴 설명용 상수 — {@code {tenantId}_{userId}_{UUID}.{ext}}. */
    public static final String FILE_NAME_PATTERN = "{tenantId}_{userId}_{UUID}.{ext}";

    public static final String MSG_FILE_REQUIRED = "업로드 파일이 비어 있습니다.";
    public static final String MSG_FILE_TOO_LARGE =
        "파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.";
    public static final String MSG_UNSUPPORTED_MIME =
        "지원하지 않는 파일 형식입니다. PNG, JPG, WEBP 파일만 업로드 가능합니다.";
    public static final String MSG_UNSUPPORTED_EXTENSION =
        "지원하지 않는 파일 확장자입니다. PNG, JPG, WEBP 만 업로드 가능합니다.";
    public static final String MSG_MAGIC_BYTES_MISMATCH =
        "파일 내용이 선언된 형식과 일치하지 않습니다. 다른 파일을 업로드해 주세요.";
    public static final String MSG_FORBIDDEN =
        "프로필 이미지를 수정할 권한이 없습니다.";
    public static final String MSG_LOGIN_REQUIRED = "로그인이 필요합니다.";
    public static final String MSG_INVALID_FILE_NAME = "잘못된 파일 경로입니다.";
    public static final String MSG_NOT_FOUND = "프로필 이미지 파일이 존재하지 않습니다.";
    public static final String MSG_STORAGE_FAILED = "프로필 이미지 저장 중 오류가 발생했습니다.";

    private ProfileImageStorageConstants() {
    }
}
