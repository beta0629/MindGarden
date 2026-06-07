# Apple T3 — 의료/건강 콘텐츠 출처(Citation) 디자인 핸드오프

> **작성일**: 2026-06-05
> **대상 거절**: Apple App Store Submission ID `ce38fb9a-ced4-4957-b606-21618ff23518`, Guideline 1.4.1 (Safety — Physical Harm)
> **버전**: 1.0.6 / iOS build 9
> **트랙**: T3 (Medical Citations)
> **선행 문서**: `docs/project-management/APPLE_REJECTION_PLAN_A_ORCHESTRATION_2026_06_04.md` §7 T3
> **작성자**: 메인 어시스턴트 (core-designer 사용량 소진으로 대체 작성)

## 1. 사유 요약

Apple 1.4.1 — 의료·건강 정보가 있는 앱은 **출처 인용** (citations) 을 제공해야 한다. 마인드가든은 다음 화면에 의학적 가이드·자가검사·AI 분석을 노출하는데, **모두 면책 안내만 있고 원전 출처가 없다**.

| 화면 | 위치 | 출처 상태 |
|---|---|---|
| 심리 교육 (15편) | `(client)/(wellness)/psycho-education/*`, `PsychoEducation.js:42-58` | ❌ 없음 |
| 명상 가이드 | `meditation/*`, `MeditationGuide.js:30-41` | ❌ 없음 |
| 마음 날씨 (AI) | `mind-weather/index.tsx:268-278` | ❌ 모델·근거 없음 |
| 자가 점검 PHQ-9/GAD-7/PSS | `self-assessment/*` | ❌ 원 척도 인용 없음 |
| 오늘의 힐링 (HealingCard) | `HealingCard.js:134-180` | ❌ 출처·AI 표시 없음 |

LLM 가드(`PsychAiServiceImpl.java:76-84` `FORBIDDEN_PATTERNS`) 와 면책 카피(`wellnessComplianceCopy.ts`) 는 우수. **부족한 부분은 "원전 인용·출처·AI 생성 사실 명시" 만**.

## 2. 결정 사항 (요약)

| 항목 | 결정 |
|---|---|
| 출처 4필드 | `source_label`, `source_url`, `source_author`, `source_published_year` |
| 다중 출처 | 배열로 저장, 카드 단위로 추가/삭제 |
| AI 콘텐츠 표시 | "AI 생성" 배지 + 모델·방법론 링크 |
| 자가검사 원전 | PHQ-9 (Kroenke 2001 / Pfizer), GAD-7 (Spitzer 2006), PSS (Cohen 1983) — 코드 상수 |
| 어드민 폼 | 콘텐츠별 출처 입력 카드 (동적 추가/삭제) |
| 시드 데이터 | 폴백 `psychoEducationData.ts` 등에도 source 필드 추가 |

## 3. 출처 섹션 디자인 (공통)

### 3.1 표시 위치

콘텐츠 카드/상세 화면 **하단** 에 별도 섹션으로 배치. 본문과 시각적으로 구분.

### 3.2 단일 출처 표시

```
┌─────────────────────────────────────┐
│  (콘텐츠 본문)                       │
│                                      │
│  ⓘ 본 콘텐츠는 의학적 진단이 아닙니다.│
│    심각한 증상은 전문가와 상담하세요.│
└─────────────────────────────────────┘

──── 출처 ────
📚  WHO Mental Health Action Plan 2013-2030
✍️  World Health Organization, 2021
🔗  apps.who.int/iris/handle/10665/345301  ↗
```

- 라벨: 회색 톤 ("출처" 또는 "Source")
- 아이콘은 Ionicons (`book-outline`, `person-outline`, `link-outline`)
- 외부 링크: 인앱 브라우저 (Linking) 또는 expo-web-browser

### 3.3 다중 출처 (2개 이상)

```
──── 출처 ────
1. 📚  PHQ-9: Validity of a Brief Depression Severity Measure
   ✍️  Kroenke K, Spitzer RL, Williams JBW, 2001
   🔗  doi.org/10.1046/j.1525-1497.2001.016009606.x  ↗

2. 📚  APA Clinical Practice Guideline for Depression
   ✍️  American Psychological Association, 2019
   🔗  apa.org/depression-guideline  ↗
```

- 각 출처 사이 간격 12pt
- 번호 매김 (콘텐츠가 길어질 때 가독성)

### 3.4 디자인 토큰

| 토큰 | 값 | 용도 |
|---|---|---|
| 컨테이너 배경 | `--color-neutral-50` (`#F9FAFB`) | 출처 섹션 배경 |
| 컨테이너 패딩 | 16pt | |
| 컨테이너 모서리 | 8pt | |
| 라벨 텍스트 | `--color-text-secondary` (`#6B7280`) 12pt | "출처" 레이블 |
| 본문 텍스트 | `--color-text-primary` (`#111827`) 13~14pt | |
| 외부 링크 | `--color-link` (`#2563EB`) 13pt | 밑줄 + ↗ 아이콘 |
| 다크 테마 | 자동 추종 | |

## 4. 자가검사 결과 표준 인용 (PHQ-9 / GAD-7 / PSS)

### 4.1 위치

`expo-app/app/(client)/(wellness)/self-assessment/result/[id].tsx` 의 `WELLNESS_ASSESSMENT_REFERENCE_FOOTER_KO` 면책 뒤에 **「원저작자 정보」** 섹션 추가.

### 4.2 PHQ-9 (우울증)

```
원저작자 정보

PHQ-9 (Patient Health Questionnaire-9)
✍️  Kroenke K, Spitzer RL, Williams JBW
📅  2001
📚  Journal of General Internal Medicine, 16(9), 606-613
🔗  doi.org/10.1046/j.1525-1497.2001.016009606.x  ↗

ⓘ  본 척도는 Pfizer 의 라이선스 하에 의료·연구 목적
   으로 무료로 사용 가능합니다.
```

### 4.3 GAD-7 (불안장애)

```
GAD-7 (Generalized Anxiety Disorder-7)
✍️  Spitzer RL, Kroenke K, Williams JBW, Löwe B
📅  2006
📚  Archives of Internal Medicine, 166(10), 1092-1097
🔗  doi.org/10.1001/archinte.166.10.1092  ↗
```

### 4.4 PSS (스트레스)

```
PSS (Perceived Stress Scale)
✍️  Cohen S, Kamarck T, Mermelstein R
📅  1983
📚  Journal of Health and Social Behavior, 24(4), 385-396
🔗  doi.org/10.2307/2136404  ↗
```

### 4.5 코드 상수화

`expo-app/src/constants/assessmentCitations.ts` (신규):

```typescript
export const ASSESSMENT_CITATIONS = {
  PHQ9: {
    title: 'PHQ-9 (Patient Health Questionnaire-9)',
    authors: 'Kroenke K, Spitzer RL, Williams JBW',
    year: 2001,
    journal: 'Journal of General Internal Medicine, 16(9), 606-613',
    doi: '10.1046/j.1525-1497.2001.016009606.x',
    url: 'https://doi.org/10.1046/j.1525-1497.2001.016009606.x',
    license: 'Pfizer 라이선스 하에 의료·연구 목적 무료 사용 가능',
  },
  GAD7: { /* ... */ },
  PSS: { /* ... */ },
} as const;
```

## 5. 마음 날씨 「AI 생성·진단 아님」 배너

### 5.1 결과 화면 상단 배너

```
┌─────────────────────────────────────┐
│  ⚠️  AI 생성·의학적 진단 아님         │
│                                      │
│  이 결과는 AI 가 생성한 분석이며      │
│  의학적 진단이 아닙니다. 자세한 진단  │
│  은 정신건강 전문가와 상담하세요.     │
│                                      │
│  [분석 방식 자세히 보기 →]           │
└─────────────────────────────────────┘
```

- 배경: 노랑 톤 (`--color-warning-50`)
- 아이콘: `warning-outline`
- 항상 결과 화면 진입 시 노출 (스크롤 시 sticky 가능)

### 5.2 「분석 방식 자세히 보기」 모달/화면

`(client)/(wellness)/mind-weather/methodology.tsx` (신규):

```
┌─────────────────────────────────────┐
│  마음 날씨 분석 방식                 │
├─────────────────────────────────────┤
│  ▸ 사용 모델                        │
│    OpenAI GPT-4o                    │
│                                      │
│  ▸ 입력 데이터                      │
│    • 회원이 직접 작성한 감정 일기    │
│    • 자가검사 결과 (PHQ-9 등)        │
│    • 최근 14일 이내 기록             │
│                                      │
│  ▸ 출력 한계                        │
│    • 개인화된 진단이 아닙니다.       │
│    • 시점·기분에 따라 결과가 다를 수 │
│      있습니다.                       │
│    • 약물·치료를 대체하지 않습니다.  │
│                                      │
│  ▸ 가이드라인 출처                  │
│    📚  WHO mhGAP Intervention Guide │
│    🔗  who.int/mhgap  ↗             │
│                                      │
│    📚  APA Clinical Practice        │
│       Guidelines                     │
│    🔗  apa.org/practice/guidelines ↗│
└─────────────────────────────────────┘
```

## 6. HealingCard (오늘의 힐링) 출처+AI 표시

### 6.1 카드 디자인 변경

`frontend/src/components/common/HealingCard.js:134-180` 의 `dangerouslySetInnerHTML` 영역에:

```
┌─────────────────────────────────────┐
│  🤖  AI 생성              [출처 ↗]  │  ← 상단 메타 라인
│  ──────────────────────────────────  │
│                                      │
│  (콘텐츠 본문)                       │
│                                      │
│  ──────────────────────────────────  │
│  ⓘ 의학적 진단이 아닙니다.           │
└─────────────────────────────────────┘
```

- "AI 생성" 배지: 작은 텍스트 + 로봇 아이콘
- 출처가 있으면 우상단 "출처" 링크 표시
- 출처가 없으면 "AI 생성" 배지만 표시

### 6.2 모바일 (Expo) 동등 적용

`expo-app/src/components/molecules/HealingCard.tsx` (또는 동등 컴포넌트) 에도 동일 메타 라인 추가.

## 7. 어드민 콘텐츠 입력 폼 (출처 4필드)

### 7.1 위치

`frontend/src/components/admin/AdminContentMasterPage.js:76-98, 181-238, 623-886` 의 psycho/healing 입력 폼.

### 7.2 출처 입력 카드 (동적 추가/삭제)

```
┌──────────────────────────────────────────────┐
│  출처 정보                          [+ 출처] │
├──────────────────────────────────────────────┤
│  출처 #1                                [✕]  │
│                                               │
│  📚 출처 제목 / 자료명 *                      │
│  [WHO Mental Health Action Plan 2013-2030  ] │
│                                               │
│  🔗 외부 링크 (URL)                          │
│  [https://apps.who.int/iris/...           ]  │
│                                               │
│  ✍️ 저자 / 기관                              │
│  [World Health Organization               ]  │
│                                               │
│  📅 발행 연도                                │
│  [2021]                                       │
│                                               │
├──────────────────────────────────────────────┤
│  출처 #2                                [✕]  │
│  ...                                          │
└──────────────────────────────────────────────┘

ⓘ 출처를 입력하지 않으면 사용자 화면에 면책만 표시되고
   원전 인용은 노출되지 않습니다.
```

### 7.3 유효성 검사

| 필드 | 규칙 |
|---|---|
| `source_label` | 필수, 최대 200자 |
| `source_url` | 선택, URL 형식 (https://...), 최대 500자 |
| `source_author` | 선택, 최대 100자 |
| `source_published_year` | 선택, 1900 ~ 현재 연도 |

### 7.4 저장 모델 (배열)

```json
{
  "title": "우울증 이해하기",
  "content": "...",
  "sources": [
    {
      "label": "PHQ-9: Validity of a Brief Depression Severity Measure",
      "url": "https://doi.org/10.1046/...",
      "author": "Kroenke K, Spitzer RL, Williams JBW",
      "publishedYear": 2001
    },
    { /* ... */ }
  ]
}
```

## 8. 백엔드 변경 (Coder 작업)

### 8.1 엔티티 출처 4필드 추가

| 엔티티 | 추가 필드 |
|---|---|
| `PsychoEducationArticle` | `sources JSON` (배열) |
| `HealingContentCatalogItem` | `sources JSON` |
| `DailyHealingContent` | `sources JSON` |
| `SelfAssessmentTemplate` | `sources JSON` (또는 코드 상수 직참조) |

> JSON 컬럼으로 단순화. 정규화는 차후.

### 8.2 마이그레이션

`V20260605_xxx__add_content_sources.sql`:
```sql
ALTER TABLE psycho_education_articles ADD COLUMN sources JSON NULL;
ALTER TABLE healing_content_catalog ADD COLUMN sources JSON NULL;
ALTER TABLE daily_healing_contents ADD COLUMN sources JSON NULL;
```

### 8.3 DTO 확장

| DTO | 추가 |
|---|---|
| `PsychoEducationArticleUpsertRequest` | `sources: List<SourceCitation>` |
| `PsychoEducationArticleResponse` | `sources` 노출 |
| `HealingContentCatalogUpsertRequest` | `sources` |
| `HealingContentCatalogResponse` | `sources` |
| 어드민 응답 DTO 2종 | `sources` |

`SourceCitation` 공용 DTO:
```java
public record SourceCitation(
    String label,        // 필수
    String url,          // 선택
    String author,       // 선택
    Integer publishedYear  // 선택
) {}
```

## 9. 시드 데이터 (폴백)

`expo-app/src/constants/psychoEducationData.ts`, `meditationData.ts`, `assessmentQuestions.ts` 의 폴백 데이터에도 `sources` 필드 채우기:

```typescript
{
  id: 'depression-cbt',
  title: '인지행동치료(CBT) 이해하기',
  content: '...',
  sources: [
    {
      label: 'APA Clinical Practice Guideline for the Treatment of Depression',
      url: 'https://www.apa.org/depression-guideline',
      author: 'American Psychological Association',
      publishedYear: 2019,
    },
  ],
}
```

### 9.1 권장 표준 출처 매핑

| 콘텐츠 주제 | 권장 출처 |
|---|---|
| 호흡법·이완 | WHO Stress management; APA relaxation guidelines |
| CBT | APA Clinical Practice Guideline for Depression (2019) |
| 마음챙김·명상 | Mindful.org; APA mindfulness review (Davis & Hayes 2011) |
| NVC (비폭력대화) | Marshall Rosenberg, "Nonviolent Communication" (PuddleDancer Press, 2015) |
| 그라운딩 | DBT Skills Training Manual (Linehan, 2014) |
| 우울증 일반 | NIMH Depression Fact Sheet; WHO mhGAP |
| 불안장애 일반 | NIMH Anxiety Fact Sheet |

## 10. 진단성 카피 검토 (선택)

사용자 노출 화면은 안전 (`wellnessComplianceCopy.ts` 우수). 단, 마케팅 카피 강화 권장:

- `frontend/src/components/landing/CounselingAbout.js:16-28` "증거 기반 치료법" → 근거 링크 추가 권장 (선택, T3 필수 아님)

## 11. ASC 메타 변경

| 항목 | 변경 |
|---|---|
| Description (영문) | "All medical/health content includes citations to peer-reviewed sources" 추가 |
| App Review 답신 | T3 핵심: "All wellness content (psycho-education, meditation, self-assessment, AI mind-weather) now includes inline citations to original sources (WHO, APA, peer-reviewed journals). Self-assessment results display original scale citations (Kroenke 2001, Spitzer 2006, Cohen 1983). AI-generated content is explicitly labeled and links to methodology page." |

## 12. 디자인 토큰 정리

(중복 방지 — 위 §3.4 참조)

추가 토큰:
| 토큰 | 값 | 용도 |
|---|---|---|
| AI 배지 | `--color-info-100` (`#DBEAFE`) | "AI 생성" 라벨 배경 |
| AI 배지 텍스트 | `--color-info-700` (`#1D4ED8`) | |
| 외부 링크 아이콘 | `↗` (Unicode) 또는 `open-outline` | |

## 13. iOS·Android·웹 적용 범위

| 항목 | iOS | Android | 웹 |
|---|---|---|---|
| 콘텐츠 출처 표시 | ✅ | ✅ | ✅ |
| 자가검사 원전 인용 | ✅ | ✅ | ✅ |
| 마음 날씨 AI 배너 | ✅ | ✅ | ✅ |
| HealingCard AI 표시 | ✅ | ✅ | ✅ |
| 어드민 출처 입력 | — | — | ✅ |

## 14. 완료 정의 (DoD)

- [ ] 모든 wellness 카드/상세 하단에 출처 섹션 노출 (출처 있을 때)
- [ ] 자가검사 결과 PHQ-9/GAD-7/PSS 원저작 인용 표시
- [ ] 마음 날씨 AI 배너 + 분석 방식 화면 노출
- [ ] HealingCard "AI 생성" 배지 + 출처 링크 (있을 때)
- [ ] 어드민 폼에 출처 4필드 (다중 추가/삭제) 동작
- [ ] 백엔드 엔티티/DTO/마이그레이션 적용
- [ ] 폴백 시드 데이터에 sources 채움
- [ ] App Review 답신에 T3 대응 명시

## 15. 다음 단계

```
@core-coder Apple T3 의료 출처 구현. 핸드오프 문서: docs/project-management/2026-06-04/APPLE_T3_CITATION_DESIGN_HANDOFF.md

수정 대상:
- expo-app/src/constants/assessmentCitations.ts (신규)
- expo-app/src/constants/psychoEducationData.ts, meditationData.ts (sources 추가)
- expo-app/app/(client)/(wellness)/psycho-education/[id].tsx (출처 섹션)
- expo-app/app/(client)/(wellness)/meditation/[id].tsx (출처 섹션)
- expo-app/app/(client)/(wellness)/mind-weather/index.tsx (AI 배너)
- expo-app/app/(client)/(wellness)/mind-weather/methodology.tsx (신규)
- expo-app/app/(client)/(wellness)/self-assessment/result/[id].tsx (원전 인용)
- expo-app/src/components/molecules/CitationBlock.tsx (신규 공용 컴포넌트)
- frontend/src/components/common/HealingCard.js (AI 배지 + 출처)
- frontend/src/components/admin/AdminContentMasterPage.js (출처 입력 카드)
- src/main/java/.../entity/PsychoEducationArticle.java, HealingContentCatalogItem.java, DailyHealingContent.java (sources JSON)
- src/main/java/.../dto/SourceCitation.java (신규 record)
- src/main/java/.../dto/*UpsertRequest, *Response (sources 추가)
- src/main/resources/db/migration/V20260605_xxx__add_content_sources.sql

완료 조건: §14 DoD 모두 체크 후 core-tester 검증.
```
