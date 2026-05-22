package com.coresolution.consultation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 어드민 테스트 발송 수신자 검색 응답 항목.
 *
 * <p><strong>PII 보호</strong>: 원본 전화번호는 절대 노출하지 않으며 {@link #phoneMasked}만 반환한다.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TestNotificationRecipient {

    private Long userId;
    private String name;
    private String email;
    private String role;
    private String phoneMasked;
    private boolean hasPhone;
}
