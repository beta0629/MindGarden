/**
 * SCT 인쇄 미리보기 PDF — A4·Letter × 100%·90% 문항 잘림 0
 * Chromium page.pdf() + pdfplumber 로 START/END 마커가 같은 페이지에 있는지 단언.
 *
 * @author MindGarden
 * @since 2026-11-23
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { buildSyntheticConsultantStorageState } from '../../helpers/syntheticConsultantStorageState';
import {
  SCT_VIEWPORTS,
  SCT_VIEWPORT_ARTIFACT_DIR,
  assertNoHorizontalOverflow,
  assertPanelVisible,
  ensureSctViewportArtifactDir,
  installSctShellMocks,
  writeSctViewportMeasurements
} from './sct-viewport-helper';
import { getSyntheticConsultantUser } from '../../helpers/syntheticConsultantStorageState';

const ARTIFACT_DIR = '/opt/cursor/artifacts/sct-print';
const LONG_ANSWER =
  '응답 문장이 길어져도 문항 블록이 페이지 경계에서 잘리지 않아야 합니다. '.repeat(8);

function buildFiftyAnswers() {
  return Array.from({ length: 50 }, (_, i) => {
    const itemNo = i + 1;
    const isNa = itemNo === 9 || itemNo === 12;
    const isBlank = itemNo === 2;
    return {
      formItemId: itemNo,
      itemNo,
      promptText: `문항 ${itemNo} 문장완성 줄기 — 인쇄 잘림 검사용 프롬프트입니다`,
      domainCode: itemNo % 2 === 0 ? 'AFFECT' : 'SELF_CONCEPT',
      domainLabel: itemNo % 2 === 0 ? '정서' : '자기개념',
      answerText: isNa || isBlank ? '' : `${LONG_ANSWER} (#${itemNo})`,
      notApplicable: isNa,
      isBlank
    };
  });
}

async function hardenPageNetwork(page: import('@playwright/test').Page): Promise<void> {
  await page.route('**/*fonts.googleapis.com/**', (route) => route.abort());
  await page.route('**/*fonts.gstatic.com/**', (route) => route.abort());
  await page.route('**/sockjs-node/**', (route) => route.abort());
  await page.route('**/ws', (route) => route.abort());
  await page.route('**/*hot-update*', (route) => route.abort());
}

async function gotoSettled(
  page: import('@playwright/test').Page,
  url: string
): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      return;
    } catch (err) {
      lastError = err;
      await page.waitForTimeout(500);
    }
  }
  throw lastError;
}

/**
 * pdfplumber 로 START/END 마커 페이지 일치 검사.
 *
 * @param pdfPath PDF 경로
 * @returns 잘린 문항 번호 목록
 */
function findClippedItems(pdfPath: string): number[] {
  const script = `
import sys, re, pdfplumber
path = sys.argv[1]
start = {}
end = {}
pat_s = re.compile(r"ITEM_START:(\\d{2})")
pat_e = re.compile(r"ITEM_END:(\\d{2})")
with pdfplumber.open(path) as pdf:
    for i, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        for m in pat_s.finditer(text):
            start[int(m.group(1))] = i
        for m in pat_e.finditer(text):
            end[int(m.group(1))] = i
clipped = []
for no, sp in sorted(start.items()):
    ep = end.get(no)
    if ep is None or ep != sp:
        clipped.append(no)
print(",".join(str(x) for x in clipped))
`;
  const result = spawnSync('python3', ['-c', script, pdfPath], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });
  if (result.status !== 0) {
    throw new Error(`pdfplumber failed: ${result.stderr || result.stdout}`);
  }
  const line = (result.stdout || '').trim();
  if (!line) return [];
  return line.split(',').filter(Boolean).map((x) => Number(x));
}

const PRINT_CASES = [
  { paper: 'A4', scale: '100', name: 'a4-100' },
  { paper: 'A4', scale: '90', name: 'a4-90' },
  { paper: 'Letter', scale: '100', name: 'letter-100' },
  { paper: 'Letter', scale: '90', name: 'letter-90' }
] as const;

test.describe('SCT 인쇄 PDF 문항 잘림 0', () => {
  test.use({ storageState: buildSyntheticConsultantStorageState() });
  test.describe.configure({ timeout: 240_000 });

  test.beforeAll(() => {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
    ensureSctViewportArtifactDir();
  });

  test.beforeEach(async({ page }) => {
    await hardenPageNetwork(page);
    const user = getSyntheticConsultantUser();
    await installSctShellMocks(page, user);

    const answers = buildFiftyAnswers();
    await page.route('**/api/v1/sct/invitations/**', async(route) => {
      const request = route.request();
      const method = request.method();
      const url = request.url();
      if (method === 'OPTIONS') {
        await route.fulfill({ status: 204 });
        return;
      }
      if (url.includes('/print-audit') && method === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'ok' })
        });
        return;
      }
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              id: 55,
              status: 'SUBMITTED',
              formType: 'ADULT',
              submittedAt: '2026-11-21T10:00:00',
              clientId: 9001,
              answers
            }
          })
        });
        return;
      }
      await route.continue();
    });
  });

  for (const c of PRINT_CASES) {
    test(`PDF ${c.name} 문항 블록 페이지 경계 걸침 0`, async({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await gotoSettled(page, '/consultant/sct-print?invitationId=55&clientName=E2E내담자');
      await expect(page.getByTestId('sct-print-preview')).toBeVisible({ timeout: 20000 });

      await page.getByTestId('sct-print-paper').selectOption(c.paper);
      await page.getByTestId('sct-print-orient').selectOption('portrait');
      await page.getByTestId('sct-print-scale').selectOption(c.scale);

      const itemCount = await page.locator('[data-sct-print-item]').count();
      expect(itemCount).toBe(50);

      const pdfPath = path.join(ARTIFACT_DIR, `sct-print-${c.name}.pdf`);
      const pdf = await page.pdf({
        format: c.paper === 'Letter' ? 'Letter' : 'A4',
        printBackground: true,
        margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' }
      });
      fs.writeFileSync(pdfPath, pdf);

      const clipped = findClippedItems(pdfPath);
      expect(clipped, `clipped items for ${c.name}: ${clipped.join(',')}`).toEqual([]);
    });
  }
});

test.describe('SCT 인쇄 미리보기 7폭', () => {
  test.use({ storageState: buildSyntheticConsultantStorageState() });
  test.describe.configure({ timeout: 180_000 });

  test.beforeAll(() => {
    ensureSctViewportArtifactDir();
  });

  test.beforeEach(async({ page }) => {
    await hardenPageNetwork(page);
    await installSctShellMocks(page, getSyntheticConsultantUser());
  });

  for (const vp of SCT_VIEWPORTS) {
    test(`인쇄 진입·미리보기 @${vp.name} (${vp.width}x${vp.height})`, async({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await gotoSettled(page, '/e2e-sct-viewport?panel=session');
      await assertPanelVisible(page, 'sct-session-panel');
      await expect(page.getByTestId('sct-print-btn')).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId('sct-font-size')).toBeVisible();
      await expect(page.getByTestId('sct-session-search')).toBeVisible();
      await assertNoHorizontalOverflow(page);

      await page.getByTestId('sct-print-btn').click();
      await expect(page.getByTestId('sct-print-preview')).toBeVisible({ timeout: 20000 });
      await assertNoHorizontalOverflow(page);

      const overflowPx = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollW = Math.max(doc.scrollWidth, body?.scrollWidth || 0);
        return scrollW - doc.clientWidth;
      });
      await page.screenshot({
        path: path.join(SCT_VIEWPORT_ARTIFACT_DIR, `print-preview-${vp.width}.png`),
        fullPage: false
      });
      writeSctViewportMeasurements([{
        panel: 'print-preview',
        name: vp.name,
        width: vp.width,
        height: vp.height,
        overflowPx,
        visible: true
      }]);
    });
  }
});
