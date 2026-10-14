package com.coresolution.consultation.dto;

import lombok.Getter;
import lombok.Setter;

/**
 * 임시 비밀번호 문자 발송 결과. 비밀번호와 본문은 담지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-14
 */
@Getter
@Setter
public class CredentialSmsResult {

    private boolean smsSent;

    /** 미발송·실패 코드. 성공이면 null. */
    private String skipReason;
}
