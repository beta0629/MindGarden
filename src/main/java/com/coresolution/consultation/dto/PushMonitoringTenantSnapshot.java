package com.coresolution.consultation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * BW-1 「푸시 설정 모니터링」 테넌트 설정 스냅샷.
 *
 * <p>디자이너 핸드오프 §2 와이어프레임 / §4.7 (PushMonitoringSnapshotTable) 1:1 매핑.
 * 7~10 행 카드 list — 알림톡 활성, SOLAPI 키, 발신 키, 카카오 템플릿 매핑, 공통코드 매핑 수,
 * Expo 토큰, 운영 토글 3종 등.
 *
 * @author MindGarden
 * @since 2026-06-07
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PushMonitoringTenantSnapshot {

    /** 알림톡 채널 활성 토글 ({@code notification.batch.alimtalk-enabled}). */
    private boolean alimtalkEnabled;

    /** SOLAPI api-key 등록 여부({@code kakao.alimtalk.solapi.api-key} 또는 fallback). */
    private boolean kakaoApiKeyRegistered;

    /** SOLAPI 발신 프로필(pf-id) 등록 여부. */
    private boolean kakaoSenderKeyRegistered;

    /** 카카오 알림톡 템플릿 매핑 ({@code filled} / {@code total}). */
    private TemplateMapping templateMapping;

    /** 공통코드 ALIMTALK_BIZ_TEMPLATE_CODE 매핑 row 수. */
    private long alimtalkBizTemplateCodeCount;

    /** Expo Push access token 등록 여부({@code mindgarden.mobile.push.expo.access-token}). */
    private boolean expoPushAccessTokenRegistered;

    /** 운영 토글 3종(알림톡/SMS/PUSH). */
    private OperationalToggle operationalToggle;

    /**
     * 카카오 템플릿 매핑 (5 / 7).
     */
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class TemplateMapping {
        /** 매핑된 템플릿 수. */
        private int filled;
        /** 전체 템플릿 수 (BatchNotificationTemplateCodes 기준 — 현재 7종). */
        private int total;
    }

    /**
     * 운영 토글 3종.
     */
    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class OperationalToggle {
        /** 알림톡 운영 ({@code kakao.alimtalk.enabled} 환경변수). */
        private boolean alimtalk;
        /** SMS 운영 (현재 정책상 항상 ON — 인증 SMS는 별도 경로). */
        private boolean sms;
        /** PUSH 운영 (Expo access token 등록 여부 = 운영 토글로 간주). */
        private boolean push;
    }
}
