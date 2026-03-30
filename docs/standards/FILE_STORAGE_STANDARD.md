# 파일 업로드/다운로드 및 스토리지 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📋 개요

CoreSolution 플랫폼의 파일 업로드/다운로드 및 스토리지 관리 표준입니다. 로컬 스토리지, S3 클라우드 스토리지, 파일 메타데이터 관리, 테넌트별 파일 격리를 정의합니다.

---

## 🎯 핵심 원칙

### ⭐ 테넌트별 파일 격리 원칙

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  모든 파일은 테넌트별로 완전히 격리되어 저장되어야 합니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**파일 관리 원칙**:
- ✅ 테넌트별 독립 저장 경로
- ✅ 파일명 충돌 방지 (UUID 사용)
- ✅ 파일 메타데이터 DB 저장
- ✅ 파일 크기 제한 검증
- ✅ 파일 타입 검증
- ✅ 바이러스 스캔 (선택)
- ✅ 자동 백업
- ❌ 크로스 테넌트 파일 접근 금지
- ❌ 원본 파일명 그대로 저장 금지

---

## 🗂️ 스토리지 전략 패턴

### 1. 스토리지 전략 인터페이스

```java
package com.coresolution.core.storage;

import java.io.InputStream;

/**
 * 스토리지 전략 인터페이스
 * 로컬 스토리지 또는 S3 스토리지 구현체를 선택적으로 사용
 */
public interface StorageStrategy {
    
    /**
     * 파일 저장
     * 
     * @param tenantId 테넌트 ID
     * @param fileName 파일명 (UUID 기반)
     * @param inputStream 파일 입력 스트림
     * @param metadata 파일 메타데이터
     * @return 파일 URL
     */
    String store(String tenantId, String fileName, InputStream inputStream, FileMetadata metadata);
    
    /**
     * 파일 조회
     * 
     * @param tenantId 테넌트 ID
     * @param fileName 파일명
     * @return 파일 입력 스트림
     */
    InputStream retrieve(String tenantId, String fileName);
    
    /**
     * 파일 삭제
     * 
     * @param tenantId 테넌트 ID
     * @param fileName 파일명
     */
    void delete(String tenantId, String fileName);
    
    /**
     * 파일 존재 여부 확인
     * 
     * @param tenantId 테넌트 ID
     * @param fileName 파일명
     * @return 존재 여부
     */
    boolean exists(String tenantId, String fileName);
    
    /**
     * 파일 URL 생성
     * 
     * @param tenantId 테넌트 ID
     * @param fileName 파일명
     * @return 파일 URL
     */
    String generateUrl(String tenantId, String fileName);
}
```

### 2. 로컬 스토리지 구현

```java
@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
@Slf4j
public class LocalStorageStrategy implements StorageStrategy {
    
    @Value("${storage.local.base-path:./uploads}")
    private String basePath;
    
    @Value("${storage.local.url-prefix:/api/files}")
    private String urlPrefix;
    
    @Override
    public String store(String tenantId, String fileName, InputStream inputStream, FileMetadata metadata) {
        try {
            // 1. 테넌트별 디렉토리 생성
            Path tenantDir = Paths.get(basePath, tenantId);
            Files.createDirectories(tenantDir);
            
            // 2. 파일 저장
            Path filePath = tenantDir.resolve(fileName);
            Files.copy(inputStream, filePath, StandardCopyOption.REPLACE_EXISTING);
            
            log.info("✅ 파일 저장 완료: tenantId={}, fileName={}, size={}", 
                tenantId, fileName, metadata.getFileSize());
            
            // 3. URL 생성
            return generateUrl(tenantId, fileName);
            
        } catch (IOException e) {
            log.error("❌ 파일 저장 실패: tenantId={}, fileName={}", tenantId, fileName, e);
            throw new FileStorageException("파일 저장에 실패했습니다.", e);
        }
    }
    
    @Override
    public InputStream retrieve(String tenantId, String fileName) {
        try {
            Path filePath = Paths.get(basePath, tenantId, fileName);
            
            if (!Files.exists(filePath)) {
                throw new FileNotFoundException("파일을 찾을 수 없습니다: " + fileName);
            }
            
            return Files.newInputStream(filePath);
            
        } catch (IOException e) {
            log.error("❌ 파일 조회 실패: tenantId={}, fileName={}", tenantId, fileName, e);
            throw new FileStorageException("파일 조회에 실패했습니다.", e);
        }
    }
    
    @Override
    public void delete(String tenantId, String fileName) {
        try {
            Path filePath = Paths.get(basePath, tenantId, fileName);
            Files.deleteIfExists(filePath);
            
            log.info("✅ 파일 삭제 완료: tenantId={}, fileName={}", tenantId, fileName);
            
        } catch (IOException e) {
            log.error("❌ 파일 삭제 실패: tenantId={}, fileName={}", tenantId, fileName, e);
            throw new FileStorageException("파일 삭제에 실패했습니다.", e);
        }
    }
    
    @Override
    public boolean exists(String tenantId, String fileName) {
        Path filePath = Paths.get(basePath, tenantId, fileName);
        return Files.exists(filePath);
    }
    
    @Override
    public String generateUrl(String tenantId, String fileName) {
        return String.format("%s/%s/%s", urlPrefix, tenantId, fileName);
    }
}
```

### 3. S3 스토리지 구현

```java
@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
@RequiredArgsConstructor
@Slf4j
public class S3StorageStrategy implements StorageStrategy {
    
    private final AmazonS3 s3Client;
    
    @Value("${storage.s3.bucket-name}")
    private String bucketName;
    
    @Value("${storage.s3.region}")
    private String region;
    
    @Override
    public String store(String tenantId, String fileName, InputStream inputStream, FileMetadata metadata) {
        try {
            // 1. S3 객체 키 생성 (테넌트별 격리)
            String objectKey = buildObjectKey(tenantId, fileName);
            
            // 2. 메타데이터 설정
            ObjectMetadata s3Metadata = new ObjectMetadata();
            s3Metadata.setContentLength(metadata.getFileSize());
            s3Metadata.setContentType(metadata.getMimeType());
            s3Metadata.addUserMetadata("tenant-id", tenantId);
            s3Metadata.addUserMetadata("original-name", metadata.getOriginalName());
            
            // 3. S3 업로드
            PutObjectRequest putRequest = new PutObjectRequest(
                bucketName, 
                objectKey, 
                inputStream, 
                s3Metadata
            );
            
            s3Client.putObject(putRequest);
            
            log.info("✅ S3 파일 저장 완료: tenantId={}, fileName={}, bucket={}, key={}", 
                tenantId, fileName, bucketName, objectKey);
            
            // 4. URL 생성
            return generateUrl(tenantId, fileName);
            
        } catch (AmazonServiceException e) {
            log.error("❌ S3 파일 저장 실패: tenantId={}, fileName={}", tenantId, fileName, e);
            throw new FileStorageException("S3 파일 저장에 실패했습니다.", e);
        }
    }
    
    @Override
    public InputStream retrieve(String tenantId, String fileName) {
        try {
            String objectKey = buildObjectKey(tenantId, fileName);
            
            S3Object s3Object = s3Client.getObject(bucketName, objectKey);
            return s3Object.getObjectContent();
            
        } catch (AmazonServiceException e) {
            log.error("❌ S3 파일 조회 실패: tenantId={}, fileName={}", tenantId, fileName, e);
            throw new FileStorageException("S3 파일 조회에 실패했습니다.", e);
        }
    }
    
    @Override
    public void delete(String tenantId, String fileName) {
        try {
            String objectKey = buildObjectKey(tenantId, fileName);
            s3Client.deleteObject(bucketName, objectKey);
            
            log.info("✅ S3 파일 삭제 완료: tenantId={}, fileName={}", tenantId, fileName);
            
        } catch (AmazonServiceException e) {
            log.error("❌ S3 파일 삭제 실패: tenantId={}, fileName={}", tenantId, fileName, e);
            throw new FileStorageException("S3 파일 삭제에 실패했습니다.", e);
        }
    }
    
    @Override
    public boolean exists(String tenantId, String fileName) {
        try {
            String objectKey = buildObjectKey(tenantId, fileName);
            return s3Client.doesObjectExist(bucketName, objectKey);
        } catch (AmazonServiceException e) {
            return false;
        }
    }
    
    @Override
    public String generateUrl(String tenantId, String fileName) {
        String objectKey = buildObjectKey(tenantId, fileName);
        return String.format("https://%s.s3.%s.amazonaws.com/%s", 
            bucketName, region, objectKey);
    }
    
    /**
     * S3 객체 키 생성 (테넌트별 격리)
     */
    private String buildObjectKey(String tenantId, String fileName) {
        return String.format("%s/%s", tenantId, fileName);
    }
}
```

---

## 📁 파일 업로드 서비스

### 1. 파일 업로드 서비스

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageService {
    
    private final StorageStrategy storageStrategy;
    private final FileMetadataRepository metadataRepository;
    private final TenantContextHolder tenantContextHolder;
    
    /**
     * 파일 업로드
     */
    @Transactional
    public FileUploadResponse uploadFile(MultipartFile file, FileUploadRequest request) {
        String tenantId = tenantContextHolder.getCurrentTenantId();
        
        // 1. 파일 검증
        validateFile(file, request);
        
        // 2. 파일 ID 및 저장 파일명 생성
        String fileId = UUID.randomUUID().toString();
        String storedFileName = generateStoredFileName(fileId, file.getOriginalFilename());
        
        // 3. 파일 메타데이터 생성
        FileMetadata metadata = FileMetadata.builder()
            .fileId(fileId)
            .tenantId(tenantId)
            .originalName(file.getOriginalFilename())
            .storedName(storedFileName)
            .fileSize(file.getSize())
            .mimeType(file.getContentType())
            .storageType(getStorageType())
            .uploadedBy(getCurrentUserId())
            .build();
        
        try {
            // 4. 파일 저장 (로컬 또는 S3)
            String fileUrl = storageStrategy.store(
                tenantId, 
                storedFileName, 
                file.getInputStream(), 
                metadata
            );
            
            metadata.setFileUrl(fileUrl);
            metadata.setFilePath(buildFilePath(tenantId, storedFileName));
            
            // 5. 메타데이터 저장
            metadataRepository.save(metadata);
            
            log.info("✅ 파일 업로드 완료: tenantId={}, fileId={}, originalName={}, size={}", 
                tenantId, fileId, file.getOriginalFilename(), file.getSize());
            
            return FileUploadResponse.from(metadata);
            
        } catch (IOException e) {
            log.error("❌ 파일 업로드 실패: tenantId={}, originalName={}", 
                tenantId, file.getOriginalFilename(), e);
            throw new FileStorageException("파일 업로드에 실패했습니다.", e);
        }
    }
    
    /**
     * 파일 다운로드
     */
    public FileDownloadResponse downloadFile(String fileId) {
        String tenantId = tenantContextHolder.getCurrentTenantId();
        
        // 1. 파일 메타데이터 조회 (테넌트 검증)
        FileMetadata metadata = metadataRepository
            .findByFileIdAndTenantId(fileId, tenantId)
            .orElseThrow(() -> new FileNotFoundException("파일을 찾을 수 없습니다: " + fileId));
        
        // 2. 파일 조회
        InputStream inputStream = storageStrategy.retrieve(tenantId, metadata.getStoredName());
        
        log.info("✅ 파일 다운로드: tenantId={}, fileId={}, originalName={}", 
            tenantId, fileId, metadata.getOriginalName());
        
        return FileDownloadResponse.builder()
            .inputStream(inputStream)
            .fileName(metadata.getOriginalName())
            .contentType(metadata.getMimeType())
            .fileSize(metadata.getFileSize())
            .build();
    }
    
    /**
     * 파일 삭제 (소프트 삭제)
     */
    @Transactional
    public void deleteFile(String fileId) {
        String tenantId = tenantContextHolder.getCurrentTenantId();
        
        // 1. 파일 메타데이터 조회 (테넌트 검증)
        FileMetadata metadata = metadataRepository
            .findByFileIdAndTenantId(fileId, tenantId)
            .orElseThrow(() -> new FileNotFoundException("파일을 찾을 수 없습니다: " + fileId));
        
        // 2. 소프트 삭제
        metadata.setIsDeleted(true);
        metadata.setDeletedAt(LocalDateTime.now());
        metadata.setDeletedBy(getCurrentUserId());
        metadataRepository.save(metadata);
        
        // 3. 실제 파일 삭제 (선택적, 배치로 처리 권장)
        // storageStrategy.delete(tenantId, metadata.getStoredName());
        
        log.info("✅ 파일 삭제: tenantId={}, fileId={}, originalName={}", 
            tenantId, fileId, metadata.getOriginalName());
    }
    
    /**
     * 파일 검증
     */
    private void validateFile(MultipartFile file, FileUploadRequest request) {
        // 파일 존재 여부
        if (file == null || file.isEmpty()) {
            throw new InvalidFileException("파일이 비어있습니다.");
        }
        
        // 파일 크기 검증
        long maxSize = request.getMaxSize() != null ? request.getMaxSize() : 10 * 1024 * 1024; // 기본 10MB
        if (file.getSize() > maxSize) {
            throw new InvalidFileException(
                String.format("파일 크기가 제한을 초과했습니다. 최대: %d MB", maxSize / 1024 / 1024)
            );
        }
        
        // 파일 타입 검증
        String contentType = file.getContentType();
        List<String> allowedTypes = request.getAllowedTypes();
        
        if (allowedTypes != null && !allowedTypes.isEmpty()) {
            if (!allowedTypes.contains(contentType)) {
                throw new InvalidFileException(
                    String.format("허용되지 않은 파일 타입입니다: %s", contentType)
                );
            }
        }
        
        // 파일 확장자 검증
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.contains(".")) {
            throw new InvalidFileException("파일 확장자가 없습니다.");
        }
    }
    
    /**
     * 저장 파일명 생성 (UUID 기반)
     */
    private String generateStoredFileName(String fileId, String originalFilename) {
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        return fileId + extension;
    }
    
    /**
     * 파일 경로 생성
     */
    private String buildFilePath(String tenantId, String storedFileName) {
        return String.format("%s/%s", tenantId, storedFileName);
    }
    
    /**
     * 현재 스토리지 타입 조회
     */
    private String getStorageType() {
        return storageStrategy instanceof LocalStorageStrategy ? "LOCAL" : "S3";
    }
    
    /**
     * 현재 사용자 ID 조회
     */
    private Long getCurrentUserId() {
        // SecurityContext에서 사용자 ID 조회
        return 1L; // 임시
    }
}
```

---

## 🗄️ 파일 메타데이터 관리

### 1. 파일 메타데이터 엔티티

```java
@Entity
@Table(name = "file_metadata",
    indexes = {
        @Index(name = "idx_tenant_id", columnList = "tenant_id"),
        @Index(name = "idx_file_id", columnList = "file_id"),
        @Index(name = "idx_uploaded_by", columnList = "uploaded_by"),
        @Index(name = "idx_is_deleted", columnList = "is_deleted")
    }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileMetadata {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;
    
    @Column(name = "file_id", unique = true, nullable = false, length = 50)
    private String fileId; // UUID
    
    @Column(name = "original_name", nullable = false)
    private String originalName;
    
    @Column(name = "stored_name", nullable = false)
    private String storedName;
    
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;
    
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;
    
    @Column(name = "file_size", nullable = false)
    private Long fileSize; // bytes
    
    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;
    
    @Column(name = "storage_type", nullable = false, length = 20)
    private String storageType; // LOCAL, S3
    
    @Column(name = "uploaded_by")
    private Long uploadedBy;
    
    // 감사 필드
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // 소프트 삭제
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(name = "deleted_by")
    private Long deletedBy;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
```

### 2. 파일 메타데이터 테이블

```sql
CREATE TABLE IF NOT EXISTS file_metadata (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    file_id VARCHAR(50) UNIQUE NOT NULL COMMENT '파일 ID (UUID)',
    original_name VARCHAR(255) NOT NULL COMMENT '원본 파일명',
    stored_name VARCHAR(255) NOT NULL COMMENT '저장된 파일명',
    file_path VARCHAR(500) NOT NULL COMMENT '파일 경로',
    file_url VARCHAR(500) NOT NULL COMMENT '파일 URL',
    file_size BIGINT NOT NULL COMMENT '파일 크기 (bytes)',
    mime_type VARCHAR(100) NOT NULL COMMENT 'MIME 타입',
    storage_type VARCHAR(20) NOT NULL COMMENT '스토리지 타입: LOCAL, S3',
    uploaded_by BIGINT COMMENT '업로드한 사용자 ID',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by BIGINT COMMENT '삭제한 사용자 ID',
    
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_file_id (file_id),
    INDEX idx_uploaded_by (uploaded_by),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_tenant_file_id (tenant_id, file_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='파일 메타데이터 테이블';
```

---

## 🌐 파일 API

### 1. 파일 업로드 API

```java
@RestController
@RequestMapping("/api/v1/files")
@RequiredArgsConstructor
public class FileController {
    
    private final FileStorageService fileStorageService;
    
    /**
     * 파일 업로드
     */
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
        @RequestParam("file") MultipartFile file,
        @RequestParam(value = "category", required = false) String category,
        @RequestParam(value = "maxSize", required = false) Long maxSize,
        @RequestParam(value = "allowedTypes", required = false) List<String> allowedTypes
    ) {
        FileUploadRequest request = FileUploadRequest.builder()
            .category(category)
            .maxSize(maxSize)
            .allowedTypes(allowedTypes)
            .build();
        
        FileUploadResponse response = fileStorageService.uploadFile(file, request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * 파일 다운로드
     */
    @GetMapping("/download/{fileId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileId) {
        FileDownloadResponse response = fileStorageService.downloadFile(fileId);
        
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(response.getContentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, 
                "attachment; filename=\"" + response.getFileName() + "\"")
            .body(new InputStreamResource(response.getInputStream()));
    }
    
    /**
     * 파일 삭제
     */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable String fileId) {
        fileStorageService.deleteFile(fileId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * 파일 정보 조회
     */
    @GetMapping("/{fileId}/info")
    public ResponseEntity<FileMetadataResponse> getFileInfo(@PathVariable String fileId) {
        FileMetadataResponse response = fileStorageService.getFileInfo(fileId);
        return ResponseEntity.ok(response);
    }
}
```

---

## 📏 파일 크기 및 타입 제한

### 1. 표준 파일 크기 제한

```yaml
# application.yml
storage:
  file-size-limits:
    # 이미지 파일
    image: 5MB      # 5 * 1024 * 1024 bytes
    # 문서 파일
    document: 10MB  # 10 * 1024 * 1024 bytes
    # 비디오 파일
    video: 100MB    # 100 * 1024 * 1024 bytes
    # 기본값
    default: 10MB
```

### 2. 표준 파일 타입

```java
public class FileTypeConstants {
    
    // 이미지 타입
    public static final List<String> IMAGE_TYPES = Arrays.asList(
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml"
    );
    
    // 문서 타입
    public static final List<String> DOCUMENT_TYPES = Arrays.asList(
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "text/plain"
    );
    
    // 비디오 타입
    public static final List<String> VIDEO_TYPES = Arrays.asList(
        "video/mp4",
        "video/mpeg",
        "video/quicktime",
        "video/x-msvideo"
    );
    
    // 오디오 타입
    public static final List<String> AUDIO_TYPES = Arrays.asList(
        "audio/mpeg",
        "audio/wav",
        "audio/ogg"
    );
}
```

---

## 🔒 보안

### 1. 파일 업로드 보안

```java
@Component
public class FileSecurityValidator {
    
    /**
     * 파일 확장자 화이트리스트 검증
     */
    public void validateFileExtension(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        
        List<String> allowedExtensions = Arrays.asList(
            "jpg", "jpeg", "png", "gif", "webp", "svg",
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt",
            "mp4", "mpeg", "mov", "avi",
            "mp3", "wav", "ogg"
        );
        
        if (!allowedExtensions.contains(extension)) {
            throw new InvalidFileException("허용되지 않은 파일 확장자입니다: " + extension);
        }
    }
    
    /**
     * 위험한 파일명 패턴 검증
     */
    public void validateFileName(String filename) {
        // 경로 탐색 공격 방지
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new InvalidFileException("잘못된 파일명입니다.");
        }
        
        // 특수문자 제한
        if (!filename.matches("^[a-zA-Z0-9._-]+$")) {
            throw new InvalidFileException("파일명에 허용되지 않은 문자가 포함되어 있습니다.");
        }
    }
    
    /**
     * 파일 내용 검증 (매직 넘버)
     */
    public void validateFileContent(MultipartFile file) throws IOException {
        byte[] fileBytes = file.getBytes();
        
        // JPEG 매직 넘버: FF D8 FF
        // PNG 매직 넘버: 89 50 4E 47
        // PDF 매직 넘버: 25 50 44 46
        
        // 실제 파일 타입과 확장자 일치 여부 검증
        String declaredType = file.getContentType();
        String actualType = detectFileType(fileBytes);
        
        if (!declaredType.equals(actualType)) {
            throw new InvalidFileException("파일 타입이 일치하지 않습니다.");
        }
    }
    
    private String detectFileType(byte[] bytes) {
        // 매직 넘버 기반 파일 타입 감지
        // Apache Tika 라이브러리 사용 권장
        return "application/octet-stream";
    }
    
    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot + 1) : "";
    }
}
```

---

## 🗑️ 파일 정리 배치

### 1. 삭제된 파일 정리 스케줄러

```java
@Component
@RequiredArgsConstructor
@Slf4j
public class FileCleanupScheduler {
    
    private final FileMetadataRepository metadataRepository;
    private final StorageStrategy storageStrategy;
    
    /**
     * 매일 새벽 3시에 30일 이상 지난 삭제 파일 정리
     */
    @Scheduled(cron = "0 0 3 * * ?")
    public void cleanupDeletedFiles() {
        log.info("🗑️ 삭제된 파일 정리 시작");
        
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(30);
        
        List<FileMetadata> deletedFiles = metadataRepository
            .findByIsDeletedTrueAndDeletedAtBefore(cutoffDate);
        
        int cleanedCount = 0;
        
        for (FileMetadata metadata : deletedFiles) {
            try {
                // 실제 파일 삭제
                storageStrategy.delete(metadata.getTenantId(), metadata.getStoredName());
                
                // 메타데이터 삭제
                metadataRepository.delete(metadata);
                
                cleanedCount++;
                
            } catch (Exception e) {
                log.error("파일 정리 실패: fileId={}", metadata.getFileId(), e);
            }
        }
        
        log.info("✅ 삭제된 파일 정리 완료: {}개", cleanedCount);
    }
}
```

---

## 🚫 금지 사항

### 1. 원본 파일명 그대로 저장 금지
```java
// ❌ 절대 금지 - 파일명 충돌 가능
String fileName = file.getOriginalFilename();
storageStrategy.store(tenantId, fileName, inputStream);

// ✅ 필수 - UUID 기반 파일명 생성
String fileId = UUID.randomUUID().toString();
String extension = getFileExtension(file.getOriginalFilename());
String storedFileName = fileId + extension;
storageStrategy.store(tenantId, storedFileName, inputStream);
```

### 2. 테넌트 검증 없이 파일 접근 금지
```java
// ❌ 절대 금지
FileMetadata metadata = metadataRepository.findByFileId(fileId);

// ✅ 필수 - 테넌트 ID 검증
String tenantId = tenantContextHolder.getCurrentTenantId();
FileMetadata metadata = metadataRepository
    .findByFileIdAndTenantId(fileId, tenantId)
    .orElseThrow(() -> new FileNotFoundException("파일을 찾을 수 없습니다."));
```

### 3. 파일 크기 검증 없이 업로드 금지
```java
// ❌ 금지
storageStrategy.store(tenantId, fileName, file.getInputStream());

// ✅ 필수
if (file.getSize() > MAX_FILE_SIZE) {
    throw new InvalidFileException("파일 크기 제한 초과");
}
storageStrategy.store(tenantId, fileName, file.getInputStream());
```

---

## ✅ 개발 체크리스트

### 스토리지 구현
- [ ] StorageStrategy 인터페이스 구현
- [ ] LocalStorageStrategy 구현
- [ ] S3StorageStrategy 구현 (선택)
- [ ] 테넌트별 디렉토리 격리

### 파일 업로드
- [ ] 파일 크기 검증
- [ ] 파일 타입 검증
- [ ] 파일명 보안 검증
- [ ] UUID 기반 파일명 생성
- [ ] 메타데이터 저장

### 파일 다운로드
- [ ] 테넌트 ID 검증
- [ ] 파일 존재 여부 확인
- [ ] Content-Type 헤더 설정
- [ ] Content-Disposition 헤더 설정

### 보안
- [ ] 파일 확장자 화이트리스트
- [ ] 매직 넘버 검증
- [ ] 경로 탐색 공격 방지
- [ ] 파일 크기 제한

### 정리
- [ ] 삭제된 파일 정리 스케줄러
- [ ] 30일 이상 지난 파일 삭제

---

## 📖 참조 문서

- [테넌트 역할 시스템 표준](./TENANT_ROLE_SYSTEM_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [보안 및 인증 표준](./SECURITY_AUTHENTICATION_STANDARD.md)

---

**최종 업데이트**: 2025-12-02

