package com.coresolution.consultation.service.impl;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.dto.PsychoEducationArticleResponse;
import com.coresolution.consultation.dto.PsychoEducationArticleResponse.Page;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.PsychoEducationService;
import com.coresolution.core.context.TenantContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;

/**
 * 심리 교육 콘텐츠 서비스 구현체.
 *
 * <p>MVP 단계에서는 시드(상수) 데이터를 그대로 노출한다. 운영 도입 시
 * Flyway 마이그레이션 + Repository 기반으로 교체한다. 시드 데이터는 의료·광고
 * 표현 가이드(`docs/project-management/EXPO_NATIVE_APP_PLAN.md` §10.1)를 준수해야 하며,
 * 운영 반영 전에는 편집·감수·저작권 검토를 거친 콘텐츠로 치환한다.</p>
 *
 * <p>본 단계에서는 콘텐츠가 모든 테넌트에서 동일하지만, 보안 표준상 tenantId가
 * 컨텍스트에 존재해야 응답한다(다른 테넌트 데이터 노출 방지). tenantId가 없으면
 * {@link com.coresolution.core.filter.TenantContextFilter}가 400으로 차단한다.</p>
 *
 * @author MindGarden
 * @since 2026-05-13
 */
@Slf4j
@Service
public class PsychoEducationServiceImpl implements PsychoEducationService {

    private static final String ENTITY_NAME = "PsychoEducationArticle";

    private static final List<PsychoEducationArticleResponse> SEED_ARTICLES = buildSeedArticles();

    @Override
    @Transactional(readOnly = true)
    public List<PsychoEducationArticleResponse> listArticles() {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        log.debug("심리 교육 콘텐츠 목록 조회: tenantId={}, count={}", tenantId, SEED_ARTICLES.size());
        return SEED_ARTICLES;
    }

    @Override
    @Transactional(readOnly = true)
    public PsychoEducationArticleResponse getArticle(Long articleId) {
        String tenantId = TenantContextHolder.getRequiredTenantId();
        if (articleId == null || articleId <= 0L) {
            throw new EntityNotFoundException(ENTITY_NAME, articleId);
        }
        Optional<PsychoEducationArticleResponse> found = SEED_ARTICLES.stream()
            .filter(article -> articleId.equals(article.id()))
            .findFirst();
        if (found.isEmpty()) {
            log.info("심리 교육 콘텐츠 없음: tenantId={}, articleId={}", tenantId, articleId);
            throw new EntityNotFoundException(ENTITY_NAME, articleId);
        }
        log.debug("심리 교육 콘텐츠 상세 조회: tenantId={}, articleId={}", tenantId, articleId);
        return found.get();
    }

    /**
     * 시드 데이터 — Expo의 {@code MOCK_PSYCHO_ARTICLES}와 카테고리·제목 순서를 동일하게 유지.
     * 운영 반영 전에는 편집팀 콘텐츠로 교체한다.
     */
    private static List<PsychoEducationArticleResponse> buildSeedArticles() {
        return List.of(
            article(
                1L,
                "STRESS",
                "스트레스 관리",
                "불안을 다스리는 5가지 호흡법",
                "긴장되는 순간, 간단한 호흡법으로 마음을 가라앉힐 수 있습니다.",
                3,
                List.of(
                    page("불안은 자연스러운 감정",
                        "불안은 누구나 경험하는 자연스러운 감정입니다. 하지만 그것이 일상을 방해할 때, 우리는 이를 관리하는 방법을 배워야 합니다."),
                    page("4-7-8 호흡법",
                        "코로 4초 들이쉬고, 7초 참고, 8초 내쉽니다. 이 방법은 부교감 신경을 활성화하여 빠르게 긴장을 완화합니다."),
                    page("복식호흡",
                        "배에 손을 얹고 배가 부풀어 오르도록 깊이 호흡합니다. 가슴이 아닌 배로 호흡하면 더 깊은 이완이 됩니다."),
                    page("박스 브리딩",
                        "4초 흡입 → 4초 멈춤 → 4초 호출 → 4초 멈춤을 반복합니다. 규칙적인 리듬이 안정감을 줍니다."),
                    page("꾸준한 연습이 핵심",
                        "하루 5분, 아침과 저녁에 꾸준히 연습하면 불안 수준이 크게 낮아질 수 있습니다. 오늘부터 시작해보세요!")
                )
            ),
            article(
                2L,
                "STRESS",
                "스트레스 관리",
                "그라운딩 기법: 5-4-3-2-1",
                "지금 이 순간으로 돌아오는 감각 기반 안정화 기법입니다.",
                3,
                List.of(
                    page("현재로 돌아오기",
                        "패닉이나 강한 불안이 찾아올 때, 감각에 집중하면 \"지금 여기\"로 돌아올 수 있습니다."),
                    page("5가지 보이는 것",
                        "주변에서 보이는 것 5가지를 하나씩 소리 내어 말합니다. 색상, 모양, 크기를 구체적으로 관찰하세요."),
                    page("4가지 촉감 + 3가지 소리",
                        "만질 수 있는 것 4개의 질감을 느끼고, 들리는 소리 3개에 귀를 기울입니다."),
                    page("2가지 냄새 + 1가지 맛",
                        "냄새 2가지를 맡고, 맛 1가지를 느낍니다. 감각에 집중하면 불안은 미래의 걱정에서 현재로 앵커링됩니다.")
                )
            ),
            article(
                3L,
                "EMOTION",
                "감정 이해",
                "자동적 사고 잡아내기",
                "무의식적으로 떠오르는 부정적 생각을 인식하고 바꾸는 방법.",
                4,
                List.of(
                    page("자동적 사고란?",
                        "상황에 대해 즉각적으로 떠오르는 생각을 자동적 사고라고 합니다. 대부분 부정적이고 왜곡된 패턴을 따릅니다."),
                    page("잡아내는 방법",
                        "감정이 급격히 변할 때 \"지금 무슨 생각을 했지?\" 자문합니다. 사고 기록지에 상황-생각-감정-결과를 적습니다."),
                    page("균형 잡힌 대안 만들기",
                        "그 생각의 근거와 반증을 모두 찾아보고, 더 균형 잡힌 대안적 생각을 만들어봅니다.")
                )
            ),
            article(
                4L,
                "EMOTION",
                "감정 이해",
                "인지 왜곡 10가지 유형",
                "흑백논리, 과잉일반화, 독심술 등 흔한 인지 왜곡 패턴을 알아봅시다.",
                6,
                List.of(
                    page("인지 왜곡이란?",
                        "우리의 생각에는 다양한 왜곡이 존재합니다. 이를 인식하는 것이 변화의 첫걸음입니다."),
                    page("흑백논리 & 과잉일반화",
                        "모 아니면 도식의 사고, 한 번의 실패로 항상 그럴 거라 단정짓는 패턴입니다."),
                    page("독심술 & 파국화",
                        "타인의 생각을 마음대로 추측하고, 작은 문제를 크게 확대하는 왜곡입니다."),
                    page("감정적 추론 & 당위적 사고",
                        "느낌이 곧 사실이라 생각하고, \"~해야 한다\"에 집착하는 패턴을 인식해보세요.")
                )
            ),
            article(
                5L,
                "RELATIONSHIP",
                "관계",
                "비폭력 대화(NVC) 4단계",
                "갈등 없이 진심을 전하는 마샬 로젠버그의 대화법.",
                5,
                List.of(
                    page("비폭력 대화란?",
                        "비폭력 대화(NVC)는 판단 없이 서로의 욕구를 이해하고 연결하는 대화 방법입니다."),
                    page("1단계: 관찰",
                        "판단 없이 사실만 말합니다.\n\"네가 30분 늦었어\" (O)\n\"넌 항상 늦잖아\" (X)"),
                    page("2단계: 느낌 + 필요",
                        "자신의 감정을 표현하고(나는 걱정이 되었어), 충족되지 않은 욕구를 말합니다(약속이 지켜지면 안심이 돼)."),
                    page("3단계: 부탁",
                        "구체적인 행동을 요청합니다. \"다음에는 늦을 것 같으면 미리 연락해줄 수 있어?\"")
                )
            ),
            article(
                6L,
                "RELATIONSHIP",
                "관계",
                "건강한 경계 설정하기",
                "나를 지키면서도 관계를 유지하는 경계의 기술.",
                4,
                List.of(
                    page("경계란?",
                        "\"여기까지는 괜찮고, 여기부터는 불편해요\"의 선입니다. 자기 존중과 타인 존중의 균형이죠."),
                    page("자기 인식",
                        "불편함을 느끼는 상황을 파악하고, 명확하게 표현합니다. \"나는 ~할 때 불편해\" I-message로 전합니다."),
                    page("일관성 유지",
                        "한번 정한 경계는 일관되게 유지합니다. 경계를 존중하지 않는 관계는 적절한 거리를 둡니다.")
                )
            ),
            article(
                7L,
                "SELFCARE",
                "자기돌봄",
                "내면의 비판자 다루기",
                "자기 비난의 목소리를 인식하고 자비로운 태도로 바꾸는 법.",
                4,
                List.of(
                    page("내면의 비판자",
                        "우리 안에는 끊임없이 비판하는 목소리가 있습니다. \"넌 그것도 못해?\", \"노력해봤자 소용없어\""),
                    page("인식하기",
                        "\"아, 지금 내면의 비판자가 말하고 있구나\" — 그 목소리를 3인칭으로 바라봅니다."),
                    page("자기 자비로 전환",
                        "친한 친구에게 하듯 나에게 말합니다. 비판의 근거를 객관적으로 검증해봅니다.")
                )
            ),
            article(
                8L,
                "SELFCARE",
                "자기돌봄",
                "작은 성공 수집하기",
                "일상의 작은 성취를 모아 자신감을 키우는 실용적 방법.",
                3,
                List.of(
                    page("작은 성공의 힘",
                        "자존감은 하루아침에 바뀌지 않습니다. 매일 3가지 \"잘한 것\"을 적어보세요."),
                    page("기준 낮추기",
                        "\"밥을 챙겨 먹었다\"도 충분한 성공입니다. To-Do 대신 Done 리스트를 만들어봅시다."),
                    page("칭찬 수용하기",
                        "\"별거 아니에요\" 대신 \"감사합니다\"로 답합니다. 6개월 후 당신의 성공 컬렉션은 놀라울 것입니다.")
                )
            )
        );
    }

    private static PsychoEducationArticleResponse article(
            long id,
            String category,
            String categoryLabel,
            String title,
            String summary,
            int readMinutes,
            List<Page> pages) {
        String body = pages.isEmpty() ? "" : pages.get(0).body();
        return new PsychoEducationArticleResponse(
            id,
            title,
            summary,
            body,
            category,
            categoryLabel,
            readMinutes,
            pages
        );
    }

    private static Page page(String title, String body) {
        return new Page(title, body);
    }
}
