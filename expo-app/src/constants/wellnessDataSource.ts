/**
 * Phase 3 웰니스 데이터 소스 — `EXPO_NATIVE_APP_PLAN.md` §11.1 **API** 행·§13 카탈로그와 정합하는 **표기·동작 원장(SSOT)**.
 *
 * - **§11.1 API**: 기획서 게이트 표의 「샘플/플레이스홀더 vs 백엔드 연동」을 아래 키별 문자열로 고정한다.
 * - **카탈로그(명상·심리교육)**: HTTP 계층이 성공해도 본문이 비어 있거나 정규화에 실패하면 **번들 Mock 목록**으로 폴백한다(MMKV 아님). 상세 분기는 각 `*Catalog*Service.ts`·`*Service.ts` 파일머리 주석.
 * - **Phase 3-B(감정 일기·자가검사)**: **API 성공 시 서버 본문만** 사용하고, **요청 실패(catch)** 시에만 **MMKV** Mock을 쓴다(일부 읽기 API는 성공이나 형식 불일치 시 빈 값·로컬 재계산 — 해당 서비스 원장 참조).
 * - **표시 경계**: API 필드는 JSX에 직접 넣지 않고, 서비스·매퍼에서 `toDisplayString`·`toSafeNumber`로 스칼라화한다(`COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`).
 * 테넌트·Bearer는 `src/api/client.ts` 인터셉터가 일괄 삽입한다.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { ASSESSMENT_STORAGE_KEY } from '@/constants/assessmentQuestions';
import { MOOD_STORAGE_KEY } from '@/constants/moodConstants';

/** §11.1·§13 표에 그대로 적을 수 있는 식별 라벨 */
export const WELLNESS_PHASE_3B_DATA_SOURCE = {
  moodJournal: {
    api: 'REST /api/v1/mood-journals, /mood-journals/{date}, /mood-journals/stats',
    mockFallback: `MMKV instance id="${MOOD_STORAGE_KEY}" (클라이언트 Mock·요청 실패 시만; 성공 응답은 서버 권위)`,
  },
  selfAssessment: {
    api: 'REST /api/v1/self-assessments, /self-assessments/{id}',
    mockFallback: `MMKV instance id="${ASSESSMENT_STORAGE_KEY}" (클라이언트 Mock·요청 실패 시만; 성공 응답은 서버 권위)`,
  },
  /** §13 Phase 3-C — 목록 카탈로그; 폴백은 번들 `MOCK_MEDITATION_TRACKS` + 데모 오디오 URI 규칙 */
  meditationCatalog: {
    api: 'GET /api/v1/meditations (`meditationCatalogService`)',
    mockFallback:
      '번들 `MOCK_MEDITATION_TRACKS` + `EXPO_PUBLIC_MEDITATION_DEMO_STREAM_URL` 또는 `demo-silence.wav`(트랙별 스트림 없을 때); GET 예외·정규화 후 빈 목록',
  },
  /** §13 Phase 3-C — 목록 카탈로그; 폴백은 번들 `MOCK_PSYCHO_ARTICLES` */
  psychoEducationCatalog: {
    api: 'GET /api/v1/psycho-education (`psychoEducationService`)',
    mockFallback: '번들 `MOCK_PSYCHO_ARTICLES`; GET 예외·파싱 실패·빈 배열 응답',
  },
} as const;
