package com.coresolution.consultation.constant;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * {@code /api/v1/admin/system-config} 범용 키-밸류 API 접근 정책 SSOT.
 *
 * <p>P0 보안(2026-10-03): 범용 {@code GET/POST /{configKey}} 가 키 제한 없이 모든
 * {@code system_config} 행을 읽고 쓸 수 있어 AI API 키·웹훅 시크릿 등 평문 노출 경로가
 * 되었다. 본 클래스가 읽기/쓰기 허용 키를 한곳에서 선언하고, 허용 목록 밖의 키는
 * 404(값 없음)로 거부한다.
 *
 * <p>정책 구분:
 * <ul>
 *   <li>{@link #READABLE_KEYS} — 테넌트 ADMIN 이 조회할 수 있는 키. 시크릿성 키는
 *       {@link #isSecretValueKey(String)} 로 분류되어 마스킹 값만 응답한다.</li>
 *   <li>{@link #WRITABLE_KEYS} — 테넌트 ADMIN 이 저장할 수 있는 키.</li>
 *   <li>{@link #OPS_ONLY_WRITE_KEYS} — 읽기는 허용(상태/마스킹)하지만 쓰기는 운영자
 *       전용 경로로만 가능한 키 (AI API 키·URL·모델).</li>
 * </ul>
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-10-03
 */
public final class SystemConfigAccessPolicy {

    /** 웰니스 자동 발송 ON/OFF. */
    public static final String WELLNESS_AUTO_SEND_ENABLED = "WELLNESS_AUTO_SEND_ENABLED";

    /** 웰니스 발송 시각(HH:mm). */
    public static final String WELLNESS_SEND_TIME = "WELLNESS_SEND_TIME";

    /** 웰니스 발송 대상 역할 목록. */
    public static final String WELLNESS_TARGET_ROLES = "WELLNESS_TARGET_ROLES";

    /** 기본 AI 프로바이더 (openai|gemini|claude|replicate). */
    public static final String AI_DEFAULT_PROVIDER = "AI_DEFAULT_PROVIDER";

    /** USD-KRW 환율 (조회 전용 — 저장은 전용 서비스 경로). */
    public static final String USD_TO_KRW_RATE = "USD_TO_KRW_RATE";

    /** AI 프로바이더 키 prefix SSOT — 프론트 {@code aiProvider/constants.js} 와 동일. */
    public static final List<String> AI_PROVIDER_KEY_PREFIXES =
            List.of("OPENAI", "GEMINI", "CLAUDE", "REPLICATE");

    /** AI 프로바이더 키 suffix — API 키. */
    public static final String SUFFIX_API_KEY = "_API_KEY";

    /** AI 프로바이더 키 suffix — API URL. */
    public static final String SUFFIX_API_URL = "_API_URL";

    /** AI 프로바이더 키 suffix — 모델명. */
    public static final String SUFFIX_MODEL = "_MODEL";

    /**
     * 값 자체가 시크릿으로 간주되는 키 토큰. 대문자 비교로 부분 일치 검사한다.
     * {@code SystemConfigServiceImpl} 의 암호화 판정(KEY/SECRET/PASSWORD) 과 정합하며
     * TOKEN 을 추가로 포함한다.
     */
    private static final List<String> SECRET_KEY_TOKENS =
            List.of("API_KEY", "SECRET", "PASSWORD", "TOKEN", "CREDENTIAL");

    /** AI 프로바이더 관련 키 — 쓰기는 운영자 전용. */
    public static final Set<String> OPS_ONLY_WRITE_KEYS = buildAiProviderKeys();

    /** 테넌트 ADMIN 조회 허용 키. */
    public static final Set<String> READABLE_KEYS = buildReadableKeys();

    /** 테넌트 ADMIN 저장 허용 키. */
    public static final Set<String> WRITABLE_KEYS = buildWritableKeys();

    private SystemConfigAccessPolicy() {
    }

    /**
     * 조회 허용 키인지 확인.
     *
     * @param configKey 설정 키
     * @return 허용 목록에 있으면 true
     */
    public static boolean isReadable(String configKey) {
        return configKey != null && READABLE_KEYS.contains(configKey);
    }

    /**
     * 저장 허용 키인지 확인.
     *
     * @param configKey 설정 키
     * @return 허용 목록에 있으면 true
     */
    public static boolean isWritable(String configKey) {
        return configKey != null && WRITABLE_KEYS.contains(configKey);
    }

    /**
     * 운영자 전용 쓰기 키인지 확인 (테넌트 경로에서는 거부, 거부 메시지 구분용).
     *
     * @param configKey 설정 키
     * @return 운영자 전용이면 true
     */
    public static boolean isOpsOnlyWrite(String configKey) {
        return configKey != null && OPS_ONLY_WRITE_KEYS.contains(configKey);
    }

    /**
     * 값이 시크릿이라 응답에서 마스킹해야 하는 키인지 확인.
     *
     * @param configKey 설정 키
     * @return 마스킹 대상이면 true
     */
    public static boolean isSecretValueKey(String configKey) {
        if (configKey == null || configKey.isBlank()) {
            return false;
        }
        String upper = configKey.toUpperCase();
        return SECRET_KEY_TOKENS.stream().anyMatch(upper::contains);
    }

    private static Set<String> buildAiProviderKeys() {
        Set<String> keys = new LinkedHashSet<>();
        for (String prefix : AI_PROVIDER_KEY_PREFIXES) {
            keys.add(prefix + SUFFIX_API_KEY);
            keys.add(prefix + SUFFIX_API_URL);
            keys.add(prefix + SUFFIX_MODEL);
        }
        return Collections.unmodifiableSet(keys);
    }

    private static Set<String> buildReadableKeys() {
        Set<String> keys = new LinkedHashSet<>(buildWritableKeys());
        keys.add(USD_TO_KRW_RATE);
        keys.addAll(OPS_ONLY_WRITE_KEYS);
        return Collections.unmodifiableSet(keys);
    }

    private static Set<String> buildWritableKeys() {
        Set<String> keys = new LinkedHashSet<>();
        keys.add(WELLNESS_AUTO_SEND_ENABLED);
        keys.add(WELLNESS_SEND_TIME);
        keys.add(WELLNESS_TARGET_ROLES);
        keys.add(AI_DEFAULT_PROVIDER);
        keys.add(SessionSecurityFlagKeys.DUPLICATE_LOGIN_ALLOWED);
        keys.add(SessionSecurityFlagKeys.OAUTH_REQUIRE_SERVER_VERIFY);
        keys.add(SessionSecurityFlagKeys.BACKGROUND_401_KEEP_USER);
        keys.add(SessionSecurityFlagKeys.SOFT_FAIL_ENABLED);
        return Collections.unmodifiableSet(keys);
    }
}
