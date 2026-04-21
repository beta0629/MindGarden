package com.coresolution.consultation.constant.userprofile;

/**
 * {@code UserProfileService}에서 사용자에게 노출되거나 API 응답에 포함될 수 있는 메시지·라벨 문자열.
 *
 * @author CoreSolution
 * @since 2026-04-21
 */
public final class UserProfileServiceUserFacingMessages {

    /** 메모 라인에서 키와 값 사이 구분자 (저장·파싱 정합). */
    public static final String MEMO_KEY_VALUE_SEPARATOR = ": ";

    public static final String MSG_USER_NOT_FOUND = "사용자를 찾을 수 없습니다.";

    public static final String MSG_CONSULTANT_ELIGIBILITY_NOT_MET = "상담사 자격 요건을 충족하지 못합니다.";

    public static final String MSG_ADMIN_ELIGIBILITY_NOT_MET = "관리자 자격 요건을 충족하지 못합니다.";

    public static final String MSG_INVALID_ROLE_TRANSITION = "유효하지 않은 역할 변경입니다.";

    public static final String MSG_PROFILE_UPDATE_ERROR_PREFIX = "프로필 업데이트 중 오류가 발생했습니다: ";

    public static final String AGE_GROUP_TEENS = "10대";

    public static final String AGE_GROUP_20S = "20대";

    public static final String AGE_GROUP_30S = "30대";

    public static final String AGE_GROUP_40S = "40대";

    public static final String AGE_GROUP_50S = "50대";

    public static final String AGE_GROUP_60S = "60대";

    public static final String AGE_GROUP_70_PLUS = "70대 이상";

    /** 사용자 메모 라벨 키 — 저장·조회 시 동일 문자열 사용. */
    public static final String MEMO_KEY_PREFERRED_COUNSELING_AREA = "상담선호분야";

    public static final String MEMO_KEY_PREFERRED_COUNSELING_METHOD = "상담선호방식";

    public static final String MEMO_KEY_COUNSELING_NEEDS = "상담받고싶은내용";

    public static final String MEMO_KEY_SPECIALTY = "전문분야";

    public static final String MEMO_KEY_QUALIFICATIONS = "자격증";

    public static final String MEMO_KEY_EXPERIENCE = "경력";

    public static final String MEMO_KEY_AVAILABLE_TIME = "상담가능시간";

    public static final String MEMO_KEY_DETAILED_INTRO = "상세자기소개";

    public static final String MEMO_KEY_EDUCATION = "학력";

    public static final String MEMO_KEY_AWARDS = "수상경력";

    public static final String MEMO_KEY_RESEARCH = "연구실적";

    public static final String MEMO_KEY_ASSIGNED_TASKS = "담당업무";

    public static final String MEMO_KEY_MANAGEMENT_SCOPE = "관리권한범위";

    public static final String MEMO_KEY_DEPARTMENT = "부서/팀";

    /** 주소 파싱 시 구(군)·동 정보가 부족할 때 사용하는 대체값. */
    public static final String ADDRESS_FALLBACK_DISTRICT = "기타";

    public static final String MSG_NEXT_STEP_CLIENT_GENDER_BIRTH = "성별과 생년월일을 추가로 입력해주세요.";

    public static final String MSG_NEXT_STEP_CLIENT_PROFILE_IMAGE = "프로필 이미지를 추가해주세요.";

    public static final String MSG_NEXT_STEP_CLIENT_PREFERENCES = "상담 선호도와 상담사 신청을 위한 추가 정보를 등록해주세요.";

    public static final String MSG_NEXT_STEP_CONSULTANT_PROFILE = "상담사 프로필을 더 자세히 작성해주세요.";

    public static final String MSG_NEXT_STEP_ADMIN_PROFILE = "관리자 프로필을 더 자세히 작성해주세요.";

    public static final String MSG_PROFILE_COMPLETE = "프로필이 완성되었습니다.";

    public static final String MSG_APPLY_CONSULTANT_ONLY_CLIENT = "내담자만 상담사로 신청할 수 있습니다.";

    public static final String MSG_CONSULTANT_ELIGIBILITY_NOT_MET_DETAILED =
            "상담사 자격 요건을 충족하지 못합니다. 이메일 인증 및 기본 프로필 정보를 완성해주세요.";

    public static final String APPLICATION_INFO_HEADER = "\n=== 상담사 신청 정보 ===\n";

    public static final String APPLICATION_DATE_LABEL = "신청일: ";

    public static final String APPLICATION_REASON_LABEL = "신청 사유: ";

    public static final String APPLICATION_RELATED_EXPERIENCE_LABEL = "관련 경험: ";

    public static final String APPLICATION_CERTIFICATIONS_LABEL = "보유 자격증: ";

    public static final String APPLICATION_SPECIALTY_LABEL = "전문 분야: ";

    public static final String APPLICATION_INTRO_LABEL = "자기소개: ";

    public static final String APPLICATION_CONTACT_LABEL = "연락처: ";

    public static final String APPLICATION_PREFERRED_HOURS_LABEL = "희망 상담 시간: ";

    public static final String APPLICATION_ADDITIONAL_NOTES_LABEL = "추가 메모: ";

    public static final String VALUE_NOT_ENTERED = "미입력";

    public static final String MSG_CONSULTANT_APPLICATION_SUCCESS =
            "상담사 신청이 완료되었습니다. 관리자 승인 후 상담사로 활동하실 수 있습니다.";

    public static final String MSG_CONSULTANT_APPLICATION_ERROR_PREFIX = "상담사 신청 중 오류가 발생했습니다: ";

    private UserProfileServiceUserFacingMessages() {
    }
}
