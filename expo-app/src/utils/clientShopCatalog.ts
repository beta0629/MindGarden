/**
 * 내담자 쇼핑 카탈로그 API 행 정규화 (웹 clientShopService.mapCatalogRow 패리티)
 *
 * @author MindGarden
 * @since 2026-05-19
 */
import type { ShopCatalogSku } from '@/api/hooks/useClientShopCatalog';
import {
  normalizeShopCatalogCategory,
  type ShopCatalogCategory,
} from '@/constants/clientShopConstants';
import { resolveProfileImageUrlForNative } from '@/utils/displayString';
import { toDisplayString } from '@/utils/toDisplayString';

type CatalogRowInput = Record<string, unknown>;

/**
 * @param row API 카탈로그 행
 */
export function normalizeCatalogSku(row: CatalogRowInput | null | undefined): ShopCatalogSku | null {
  if (!row || typeof row !== 'object') {
    return null;
  }

  const skuCode = toDisplayString(row.skuCode, '').trim();
  if (!skuCode) {
    return null;
  }

  const thumbnailRaw = toDisplayString(row.thumbnailUrl ?? row.heroImageUrl, '').trim();
  const resolvedThumbnail = thumbnailRaw
    ? resolveProfileImageUrlForNative(thumbnailRaw)
    : undefined;

  const unitPriceMinor = Number(row.unitPriceMinor);
  const currency = toDisplayString(row.currency, 'KRW').trim() || 'KRW';
  const descriptionText = toDisplayString(row.descriptionText, '').trim();

  return {
    skuCode,
    title: toDisplayString(row.title, '상품'),
    descriptionText: descriptionText || undefined,
    unitPriceMinor: Number.isFinite(unitPriceMinor) ? unitPriceMinor : 0,
    currency,
    catalogCategory: normalizeShopCatalogCategory(
      row.catalogCategory as string | undefined,
    ) as ShopCatalogCategory,
    thumbnailUrl: resolvedThumbnail ?? null,
  };
}

/**
 * @param rows API 카탈로그 배열
 */
export function normalizeShopCatalogList(
  rows: unknown,
): ShopCatalogSku[] {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row) => normalizeCatalogSku(row as CatalogRowInput))
    .filter((row): row is ShopCatalogSku => row != null);
}
