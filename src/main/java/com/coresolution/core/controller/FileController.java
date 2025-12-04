package com.coresolution.core.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 파일 서빙 컨트롤러
 * 업로드된 파일들을 서빙하는 REST API
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/files", "/api/files"}) // v1 경로 추가, 레거시 경로 유지
@Tag(name = "File", description = "파일 서빙 API")
public class FileController {
    
    private static final String LOGO_UPLOAD_DIR = "uploads/logos/";
    
    /**
     * 로고 파일 서빙
     */
    @GetMapping("/logos/{fileName}")
    @Operation(summary = "로고 파일 조회", description = "업로드된 로고 파일을 조회합니다")
    public ResponseEntity<Resource> getLogoFile(
            @Parameter(description = "파일명") @PathVariable String fileName) {
        try {
            Path filePath = Paths.get(LOGO_UPLOAD_DIR).resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                log.warn("로고 파일을 찾을 수 없음: fileName={}", fileName);
                return ResponseEntity.notFound().build();
            }
            
            // 파일 확장자에 따른 Content-Type 설정
            String contentType = getContentType(fileName);
            
            log.debug("로고 파일 서빙: fileName={}, contentType={}", fileName, contentType);
            
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
                
        } catch (MalformedURLException e) {
            log.error("로고 파일 경로 오류: fileName={}", fileName, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * 파일 확장자에 따른 Content-Type 반환
     */
    private String getContentType(String fileName) {
        String extension = getFileExtension(fileName);
        
        switch (extension.toLowerCase()) {
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
     * 파일 확장자 추출
     */
    private String getFileExtension(String fileName) {
        if (fileName == null || fileName.lastIndexOf('.') == -1) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1);
    }
}
