package com.coresolution.consultation.assessment.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

public interface EncryptedFileStorageService {
    StoredEncryptedFile storePdf(String tenantId, MultipartFile file);

    /**
     * 저장된 암호화 PDF를 복호화하여 InputStream으로 반환.
     * 저장 형식: [iv(12)] + [ciphertext+tag]
     *
     * @param storagePath 저장 경로 (storePdf 반환값의 storagePath)
     * @return 복호화된 PDF 바이트 스트림, 파일 없으면 null
     */
    InputStream readDecryptedPdfAsInputStream(String storagePath);

    record StoredEncryptedFile(
            String storagePath,
            String sha256,
            long size,
            String contentType,
            String originalFilename,
            String keyVersion
    ) {}
}


