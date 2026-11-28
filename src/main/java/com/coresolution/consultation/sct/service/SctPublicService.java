package com.coresolution.consultation.sct.service;

import com.coresolution.consultation.sct.dto.SctConsentRequest;
import com.coresolution.consultation.sct.dto.SctDraftSaveRequest;
import com.coresolution.consultation.sct.dto.SctPublicFormResponse;
import com.coresolution.consultation.sct.dto.SctPublicMetaResponse;
import com.coresolution.consultation.sct.dto.SctSubmitRequest;
import com.coresolution.consultation.sct.dto.SctVerifyRequest;
import com.coresolution.consultation.sct.dto.SctVerifyResponse;

/**
 * SCT 공개(비로그인) 서비스.
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public interface SctPublicService {

    SctPublicMetaResponse getMeta(String rawToken);

    SctVerifyResponse verify(String rawToken, SctVerifyRequest request, String clientIp);

    /**
     * 같은 단말 재진입(새로고침·새 탭) — 단말 쿠키의 verify 세션이 유효하면 재인증 없이 세션을 돌려준다.
     * 쿠키가 없거나 무효이면 {@code verifySessionId=null} (OTP 본인확인 필요). 링크만으로는 세션이 생기지 않는다.
     *
     * @param rawToken        opaque 토큰(교환 코드 포함)
     * @param deviceSessionId 단말 쿠키 값(nullable)
     * @return 세션 응답 또는 verifySessionId 없는 응답
     */
    SctVerifyResponse resumeDeviceSession(String rawToken, String deviceSessionId);

    /**
     * 이 링크(교환 코드 포함)가 가리키는 초대·테넌트의 단말 쿠키 이름 접미.
     * 취소·만료·재발급·제출 완료 상태는 resume 과 같은 규칙으로 거부한다.
     *
     * @param rawToken opaque 토큰(교환 코드 포함)
     * @return 쿠키 이름 접미
     */
    String resolveDeviceCookieRef(String rawToken);

    SctPublicFormResponse getForm(String rawToken, String verifySessionId);

    void saveDraft(String rawToken, SctDraftSaveRequest request);

    void saveConsent(String rawToken, SctConsentRequest request, String clientIp, String userAgent);

    void submit(String rawToken, SctSubmitRequest request);
}
