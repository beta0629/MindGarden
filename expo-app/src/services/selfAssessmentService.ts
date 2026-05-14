/**
 * 자가 심리검사 — **MMKV 로컬 Mock** + REST (`EXPO_NATIVE_APP_PLAN.md` §11.1·§13 Phase 3-B).
 *
 * **원장(Mock vs API)** — 표기: `WELLNESS_PHASE_3B_DATA_SOURCE.selfAssessment`:
 * - **`fetchSelfAssessments`**: `normalizeList`가 배열을 반환하면 **정렬된 서버 목록만** 반환. `catch` **또는** 성공 응답인데 `normalizeList === null`이면 **MMKV** `getAllResultsLocal()`(형식 불일치 시에도 로컬 폴백).
 * - **`fetchAssessmentDetail`**: 정규화된 단건이 있으면 서버 권위; 없거나 `catch`면 MMKV에서 id 매칭.
 * - **`submitSelfAssessmentRemote`**: `catch`면 MMKV 저장 후 로컬 결과 반환. **HTTP 성공**이나 응답 본문을 `normalizeResult`할 수 없으면 **메모리 내 `localResult`만** 반환(MMKV에 넣지 않음 — 서버 재조회 시 재시도 가능).
 * - **`updateSelfAssessmentShareRemote`**: `catch` 시 MMKV만 갱신.
 * - **표시 경계**: `normalizeResult` 등 `toDisplayString`·`toSafeNumber`(`COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`).
 * 문항 정적 데이터: `src/constants/assessmentQuestions.ts`
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { getMmkv } from '@/lib/getMmkv';
import { apiGet, apiPost, apiPut } from '@/api/client';
import { SELF_ASSESSMENT_API } from '@/api/endpoints';
import { unwrapApiResponse } from '@/api/unwrapApiResponse';
import {
  ASSESSMENT_STORAGE_KEY,
  ASSESSMENTS,
  PSS_REVERSE_ITEMS,
  type AssessmentType,
  type AssessmentInterpretation,
} from '@/constants/assessmentQuestions';
import { toDisplayString } from '@/utils/toDisplayString';
import { toSafeNumber } from '@/utils/safeDisplay';

const mmkv = getMmkv(ASSESSMENT_STORAGE_KEY);

export interface AssessmentResult {
  id: string;
  type: AssessmentType;
  answers: number[];
  totalScore: number;
  interpretation: AssessmentInterpretation;
  sharedWithConsultant: boolean;
  createdAt: string;
}

function getAllResultsLocal(): AssessmentResult[] {
  const raw = mmkv.getString('results');
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AssessmentResult[];
  } catch {
    return [];
  }
}

function saveAllResultsLocal(results: AssessmentResult[]) {
  mmkv.set('results', JSON.stringify(results));
}

function calculateScore(type: AssessmentType, answers: number[]): number {
  if (type === 'PSS') {
    return answers.reduce((sum, val, idx) => {
      const isReverse = PSS_REVERSE_ITEMS.includes(idx as 3 | 4 | 6 | 7);
      return sum + (isReverse ? 4 - val : val);
    }, 0);
  }
  return answers.reduce((sum, val) => sum + val, 0);
}

function normalizeResult(raw: unknown): AssessmentResult | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const type = toDisplayString(o.type ?? o.assessmentType, '') as AssessmentType;
  if (!ASSESSMENTS[type]) return null;
  const def = ASSESSMENTS[type];
  const answersRaw = o.answers ?? o.responses;
  const answers = Array.isArray(answersRaw) ? answersRaw.map((a) => toSafeNumber(a, 0)) : [];
  const totalScore = toSafeNumber(o.totalScore ?? o.score, calculateScore(type, answers));
  const interpretation =
    typeof o.interpretation === 'object' && o.interpretation != null
      ? (o.interpretation as AssessmentInterpretation)
      : def.interpret(totalScore);
  return {
    id: toDisplayString(o.id ?? o.resultId, `${type}_${Date.now()}`),
    type,
    answers,
    totalScore,
    interpretation,
    sharedWithConsultant: Boolean(o.sharedWithConsultant),
    createdAt: toDisplayString(o.createdAt ?? o.created_at, new Date().toISOString()),
  };
}

function normalizeList(raw: unknown): AssessmentResult[] | null {
  const body = unwrapApiResponse<unknown>(raw) ?? raw;
  if (!Array.isArray(body)) {
    if (body && typeof body === 'object') {
      const obj = body as Record<string, unknown>;
      if (Array.isArray(obj.content)) {
        return normalizeList(obj.content);
      }
    }
    return null;
  }
  const out: AssessmentResult[] = [];
  for (const row of body) {
    const r = normalizeResult(row);
    if (r) out.push(r);
  }
  return out;
}

export async function fetchSelfAssessments(): Promise<AssessmentResult[]> {
  try {
    const raw = await apiGet<unknown>(SELF_ASSESSMENT_API.GET_ALL);
    const list = normalizeList(raw);
    if (list != null) {
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  } catch {
    /* MMKV Mock: 요청 실패 시에만 */
  }
  return getAllResultsLocal().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function fetchAssessmentDetail(id: string): Promise<AssessmentResult | null> {
  try {
    const raw = await apiGet<unknown>(SELF_ASSESSMENT_API.detail(id));
    const body = unwrapApiResponse<unknown>(raw) ?? raw;
    const r = normalizeResult(body);
    if (r) return r;
    return null;
  } catch {
    /* MMKV Mock: 요청 실패 시에만 */
  }
  return getAllResultsLocal().find((x) => x.id === id) ?? null;
}

export async function submitSelfAssessmentRemote(params: {
  type: AssessmentType;
  answers: number[];
  sharedWithConsultant: boolean;
}): Promise<AssessmentResult> {
  const definition = ASSESSMENTS[params.type];
  const totalScore = calculateScore(params.type, params.answers);
  const interpretation = definition.interpret(totalScore);
  const localResult: AssessmentResult = {
    id: `${params.type}_${Date.now()}`,
    type: params.type,
    answers: params.answers,
    totalScore,
    interpretation,
    sharedWithConsultant: params.sharedWithConsultant,
    createdAt: new Date().toISOString(),
  };

  try {
    const raw = await apiPost<unknown>(SELF_ASSESSMENT_API.SUBMIT, {
      type: params.type,
      answers: params.answers,
      sharedWithConsultant: params.sharedWithConsultant,
    });
    const body = unwrapApiResponse<unknown>(raw) ?? raw;
    const r = normalizeResult(body);
    if (r) return r;
    return localResult;
  } catch {
    /* MMKV Mock: POST 실패 시에만 */
    const all = getAllResultsLocal();
    all.unshift(localResult);
    saveAllResultsLocal(all);
    return localResult;
  }
}

/**
 * 결과 공유 여부 변경 — PUT 본문만 전송 (실패 시 MMKV만 갱신)
 */
export async function updateSelfAssessmentShareRemote(
  id: string,
  sharedWithConsultant: boolean,
): Promise<void> {
  try {
    await apiPut(SELF_ASSESSMENT_API.detail(id), { sharedWithConsultant });
  } catch {
    const all = getAllResultsLocal();
    const idx = all.findIndex((x) => x.id === id);
    if (idx >= 0) {
      const prev = all[idx];
      if (!prev) return;
      const next: AssessmentResult = { ...prev, sharedWithConsultant };
      all[idx] = next;
      saveAllResultsLocal(all);
    }
  }
}
