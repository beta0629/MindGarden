package com.coresolution.consultation.assessment.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

public interface EncryptedFileStorageService {
    StoredEncryptedFile storePdf(String tenantId, MultipartFile file);

    /**
     * PDF 또는 이미지 파일을 암호화하여 저장. storePdf와 동일한 암호화 로직 적용.
     *
     * @param tenantId 테넌트 ID
     * @param file     업로드 파일
     * @return 저장된 파일 메타정보
     */
    StoredEncryptedFile storeFile(String tenantId, MultipartFile file);

    /**
     * 저장된 암호화 파일을 복호화하여 InputStream으로 반환.
     * 저장 형식: [iv(12)] + [ciphertext+tag]. PDF/이미지 동일.
     *
     * @param storagePath 저장 경로 (storePdf/storeFile 반환값의 storagePath)
     * @return 복호화된 바이트 스트림, 파일 없으면 null
     */
    InputStream readDecryptedFileAsInputStream(String storagePath);

    /**
     * 저장된 암호화 PDF를 복호화하여 InputStream으로 반환.
     *
     * @param storagePath 저장 경로 (storePdf 반환값의 storagePath)
     * @return 복호화된 PDF 바이트 스트림, 파일 없으면 null
     * @deprecated readDecryptedFileAsInputStream 사용 권장
     */
    default InputStream readDecryptedPdfAsInputStream(String storagePath) {
        return readDecryptedFileAsInputStream(storagePath);
    }

    record StoredEncryptedFile(
            String storagePath,
            String sha256,
            long size,
            String contentType,
            String originalFilename,
            String keyVersion
    ) {}
}


