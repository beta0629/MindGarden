/**
 * 햄버거 셸 핵심 회귀용 API 목.
 * - 실데이터 쓰기·문자 발송 차단
 * - 매핑 목록 size=200 페이지 순회 기록
 * - 등록일·displayPackageName·결제대기 KPI 픽스처
 */
import type { Page, Request } from '@playwright/test';
import { E2E_ADMIN_LNB_RAW_TREE } from './adminHamburgerShellMocks';

export type ShellMockUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  permissionGroupCodes?: string[];
  tenantId?: string;
  counselingEnabled?: boolean;
};

export const REGRESSION_DISPLAY_PACKAGE_NAME = '단회기 90,000원 + 기본10회기';
/** raw packageName — 당일결제 모달 가드·요청용 (displayPackageName 과 분리) */
export const REGRESSION_PACKAGE_NAME = '단회기 90,000원';
export const REGRESSION_REGISTRATION_LABEL = '11.20 등록';
export const REGRESSION_CREATED_AT = '2026-11-20T09:00:00+09:00';
export const REGRESSION_PENDING_COUNT = 2;
export const REGRESSION_PENDING_AMOUNT = 180000;
/** adminMappingsListGetAll drain 기본 size (ADMIN_LIST_DRAIN_PAGE_SIZE) */
export const REGRESSION_MAPPING_PAGE_SIZE = 200;
export const REGRESSION_MAPPING_TOTAL = 201;

export const REGRESSION_FEATURED = Object.freeze({
  registrationMappingId: 880001,
  checkoutMappingId: 880002,
  registrationClientName: '등록일검증내담자',
  checkoutClientName: '당일결제검증내담자',
  consultantName: 'E2E 상담사'
});

const CORS = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
};

function jsonOk(data: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    headers: CORS,
    body: JSON.stringify({ success: true, data })
  };
}

function parseQuery(url: string): URLSearchParams {
  try {
    return new URL(url).searchParams;
  } catch {
    const q = url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
    return new URLSearchParams(q);
  }
}

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url.split('?')[0] || '';
  }
}

function buildMinimalMapping(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    clientId: 700000 + id,
    consultantId: 99999003,
    clientName: `내담자${id}`,
    consultantName: REGRESSION_FEATURED.consultantName,
    packageName: `패키지${id}`,
    displayPackageName: null,
    packagePrice: 90000,
    totalSessions: 10,
    remainingSessions: 5,
    status: 'ACTIVE',
    paymentTiming: 'ADVANCE',
    createdAt: REGRESSION_CREATED_AT,
    startDate: '2026-11-20',
    hasConsultationSchedule: false,
    hasOpenOccupyingConsultationSchedule: false,
    ...overrides
  };
}

/** 사이드바 등록일·당일결제 모달용 피처 매핑 */
export function buildFeaturedMappings() {
  const registration = buildMinimalMapping(REGRESSION_FEATURED.registrationMappingId, {
    clientName: REGRESSION_FEATURED.registrationClientName,
    packageName: '기본10회기',
    displayPackageName: null,
    remainingSessions: 8,
    status: 'ACTIVE',
    paymentTiming: 'ADVANCE',
    createdAt: REGRESSION_CREATED_AT
  });
  const checkout = buildMinimalMapping(REGRESSION_FEATURED.checkoutMappingId, {
    clientName: REGRESSION_FEATURED.checkoutClientName,
    packageName: REGRESSION_PACKAGE_NAME,
    displayPackageName: REGRESSION_DISPLAY_PACKAGE_NAME,
    packagePrice: 90000,
    totalSessions: 1,
    remainingSessions: 0,
    status: 'PENDING_PAYMENT',
    paymentTiming: 'SAME_DAY_CARD',
    createdAt: REGRESSION_CREATED_AT
  });
  return { registration, checkout };
}

function buildAllMappingsPool() {
  const { registration, checkout } = buildFeaturedMappings();
  const pool = [registration, checkout];
  for (let i = 0; i < REGRESSION_MAPPING_TOTAL - 2; i += 1) {
    pool.push(buildMinimalMapping(900000 + i));
  }
  return pool;
}

export type MappingListRequestRecord = {
  url: string;
  page: number | null;
  size: number | null;
};

export type RegressionMockHandles = {
  mappingListRequests: MappingListRequestRecord[];
  resetMappingListRequests: () => void;
};

/**
 * 역할 공통 API 목 설치. mapping list 요청을 기록한다.
 */
export async function installRegressionMocks(
  page: Page,
  user: ShellMockUser
): Promise<RegressionMockHandles> {
  const mappingListRequests: MappingListRequestRecord[] = [];
  const allMappings = buildAllMappingsPool();
  const { checkout } = buildFeaturedMappings();
  const pendingMappings = [
    checkout,
    buildMinimalMapping(880003, {
      clientName: '결제대기추가내담자',
      status: 'PENDING_PAYMENT',
      paymentTiming: 'ADVANCE',
      packagePrice: 90000,
      remainingSessions: 0
    })
  ];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();
    const path = pathnameOf(url);
    const qs = parseQuery(url);

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }

    if (path.includes('/auth/current-user') || path.includes('/auth/session-info')) {
      await route.fulfill(jsonOk(user));
      return;
    }

    if (path.includes('/menus/lnb')) {
      await route.fulfill(jsonOk(E2E_ADMIN_LNB_RAW_TREE));
      return;
    }

    // 매핑 목록 전체 로드 (#1894) — size=200 페이지 순회 기록
    if (
      method === 'GET'
      && (path === '/api/v1/admin/mappings' || path.endsWith('/admin/mappings'))
      && !path.includes('/admin/mappings/')
    ) {
      const pageNum = qs.has('page') ? Number(qs.get('page')) : 0;
      const sizeNum = qs.has('size') ? Number(qs.get('size')) : REGRESSION_MAPPING_PAGE_SIZE;
      mappingListRequests.push({
        url,
        page: Number.isFinite(pageNum) ? pageNum : null,
        size: Number.isFinite(sizeNum) ? sizeNum : null
      });
      const safePage = Number.isFinite(pageNum) && pageNum >= 0 ? pageNum : 0;
      const safeSize =
        Number.isFinite(sizeNum) && sizeNum > 0 ? sizeNum : REGRESSION_MAPPING_PAGE_SIZE;
      const start = safePage * safeSize;
      const slice = allMappings.slice(start, start + safeSize);
      await route.fulfill(
        jsonOk({
          mappings: slice,
          count: REGRESSION_MAPPING_TOTAL,
          totalElements: REGRESSION_MAPPING_TOTAL,
          totalPages: Math.ceil(REGRESSION_MAPPING_TOTAL / safeSize),
          number: safePage,
          size: safeSize,
          page: safePage,
          last: start + slice.length >= REGRESSION_MAPPING_TOTAL
        })
      );
      return;
    }

    // 결제 대기 KPI (# pending-payment)
    if (path.includes('/admin/mappings/pending-payment') && !path.includes('dirty')) {
      const pageNum = qs.has('page') ? Number(qs.get('page')) : 0;
      const sizeNum = qs.has('size') ? Number(qs.get('size')) : REGRESSION_MAPPING_PAGE_SIZE;
      const safePage = Number.isFinite(pageNum) && pageNum >= 0 ? pageNum : 0;
      const safeSize =
        Number.isFinite(sizeNum) && sizeNum > 0 ? sizeNum : REGRESSION_MAPPING_PAGE_SIZE;
      const start = safePage * safeSize;
      const slice = pendingMappings.slice(start, start + safeSize);
      await route.fulfill(
        jsonOk({
          mappings: slice,
          count: pendingMappings.length,
          totalElements: pendingMappings.length,
          page: safePage,
          size: safeSize,
          number: safePage,
          last: true
        })
      );
      return;
    }

    if (path.includes('/admin/mappings/stats')) {
      await route.fulfill(
        jsonOk({
          total: REGRESSION_MAPPING_TOTAL,
          active: REGRESSION_MAPPING_TOTAL - REGRESSION_PENDING_COUNT,
          pendingPayment: REGRESSION_PENDING_COUNT
        })
      );
      return;
    }

    if (path.includes('/admin/mappings/pending-deposit')) {
      await route.fulfill(jsonOk({ mappings: [], count: 0 }));
      return;
    }

    if (path.includes('/admin/mappings/pending-payment-dirty')) {
      await route.fulfill(jsonOk({ items: [], count: 0 }));
      return;
    }

    if (path.includes('/admin/session-extensions/pending-payment')) {
      await route.fulfill(jsonOk({ requests: [], count: 0 }));
      return;
    }

    // 스케줄 목록 (통합·상담사)
    if (
      path.includes('/schedules')
      || path.includes('/admin/schedules')
    ) {
      await route.fulfill(
        jsonOk({
          schedules: [],
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: safeSizeOr(qs, 200),
          count: 0,
          last: true
        })
      );
      return;
    }

    // 공통코드·결제수단 (당일결제 모달)
    if (path.includes('/common-codes')) {
      if (path.includes('PAYMENT_METHOD') || qs.get('groupCode') === 'PAYMENT_METHOD') {
        await route.fulfill(
          jsonOk([
            {
              codeValue: 'CARD',
              codeLabel: '카드',
              label: '카드',
              isActive: true
            },
            {
              codeValue: 'CASH',
              codeLabel: '현금',
              label: '현금',
              isActive: true
            }
          ])
        );
        return;
      }
      await route.fulfill(jsonOk([]));
      return;
    }

    // 내담자/상담사 홈 보조 API
    if (
      path.includes('/clients/with-mapping')
      || path.includes('/clients/with-stats')
      || path.includes('/consultants/with-stats')
    ) {
      await route.fulfill(jsonOk({ clients: [], consultants: [], count: 0 }));
      return;
    }

    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      await route.fulfill(jsonOk({}));
      return;
    }

    await route.fulfill(jsonOk([]));
  });

  return {
    mappingListRequests,
    resetMappingListRequests: () => {
      mappingListRequests.length = 0;
    }
  };
}

function safeSizeOr(qs: URLSearchParams, fallback: number): number {
  if (!qs.has('size')) return fallback;
  const n = Number(qs.get('size'));
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** 요청 기록에서 size=200(또는 drain size) 페이지 순회 여부 */
export function assertMappingDrainRecorded(
  records: MappingListRequestRecord[],
  expectedSize = REGRESSION_MAPPING_PAGE_SIZE
): { pass: boolean; detail: Record<string, unknown> } {
  const sized = records.filter((r) => r.size === expectedSize);
  const pages = sized
    .map((r) => r.page)
    .filter((p): p is number => p != null)
    .sort((a, b) => a - b);
  const uniquePages = Array.from(new Set(pages));
  const hasPage0 = uniquePages.includes(0);
  const hasPage1Plus = uniquePages.some((p) => p >= 1);
  const pass = sized.length >= 2 && hasPage0 && hasPage1Plus;
  return {
    pass,
    detail: {
      totalRequests: records.length,
      sizedRequests: sized.length,
      pages: uniquePages,
      sizes: Array.from(new Set(records.map((r) => r.size))),
      expectedSize
    }
  };
}

/** 디버그용 — 요청 URL만 추출 */
export function summarizeMappingRequests(records: MappingListRequestRecord[]) {
  return records.map((r) => ({ page: r.page, size: r.size }));
}

export function isMappingListRequest(request: Request): boolean {
  const url = request.url();
  const path = pathnameOf(url);
  return (
    request.method() === 'GET'
    && (path === '/api/v1/admin/mappings' || path.endsWith('/admin/mappings'))
    && !path.includes('/admin/mappings/')
  );
}
