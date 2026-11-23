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

    SctPublicFormResponse getForm(String rawToken, String verifySessionId);

    void saveDraft(String rawToken, SctDraftSaveRequest request);

    void saveConsent(String rawToken, SctConsentRequest request, String clientIp, String userAgent);

    void submit(String rawToken, SctSubmitRequest request);
}
