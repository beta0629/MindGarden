package com.coresolution.consultation.constant;

import java.util.Set;

/**
 * 홈페이지 공개 문의 상수 SSOT.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
public final class HomepageInquiryConstants {

    /** 테넌트 공통코드 그룹 — 문의 유형. */
    public static final String CODE_GROUP_INQUIRY_TYPE = "HOMEPAGE_INQUIRY_TYPE";

    /** 접수 출처: 공개 웹 폼. */
    public static final String SOURCE_WEB_FORM = "WEB_FORM";

    /** 접수 출처: 홈페이지 레거시 임포트(예약). */
    public static final String SOURCE_HOMEPAGE_LEGACY = "HOMEPAGE_LEGACY";

    /** 상태: 신규. */
    public static final String STATUS_NEW = "NEW";

    /** 상태: 처리중. */
    public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";

    /** 상태: 연락완료. */
    public static final String STATUS_CONTACTED = "CONTACTED";

    /** 허용 상태 집합. */
    public static final Set<String> ALLOWED_STATUSES =
            Set.of(STATUS_NEW, STATUS_IN_PROGRESS, STATUS_CONTACTED);

    /** 푸시 제목(개인정보 미포함). */
    public static final String PUSH_TITLE_NEW_INQUIRY = "새 문의가 들어왔습니다";

    /** 캡차 미구성 fail-closed 클라이언트 메시지. */
    public static final String CAPTCHA_UNAVAILABLE_MESSAGE = "일시적으로 문의를 접수할 수 없습니다.";

    /** 공개 POST 경로 접두 ({@code /api/v1/public/tenants/{slug}/inquiries}). */
    public static final String PUBLIC_TENANTS_PATH_PREFIX = "/api/v1/public/tenants/";

    /** 공개 문의 POST 경로 접미. */
    public static final String PUBLIC_INQUIRIES_PATH_SUFFIX = "/inquiries";

    /** 관리자 API 기본 경로. */
    public static final String ADMIN_API_BASE = "/api/v1/admin/homepage/inquiries";

    /** 개인정보 접근 로그 dataType. */
    public static final String ACCESS_LOG_DATA_TYPE = "HOMEPAGE_INQUIRY";

    /**
     * 상세 열람 시 NEW→IN_PROGRESS 자동 전환 감사 메타데이터.
     */
    public static final String AUDIT_METADATA_AUTO_FROM_DETAIL_VIEW =
            "{\"source\":\"homepage-inquiry-admin\",\"autoFromDetailView\":true}";

    /** 이름 최대 길이(평문). */
    public static final int MAX_NAME_LENGTH = 50;

    /** 전화 최대 길이(평문). */
    public static final int MAX_PHONE_LENGTH = 30;

    /** 문의 내용 최대 길이. */
    public static final int MAX_CONTENT_LENGTH = 2000;

    /** 동의 버전 최대 길이. */
    public static final int MAX_CONSENT_VERSION_LENGTH = 64;

    /** 허니팟 필드 JSON 이름(봇 채움 시 조용히 폐기). */
    public static final String HONEYPOT_FIELD = "website";

    /** 알 수 없는 테넌트·리소스에 대한 일반 클라이언트 메시지(존재 여부 미노출). */
    public static final String GENERIC_NOT_FOUND_MESSAGE = "요청을 처리할 수 없습니다.";

    /** 공개 접수 성공 메시지(식별자·개인정보 미포함). */
    public static final String PUBLIC_ACCEPTED_MESSAGE = "문의가 접수되었습니다.";

    private HomepageInquiryConstants() {
    }
}
