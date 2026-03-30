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
 * 심리검사 업로드 파일 검열(보안 검증).
 * - PDF + 이미지(JPG, PNG): Content-Type, 확장자, 매직 바이트 검사
 * - 크기 제한, 파일명 경로 조작 방지
 *
 * @author Core Solution
 */
@Slf4j
@Component
public class PsychAssessmentFileValidator {

    private static final String CONTENT_TYPE_PDF = "application/pdf";
    private static final String CONTENT_TYPE_JPEG = "image/jpeg";
    private static final String CONTENT_TYPE_PNG = "image/png";
    private static final byte[] PDF_MAGIC = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D}; // %PDF-
    private static final byte[] JPEG_MAGIC = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_MAGIC = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    @Value("${psych.assessment.upload.max-file-size:52428800}")
    private long maxFileSizeBytes; // default 50MB

    /**
     * PDF 또는 이미지 공통 검증. validatePdfUpload/validateImageUpload 내부 호출.
     *
     * @param file 업로드 파일
     * @param allowPdf PDF 허용 여부
     * @param allowImage 이미지 허용 여부
     */
    public void validateUpload(MultipartFile file, boolean allowPdf, boolean allowImage) {
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

        String contentType = file.getContentType();
        String ct = contentType != null ? contentType.strip() : "";
        String lowerFilename = filename.toLowerCase(Locale.ROOT);

        if (allowPdf && CONTENT_TYPE_PDF.equalsIgnoreCase(ct) && lowerFilename.endsWith(".pdf")) {
            if (!hasPdfMagicBytes(file)) {
                log.warn("심리검사 업로드 거부: PDF 매직 바이트 불일치 filename={}", filename);
                throw new IllegalArgumentException("PDF 형식이 올바르지 않습니다. 다른 형식의 파일을 PDF로 업로드할 수 없습니다.");
            }
            validateSize(file, filename);
            return;
        }

        if (allowImage) {
            boolean isJpeg = (CONTENT_TYPE_JPEG.equalsIgnoreCase(ct) || lowerFilename.endsWith(".jpg")
                    || lowerFilename.endsWith(".jpeg"));
            boolean isPng = (CONTENT_TYPE_PNG.equalsIgnoreCase(ct) || lowerFilename.endsWith(".png"));
            if (isJpeg) {
                if (!hasJpegMagicBytes(file)) {
                    log.warn("심리검사 업로드 거부: JPEG 매직 바이트 불일치 filename={}", filename);
                    throw new IllegalArgumentException("JPEG 형식이 올바르지 않습니다.");
                }
                validateSize(file, filename);
                return;
            }
            if (isPng) {
                if (!hasPngMagicBytes(file)) {
                    log.warn("심리검사 업로드 거부: PNG 매직 바이트 불일치 filename={}", filename);
                    throw new IllegalArgumentException("PNG 형식이 올바르지 않습니다.");
                }
                validateSize(file, filename);
                return;
            }
        }

        throw new IllegalArgumentException("PDF 또는 이미지 파일(JPG, PNG)만 업로드할 수 있습니다.");
    }

    private void validateSize(MultipartFile file, String filename) {
        long size = file.getSize();
        if (size <= 0) {
            throw new IllegalArgumentException("파일 크기가 올바르지 않습니다.");
        }
        if (size > maxFileSizeBytes) {
            throw new IllegalArgumentException(
                    "파일 크기가 제한을 초과합니다. 최대 " + (maxFileSizeBytes / 1024 / 1024) + "MB까지 업로드할 수 있습니다.");
        }
    }

    /**
     * 업로드 파일이 허용된 PDF인지 검증. 실패 시 IllegalArgumentException.
     */
    public void validatePdfUpload(MultipartFile file) {
        validateUpload(file, true, false);
    }

    /**
     * 업로드 파일이 허용된 이미지(JPG, PNG)인지 검증. 실패 시 IllegalArgumentException.
     */
    public void validateImageUpload(MultipartFile file) {
        validateUpload(file, false, true);
    }

    /**
     * PDF 또는 이미지 업로드 검증 (공용).
     */
    public void validatePdfOrImageUpload(MultipartFile file) {
        validateUpload(file, true, true);
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

    private boolean hasJpegMagicBytes(MultipartFile file) {
        return hasMagicBytes(file, JPEG_MAGIC);
    }

    private boolean hasPngMagicBytes(MultipartFile file) {
        return hasMagicBytes(file, PNG_MAGIC);
    }

    private boolean hasMagicBytes(MultipartFile file, byte[] magic) {
        try (InputStream in = file.getInputStream()) {
            byte[] head = new byte[magic.length];
            int n = in.read(head);
            if (n != magic.length) {
                return false;
            }
            for (int i = 0; i < magic.length; i++) {
                if (head[i] != magic[i]) {
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
