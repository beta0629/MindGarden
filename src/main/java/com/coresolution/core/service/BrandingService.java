package com.coresolution.core.service;

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
            
            if (!brandingInfo.hasCompanyName()) {
                log.debug("회사명 없어 테넌트명 적용: tenantId={}, tenantName={}", tenantId, tenant.getName());
                brandingInfo.setCompanyName(tenant.getName() != null ? tenant.getName() : "CoreSolution");
            }
        }
        
        log.debug("브랜딩 정보 조회 완료: tenantId={}, hasLogo={}, companyName={}", 
            tenantId, brandingInfo.hasLogo(), brandingInfo.getDisplayName());
        
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
        
        // 요청된 정보로 업데이트
        if (request.getCompanyName() != null) {
            currentBranding.setCompanyName(request.getCompanyName());
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
            String brandingJson = objectMapper.writeValueAsString(currentBranding);
            tenant.setBrandingJson(brandingJson);
            tenantRepository.save(tenant);
            
            log.info("브랜딩 정보 업데이트 완료: tenantId={}", tenantId);
            return currentBranding;
            
        } catch (JsonProcessingException e) {
            log.error("브랜딩 정보 JSON 변환 실패: tenantId={}", tenantId, e);
            throw new RuntimeException("브랜딩 정보 저장 중 오류가 발생했습니다", e);
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
            String brandingJson = objectMapper.writeValueAsString(brandingInfo);
            tenant.setBrandingJson(brandingJson);
            tenantRepository.save(tenant);
            
            log.info("로고 업로드 완료: tenantId={}, logoUrl={}", tenantId, logoUrl);
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
            return objectMapper.readValue(brandingJson, BrandingInfo.class);
        } catch (JsonProcessingException e) {
            log.warn("브랜딩 JSON 파싱 실패, 기본값 사용: json={}", brandingJson, e);
            return null;
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
