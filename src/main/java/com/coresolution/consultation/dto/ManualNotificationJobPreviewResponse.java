package com.coresolution.consultation.dto;

import java.util.List;
import java.util.Map;
import com.coresolution.consultation.constant.ManualNotificationRecipientMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 수동 발송 확인 단계 응답. {@link #finalCount} 가 생성 시 작업 총건수와 같다({@link #snapshotToken} 으로 보장).
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ManualNotificationJobPreviewResponse {

    private TestNotificationChannel channel;
    private ManualNotificationRecipientMode recipientMode;
    private boolean marketing;
    private int finalCount;
    private int excludedCount;
    private int ineligibleCount;
    /** 제외 사유별 건수(INACTIVE, NO_PHONE, NO_MARKETING_CONSENT 등). */
    private Map<String, Integer> ineligibleReasons;
    private int maxRecipients;
    private List<PreviewRecipient> previewRecipients;
    private MessagePreview messagePreview;
    private String snapshotToken;

    /**
     * 확정 수신자 앞부분(마스킹).
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PreviewRecipient {
        private Long userId;
        private String nameMasked;
        private String phoneMasked;
    }

    /**
     * 메시지 미리보기.
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessagePreview {
        private String content;
        private String title;
        private String body;
        private String templateCode;
        private Map<String, String> templateParams;
    }
}
