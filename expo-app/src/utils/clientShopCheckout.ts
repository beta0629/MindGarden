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
  consultantDisplayName: string;
  label?: string | null;
  /** 반환 목록 중 유일하게 배정된 매핑일 때만 true */
  preselected?: boolean;
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
 * 초기 selectedMappingId (문자열). 0건 → ''; 1건 → 그 id; unique preselected → 그 id; 그 외 → ''.
 *
 * @param mappings 상담 매핑 옵션
 */
export function resolveInitialMappingId(
  mappings: ReadonlyArray<ShopConsultantMappingOption> | null | undefined,
): string {
  const list = mappings ?? [];
  if (list.length === 0) {
    return '';
  }
  if (list.length === 1) {
    const only = list[0];
    return only?.mappingId != null ? String(only.mappingId) : '';
  }
  const unique = findUniquePreselectedMapping(list);
  if (unique?.mappingId != null) {
    return String(unique.mappingId);
  }
  return '';
}

/**
 * 상담사 선택 피커를 보여줄지 여부.
 * length&lt;2 → false; length≥2 이고 unique preselected 있으면 false; 그 외 true.
 *
 * @param mappings 상담 매핑 옵션
 */
export function shouldShowConsultantMappingPicker(
  mappings: ReadonlyArray<ShopConsultantMappingOption> | null | undefined,
): boolean {
  const list = mappings ?? [];
  if (list.length < 2) {
    return false;
  }
  return findUniquePreselectedMapping(list) == null;
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
    result.push({
      mappingId,
      consultantDisplayName: String(item.consultantDisplayName ?? ''),
      label: item.label != null ? String(item.label) : undefined,
      preselected: item.preselected === true,
    });
  }
  return result;
}

/**
 * @param hasConsultationInCart 상담 SKU 포함 여부
 * @param mappingsCount 활성 매핑 건수
 * @param selectedMappingId 선택된 mappingId 문자열
 */
export function validateCheckoutMapping(
  hasConsultationInCart: boolean,
  mappingsCount: number,
  selectedMappingId: string,
): string {
  if (!hasConsultationInCart) {
    return '';
  }
  if (mappingsCount === 0) {
    return SHOP_CHECKOUT_MAPPING_COPY.NO_MAPPING;
  }
  if (mappingsCount > 1 && !selectedMappingId) {
    return SHOP_CHECKOUT_MAPPING_COPY.REQUIRED;
  }
  return '';
}

/**
 * @param mapping 상담 매핑 옵션
 */
export function formatConsultantMappingLabel(mapping: ShopConsultantMappingOption): string {
  const suffix = mapping.label ? ` — ${mapping.label}` : '';
  return `${mapping.consultantDisplayName}${suffix}`;
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
