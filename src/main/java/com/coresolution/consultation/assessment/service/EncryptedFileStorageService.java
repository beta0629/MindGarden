package com.coresolution.consultation.assessment.service;

import org.springframework.web.multipart.MultipartFile;

public interface EncryptedFileStorageService {
    StoredEncryptedFile storePdf(String tenantId, MultipartFile file);

    record StoredEncryptedFile(
            String storagePath,
            String sha256,
            long size,
            String contentType,
            String originalFilename,
            String keyVersion
    ) {}
}


