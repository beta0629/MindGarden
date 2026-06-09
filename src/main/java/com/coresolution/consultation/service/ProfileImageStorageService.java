package com.coresolution.consultation.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;

/**
 * 사용자 프로필 이미지 업로드·서빙·삭제를 담당하는 서비스.
 *
 * <p>P0 영구 대책 Phase 2 — 2026-06-09. {@code users.profile_image_url} 컬럼에 base64 dataURI 가
 * 저장돼 마이페이지 응답이 폭증한 회귀(PR #159 / #166 가드 라인)의 영구 해소를 위한 로컬 디스크 기반
 * 업로드 endpoint 의 저장소 계층이다. {@code TenantLogoFileUtils} + {@code ShopCatalogSkuThumbnailServiceImpl}
 * 패턴과 동일 계열로 매직바이트·MIME·확장자·사이즈 가드를 단일 경로에서 수행한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
public interface ProfileImageStorageService {

    /**
     * 업로드 파일을 검증한 뒤 운영 공용 폴더에 저장하고, 서빙 URL 을 반환한다.
     *
     * @param tenantId 호출자 테넌트 ID (파일명 prefix)
     * @param userId   대상 사용자 PK
     * @param file     멀티파트 업로드 파일
     * @return 서빙 URL ({@code /api/v1/files/profile-images/{savedFileName}})
     * @throws IllegalArgumentException 파일이 비었거나 사이즈/MIME/매직바이트가 정책 위반인 경우
     * @throws java.io.UncheckedIOException 저장 중 IO 오류가 발생한 경우
     */
    String store(String tenantId, Long userId, MultipartFile file);

    /**
     * base64 dataURI ({@code data:image/png;base64,...} 등) 입력을 디코드·검증한 뒤 운영 공용 폴더에
     * 저장하고 서빙 URL 을 반환한다. {@link #store(String, Long, MultipartFile)} 와 동일한 사이즈·MIME·
     * 매직바이트 정책을 적용한다.
     *
     * <p>P0 핫픽스 — 2026-06-09. v1.0.6 expo-app · 강제 리로드 안 한 web 사용자가 multipart 빌드(PR #167)
     * 도입 후에도 여전히 dataURI 를 전송해 발생한 회귀(MyPage·UserProfile 가드의 400 거부)를 후방 호환으로
     * 흡수한다. 호출부(MyPage·UserProfile·Admin 서비스)에서 입력이 dataURI 면 본 메서드로 변환해 storage
     * URL 만 {@code users.profile_image_url} 에 저장한다.</p>
     *
     * @param tenantId 호출자 테넌트 ID (파일명 prefix). null·blank 면 거부.
     * @param userId   대상 사용자 PK. null·≤0 이면 거부.
     * @param dataUri  {@code data:image/(jpeg|png|webp);base64,...} 형태 문자열. null·blank 면 null 반환.
     * @return 서빙 URL ({@code /api/v1/files/profile-images/{savedFileName}}). 입력이 비었으면 null.
     * @throws IllegalArgumentException prefix·MIME·사이즈·base64 디코드·매직바이트 정책 위반 시
     * @throws java.io.UncheckedIOException 저장 중 IO 오류가 발생한 경우
     */
    String storeFromDataUri(String tenantId, Long userId, String dataUri);

    /**
     * 우리 서빙 URL prefix 로 시작하는 기존 URL 의 파일을 즉시 unlink 한다.
     * 외부 URL 이거나 prefix 미일치 시 no-op. path traversal 입력은 무시.
     *
     * @param url DB 에 저장돼 있던 이전 프로필 이미지 URL
     */
    void deleteByUrl(String url);

    /**
     * 서빙용 리소스 로딩. {@link com.coresolution.core.controller.FileController} 에서 사용.
     *
     * @param fileName 저장 파일명 (URL prefix 이후 마지막 segment)
     * @return 파일 리소스. 존재하지 않으면 빈 결과를 그대로 반환하지 않고 null 을 반환.
     */
    Resource loadAsResource(String fileName);
}
