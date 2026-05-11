package com.coresolution.consultation.constant.salary;

/**
 * 급여보내기(PDF/Excel/CSV) MIME·data URI·파일명 접두사.
 * 운영 하드코딩 게이트: 경로·MIME·파일명 규칙은 본 클래스 및 설정에서만 정의한다.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
public final class SalaryExportConstants {

    private SalaryExportConstants() {
    }

    public static final String MIME_TYPE_PDF = "application/pdf";

    public static final String MIME_TYPE_XLSX =
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    public static final String MIME_TYPE_CSV = "text/csv";

    /** data URL — 프론트가 동일 오리진에서 앵커 다운로드에 사용 */
    public static final String DATA_URI_PREFIX_PDF = "data:" + MIME_TYPE_PDF + ";base64,";

    public static final String DATA_URI_PREFIX_XLSX = "data:" + MIME_TYPE_XLSX + ";base64,";

    public static final String DATA_URI_PREFIX_CSV = "data:" + MIME_TYPE_CSV + ";charset=UTF-8;base64,";

    /** 파일 시스템·로그 안전 ASCII 접두사 (본문 파일명에는 상담사명·기간을 이어 붙임) */
    public static final String FILENAME_PREFIX = "salary_calculation_";

    /** API 응답 data 맵 키 (프론트 SalaryExportModal 계약) */
    public static final String RESPONSE_KEY_DOWNLOAD_URL = "downloadUrl";

    public static final String RESPONSE_KEY_FILENAME = "filename";

    /** export(PDF/Excel/CSV) 시 이메일 발송 여부({@code notifyConsultantByEmail} 요청 시에만 설정) */
    public static final String RESPONSE_KEY_EMAIL_SENT = "emailSent";

    /** 이메일 미발송·차단 시 사용자 표시용 메시지 */
    public static final String RESPONSE_KEY_EMAIL_MESSAGE = "emailMessage";

    /** 발송 성공 시에만 설정. 마스킹된 수신 주소(예: {@code ab***@example.com}) */
    public static final String RESPONSE_KEY_RECIPIENT_EMAIL = "recipientEmail";

    /** 상담사 이메일 부재·상담사 미연결 */
    public static final String EMAIL_MESSAGE_NO_CONSULTANT_EMAIL = "상담사 이메일이 등록되어 있지 않습니다.";

    /** 복호화 값이 이메일 형식이 아님 */
    public static final String EMAIL_MESSAGE_INVALID_CONSULTANT_EMAIL =
            "상담사 등록 이메일 형식이 올바르지 않아 발송할 수 없습니다.";

    /** 급여 세금 상세 API 응답과 동일 키 (getTaxDetails) */
    public static final String TAX_PAYLOAD_KEY_TAX_DETAILS = "taxDetails";

    public static final String TAX_ROW_KEY_TAX_TYPE = "taxType";

    public static final String TAX_ROW_KEY_TAX_AMOUNT = "taxAmount";
}
