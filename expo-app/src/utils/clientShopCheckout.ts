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
