package com.coresolution.core.service;

import com.coresolution.core.constants.TenantDisplayNameMessages;
import com.coresolution.core.domain.Tenant;
import com.coresolution.core.dto.BrandingInfo;
import com.coresolution.core.dto.BrandingUpdateRequest;
import com.coresolution.core.repository.TenantRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Base64;
import java.util.UUID;

/**
 * 브랜딩 관리 서비스
 * 테넌트별 로고, 상호명 등 브랜딩 정보를 관리
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BrandingService {
    
    private final TenantRepository tenantRepository;
    private final ObjectMapper objectMapper;
    
    // 로고 저장 경로 (실제 환경에서는 S3 등 클라우드 스토리지 사용 권장)
    private static final String LOGO_UPLOAD_DIR = "uploads/logos/";
    private static final String LOGO_URL_PREFIX = "/api/files/logos/";
    /** {@link com.coresolution.core.controller.FileController} 와 동일한 로고 URL 프리픽스 */
    private static final String LOGO_URL_PREFIX_V1 = "/api/v1/files/logos/";

    /**
     * API 응답에 포함할 로고 인라인 data URI 최대 크기(바이트). 초과 시 URL만 유지합니다.
     */
    private static final int MAX_INLINE_LOGO_BYTES = 512 * 1024;

    // 지원하는 이미지 형식
    private static final String[] SUPPORTED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/svg+xml"};
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    
    /**
     * 테넌트의 브랜딩 정보 조회
     */
    public BrandingInfo getBrandingInfo(String tenantId) {
        log.debug("브랜딩 정보 조회 시작: tenantId={}", tenantId);
        
        Tenant tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("테넌트를 찾을 수 없습니다: " + tenantId));
        
        BrandingInfo brandingInfo = parseBrandingJson(tenant.getBrandingJson());
        
        // Fallback 처리: 브랜딩 정보가 없거나 불완전한 경우 기본값 적용
        if (brandingInfo == null) {
            log.debug("브랜딩 정보가 없어 기본값 적용: tenantId={}", tenantId);
            brandingInfo = BrandingInfo.createDefault(tenant.getName());
        } else {
            // 부분적으로 누락된 정보 보완
            if (!brandingInfo.hasLogo()) {
                log.debug("로고 정보 없어 기본 로고 적용: tenantId={}", tenantId);
                brandingInfo.setLogo(BrandingInfo.LogoInfo.builder()
                    .url("/images/core-solution-logo.png")
                    .width(200)
                    .height(60)
                    .format("png")
                    .alt("CoreSolution")
                    .build());
            }
        }

        // 회사명(한글)은 항상 tenants.name 과 동일 (단일 소스)
        String tenantDisplayName = tenant.getName();
        brandingInfo.setCompanyName(
            tenantDisplayName != null && !tenantDisplayName.isBlank()
                ? tenantDisplayName.trim()
                : "CoreSolution");

        log.debug("브랜딩 정보 조회 완료: tenantId={}, hasLogo={}, companyName={}", 
            tenantId, brandingInfo.hasLogo(), brandingInfo.getDisplayName());

        enrichLogoDataUri(brandingInfo);
        return brandingInfo;
    }
    
    /**
     * 브랜딩 정보 업데이트 (로고 제외)
     */
    @Transactional
    public BrandingInfo updateBrandingInfo(String tenantId, BrandingUpdateRequest request) {
        log.info("브랜딩 정보 업데이트 시작: tenantId={}", tenantId);
        
        Tenant tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("테넌트를 찾을 수 없습니다: " + tenantId));
        
        // 기존 브랜딩 정보 조회
        BrandingInfo currentBranding = parseBrandingJson(tenant.getBrandingJson());
        if (currentBranding == null) {
            currentBranding = BrandingInfo.createDefault(tenant.getName());
        }
        
        // 회사명(한글) 변경 시 tenants.name 과 동기화 (중복 규칙 동일)
        if (request.getCompanyName() != null) {
            String trimmed = request.getCompanyName().trim();
            if (trimmed.isEmpty()) {
                throw new IllegalArgumentException(TenantDisplayNameMessages.NAME_EMPTY_AFTER_TRIM);
            }
            tenantRepository.findByNameAndIsDeletedFalse(trimmed).ifPresent(other -> {
                if (!other.getTenantId().equals(tenantId)) {
                    throw new IllegalArgumentException(TenantDisplayNameMessages.DUPLICATE_NAME_IN_USE);
                }
            });
            tenant.setName(trimmed);
            currentBranding.setCompanyName(trimmed);
        }
        if (request.getCompanyNameEn() != null) {
            currentBranding.setCompanyNameEn(request.getCompanyNameEn());
        }
        if (request.getPrimaryColor() != null) {
            currentBranding.setPrimaryColor(request.getPrimaryColor());
        }
        if (request.getSecondaryColor() != null) {
            currentBranding.setSecondaryColor(request.getSecondaryColor());
        }
        if (request.getFavicon() != null) {
            currentBranding.setFavicon(request.getFavicon());
        }
        
        // JSON으로 변환하여 저장
        try {
            stripLogoDataUriForPersistence(currentBranding);
            String brandingJson = objectMapper.writeValueAsString(currentBranding);
            tenant.setBrandingJson(brandingJson);
            tenantRepository.save(tenant);
            
            log.info("브랜딩 정보 업데이트 완료: tenantId={}", tenantId);
            enrichLogoDataUri(currentBranding);
            return currentBranding;
            
        } catch (JsonProcessingException e) {
            log.error("브랜딩 정보 JSON 변환 실패: tenantId={}", tenantId, e);
            throw new RuntimeException("브랜딩 정보 저장 중 오류가 발생했습니다", e);
        }
    }

    /**
     * {@code tenants.name} 변경 후 {@code branding_json} 의 회사명(한글)을 동일하게 맞춥니다.
     *
     * @param tenant 방금 저장된 테넌트 엔티티
     */
    @Transactional
    public void syncBrandingJsonCompanyNameWithTenant(Tenant tenant) {
        String tenantId = tenant.getTenantId();
        log.debug("브랜딩 JSON 회사명을 테넌트 표시명과 동기화: tenantId={}", tenantId);
        try {
            BrandingInfo info = parseBrandingJson(tenant.getBrandingJson());
            if (info == null) {
                info = BrandingInfo.createDefault(tenant.getName());
            } else {
                String tn = tenant.getName();
                info.setCompanyName(tn != null && !tn.isBlank() ? tn.trim() : "CoreSolution");
            }
            stripLogoDataUriForPersistence(info);
            tenant.setBrandingJson(objectMapper.writeValueAsString(info));
            tenantRepository.save(tenant);
        } catch (JsonProcessingException e) {
            log.error("브랜딩 JSON 동기화 실패: tenantId={}", tenantId, e);
            throw new RuntimeException("브랜딩 정보 동기화 중 오류가 발생했습니다", e);
        }
    }

    /**
     * 로고 업로드
     */
    @Transactional
    public BrandingInfo uploadLogo(String tenantId, MultipartFile logoFile) {
        log.info("로고 업로드 시작: tenantId={}, fileName={}, size={}", 
            tenantId, logoFile.getOriginalFilename(), logoFile.getSize());
        
        // 파일 검증
        validateLogoFile(logoFile);
        
        Tenant tenant = tenantRepository.findByTenantIdAndIsDeletedFalse(tenantId)
            .orElseThrow(() -> new IllegalArgumentException("테넌트를 찾을 수 없습니다: " + tenantId));
        
        try {
            // 파일 저장
            String savedFileName = saveLogoFile(tenantId, logoFile);
            String logoUrl = LOGO_URL_PREFIX + savedFileName;
            
            // 브랜딩 정보 업데이트
            BrandingInfo brandingInfo = parseBrandingJson(tenant.getBrandingJson());
            if (brandingInfo == null) {
                brandingInfo = BrandingInfo.createDefault(tenant.getName());
            }
            
            // 로고 정보 업데이트
            BrandingInfo.LogoInfo logoInfo = BrandingInfo.LogoInfo.builder()
                .url(logoUrl)
                .format(getFileExtension(logoFile.getOriginalFilename()))
                .alt(brandingInfo.getDisplayName())
                .build();
            
            brandingInfo.setLogo(logoInfo);
            
            // JSON으로 변환하여 저장
            stripLogoDataUriForPersistence(brandingInfo);
            String brandingJson = objectMapper.writeValueAsString(brandingInfo);
            tenant.setBrandingJson(brandingJson);
            tenantRepository.save(tenant);
            
            log.info("로고 업로드 완료: tenantId={}, logoUrl={}", tenantId, logoUrl);
            enrichLogoDataUri(brandingInfo);
            return brandingInfo;
            
        } catch (JsonProcessingException e) {
            log.error("브랜딩 정보 JSON 변환 실패: tenantId={}", tenantId, e);
            throw new RuntimeException("브랜딩 정보 저장 중 오류가 발생했습니다", e);
        } catch (IOException e) {
            log.error("로고 파일 저장 실패: tenantId={}", tenantId, e);
            throw new RuntimeException("로고 업로드 중 오류가 발생했습니다", e);
        }
    }
    
    /**
     * 브랜딩 JSON 파싱
     */
    private BrandingInfo parseBrandingJson(String brandingJson) {
        if (brandingJson == null || brandingJson.trim().isEmpty()) {
            return null;
        }
        
        try {
            BrandingInfo parsed = objectMapper.readValue(brandingJson, BrandingInfo.class);
            stripLogoDataUriForPersistence(parsed);
            return parsed;
        } catch (JsonProcessingException e) {
            log.warn("브랜딩 JSON 파싱 실패, 기본값 사용: json={}", brandingJson, e);
            return null;
        }
    }

    /**
     * persistence 직전에 로고의 data URI를 제거합니다. {@code branding_json} 컬럼에는 저장하지 않습니다.
     *
     * @param info 브랜딩 정보
     */
    public void stripLogoDataUriForPersistence(BrandingInfo info) {
        if (info == null || info.getLogo() == null) {
            return;
        }
        info.getLogo().setDataUri(null);
    }

    /**
     * 업로드 경로 로고 URL에 대해 로컬 파일이 있으면 {@link BrandingInfo.LogoInfo#setDataUri(String)} 를 채웁니다.
     *
     * @param info 브랜딩 정보
     */
    private void enrichLogoDataUri(BrandingInfo info) {
        if (info == null || !info.hasLogo()) {
            return;
        }
        BrandingInfo.LogoInfo logo = info.getLogo();
        String url = logo.getUrl();
        String fileName = extractFileNameFromLogoUrl(url);
        if (fileName == null || fileName.isBlank()) {
            return;
        }

        Path uploadBase = Paths.get(LOGO_UPLOAD_DIR).toAbsolutePath().normalize();
        Path filePath = uploadBase.resolve(fileName).normalize();
        if (!filePath.startsWith(uploadBase)) {
            log.warn("로고 파일 경로가 허용 범위를 벗어남: fileName={}", fileName);
            return;
        }

        if (!Files.isRegularFile(filePath) || !Files.isReadable(filePath)) {
            return;
        }

        try {
            long size = Files.size(filePath);
            if (size > MAX_INLINE_LOGO_BYTES) {
                log.debug("로고 파일이 인라인 최대 크기를 초과하여 dataUri 생략: size={}, fileName={}", size,
                    fileName);
                return;
            }
            byte[] bytes = Files.readAllBytes(filePath);
            String mime = mimeTypeForLogoFileName(fileName);
            String b64 = Base64.getEncoder().encodeToString(bytes);
            logo.setDataUri("data:" + mime + ";base64," + b64);
        } catch (IOException e) {
            log.debug("로고 파일 읽기 실패로 dataUri 생략: fileName={}, error={}", fileName, e.getMessage());
        }
    }

    /**
     * 로고 서빙 URL에서 파일명만 추출합니다. 레거시·v1 경로 모두 허용합니다.
     *
     * @param url 로고 URL
     * @return 파일명 또는 해당 없으면 null
     */
    public String extractFileNameFromLogoUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }
        String u = url.trim();
        if (u.startsWith(LOGO_URL_PREFIX_V1)) {
            return u.substring(LOGO_URL_PREFIX_V1.length());
        }
        if (u.startsWith(LOGO_URL_PREFIX)) {
            return u.substring(LOGO_URL_PREFIX.length());
        }
        return null;
    }

    /**
     * {@link com.coresolution.core.controller.FileController#getContentType(String)} 와 동일한 MIME 매핑입니다.
     */
    private static String mimeTypeForLogoFileName(String fileName) {
        if (fileName == null || fileName.lastIndexOf('.') == -1) {
            return "application/octet-stream";
        }
        String ext = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        switch (ext) {
            case "png":
                return "image/png";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "svg":
                return "image/svg+xml";
            case "gif":
                return "image/gif";
            case "webp":
                return "image/webp";
            default:
                return "application/octet-stream";
        }
    }
    
    /**
     * 로고 파일 검증
     */
    private void validateLogoFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다");
        }
        
        String contentType = file.getContentType();
        boolean isSupported = false;
        for (String supportedType : SUPPORTED_IMAGE_TYPES) {
            if (supportedType.equals(contentType)) {
                isSupported = true;
                break;
            }
        }
        
        if (!isSupported) {
            throw new IllegalArgumentException("지원하지 않는 파일 형식입니다. PNG, JPG, SVG 파일만 업로드 가능합니다");
        }
    }
    
    /**
     * 로고 파일 저장
     */
    private String saveLogoFile(String tenantId, MultipartFile file) throws IOException {
        // 업로드 디렉토리 생성
        Path uploadDir = Paths.get(LOGO_UPLOAD_DIR);
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }
        
        // 파일명 생성 (테넌트ID_UUID.확장자)
        String originalFileName = file.getOriginalFilename();
        String extension = getFileExtension(originalFileName);
        String savedFileName = tenantId + "_" + UUID.randomUUID().toString() + "." + extension;
        
        // 파일 저장
        Path filePath = uploadDir.resolve(savedFileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        return savedFileName;
    }
    
    /**
     * 파일 확장자 추출
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.lastIndexOf('.') == -1) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
