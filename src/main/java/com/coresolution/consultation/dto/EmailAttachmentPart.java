package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 이메일 바이너리 첨부(파일 경로 대신 메모리).
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailAttachmentPart {

    /**
     * 첨부 파일명 (확장자 포함).
     */
    private String filename;

    /**
     * 첨부 본문.
     */
    private byte[] content;

    /**
     * MIME 타입 (예: application/pdf). 비어 있으면 발송 구현체 기본값 사용.
     */
    private String mimeType;
}
