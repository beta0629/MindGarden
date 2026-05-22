package com.coresolution.consultation.service;

import java.time.LocalDate;
import java.util.List;
import com.coresolution.consultation.dto.TestAlimtalkRequest;
import com.coresolution.consultation.dto.TestNotificationAlimtalkTemplate;
import com.coresolution.consultation.dto.TestNotificationChannel;
import com.coresolution.consultation.dto.TestNotificationHistoryItem;
import com.coresolution.consultation.dto.TestNotificationRecipient;
import com.coresolution.consultation.dto.TestNotificationResponse;
import com.coresolution.consultation.dto.TestSmsRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.impl.AdminTestNotificationRateLimiter.Decision;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * 어드민 SMS·카카오 알림톡 테스트 발송 서비스.
 *
 * <p>기획서 {@code ADMIN_TEST_NOTIFICATION_TOOL_PLAN.md} §3 API 명세 1:1 매핑.
 * 모든 메서드는 호출자({@code AdminTestNotificationController})가 사전에 인증·테넌트 컨텍스트를 확보한 상태에서만 호출된다.
 *
 * @author MindGarden
 * @since 2026-05-22
 */
public interface AdminTestNotificationService {

    /**
     * 현재 테넌트 수신자 검색.
     *
     * @param tenantId  테넌트 ID
     * @param search    이름·이메일 검색어(null 허용)
     * @param role      역할 필터(null 허용)
     * @param hasPhone  true이면 전화번호 있는 사용자만
     * @return 검색 결과(전화번호는 마스킹)
     */
    List<TestNotificationRecipient> searchRecipients(String tenantId, String search,
            String role, boolean hasPhone);

    /**
     * 알림톡 템플릿 목록(공통코드 {@code ALIMTALK_TEMPLATE} 출처).
     *
     * @param tenantId 테넌트 ID
     * @return 템플릿 메타 목록
     */
    List<TestNotificationAlimtalkTemplate> listCommonCodeTemplates(String tenantId);

    /**
     * 알림톡 템플릿 목록(솔라피 실시간 출처). 솔라피 API 미설정/오류 시 빈 리스트 반환.
     *
     * @param tenantId 테넌트 ID
     * @return 템플릿 메타 목록
     */
    List<TestNotificationAlimtalkTemplate> listLiveAlimtalkTemplates(String tenantId);

    /**
     * 발송 사전 rate-limit 판정만 별도 호출(필요 시).
     *
     * @param tenantId 테넌트 ID
     * @param userId   발송자 PK
     * @return 결정
     */
    Decision checkRateLimit(String tenantId, Long userId);

    /**
     * 테스트 SMS 발송. 사전 rate-limit 통과 후 호출.
     *
     * @param tenantId    테넌트 ID
     * @param currentUser 발송 사용자
     * @param request     요청
     * @return 결과
     */
    TestNotificationResponse sendSms(String tenantId, User currentUser, TestSmsRequest request);

    /**
     * 테스트 알림톡 발송. 사전 rate-limit 통과 후 호출.
     *
     * @param tenantId    테넌트 ID
     * @param currentUser 발송 사용자
     * @param request     요청
     * @return 결과
     */
    TestNotificationResponse sendAlimtalk(String tenantId, User currentUser,
            TestAlimtalkRequest request);

    /**
     * 본 사용자·tenant 한정 이력 조회(페이지네이션).
     *
     * @param tenantId   테넌트 ID
     * @param currentUser 현재 사용자
     * @param from       시작일(null 허용)
     * @param to         종료일(null 허용)
     * @param channel    채널 필터(null 허용)
     * @param success    성공 필터(null 허용)
     * @param pageable   페이지 정보
     * @return 페이지
     */
    Page<TestNotificationHistoryItem> getHistory(String tenantId, User currentUser,
            LocalDate from, LocalDate to, TestNotificationChannel channel, Boolean success,
            Pageable pageable);
}
