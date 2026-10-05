package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.config.ManualNotificationProperties;
import com.coresolution.consultation.constant.ManualNotificationDeliveryStatus;
import com.coresolution.consultation.constant.ManualNotificationJobConstants;
import com.coresolution.consultation.constant.ManualNotificationProviderMode;
import com.coresolution.consultation.dto.MobilePushBroadcastResult;
import com.coresolution.consultation.service.MobilePushDispatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * 수동 발송 작업의 프로바이더 경계. REAL 은 기존 발송 헬퍼·푸시 서비스를 부르고, DRY_RUN 은 호출만 생략한 채
 * 같은 결과 형태를 돌려준다(작업·발송 기록 경로는 동일). 모드는 설정 {@code notification.manual.job.provider-mode}.
 *
 * @author MindGarden
 * @since 2026-10-05
 */
@Component
@RequiredArgsConstructor
public class ManualNotificationDispatchGateway {

    private final NotificationDispatchHelper dispatchHelper;
    private final MobilePushDispatchService mobilePushDispatchService;
    private final ManualNotificationProperties properties;

    /**
     * 현재 프로바이더 모드.
     *
     * @return 모드(알 수 없는 값이면 DRY_RUN)
     */
    public ManualNotificationProviderMode mode() {
        return ManualNotificationProviderMode.fromConfig(properties.getJob().getProviderMode());
    }

    /**
     * SMS 1건.
     *
     * @param phone   정규화 번호
     * @param content 본문
     * @return 결과
     */
    public Outcome sendSms(String phone, String content) {
        if (mode() == ManualNotificationProviderMode.DRY_RUN) {
            return Outcome.dryRun();
        }
        return Outcome.from(dispatchHelper.dispatchSms(phone, content));
    }

    /**
     * 알림톡 1건.
     *
     * @param phone      정규화 번호
     * @param templateId 실 템플릿 식별자
     * @param params     변수
     * @return 결과
     */
    public Outcome sendAlimtalk(String phone, String templateId, Map<String, String> params) {
        if (mode() == ManualNotificationProviderMode.DRY_RUN) {
            return Outcome.dryRun();
        }
        return Outcome.from(dispatchHelper.dispatchAlimtalk(phone, templateId, params));
    }

    /**
     * 푸시 청크 1회 요청.
     *
     * @param tenantId 테넌트 ID
     * @param userIds  수신 사용자
     * @param title    제목
     * @param body     본문
     * @param bucket   푸시 멱등 버킷(작업 UUID)
     * @return userId → 결과
     */
    public Map<Long, Outcome> sendPush(String tenantId, List<Long> userIds, String title, String body, String bucket) {
        Map<Long, Outcome> out = new HashMap<>();
        if (mode() == ManualNotificationProviderMode.DRY_RUN) {
            for (Long id : userIds) {
                out.put(id, Outcome.dryRun());
            }
            return out;
        }
        List<MobilePushBroadcastResult> rows = mobilePushDispatchService.dispatchAdminAnnouncement(tenantId, userIds,
            title, body, bucket);
        if (rows != null) {
            for (MobilePushBroadcastResult row : rows) {
                if (row != null && row.getUserId() != null) {
                    out.put(row.getUserId(), Outcome.from(row));
                }
            }
        }
        return out;
    }

    /**
     * 프로바이더 결과(수신자 1명).
     *
     * @param status       SENT·FAILED·SKIPPED
     * @param resultCode   결과 코드
     * @param errorMessage 오류 메시지(성공이면 null)
     */
    public record Outcome(ManualNotificationDeliveryStatus status, String resultCode, String errorMessage) {

        static Outcome dryRun() {
            return new Outcome(ManualNotificationDeliveryStatus.SENT, ManualNotificationJobConstants.RESULT_DRY_RUN,
                null);
        }

        static Outcome from(NotificationDispatchHelper.DispatchResult result) {
            if (result == null) {
                return new Outcome(ManualNotificationDeliveryStatus.FAILED,
                    ManualNotificationJobConstants.RESULT_PROVIDER_RESULT_MISSING, null);
            }
            if (result.success()) {
                return new Outcome(ManualNotificationDeliveryStatus.SENT, ManualNotificationJobConstants.RESULT_OK,
                    null);
            }
            return new Outcome(ManualNotificationDeliveryStatus.FAILED, result.errorCode(), result.errorMessage());
        }

        static Outcome from(MobilePushBroadcastResult row) {
            if (row.getStatus() == MobilePushBroadcastResult.Status.SENT) {
                return new Outcome(ManualNotificationDeliveryStatus.SENT, ManualNotificationJobConstants.RESULT_OK,
                    null);
            }
            ManualNotificationDeliveryStatus status = row.getStatus() == MobilePushBroadcastResult.Status.SKIPPED
                ? ManualNotificationDeliveryStatus.SKIPPED
                : ManualNotificationDeliveryStatus.FAILED;
            return new Outcome(status, row.getErrorCode(), row.getErrorMessage());
        }

        /**
         * 결과 없음(응답 누락).
         *
         * @return FAILED
         */
        public static Outcome missing() {
            return new Outcome(ManualNotificationDeliveryStatus.FAILED,
                ManualNotificationJobConstants.RESULT_PROVIDER_RESULT_MISSING, null);
        }

        /**
         * 호출 중 예외.
         *
         * @param e 예외
         * @return FAILED
         */
        public static Outcome error(RuntimeException e) {
            return new Outcome(ManualNotificationDeliveryStatus.FAILED, ManualNotificationJobConstants.RESULT_INTERNAL_ERROR,
                e.getClass().getSimpleName());
        }
    }
}
