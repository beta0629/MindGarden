/**
 * SCT E2E — 7폭·horizontal overflow 검사 헬퍼
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/** 공개·관리·상담 스모크용 뷰포트 7종 (1440·375 포함) */
export const SCT_VIEWPORTS = [
  { name: 'iphone-375', width: 375, height: 812 },
  { name: 'iphone-414', width: 414, height: 896 },
  { name: 'ipad-portrait', width: 820, height: 1180 },
  { name: 'ipad-landscape', width: 1180, height: 820 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 }
] as const;

export const SCT_VIEWPORT_ARTIFACT_DIR = '/opt/cursor/artifacts/sct-viewport';

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

/**
 * documentElement 기준 가로 오버플로가 0인지 검사한다.
 *
 * @param page Playwright page
 */
export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollW = Math.max(doc.scrollWidth, body?.scrollWidth || 0);
    const clientW = doc.clientWidth;
    return scrollW - clientW;
  });
  expect(overflow, `horizontal overflow px=${overflow}`).toBe(0);
}

/**
 * 빈 화면(주요 패널 미렌더)이 아닌지 검사.
 *
 * @param page Playwright page
 * @param testId data-testid
 */
export async function assertPanelVisible(page: Page, testId: string): Promise<void> {
  const loc = page.getByTestId(testId);
  await expect(loc).toBeVisible({ timeout: 20000 });
  const box = await loc.boundingBox();
  expect(box, `${testId} bounding box`).toBeTruthy();
  expect((box?.width || 0) > 0 && (box?.height || 0) > 0).toBeTruthy();
}

/**
 * SCT 공개 API를 고정 픽스처로 모킹한다.
 *
 * @param page Playwright page
 * @param overrides meta 응답 덮어쓰기
 */
export async function mockSctPublicApis(
  page: Page,
  overrides: Record<string, unknown> = {}
): Promise<void> {
  await page.route('**/api/v1/public/sct/**/meta', async(route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          formType: 'ADULT',
          title: '문장완성 질문지',
          status: 'SENT',
          itemCount: 50,
          verifyChannelHint: 'PHONE',
          tokenExpiresAt: '2026-12-01T23:59:00',
          hasDraft: false,
          requiresGuardian: false,
          signerBand: 'ADULT',
          ...overrides
        }
      })
    });
  });
}

const DEFAULT_CONSENT = {
  signerBand: 'ADULT',
  requiresGuardian: false,
  sensitiveRequired: true,
  guardianRequired: false,
  selfSignatureRequired: true,
  childNameOptional: false,
  satisfied: false,
  revoked: false,
  sensitiveConsentTitle: '실시 안내 및 동의',
  sensitiveConsentBody:
    '이 질문지는 마인드가든심리상담센터가 자체 제작한 상담 면담 질문지입니다.\n\n민감정보(심리·건강 관련 정보) 처리에 대한 동의\n\n한 번 동의하면 철회할 때까지 이후 실시에도 적용됩니다.',
  sensitiveConsentVersion: 'handoff-2026-11-23',
  guardianConsentTitle: null,
  guardianConsentBody: null,
  guardianConsentVersion: null,
  guardianVerifyMode: 'CHECK_NAME_RELATION'
};

/**
 * 동의 단계까지 진입 가능한 공개 API mock (ENV skip 금지 — synthetic).
 *
 * @param page Playwright page
 * @param consentOverrides consent 필드 덮어쓰기
 */
export async function mockSctPublicApisThroughConsent(
  page: Page,
  consentOverrides: Record<string, unknown> = {}
): Promise<void> {
  const consent = { ...DEFAULT_CONSENT, ...consentOverrides };

  await page.route('**/api/v1/public/sct/**', async(route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }

    if (url.includes('/meta')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          success: true,
          data: {
            formType: 'ADULT',
            title: '문장완성 질문지',
            status: 'SENT',
            itemCount: 50,
            verifyChannelHint: 'PHONE',
            tokenExpiresAt: '2026-12-01T23:59:00',
            hasDraft: false,
            requiresGuardian: Boolean(consent.requiresGuardian),
            signerBand: consent.signerBand
          }
        })
      });
      return;
    }

    if (url.includes('/verify') && method === 'POST') {
      await route.fulfill(jsonOk({
        verifySessionId: 'e2e-verify-session',
        expiresInSeconds: 1800,
        consent
      }));
      return;
    }

    if (url.includes('/consents') && method === 'POST') {
      await route.fulfill(jsonOk({ message: 'ok' }));
      return;
    }

    if (url.includes('/form') && method === 'GET') {
      const headers = request.headers();
      const hasHeader = Boolean(
        headers['x-sct-verify-session'] || headers['X-Sct-Verify-Session']
      );
      if (!hasHeader) {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          headers: CORS,
          body: JSON.stringify({ success: false, message: '본인 확인이 필요합니다.' })
        });
        return;
      }
      await route.fulfill(jsonOk({
        formType: 'ADULT',
        title: '문장완성 질문지',
        instructionText: '안내',
        headerFieldsJson: '[]',
        status: 'SENT',
        requiresGuardian: false,
        signerBand: 'ADULT',
        consent: { ...consent, satisfied: true, sensitiveRequired: false },
        items: [
          {
            formItemId: 1,
            itemNo: 1,
            promptText: '내 이름 앞에 어울리는 수식어를 하나 붙인다면',
            domainCode: 'SELF_CONCEPT',
            domainLabel: '자기개념',
            allowsNotApplicable: false,
            answerText: null,
            notApplicable: false,
            isBlank: true
          }
        ]
      }));
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      headers: CORS,
      body: JSON.stringify({ success: false, message: `unmocked ${method} ${url}` })
    });
  });
}

export type SctShellMockUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  permissionGroupCodes?: string[];
  tenantId?: string;
};

/**
 * SCT 관리·상담·설정 화면용 API mock (feature ON + 패널 데이터).
 *
 * @param page Playwright page
 * @param user 합성 사용자
 */
export async function installSctShellMocks(
  page: Page,
  user: SctShellMockUser
): Promise<void> {
  const sessionAnswers = [
    {
      formItemId: 1,
      itemNo: 1,
      promptText: '내 이름 앞에 어울리는 수식어를 하나 붙인다면',
      domainCode: 'SELF_CONCEPT',
      domainLabel: '자기개념',
      answerText: '차분한',
      notApplicable: false,
      isBlank: false
    },
    {
      formItemId: 2,
      itemNo: 2,
      promptText: '기운이 바닥난 날 내 방의 모습은',
      domainCode: 'AFFECT',
      domainLabel: '정서(우울)',
      answerText: '',
      notApplicable: false,
      isBlank: true
    }
  ];

  await page.route('**/api/v1/**', async(route) => {
    const request = route.request();
    const method = request.method();
    const url = request.url();

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: CORS });
      return;
    }

    if (url.includes('/auth/current-user') || url.includes('/auth/session-info')) {
      await route.fulfill(jsonOk(user));
      return;
    }

    if (url.includes('/api/v1/sct/forms')) {
      await route.fulfill(jsonOk([
        { formType: 'ADULT', title: '성인용', itemCount: 50, formTemplateId: 1 }
      ]));
      return;
    }

    if (url.includes('/api/v1/admin/sct-settings')) {
      await route.fulfill(jsonOk({
        linkExpiryDays: 14,
        retentionDays: null,
        featureEnabled: true
      }));
      return;
    }

    if (url.includes('/latest-submitted') || url.includes('/session-view')) {
      await route.fulfill(jsonOk({
        id: 55,
        status: 'SUBMITTED',
        formType: 'ADULT',
        submittedAt: '2026-11-21T10:00:00',
        clientId: 9001,
        answers: sessionAnswers
      }));
      return;
    }

    if (url.includes('/domain-memos')) {
      if (method === 'PUT') {
        await route.fulfill(jsonOk({
          id: 1,
          invitationId: 55,
          domainCode: 'SELF_CONCEPT',
          memoText: '면담 확인',
          authorUserId: user.id
        }));
        return;
      }
      await route.fulfill(jsonOk([
        {
          id: 1,
          invitationId: 55,
          domainCode: 'SELF_CONCEPT',
          memoText: '기존 메모',
          authorUserId: user.id
        }
      ]));
      return;
    }

    if (url.includes('/sct/clients/') && url.includes('/invitations')) {
      await route.fulfill(jsonOk([
        {
          id: 55,
          formType: 'ADULT',
          status: 'SUBMITTED',
          submittedAt: '2026-11-21T10:00:00',
          tokenExpiresAt: '2026-12-01T23:59:00',
          maskedPhone: '010****5678'
        }
      ]));
      return;
    }

    if (url.includes('/print-audit') && method === 'POST') {
      await route.fulfill(jsonOk({ recorded: true }));
      return;
    }

    if (url.includes('/api/v1/sct/invitations/') && method === 'GET') {
      await route.fulfill(jsonOk({
        id: 55,
        formType: 'ADULT',
        status: 'SUBMITTED',
        submittedAt: '2026-11-21T10:00:00',
        clientId: 9001,
        answers: sessionAnswers
      }));
      return;
    }

    if (url.includes('/menus/lnb')) {
      await route.fulfill(jsonOk([]));
      return;
    }

    if (url.includes('/admin/system-config') || url.includes('/system-configs')) {
      // SystemConfigManagement 는 response.success + configValue 형태를 기대
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({
          success: true,
          configKey: 'mock',
          configValue: 'false',
          description: 'e2e'
        })
      });
      return;
    }

    if (url.includes('/admin/notification-scheduler') || url.includes('/notification-scheduler-flags')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: CORS,
        body: JSON.stringify({ success: true, flags: [] })
      });
      return;
    }

    if (url.includes('/common-codes')) {
      await route.fulfill(jsonOk([]));
      return;
    }

    if (url.includes('/notification-scheduler') || url.includes('/scheduler')) {
      await route.fulfill(jsonOk({}));
      return;
    }

    if (method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      await route.fulfill(jsonOk({}));
      return;
    }

    await route.fulfill(jsonOk([]));
  });
}

/**
 * 아티팩트 디렉터리 준비.
 */
export function ensureSctViewportArtifactDir(): void {
  fs.mkdirSync(SCT_VIEWPORT_ARTIFACT_DIR, { recursive: true });
}

/**
 * 뷰포트 측정 JSON append.
 *
 * @param rows 측정 행
 */
export function writeSctViewportMeasurements(
  rows: Array<{
    panel: string;
    name: string;
    width: number;
    height: number;
    overflowPx: number;
    visible: boolean;
  }>
): void {
  ensureSctViewportArtifactDir();
  const out = path.join(SCT_VIEWPORT_ARTIFACT_DIR, 'viewport-measurements.json');
  let existing: unknown[] = [];
  if (fs.existsSync(out)) {
    try {
      existing = JSON.parse(fs.readFileSync(out, 'utf8'));
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
  }
  fs.writeFileSync(out, JSON.stringify([...existing, ...rows], null, 2), 'utf8');
}
