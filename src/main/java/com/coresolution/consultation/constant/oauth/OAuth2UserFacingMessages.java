package com.coresolution.consultation.constant.oauth;

/**
 * OAuth2 플로우에서 사용자·클라이언트에 노출될 수 있는 메시지 문자열.
 *
 * @author CoreSolution
 * @since 2026-04-21
 */
public final class OAuth2UserFacingMessages {

    public static final String MSG_TENANT_INFO_MISSING_LOCAL =
            "테넌트 정보가 없습니다. 로컬 환경에서는 local.default-tenant-id 또는 "
                    + "LOCAL_DEFAULT_TENANT_ID 환경 변수를 설정해주세요.";

    public static final String MSG_TENANT_INFO_MISSING_SUBDOMAIN =
            "테넌트 정보가 없습니다. 반드시 서브도메인으로 접속 후 소셜 로그인을 진행해주세요.";

    public static final String MSG_KAKAO_OAUTH_AUTH_URL_FAILED_FMT =
            "카카오 OAuth2 인증 URL 생성에 실패했습니다: %s";

    public static final String MSG_NAVER_OAUTH_AUTH_URL_FAILED_FMT =
            "네이버 OAuth2 인증 URL 생성에 실패했습니다: %s";

    public static final String ERR_LOGIN_NO_AUTH_CODE = "인증코드없음";

    public static final String ERR_LOGIN_SECURITY_VERIFICATION_FAILED = "보안검증실패";

    public static final String MSG_TENANT_NOT_REGISTERED =
            "테넌트가 등록되지 않았습니다. 먼저 테넌트 등록을 진행해주세요.";

    public static final String ERR_LOGIN_SYSTEM_ERROR = "시스템오류";

    public static final String MSG_EMAIL_CONSENT_REQUIRED = "이메일 제공 동의가 필요합니다.";

    public static final String MSG_USER_NOT_FOUND = "사용자를 찾을 수 없습니다.";

    public static final String MSG_AUTH_PROCESSING_FAILED = "인증 처리 중 오류가 발생했습니다";

    public static final String MSG_USER_INFO_UNAVAILABLE = "사용자 정보를 가져올 수 없습니다.";

    public static final String ERR_LOGIN_SESSION_EXPIRED = "세션만료";

    public static final String ERR_ACCOUNT_LINK_FAILED = "연동실패";

    public static final String ERR_ACCOUNT_LINK_COMPLETE = "연동완료";

    /**
     * 마이페이지 연동 시 해당 SNS가 이미 다른 사용자 계정에 연결되어 있는 경우.
     */
    public static final String ERR_SOCIAL_ALREADY_LINKED_TO_OTHER_ACCOUNT =
            "이미 다른 계정에 연결된 소셜 계정입니다.";

    public static final String ERR_LOGIN_PROCESS_FAILED = "처리실패";

    public static final String MSG_SIGNUP_REQUIRED = "간편 회원가입이 필요합니다.";

    public static final String MSG_USER_NOT_FOUND_USER_ID_FMT = "사용자를 찾을 수 없습니다: userId=%s";

    public static final String MSG_UNEXPECTED_ERROR_FMT = "예상치 못한 오류가 발생했습니다: %s";

    public static final String MSG_USER_ID_REQUIRED = "사용자 ID가 필요합니다.";

    public static final String MSG_INVALID_USER_ID = "잘못된 사용자 ID입니다.";

    public static final String MSG_NATIVE_LOGIN_FAILED_FMT = "로그인 처리 중 오류가 발생했습니다: %s";

    public static final String MSG_PROVIDER_AND_ACCESS_TOKEN_REQUIRED =
            "provider와 accessToken이 필요합니다.";

    public static final String MSG_UNSUPPORTED_SOCIAL_PLATFORM = "지원하지 않는 소셜 플랫폼입니다.";

    public static final String MSG_KAKAO_ACCOUNT_LOGGED_IN = "카카오 계정으로 로그인되었습니다.";

    public static final String MSG_LOGIN_SUCCESS = "로그인 성공";

    public static final String MSG_PHONE_ACCOUNT_SELECTION_REQUIRED =
            "동일한 휴대폰으로 등록된 계정이 여러 개입니다. 연결할 계정을 선택해주세요.";

    public static final String ERR_OAUTH_SELECTION_TOKEN_INVALID = "계정 선택 토큰이 유효하지 않습니다.";

    public static final String ERR_OAUTH_SELECTION_USER_NOT_ALLOWED = "선택한 계정은 이 로그인에 허용되지 않습니다.";

    public static final String OAUTH_TEST_SIGNUP_DISPLAY_NAME = "테스트사용자";

    public static final String OAUTH_TEST_SIGNUP_DISPLAY_NICKNAME = "테스트닉네임";

    public static final String HTML_DEEP_LINK_PAGE_TITLE = "로그인 처리 중...";

    public static final String HTML_DEEP_LINK_INSTRUCTION = "아래 버튼을 눌러 앱을 열어주세요.";

    public static final String HTML_DEEP_LINK_OPEN_APP_BUTTON = "앱 열기";

    /** Deep Link 랜딩 HTML. {@code @@MG_DEEP_LINK@@} 를 이스케이프된 deepLink 로 치환. */
    public static final String HTML_DEEP_LINK_PAGE_NAVER_TEMPLATE =
            "<!DOCTYPE html><html><head><meta charset='UTF-8'>" + "<title>" + HTML_DEEP_LINK_PAGE_TITLE
                    + "</title>"
                    + "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                    + "<style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f5f5f5;}"
                    + "h1{color:#333;}button{background:#03C75A;color:white;border:none;padding:15px 30px;"
                    + "font-size:16px;border-radius:5px;cursor:pointer;margin-top:20px;}"
                    + "button:hover{background:#02B350;}</style></head><body>" + "<h1>"
                    + HTML_DEEP_LINK_PAGE_TITLE + "</h1><p>" + HTML_DEEP_LINK_INSTRUCTION + "</p>"
                    + "<button id='openAppBtn' onclick=\"window.location.href='@@MG_DEEP_LINK@@'\">"
                    + HTML_DEEP_LINK_OPEN_APP_BUTTON + "</button><script>"
                    + "var deepLink = '@@MG_DEEP_LINK@@';"
                    + "setTimeout(function(){ window.location.href = deepLink; }, 1000);"
                    + "document.getElementById('openAppBtn').addEventListener('click', function(){"
                    + "  window.location.href = deepLink; });</script>" + "</body></html>";

    /** Deep Link 랜딩 HTML (카카오 버튼 색). {@code @@MG_DEEP_LINK@@} 를 이스케이프된 deepLink 로 치환. */
    public static final String HTML_DEEP_LINK_PAGE_KAKAO_TEMPLATE =
            "<!DOCTYPE html><html><head><meta charset='UTF-8'>" + "<title>" + HTML_DEEP_LINK_PAGE_TITLE
                    + "</title>"
                    + "<meta name='viewport' content='width=device-width, initial-scale=1.0'>"
                    + "<style>body{font-family:Arial,sans-serif;text-align:center;padding:50px;background:#f5f5f5;}"
                    + "h1{color:#333;}button{background:#FEE500;color:#000;border:none;padding:15px 30px;"
                    + "font-size:16px;border-radius:5px;cursor:pointer;margin-top:20px;font-weight:bold;}"
                    + "button:hover{background:#FDD835;}</style></head><body>" + "<h1>"
                    + HTML_DEEP_LINK_PAGE_TITLE + "</h1><p>" + HTML_DEEP_LINK_INSTRUCTION + "</p>"
                    + "<button id='openAppBtn' onclick=\"window.location.href='@@MG_DEEP_LINK@@'\">"
                    + HTML_DEEP_LINK_OPEN_APP_BUTTON + "</button><script>"
                    + "var deepLink = '@@MG_DEEP_LINK@@';"
                    + "setTimeout(function(){ window.location.href = deepLink; }, 1000);"
                    + "document.getElementById('openAppBtn').addEventListener('click', function(){"
                    + "  window.location.href = deepLink; });</script>" + "</body></html>";

    private static final String HTML_DEEP_LINK_PLACEHOLDER = "@@MG_DEEP_LINK@@";

    private OAuth2UserFacingMessages() {
    }

    /**
     * Deep Link용 HTML. URL에 {@code %} 가 포함돼도 안전하도록 플레이스홀더 치환을 사용한다.
     *
     * @param template {@link #HTML_DEEP_LINK_PAGE_NAVER_TEMPLATE} 또는 {@link #HTML_DEEP_LINK_PAGE_KAKAO_TEMPLATE}
     * @param escapedDeepLink 작은따옴표 이스케이프 처리된 deep link
     * @return 완성된 HTML
     */
    public static String buildDeepLinkLandingHtml(String template, String escapedDeepLink) {
        return template.replace(HTML_DEEP_LINK_PLACEHOLDER, escapedDeepLink);
    }
}
