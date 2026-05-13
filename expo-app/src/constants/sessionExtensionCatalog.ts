import Constants from 'expo-constants';

/**
 * 회기 연장(추가 패키지) SKU — 서버 카탈로그 API 연동 전까지 사용하는 소스.
 * - 우선순위: `app.config` extra JSON 문자열 → `EXPO_PUBLIC_SESSION_EXTENSION_CATALOG_JSON`
 * - 없거나 파싱 실패 시 아래 **데모 카탈로그**(로컬·스테이징용) 사용.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
export interface SessionExtensionPackage {
  id: number;
  name: string;
  sessions: number;
  price: number;
  popular?: boolean;
  perSession: number;
}

/** 데모·스토어 심사용 기본 목록 (운영 가격은 서버/환경 JSON으로 치환). */
export const DEMO_SESSION_EXTENSION_PACKAGES: SessionExtensionPackage[] = [
  { id: 1, name: '1회 체험', sessions: 1, price: 60000, perSession: 60000 },
  {
    id: 2,
    name: '5회 패키지',
    sessions: 5,
    price: 275000,
    popular: true,
    perSession: 55000,
  },
  { id: 3, name: '10회 패키지', sessions: 10, price: 500000, perSession: 50000 },
];

function normalizePackageRow(row: unknown): SessionExtensionPackage | null {
  if (row == null || typeof row !== 'object') {
    return null;
  }
  const r = row as Record<string, unknown>;
  const id = Number(r.id);
  const sessions = Number(r.sessions);
  const price = Number(r.price);
  const name = typeof r.name === 'string' ? r.name.trim() : '';
  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(sessions) || sessions <= 0) {
    return null;
  }
  if (!Number.isFinite(price) || price <= 0 || name === '') {
    return null;
  }
  const perSessionRaw = r.perSession != null ? Number(r.perSession) : Math.round(price / sessions);
  const perSession =
    Number.isFinite(perSessionRaw) && perSessionRaw > 0 ? perSessionRaw : Math.round(price / sessions);
  const popular = r.popular === true;
  return { id, name, sessions, price, perSession, popular };
}

function parseCatalogJson(raw: string): SessionExtensionPackage[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return null;
    }
    const out: SessionExtensionPackage[] = [];
    parsed.forEach((row) => {
      const pkg = normalizePackageRow(row);
      if (pkg) {
        out.push(pkg);
      }
    });
    return out.length > 0 ? out : null;
  } catch {
    return null;
  }
}

export function getSessionExtensionPackages(): SessionExtensionPackage[] {
  const extraRaw = Constants.expoConfig?.extra?.sessionExtensionCatalog;
  if (typeof extraRaw === 'string' && extraRaw.trim() !== '') {
    const parsed = parseCatalogJson(extraRaw.trim());
    if (parsed) {
      return parsed;
    }
  }
  const envRaw = process.env.EXPO_PUBLIC_SESSION_EXTENSION_CATALOG_JSON;
  if (typeof envRaw === 'string' && envRaw.trim() !== '') {
    const parsed = parseCatalogJson(envRaw.trim());
    if (parsed) {
      return parsed;
    }
  }
  return DEMO_SESSION_EXTENSION_PACKAGES;
}
