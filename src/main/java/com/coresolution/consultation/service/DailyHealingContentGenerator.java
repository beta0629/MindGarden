package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.DailyHealingContent;
import com.coresolution.consultation.repository.DailyHealingContentRepository;
import com.coresolution.consultation.service.impl.HealingContentServiceImpl;
import com.coresolution.core.context.TenantContextHolder;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * 테넌트별 일일 힐링 컨텐츠 생성 (AI 호출 → {@code ai_usage_logs} 적재).
 *
 * <p>알림 발송({@code WellnessNotificationScheduler}) 과 분리되어,
 * 모니터링용 적재 스케줄러에서도 재사용한다. 날짜 단위 idempotent
 * ({@code existsByDate}) 이므로 양쪽에서 호출해도 중복 생성하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-07-11
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DailyHealingContentGenerator {

    private final DailyHealingContentRepository dailyHealingContentRepository;
    private final HealingContentServiceImpl healingContentService;

    /**
     * 지정 테넌트·날짜의 힐링 컨텐츠 6종(역할×카테고리)을 생성한다.
     *
     * @param today    대상 날짜
     * @param tenantId 테넌트 ID (필수 — blank 이면 스킵)
     */
    public void generateForTenant(LocalDate today, String tenantId) {
        if (!StringUtils.hasText(tenantId)) {
            log.warn("⚠️ [DailyHealing] tenantId 누락 — 힐링 생성 스킵");
            return;
        }
        if (today == null) {
            log.warn("⚠️ [DailyHealing] today 누락 — 힐링 생성 스킵 tenantId={}", tenantId);
            return;
        }
        try {
            log.debug("💚 오늘의 힐링 컨텐츠 생성 시작 - 날짜: {}, tenantId: {}", today, tenantId);

            if (dailyHealingContentRepository.existsByDate(today)) {
                log.debug("💚 오늘의 힐링 컨텐츠가 이미 존재합니다 - 날짜: {}", today);
                return;
            }

            generateHealingContentForRole("CLIENT", "GENERAL", today, tenantId);
            generateHealingContentForRole("CLIENT", "HUMOR", today, tenantId);
            generateHealingContentForRole("CLIENT", "WARM_WORDS", today, tenantId);
            generateHealingContentForRole("CONSULTANT", "GENERAL", today, tenantId);
            generateHealingContentForRole("CONSULTANT", "HUMOR", today, tenantId);
            generateHealingContentForRole("CONSULTANT", "WARM_WORDS", today, tenantId);

            log.debug("✅ 오늘의 힐링 컨텐츠 생성 완료 - 날짜: {}, tenantId: {}", today, tenantId);
        } catch (Exception e) {
            log.error("❌ 오늘의 힐링 컨텐츠 생성 실패 - 날짜: {}, tenantId: {}", today, tenantId, e);
        }
    }

    private void generateHealingContentForRole(
            String userRole, String category, LocalDate today, String tenantId) {
        try {
            TenantContextHolder.setTenantId(tenantId);

            var healingContent = healingContentService.generateNewHealingContent(userRole, category);

            DailyHealingContent dailyContent = DailyHealingContent.builder()
                    .contentDate(today)
                    .title(healingContent.getTitle())
                    .content(healingContent.getContent())
                    .category(category)
                    .userRole(userRole)
                    .emoji(healingContent.getEmoji())
                    .isActive(true)
                    .build();

            dailyHealingContentRepository.save(dailyContent);

            log.debug("💚 힐링 컨텐츠 저장 완료 - tenantId: {}, 역할: {}, 카테고리: {}, 제목: {}",
                    tenantId, userRole, category, healingContent.getTitle());
        } catch (Exception e) {
            log.error("❌ 힐링 컨텐츠 생성 실패 - tenantId: {}, 역할: {}, 카테고리: {}",
                    tenantId, userRole, category, e);
        }
    }
}
