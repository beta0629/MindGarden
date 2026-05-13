/**
 * Phase 3-B 웰니스 데이터 소스 — `EXPO_NATIVE_APP_PLAN.md` §11.1·§13 연동 표기용
 *
 * 실제 폴백 분기: 각 `*Service.ts`에서 **HTTP 성공 시 서버 본문만 사용**,
 * **Axios 거부(네트워크·4xx/5xx·래퍼 success:false 등)** 시에만 MMKV Mock 사용.
 * 테넌트·Bearer는 `src/api/client.ts` 인터셉터가 일괄 삽입한다.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { ASSESSMENT_STORAGE_KEY } from '@/constants/assessmentQuestions';
import { MOOD_STORAGE_KEY } from '@/constants/moodConstants';

/** §11.1 표에 그대로 적을 수 있는 식별 라벨 */
export const WELLNESS_PHASE_3B_DATA_SOURCE = {
  moodJournal: {
    api: 'REST /api/v1/mood-journals, /mood-journals/{date}, /mood-journals/stats',
    mockFallback: `MMKV instance id="${MOOD_STORAGE_KEY}" (클라이언트 Mock·API 실패 시만)`,
  },
  selfAssessment: {
    api: 'REST /api/v1/self-assessments, /self-assessments/{id}',
    mockFallback: `MMKV instance id="${ASSESSMENT_STORAGE_KEY}" (클라이언트 Mock·API 실패 시만)`,
  },
} as const;
