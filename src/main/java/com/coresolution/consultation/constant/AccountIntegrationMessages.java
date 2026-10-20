package com.coresolution.consultation.constant;

/**
 * 계정 연동 API 사용자 문구. 예외 메시지는 응답에 싣지 않고 이 표준 문구만 쓴다.
 *
 * @author CoreSolution
 * @since 2026-10-12
 */
public final class AccountIntegrationMessages {

    public static final String CODE_SENT = "입력하신 이메일이 등록되어 있다면 인증 코드를 보냈습니다.";
    public static final String SEND_COOLDOWN = "재발송 요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
    public static final String SEND_DAILY_LIMIT = "오늘 인증 메일 발송 횟수를 초과했습니다. 내일 다시 시도해 주세요.";
    public static final String SEND_IP_LIMIT = "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
    public static final String CODE_VALID = "인증 코드가 올바릅니다.";
    public static final String CODE_INVALID = "인증 코드가 올바르지 않거나 만료되었습니다.";
    public static final String CODE_LOCKED = "인증 시도 횟수를 초과했습니다. 잠시 후 인증 코드를 다시 요청해 주세요.";
    public static final String SERVER_ERROR = "서버 오류가 발생했습니다.";
    public static final String INTEGRATION_DONE = "계정 통합이 완료되었습니다.";
    public static final String INTEGRATION_FAILED = "계정 통합 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.";
    public static final String INTEGRATION_VERIFY_FAILED = "인증 정보가 올바르지 않습니다.";
    public static final String PASSWORD_REQUIRED = "기존 계정 비밀번호를 입력해 주세요.";
    public static final String PROVIDER_INVALID = "SNS 제공자 정보가 올바르지 않습니다.";
    public static final String SOCIAL_ID_INVALID = "SNS 계정 정보가 올바르지 않습니다.";
    public static final String SOCIAL_ID_IN_USE = "이미 다른 계정에 연결된 SNS 계정입니다.";
    public static final String STATUS_LINKED = "연결된 SNS 계정이 있습니다.";
    public static final String STATUS_NOT_LINKED = "연결된 SNS 계정이 없습니다.";
    public static final String STATUS_FAILED = "계정 통합 상태 확인 중 오류가 발생했습니다.";
    public static final String STATUS_OWN_EMAIL_ONLY = "본인 이메일만 조회할 수 있습니다.";
    public static final String LINK_SUCCESS = "SNS 계정이 성공적으로 연결되었습니다.";
    public static final String LINK_FAILED = "SNS 계정 연결에 실패했습니다.";

    private AccountIntegrationMessages() {
    }
}
