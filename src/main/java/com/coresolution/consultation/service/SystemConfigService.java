package com.coresolution.consultation.service;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.dto.NotificationSchedulerFlagDto;

/**
 * 시스템 설정 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
public interface SystemConfigService {
    
    /**
     * 설정 값 조회
     */
    Optional<String> getConfigValue(String configKey);
    
    /**
     * 설정 값 조회 (기본값 포함)
     */
    String getConfigValue(String configKey, String defaultValue);
    
    /**
     * 설정 값 저장
     */
    void setConfigValue(String configKey, String configValue, String description, String category);
    
    /**
     * 카테고리별 설정 조회
     */
    List<String> getConfigsByCategory(String category);
    
    /**
     * OpenAI API 키 조회
     */
    String getOpenAIApiKey();
    
    /**
     * OpenAI API URL 조회
     */
    String getOpenAIApiUrl();
    
    /**
     * OpenAI 모델명 조회
     */
    String getOpenAIModel();
    
    /**
     * 기본 AI 프로바이더 ID 조회 (openai | gemini | claude | replicate).
     * 없거나 빈 값이면 "openai" 반환.
     */
    String getAiDefaultProvider();
    
    /**
     * 기본 AI 프로바이더 저장
     */
    void setAiDefaultProvider(String providerId);
    
    /**
     * 지정 프로바이더의 API 키 조회
     */
    String getApiKeyForProvider(String providerId);
    
    /**
     * 지정 프로바이더의 API URL 조회
     */
    String getApiUrlForProvider(String providerId);
    
    /**
     * 지정 프로바이더의 모델명 조회
     */
    String getModelForProvider(String providerId);
    
    /**
     * USD-KRW 환율 조회
     */
    Double getUsdToKrwRate();
    
    /**
     * 환율 설정 저장
     */
    void setUsdToKrwRate(Double rate);

    /**
     * 전역(테넌트 비종속) 불리언 플래그 조회.
     *
     * <p>{@code tenant_id = ''} 단일 행을 직접 조회하므로 {@link com.coresolution.core.context.TenantContextHolder}
     * 설정이 없어도 안전하게 호출 가능하다. 운영 알림 발송 스케줄러 ON/OFF 같은 전역 토글에 사용한다.
     * 값 파싱은 {@code "true"|"1"|"yes"|"on"} (대소문자 무시) → {@code true}, 그 외 → {@code false}.
     *
     * @param configKey    설정 키
     * @param defaultValue 행이 없거나 비활성일 때 반환할 기본값
     * @return 플래그 값 (행 없음 시 {@code defaultValue})
     */
    boolean getGlobalBoolean(String configKey, boolean defaultValue);

    /**
     * 알림 자동 발송 스케줄러 4 종 전역 플래그 일괄 조회.
     *
     * <p>키 SSOT: {@link com.coresolution.consultation.constant.NotificationSchedulerFlagKeys}.
     * 어드민 토글 UI 가 한 번에 4 키 상태(값·마지막 변경자·시각)를 받아오기 위한 진입점.
     * 시드되지 않은 키는 {@link com.coresolution.consultation.constant.NotificationSchedulerFlagKeys#DEFAULT_ENABLED}
     * 으로 응답하되, {@code updatedBy/updatedAt} 은 null 로 반환한다.
     *
     * @return 4 종 플래그 DTO (키 정렬 안정성 보장)
     */
    List<NotificationSchedulerFlagDto> listNotificationSchedulerFlags();

    /**
     * 전역(테넌트 비종속) 불리언 플래그 저장.
     *
     * <p>화이트리스트 검증은 호출자(컨트롤러) 책임이며, 본 메서드는 키가 화이트리스트에
     * 포함된다는 전제 하에 동작한다. 행이 없으면 신규 생성, 있으면 업데이트하며
     * {@code updated_by} 에 호출자가 전달한 식별자를 기록한다.
     *
     * @param configKey  설정 키 (전역 행)
     * @param value      저장할 boolean 값 (true → "true", false → "false")
     * @param updatedBy  변경 주체 식별자 (admin 사용자 ID/이메일 등). null/blank 면 "ADMIN" 으로 대체.
     * @return 변경 후 저장된 DTO (key, value, updatedBy, updatedAt)
     */
    NotificationSchedulerFlagDto setGlobalBoolean(String configKey, boolean value, String updatedBy);
}
