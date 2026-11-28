package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.AuditLogService;
import com.coresolution.consultation.sct.constant.SctConstants;
import com.coresolution.consultation.sct.constant.SctInviteStatus;
import com.coresolution.consultation.sct.dto.SctDraftAnswerItem;
import com.coresolution.consultation.sct.dto.SctDraftSaveRequest;
import com.coresolution.consultation.sct.dto.SctSubmitRequest;
import com.coresolution.consultation.sct.entity.SctFormItem;
import com.coresolution.consultation.sct.entity.SctFormTemplate;
import com.coresolution.consultation.sct.entity.SctInvitation;
import com.coresolution.consultation.sct.exception.SctGoneException;
import com.coresolution.consultation.sct.exception.SctLinkSessionExpiredException;
import com.coresolution.consultation.sct.exception.SctVerifyRequiredException;
import com.coresolution.consultation.sct.repository.SctFormItemRepository;
import com.coresolution.consultation.sct.repository.SctFormTemplateRepository;
import com.coresolution.consultation.sct.repository.SctInvitationRepository;
import com.coresolution.consultation.sct.repository.SctInviteAccessAttemptRepository;
import com.coresolution.consultation.sct.repository.SctResponseAnswerRepository;
import com.coresolution.consultation.sct.repository.SctRotatedTokenHashRepository;
import com.coresolution.consultation.sct.service.SctConsentService;
import com.coresolution.consultation.sct.service.SctExchangeCodeStore;
import com.coresolution.consultation.sct.service.SctFeatureGuard;
import com.coresolution.consultation.sct.service.SctSettingsService;
import com.coresolution.consultation.sct.service.SctVerifySessionStore;
import com.coresolution.consultation.sct.service.impl.SctPublicServiceImpl;
import com.coresolution.consultation.sct.service.impl.SctPublicTokenResolverImpl;
import com.coresolution.consultation.security.pii.PiiHmacService;
import com.coresolution.consultation.security.pii.PiiTestSecrets;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * P0 2026-11-28 — 단축 링크(/s/xxx) 교환 코드로 50문항 작성 중 10분 고정 TTL 이 지나
 * draft/submit 이 404 나던 회귀. 교환 코드는 첫 사용 뒤 작성 중 시간 제한 없이 초대 만료까지 유지,
 * 제출·취소·만료·재발급만 거부. 만료(410)와 없음(404)을 구분한다. 본인확인 세션 판정은 그대로.
 *
 * @author MindGarden
 * @since 2026-11-28
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SctShortLinkSessionSlidingTest {

    private static final String TENANT_A = "tenant-a";
    private static final String RAW_TOKEN = "short-link-sliding-raw-token-32b!";
    private static final long LANDING_SECONDS = SctConstants.SHORT_LINK_EXCHANGE_TTL_MINUTES * 60L;
    private static final long IDLE_SECONDS = SctConstants.VERIFY_SESSION_IDLE_MINUTES * 60L;

    @Mock private SctInvitationRepository invitationRepository;
    @Mock private SctFormTemplateRepository formTemplateRepository;
    @Mock private SctFormItemRepository formItemRepository;
    @Mock private SctResponseAnswerRepository answerRepository;
    @Mock private SctInviteAccessAttemptRepository attemptRepository;
    @Mock private SctRotatedTokenHashRepository rotatedTokenHashRepository;
    @Mock private SctFeatureGuard sctFeatureGuard;
    @Mock private SctConsentService sctConsentService;
    @Mock private SctSettingsService sctSettingsService;
    @Mock private AuditLogService auditLogService;
    @Mock private EntityManager entityManager;

    @InjectMocks
    private SctPublicServiceImpl sctPublicService;

    private final MutableClock clock = new MutableClock(Instant.now());
    private SctVerifySessionStore verifySessionStore;
    private SctExchangeCodeStore exchangeCodeStore;
    private SctInvitation invitation;

    @BeforeEach
    void setUp() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        verifySessionStore = new SctVerifySessionStore(redis.provider(), clock, IDLE_SECONDS);
        exchangeCodeStore = new SctExchangeCodeStore(redis.provider(), clock, LANDING_SECONDS);
        PiiHmacService hmac = PiiTestSecrets.hmacService();

        invitation = SctInvitation.builder()
                .formTemplateId(1L)
                .tokenHash(hmac.hmacHex(RAW_TOKEN))
                .tokenExpiresAt(LocalDateTime.now().plusDays(7))
                .status(SctInviteStatus.SENT.name())
                .sentByUserId(1L)
                .verifyFailCount(0)
                .requiresGuardian(false)
                .build();
        invitation.setId(100L);
        invitation.setTenantId(TENANT_A);

        SctFormTemplate template = SctFormTemplate.builder()
                .id(1L).formType("ADULT").title("t").instructionText("i")
                .formVersion("v3").tenantId("").isActive(true).isDeleted(false).build();
        SctFormItem formItem = SctFormItem.builder()
                .id(1L).formTemplateId(1L).itemNo(1).promptText("나는")
                .allowsNotApplicable(false).build();

        when(invitationRepository.findByTokenHashAndIsDeletedFalse(any())).thenReturn(Optional.empty());
        when(invitationRepository.findByTenantIdAndIdAndIsDeletedFalse(TENANT_A, 100L))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(invitationRepository.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(formTemplateRepository.findByIdAndIsDeletedFalse(1L)).thenReturn(Optional.of(template));
        when(formItemRepository.findByIdAndFormTemplateId(1L, 1L)).thenReturn(Optional.of(formItem));
        when(answerRepository.findByTenantIdAndInvitationIdAndFormItemId(TENANT_A, 100L, 1L))
                .thenReturn(Optional.empty());
        when(answerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(rotatedTokenHashRepository.findByTokenHash(any())).thenReturn(Optional.empty());

        SctPublicTokenResolverImpl resolver = new SctPublicTokenResolverImpl(
                invitationRepository, rotatedTokenHashRepository, exchangeCodeStore, hmac);
        ReflectionTestUtils.setField(sctPublicService, "publicTokenResolver", resolver);
        ReflectionTestUtils.setField(sctPublicService, "verifySessionStore", verifySessionStore);
        ReflectionTestUtils.setField(sctPublicService, "piiHmacService", hmac);
        ReflectionTestUtils.setField(sctPublicService, "entityManager", entityManager);
    }

    private Instant inviteAbsolute() {
        return invitation.getTokenExpiresAt().atZone(ZoneId.of("Asia/Seoul")).toInstant();
    }

    private String issueExchange(Instant absolute) {
        return exchangeCodeStore.issue(100L, TENANT_A, null, invitation.getTokenHash(), absolute);
    }

    /** 기존 OTP/verify 성공 결과로 발급된 세션과 동일한 발급 경로. */
    private String issueVerifySession() {
        return verifySessionStore.issue(100L, TENANT_A, inviteAbsolute());
    }

    private SctDraftSaveRequest draft(String sid, String text) {
        return SctDraftSaveRequest.builder()
                .verifySessionId(sid)
                .answers(Collections.singletonList(SctDraftAnswerItem.builder()
                        .formItemId(1L).answerText(text).build()))
                .build();
    }

    @Test
    @DisplayName("교환 코드 발급 11분+ 후에도 작성 중이면 draft·submit 성공 (회귀: 10분 고정 404)")
    void exchangeCode_after11Minutes_draftAndSubmitSucceed() {
        String code = issueExchange(inviteAbsolute());
        clock.advance(Duration.ofMinutes(1));
        String sid = issueVerifySession();
        sctPublicService.saveDraft(code, draft(sid, "a"));

        clock.advance(Duration.ofMinutes(5));
        sctPublicService.saveDraft(code, draft(sid, "b"));

        clock.advance(Duration.ofMinutes(5).plusSeconds(30));
        sctPublicService.saveDraft(code, draft(sid, "c"));

        clock.advance(Duration.ofMinutes(1));
        sctPublicService.submit(code, SctSubmitRequest.builder().verifySessionId(sid).build());

        assertEquals(SctInviteStatus.SUBMITTED.name(), invitation.getStatus());
    }

    @Test
    @DisplayName("본인확인 우회 없음 — 교환 코드가 살아 있어도 verify 세션 없으면 거부")
    void exchangeCodeAlive_withoutVerifySession_stillRequiresVerify() {
        String code2 = issueExchange(inviteAbsolute());
        clock.advance(Duration.ofMinutes(1));
        assertThrows(SctVerifyRequiredException.class,
                () -> sctPublicService.saveDraft(code2, draft("no-session", "x")));
    }

    @Test
    @DisplayName("착지 창(첫 사용 전) 초과 → 410 만료(없음 404 와 구분)")
    void exchangeCode_unusedPastLanding_isExpired410() {
        String code = issueExchange(inviteAbsolute());
        String sid = issueVerifySession();
        clock.advance(Duration.ofSeconds(LANDING_SECONDS + 1));

        assertTrue(exchangeCodeStore.isExpired(code));
        SctLinkSessionExpiredException ex = assertThrows(SctLinkSessionExpiredException.class,
                () -> sctPublicService.saveDraft(code, draft(sid, "x")));
        assertEquals(SctConstants.MSG_LINK_SESSION_EXPIRED, ex.getMessage());
        assertEquals("SCT_LINK_SESSION_EXPIRED", SctLinkSessionExpiredException.ERROR_CODE);
    }

    @Test
    @DisplayName("60분+ 경과 후에도 draft·submit 성공 — 작성 중 시간 제한 없음")
    void exchangeCode_after65Minutes_draftAndSubmitSucceed() {
        String code = issueExchange(inviteAbsolute());
        clock.advance(Duration.ofMinutes(1));
        String sid = issueVerifySession();
        sctPublicService.saveDraft(code, draft(sid, "a"));
        for (int i = 0; i < 3; i++) {
            clock.advance(Duration.ofMinutes(20));
            sctPublicService.saveDraft(code, draft(sid, "step" + i));
        }
        clock.advance(Duration.ofMinutes(4));
        sctPublicService.submit(code, SctSubmitRequest.builder().verifySessionId(sid).build());
        assertEquals(SctInviteStatus.SUBMITTED.name(), invitation.getStatus());
    }

    @Test
    @DisplayName("사용한 교환 코드는 수 시간 방치 후에도 유효 — 같은 링크로 이어쓰기")
    void usedExchangeCode_survivesLongIdle() {
        String code = issueExchange(inviteAbsolute());
        assertTrue(exchangeCodeStore.resolve(code).isPresent());
        clock.advance(Duration.ofHours(3));
        assertTrue(exchangeCodeStore.resolve(code).isPresent());
        assertFalse(exchangeCodeStore.isExpired(code));
    }

    @Test
    @DisplayName("초대 취소 → 410 거부")
    void cancelledInvitation_rejected() {
        String code = issueExchange(inviteAbsolute());
        clock.advance(Duration.ofMinutes(1));
        String sid = issueVerifySession();
        sctPublicService.saveDraft(code, draft(sid, "a"));
        invitation.setStatus(SctInviteStatus.CANCELLED.name());
        clock.advance(Duration.ofMinutes(61));
        assertThrows(SctGoneException.class,
                () -> sctPublicService.submit(code, SctSubmitRequest.builder().verifySessionId(sid).build()));
    }

    @Test
    @DisplayName("초대 만료 상태 → 410 거부")
    void expiredInvitation_rejected() {
        String code = issueExchange(inviteAbsolute());
        clock.advance(Duration.ofMinutes(1));
        String sid = issueVerifySession();
        sctPublicService.saveDraft(code, draft(sid, "a"));
        invitation.setStatus(SctInviteStatus.EXPIRED.name());
        assertThrows(SctGoneException.class,
                () -> sctPublicService.saveDraft(code, draft(sid, "b")));
    }

    @Test
    @DisplayName("재발급(tokenHash 교체) → 이전 교환 코드 404 거부")
    void reissuedInvitation_rejected() {
        String code = issueExchange(inviteAbsolute());
        clock.advance(Duration.ofMinutes(1));
        String sid = issueVerifySession();
        sctPublicService.saveDraft(code, draft(sid, "a"));
        invitation.setTokenHash(PiiTestSecrets.hmacService().hmacHex("rotated-new-token-value-32bytes!!"));
        assertThrows(EntityNotFoundException.class,
                () -> sctPublicService.saveDraft(code, draft(sid, "b")));
    }

    @Test
    @DisplayName("절대 상한 = 초대 만료 — 지나면 410 만료")
    void exchangeCode_neverOutlivesInvitationAbsolute() {
        Instant absolute = clock.instant().plus(Duration.ofMinutes(90));
        String code = issueExchange(absolute);
        clock.advance(Duration.ofMinutes(1));
        assertTrue(exchangeCodeStore.resolve(code).isPresent());
        clock.advance(Duration.ofMinutes(80));
        assertTrue(exchangeCodeStore.resolve(code).isPresent());
        clock.advance(Duration.ofMinutes(10));
        assertFalse(exchangeCodeStore.resolve(code).isPresent());
        assertTrue(exchangeCodeStore.isExpired(code));
    }

    @Test
    @DisplayName("발급된 적 없는 코드 → 404 없음(만료 아님)")
    void unknownCode_isNotFound404() {
        String sid = issueVerifySession();
        assertFalse(exchangeCodeStore.isExpired("never-issued-code-xxxxxxxxxxxxxxxx"));
        EntityNotFoundException ex = assertThrows(EntityNotFoundException.class,
                () -> sctPublicService.saveDraft("never-issued-code-xxxxxxxxxxxxxxxx", draft(sid, "x")));
        assertEquals(SctConstants.MSG_LINK_NOT_FOUND, ex.getMessage());
    }

    @Test
    @DisplayName("로그 참조는 해시 접두 8자만 — 원문 미포함")
    void logRef_isHashPrefixOnly() {
        String ref = SctExchangeCodeStore.logRef(RAW_TOKEN);
        assertEquals(8, ref.length());
        assertFalse(RAW_TOKEN.contains(ref));
    }

    /** 테스트 시계. */
    private static final class MutableClock extends Clock {
        private final AtomicReference<Instant> now;

        private MutableClock(Instant start) {
            this.now = new AtomicReference<>(start);
        }

        void advance(Duration d) {
            now.updateAndGet(i -> i.plus(d));
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now.get();
        }
    }
}
