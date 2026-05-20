package com.coresolution.consultation.integration.solapi;

import java.util.Locale;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * 솔라피 알림톡 자격 증명·발신 프로필 ID resolver(ENV/Secrets 참조 lookup).
 *
 * <p>키 본문은 DB에 저장하지 않는다는 정책 하에, {@code tenant_kakao_alimtalk_settings}의
 * {@code kakao_api_key_ref}/{@code kakao_sender_key_ref}를 받아 다음 순서로 lookup한다.
 *
 * <ol>
 *   <li>{@code <REF>_API_KEY} / {@code <REF>_API_SECRET} 등의 ENV 변수
 *       (ref는 대문자·{@code [A-Z0-9_]} 외 문자는 {@code _}로 치환)</li>
 *   <li>{@code kakao.alimtalk.solapi.api-key} / {@code .api-secret} 등의 전역 프로퍼티/ENV</li>
 *   <li>둘 다 비어 있으면 {@code sms.auth.api-key} / {@code sms.auth.api-secret}
 *       (= {@code SMS_API_KEY}/{@code SMS_API_SECRET}) 로 fallback.
 *       솔라피는 계정당 통합 API Key/Secret 하나로 SMS·알림톡을 모두 발송하므로,
 *       단일 계정 운영자가 별도 ENV를 채우지 않아도 동작하도록 한다.
 *       단, 테넌트별 {@code <REF>_API_KEY}는 SMS 키로 fallback하지 않는다(테넌트 분리 보존).</li>
 * </ol>
 *
 * <p>운영 환경에서는 별도 Secrets Manager 통합 resolver로 교체할 수 있도록 단일 클래스로 격리한다.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
@Slf4j
@Component
public class KakaoSolapiCredentialResolver {

    private static final String DEFAULT_API_KEY_PROPERTY = "kakao.alimtalk.solapi.api-key";
    private static final String DEFAULT_API_SECRET_PROPERTY = "kakao.alimtalk.solapi.api-secret";
    private static final String DEFAULT_PFID_PROPERTY = "kakao.alimtalk.solapi.pf-id";
    private static final String SMS_API_KEY_PROPERTY = "sms.auth.api-key";
    private static final String SMS_API_SECRET_PROPERTY = "sms.auth.api-secret";

    private final Environment environment;

    @Value("${kakao.alimtalk.solapi.api-key:}")
    private String defaultApiKey;

    @Value("${kakao.alimtalk.solapi.api-secret:}")
    private String defaultApiSecret;

    @Value("${kakao.alimtalk.solapi.pf-id:}")
    private String defaultPfId;

    /**
     * SMS 인증용 솔라피 API Key (fallback).
     *
     * <p>솔라피는 SMS·알림톡 통합 키이므로, 알림톡 전용 키가 비어 있으면 이 값을 그대로 사용한다.
     * 안전한 기본값으로 빈 문자열을 사용한다.
     */
    @Value("${sms.auth.api-key:}")
    private String smsApiKey;

    /**
     * SMS 인증용 솔라피 API Secret (fallback).
     */
    @Value("${sms.auth.api-secret:}")
    private String smsApiSecret;

    /**
     * 운영용 생성자.
     *
     * @param environment Spring Environment(ENV·프로퍼티 lookup)
     */
    public KakaoSolapiCredentialResolver(Environment environment) {
        this.environment = environment;
    }

    /**
     * 테넌트 ref를 기반으로 솔라피 API 자격 증명을 resolve.
     *
     * @param apiKeyRef 테넌트 DB에 저장된 키 ref(없으면 전역 fallback)
     * @return 자격 증명. {@link SolapiCredentials#isComplete()}로 사용 가능 여부 확인.
     */
    public SolapiCredentials resolveCredentials(String apiKeyRef) {
        String resolvedKey = lookupEnv(apiKeyRef, "_API_KEY").orElse(defaultApiKey);
        String resolvedSecret = lookupEnv(apiKeyRef, "_API_SECRET").orElse(defaultApiSecret);

        boolean usedSmsFallback = false;
        if (isBlank(resolvedKey) && isBlank(resolvedSecret)
            && !isBlank(smsApiKey) && !isBlank(smsApiSecret)) {
            resolvedKey = smsApiKey;
            resolvedSecret = smsApiSecret;
            usedSmsFallback = true;
        }

        if (usedSmsFallback) {
            log.info("알림톡 자격증명 — SMS 키({}/{})로 fallback 사용",
                SMS_API_KEY_PROPERTY, SMS_API_SECRET_PROPERTY);
        }

        if (log.isDebugEnabled()) {
            log.debug("Solapi credentials resolved: ref={}, key={}, secret={}, smsFallback={}",
                isBlank(apiKeyRef) ? "(default)" : sanitizeRef(apiKeyRef),
                isBlank(resolvedKey) ? "missing" : "present",
                isBlank(resolvedSecret) ? "missing" : "present",
                usedSmsFallback);
        }

        return new SolapiCredentials(resolvedKey, resolvedSecret);
    }

    /**
     * 테넌트 sender ref를 기반으로 솔라피 발신 프로필 ID(pfId)를 resolve.
     *
     * <p>{@code senderKeyRef}가 이미 PFID 형식(영숫자 비밀이 아닌 식별자)일 수 있어, ENV에 없으면
     * ref 자체를 PFID로 간주한다. 그래도 없으면 전역 default를 사용한다.
     *
     * @param senderKeyRef 테넌트 DB에 저장된 발신 키 ref
     * @return 발신 프로필 ID(없으면 빈 문자열)
     */
    public String resolvePfId(String senderKeyRef) {
        Optional<String> envValue = lookupEnv(senderKeyRef, "_PFID");
        if (envValue.isPresent()) {
            return envValue.get();
        }
        if (!isBlank(senderKeyRef) && looksLikePlainIdentifier(senderKeyRef)) {
            return senderKeyRef.trim();
        }
        return defaultPfId == null ? "" : defaultPfId;
    }

    /**
     * 전역 default API key가 설정돼 있는지(보조 진단용).
     *
     * <p>알림톡 전용 키({@code kakao.alimtalk.solapi.api-key/api-secret})가 모두 채워져 있거나,
     * SMS fallback 키({@code sms.auth.api-key/api-secret})가 모두 채워져 있으면 true.
     *
     * @return 알림톡 전용 키 또는 SMS fallback 키가 사용 가능하면 true
     */
    public boolean hasDefaultCredentials() {
        boolean hasNativeAlimtalkKeys = !isBlank(defaultApiKey) && !isBlank(defaultApiSecret);
        boolean hasSmsFallbackKeys = !isBlank(smsApiKey) && !isBlank(smsApiSecret);
        return hasNativeAlimtalkKeys || hasSmsFallbackKeys;
    }

    /**
     * 전역 default PFID 존재 여부(보조 진단용).
     *
     * @return 설정돼 있으면 true
     */
    public boolean hasDefaultPfId() {
        return !isBlank(defaultPfId);
    }

    /**
     * 사용자 ref 또는 default ENV 이름을 사용해 값 lookup.
     *
     * @param ref    ref 식별자(없으면 default 전용)
     * @param suffix ENV 키 접미사(예: {@code _API_KEY})
     * @return ENV 값 또는 empty
     */
    Optional<String> lookupEnv(String ref, String suffix) {
        if (isBlank(ref)) {
            return Optional.empty();
        }
        String envKey = sanitizeRef(ref) + suffix;
        String value = environment.getProperty(envKey);
        if (isBlank(value)) {
            return Optional.empty();
        }
        return Optional.of(value);
    }

    private static String sanitizeRef(String ref) {
        return ref.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9_]", "_");
    }

    private static boolean looksLikePlainIdentifier(String value) {
        String trimmed = value.trim();
        return trimmed.matches("[A-Za-z0-9_\\-]{4,}");
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    /**
     * 테스트 후크: 정적 프로퍼티 이름 노출(추후 외부 진단에 사용).
     *
     * @return default 프로퍼티 키 목록
     */
    public static String[] defaultPropertyNames() {
        return new String[]{
            DEFAULT_API_KEY_PROPERTY,
            DEFAULT_API_SECRET_PROPERTY,
            DEFAULT_PFID_PROPERTY,
            SMS_API_KEY_PROPERTY,
            SMS_API_SECRET_PROPERTY
        };
    }
}
