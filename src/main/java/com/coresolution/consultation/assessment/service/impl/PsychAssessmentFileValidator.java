package com.coresolution.consultation.assessment.service.impl;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Locale;

/**
 * 심리검사 PDF 업로드 파일 검열(보안 검증).
 * - PDF 전용: Content-Type, 확장자, 매직 바이트 검사
 * - 크기 제한, 파일명 경로 조작 방지
 *
 * @author Core Solution
 */
@Slf4j
@Component
public class PsychAssessmentFileValidator {

    private static final String ALLOWED_CONTENT_TYPE = "application/pdf";
    private static final String ALLOWED_EXTENSION = ".pdf";
    private static final byte[] PDF_MAGIC = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D}; // %PDF-

    @Value("${psych.assessment.upload.max-file-size:52428800}")
    private long maxFileSizeBytes; // default 50MB

    /**
     * 업로드 파일이 허용된 PDF인지 검증. 실패 시 IllegalArgumentException.
     */
    public void validatePdfUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어있습니다.");
        }

        String filename = file.getOriginalFilename();
        if (!StringUtils.hasText(filename)) {
            throw new IllegalArgumentException("파일 이름이 없습니다.");
        }

        // 경로 조작 방지: .., /, \ 포함 시 거부
        String safeName = filename.replace('\\', '/');
        if (safeName.contains("..") || safeName.startsWith("/") || safeName.contains("/")) {
            log.warn("심리검사 업로드 거부: 부적절한 파일명 path traversal 시도 filename={}", filename);
            throw new IllegalArgumentException("허용되지 않은 파일 이름입니다.");
        }

        // 확장자: .pdf 만 허용 (대소문자 무관)
        if (!filename.toLowerCase(Locale.ROOT).endsWith(ALLOWED_EXTENSION)) {
            throw new IllegalArgumentException("PDF 파일만 업로드할 수 있습니다. (확장자 .pdf)");
        }

        // Content-Type: application/pdf 만 허용 (클라이언트 조작 방지)
        String contentType = file.getContentType();
        if (!ALLOWED_CONTENT_TYPE.equalsIgnoreCase(contentType != null ? contentType.strip() : "")) {
            throw new IllegalArgumentException("PDF 파일만 업로드할 수 있습니다. (Content-Type: application/pdf)");
        }

        // 크기 제한
        long size = file.getSize();
        if (size <= 0) {
            throw new IllegalArgumentException("파일 크기가 올바르지 않습니다.");
        }
        if (size > maxFileSizeBytes) {
            throw new IllegalArgumentException(
                    "파일 크기가 제한을 초과합니다. 최대 " + (maxFileSizeBytes / 1024 / 1024) + "MB까지 업로드할 수 있습니다.");
        }

        // 매직 바이트 검사: 실제 바이너리가 PDF가 아니면 거부 (해킹/위장 파일 방지)
        if (!hasPdfMagicBytes(file)) {
            log.warn("심리검사 업로드 거부: PDF 매직 바이트 불일치 filename={}", filename);
            throw new IllegalArgumentException("PDF 형식이 올바르지 않습니다. 다른 형식의 파일을 PDF로 업로드할 수 없습니다.");
        }
    }

    private boolean hasPdfMagicBytes(MultipartFile file) {
        try (InputStream in = file.getInputStream()) {
            byte[] head = new byte[PDF_MAGIC.length];
            int n = in.read(head);
            if (n != PDF_MAGIC.length) {
                return false;
            }
            for (int i = 0; i < PDF_MAGIC.length; i++) {
                if (head[i] != PDF_MAGIC[i]) {
                    return false;
                }
            }
            return true;
        } catch (IOException e) {
            log.warn("심리검사 업로드: 매직 바이트 읽기 실패", e);
            return false;
        }
    }
}
