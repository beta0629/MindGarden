package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.dto.BulkAlimtalkManualRequest;
import com.coresolution.consultation.dto.BulkNotificationResponse;
import com.coresolution.consultation.dto.BulkPushManualRequest;
import com.coresolution.consultation.dto.BulkRecipientResult;
import com.coresolution.consultation.dto.BulkSmsManualRequest;
import com.coresolution.consultation.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 어드민 수동 다중 SMS·알림톡 발송 서비스.
 *
 * <p>P1.2 — Q1=B(별도 메뉴), Q2=50명 상한, Q4=batch_id 포함, Q5=rate-limit 잔여 부족 시 전체 차단.
 * 단일 발송 도구({@link AdminTestNotificationService}) 와 동일한 감사로그 테이블·rate-limiter·
 * 디스패치 헬퍼를 공유하지만, 발송 단위는 항상 다중(1~50명) 이며 배치마다 UUID 가 부여된다.
 *
 * @author MindGarden
 * @since 2026-05-23
 */
public interface AdminManualNotificationService {

    /**
     * 다중 SMS 발송. tenantId/currentUser 는 호출자(컨트롤러) 가 사전에 검증한다.
     *
     * @param tenantId    테넌트 ID
     * @param currentUser 발송 사용자
     * @param request     요청
     * @return 배치 결과(batch_id 포함)
     */
    BulkNotificationResponse sendBulkSms(String tenantId, User currentUser,
            BulkSmsManualRequest request);

    /**
     * 다중 알림톡 발송. {@code templateSource=COMMON_CODE} 이고 매핑이 없으면 전체 차단.
     *
     * @param tenantId    테넌트 ID
     * @param currentUser 발송 사용자
     * @param request     요청
     * @return 배치 결과(batch_id 포함)
     */
    BulkNotificationResponse sendBulkAlimtalk(String tenantId, User currentUser,
            BulkAlimtalkManualRequest request);

    /**
     * 다중 푸시(Expo Push API) broadcast. 토큰 없는 사용자·SYSTEM 카테고리 OFF 사용자는 SKIPPED
     * (실패 아님)로 행 단위 결과에 사유 포함. 멱등은 batch UUID 기반.
     *
     * @param tenantId    테넌트 ID
     * @param currentUser 발송 사용자
     * @param request     요청
     * @return 배치 결과(batch_id 포함, 행 단위 결과 SENT/SKIPPED/FAILED)
     * @since 2026-05-25
     */
    BulkNotificationResponse sendBulkPush(String tenantId, User currentUser,
            BulkPushManualRequest request);

    /**
     * 배치 상세 — 같은 batch_id 의 모든 감사로그 행을 행 단위 결과로 노출.
     *
     * @param tenantId 테넌트 ID
     * @param batchId  배치 UUID
     * @return 배치에 포함된 행 결과 목록(시간 오름차순). 미존재 시 빈 리스트
     */
    List<BulkRecipientResult> getBatchDetails(String tenantId, String batchId);

    /**
     * 배치 그룹 단위 페이지네이션 — 본인·tenant 한정. 단일 발송(batch_id=null) 은 제외한다.
     *
     * @param tenantId    테넌트 ID
     * @param currentUser 현재 사용자
     * @param pageable    페이지 정보
     * @return 배치 헤더 페이지
     */
    Page<BulkNotificationResponse> getBatchHistory(String tenantId, User currentUser,
            Pageable pageable);
}
