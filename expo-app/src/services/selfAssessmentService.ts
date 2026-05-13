/**
 * 자가 심리검사 — API 우선, 실패 시 MMKV Mock 레이어
 *
 * SSOT: `docs/project-management/EXPO_NATIVE_APP_PLAN.md` Phase 3-B·§13
 * - `/api/v1/self-assessments` (검사 실시·결과 저장·이력)
 * 문항 정적 데이터: `src/constants/assessmentQuestions.ts` 유지
 *
 * @author MindGarden
 * @since 2026-05-13
 */
import { createMMKV } from 'react-native-mmkv';
import { apiGet, apiPost } from '@/api/client';
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

const mmkv = createMMKV({ id: ASSESSMENT_STORAGE_KEY });

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
  const answers = Array.isArray(answersRaw)
    ? answersRaw.map((a) => toSafeNumber(a, 0))
    : [];
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
      return list.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
  } catch {
    /* Mock 레이어 */
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
  } catch {
    /* 로컬 */
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
    const all = getAllResultsLocal();
    all.unshift(localResult);
    saveAllResultsLocal(all);
    return localResult;
  }
}
