package com.coresolution.consultation.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 급여 출력(보내기) 요청 본문. 프론트 {@code SalaryExportModal}과 동일 필드(이메일 발송은 {@code notifyConsultantByEmail}).
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
@Data
public class SalaryExportRequest {

    @NotNull
    private Long calculationId;

    /** PDF/EXCEL/CSV — 경로별 엔드포인트에서는 무시 가능 */
    private String format;

    private Boolean includeTaxDetails;

    private Boolean includeCalculationDetails;

    private String consultantName;

    private String period;

    /** 하위 호환·미사용: PDF 이메일 발송 주소는 상담사 DB 이메일만 사용한다. */
    private String emailAddress;

    /**
     * true이면 파일 생성 후 상담사(User) 등록 이메일(복호화)로 발송한다. {@code emailAddress}는 무시된다.
     */
    private Boolean notifyConsultantByEmail;

    /**
     * 이메일 발송 시 생성된 파일을 첨부할지 여부. 기본 true(null이면 true 취급).
     * false이면 급여 요약 본문만 발송하고 파일은 첨부하지 않는다.
     */
    private Boolean includeAttachmentInEmail;

    /**
     * {@code includeAttachmentInEmail}이 null이면 true(기존 호환).
     */
    public boolean isIncludeAttachment() {
        return !Boolean.FALSE.equals(includeAttachmentInEmail);
    }
}
