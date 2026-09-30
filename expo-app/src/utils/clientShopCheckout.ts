/**
 * 내담자 쇼핑 체크아웃 유틸 — 상담 매핑·CONSULTATION 장바구니 판별
 *
 * @author MindGarden
 * @since 2026-05-20
 */
import {
  SHOP_CATALOG_CATEGORY,
  SHOP_CHECKOUT_MAPPING_COPY,
} from '@/constants/clientShopConstants';

export interface ShopConsultantMappingOption {
  mappingId: number;
  consultantId?: number;
  consultantDisplayName: string;
  label?: string | null;
  /** 자동 바인딩 대표 매핑일 때 true (목록당 최대 1건) */
  preselected?: boolean;
}

/**
 * @param cartLines 장바구니 라인
 * @param catalog 카탈로그 SKU 목록
 */
export function collectCartConsultationTitles(
  cartLines: ReadonlyArray<{ skuCode?: string; title?: string }> | null | undefined,
  catalog: ReadonlyArray<{ skuCode?: string; catalogCategory?: string }> | null | undefined,
): string[] {
  const consultationCodes = new Set(
    (catalog ?? [])
      .filter((row) => row.catalogCategory === SHOP_CATALOG_CATEGORY.CONSULTATION)
      .map((row) => row.skuCode)
      .filter((code): code is string => Boolean(code)),
  );
  const titles: string[] = [];
  for (const line of cartLines ?? []) {
    if (!line.skuCode || !consultationCodes.has(line.skuCode)) {
      continue;
    }
    const title = line.title != null ? String(line.title).trim() : '';
    if (title) {
      titles.push(title);
    }
  }
  return titles;
}

/**
 * @param row 상담 매핑 옵션
 */
export function distinctConsultantKey(row: ShopConsultantMappingOption | null | undefined): string {
  if (!row) {
    return '';
  }
  if (row.consultantId != null && Number.isFinite(row.consultantId)) {
    return String(row.consultantId);
  }
  const name = row.consultantDisplayName?.trim() ?? '';
  if (name) {
    return `name:${name}`;
  }
  return `m:${row.mappingId}`;
}

/**
 * @param mappings 상담 매핑 옵션
 */
export function countDistinctConsultants(
  mappings: ReadonlyArray<ShopConsultantMappingOption> | null | undefined,
): number {
  const keys = new Set<string>();
  for (const row of mappings ?? []) {
    const key = distinctConsultantKey(row);
    if (key) {
      keys.add(key);
    }
  }
  return keys.size;
}

function packageTitleMatchScore(row: ShopConsultantMappingOption, cartTitles: readonly string[]): number {
  const label = row.label?.trim() ?? '';
  if (!label || cartTitles.length === 0) {
    return 0;
  }
  const pkgLower = label.toLowerCase();
  for (const raw of cartTitles) {
    const title = raw.trim();
    if (!title) {
      continue;
    }
    if (label.localeCompare(title, undefined, { sensitivity: 'accent' }) === 0) {
      return 3;
    }
    const titleLower = title.toLowerCase();
    if (pkgLower.includes(titleLower) || titleLower.includes(pkgLower)) {
      return 2;
    }
  }
  return 0;
}

/**
 * @param forConsultant 동일 상담사 매핑 묶음
 * @param cartTitles 장바구니 CONSULTATION 제목
 */
export function resolveBestMappingRowForConsultant(
  forConsultant: ReadonlyArray<ShopConsultantMappingOption>,
  cartTitles: readonly string[] = [],
): ShopConsultantMappingOption | null {
  const list = forConsultant.filter(Boolean);
  if (list.length === 0) {
    return null;
  }
  let best = list[0] ?? null;
  let bestScore = -1;
  for (const row of list) {
    const score = packageTitleMatchScore(row, cartTitles);
    const combined = score * 10 + (row.preselected === true ? 1 : 0);
    if (combined > bestScore) {
      bestScore = combined;
      best = row;
    } else if (combined === bestScore && best && row.mappingId > best.mappingId) {
      best = row;
    }
  }
  return best;
}

export interface ConsultantPickerOption {
  value: string;
  label: string;
}

/**
 * @param mappings 상담 매핑 옵션
 * @param cartTitles 장바구니 CONSULTATION 제목
 */
export function buildConsultantPickerOptions(
  mappings: ReadonlyArray<ShopConsultantMappingOption> | null | undefined,
  cartTitles: readonly string[] = [],
): ConsultantPickerOption[] {
  const byKey = new Map<string, ShopConsultantMappingOption[]>();
  for (const row of mappings ?? []) {
    const key = distinctConsultantKey(row);
    if (!key) {
      continue;
    }
    const bucket = byKey.get(key) ?? [];
    bucket.push(row);
    byKey.set(key, bucket);
  }
  const options: ConsultantPickerOption[] = [];
  for (const bucket of byKey.values()) {
    const best = resolveBestMappingRowForConsultant(bucket, cartTitles);
    if (!best) {
      continue;
    }
    options.push({
      value: String(best.mappingId),
      label: best.consultantDisplayName,
    });
  }
  return options;
}

/**
 * eligible 목록에서 preselected===true 가 정확히 1건이면 그 옵션, 아니면 null.
 *
 * @param mappings 상담 매핑 옵션
 */
export function findUniquePreselectedMapping(
  mappings: ReadonlyArray<ShopConsultantMappingOption> | null | undefined,
): ShopConsultantMappingOption | null {
  const list = mappings ?? [];
  const preselected = list.filter((row) => row?.preselected === true);
  if (preselected.length === 1) {
    return preselected[0] ?? null;
  }
  return null;
}

/**
 * 초기 selectedMappingId (문자열).
 *
 * @param mappings 상담 매핑 옵션
 * @param cartTitles 장바구니 CONSULTATION 제목
 */
export function resolveInitialMappingId(
  mappings: ReadonlyArray<ShopConsultantMappingOption> | null | undefined,
  cartTitles: readonly string[] = [],
): string {
  const list = mappings ?? [];
  if (list.length === 0) {
    return '';
  }
  const distinct = countDistinctConsultants(list);
  if (distinct === 1) {
    const key = distinctConsultantKey(list[0]);
    const bucket = list.filter((row) => distinctConsultantKey(row) === key);
    const best = resolveBestMappingRowForConsultant(bucket, cartTitles);
    return best?.mappingId != null ? String(best.mappingId) : '';
  }
  if (distinct >= 2) {
    return '';
  }
  const unique = findUniquePreselectedMapping(list);
  if (unique?.mappingId != null) {
    return String(unique.mappingId);
  }
  return '';
}

/**
 * 상담사 선택 피커를 보여줄지 여부.
 *
 * @param mappings 상담 매핑 옵션
 */
export function shouldShowConsultantMappingPicker(
  mappings: ReadonlyArray<ShopConsultantMappingOption> | null | undefined,
): boolean {
  return countDistinctConsultants(mappings) >= 2;
}

/**
 * @param cartLines 장바구니 라인
 * @param catalog 카탈로그 SKU 목록
 */
export function cartHasConsultationSku(
  cartLines: ReadonlyArray<{ skuCode?: string }> | null | undefined,
  catalog: ReadonlyArray<{ skuCode?: string; catalogCategory?: string }> | null | undefined,
): boolean {
  const consultationCodes = new Set(
    (catalog ?? [])
      .filter((row) => row.catalogCategory === SHOP_CATALOG_CATEGORY.CONSULTATION)
      .map((row) => row.skuCode)
      .filter((code): code is string => Boolean(code)),
  );
  return (cartLines ?? []).some((line) => line.skuCode && consultationCodes.has(line.skuCode));
}

/**
 * @param raw API 응답(unwrap 전·후 배열)
 */
export function parseConsultantMappingsResponse(raw: unknown): ShopConsultantMappingOption[] {
  const list = Array.isArray(raw) ? raw : [];
  const result: ShopConsultantMappingOption[] = [];
  for (const row of list) {
    if (!row || typeof row !== 'object') {
      continue;
    }
    const item = row as Record<string, unknown>;
    const mappingId = Number(item.mappingId);
    if (!Number.isFinite(mappingId)) {
      continue;
    }
    const consultantIdRaw = item.consultantId;
    const consultantId =
      consultantIdRaw != null && Number.isFinite(Number(consultantIdRaw))
        ? Number(consultantIdRaw)
        : undefined;
    result.push({
      mappingId,
      consultantId,
      consultantDisplayName: String(item.consultantDisplayName ?? ''),
      label: item.label != null ? String(item.label) : undefined,
      preselected: item.preselected === true,
    });
  }
  return result;
}

/**
 * @param hasConsultationInCart 상담 SKU 포함 여부
 * @param mappings 활성 매핑 목록
 * @param selectedMappingId 선택된 mappingId 문자열
 */
export function validateCheckoutMapping(
  hasConsultationInCart: boolean,
  mappings: ReadonlyArray<ShopConsultantMappingOption> | null | undefined,
  selectedMappingId: string,
): string {
  if (!hasConsultationInCart) {
    return '';
  }
  const list = mappings ?? [];
  if (list.length === 0) {
    return SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING;
  }
  if (shouldShowConsultantMappingPicker(list) && !selectedMappingId) {
    return SHOP_CHECKOUT_MAPPING_COPY.REQUIRED;
  }
  return '';
}

/**
 * 피커 옵션 라벨 — 상담사 이름만 (패키지 라벨 제외).
 *
 * @param mapping 상담 매핑 옵션
 */
export function formatConsultantMappingLabel(mapping: ShopConsultantMappingOption): string {
  return mapping.consultantDisplayName;
}

/**
 * @param hasConsultationInCart 상담 SKU 포함 여부
 * @param selectedMappingId 선택된 mappingId 문자열
 */
export function resolveMappingIdForCheckout(
  hasConsultationInCart: boolean,
  selectedMappingId: string,
): number | null {
  if (!hasConsultationInCart || !selectedMappingId) {
    return null;
  }
  const parsed = Number(selectedMappingId);
  return Number.isFinite(parsed) ? parsed : null;
}
