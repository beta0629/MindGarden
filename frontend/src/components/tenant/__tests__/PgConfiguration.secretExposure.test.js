/**
 * PG 설정 상세 — 평문 시크릿 노출 경로 제거 회귀 가드.
 *
 * P0 보안(2026-10-03): 테넌트 관리자 화면에서 PG API 키·시크릿을 복호화해 그대로 보여주고
 * 클립보드로 복사할 수 있었다. 서버의 `POST /tenants/{id}/pg-configurations/{configId}/decrypt-keys`
 * 를 제거했으므로 화면에서도 호출·복사 UI 가 다시 들어오지 않도록 소스를 고정한다.
 *
 * 웹훅 시크릿 교체·테스트 모드 전환은 운영자 전용 경로로 이동했고 테넌트 API 는 403 이므로
 * 입력·저장 컨트롤이 비활성인지도 함께 검증한다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */

import fs from 'fs';
import path from 'path';

import { ADMIN_SHOP_PG_COPY } from '../../../constants/adminShopSuite';

const DETAIL_SOURCE_PATH = path.join(__dirname, '..', 'PgConfigurationDetail.js');
const PG_API_SOURCE_PATH = path.join(__dirname, '..', '..', '..', 'utils', 'pgApi.js');

const readSource = (filePath) => fs.readFileSync(filePath, 'utf8');

describe('PgConfigurationDetail — 평문 시크릿 노출 제거', () => {
  let detailSource;

  beforeAll(() => {
    detailSource = readSource(DETAIL_SOURCE_PATH);
  });

  test('복호화 호출·상태·핸들러가 없다', () => {
    expect(detailSource).not.toContain('decryptPgKeys');
    expect(detailSource).not.toContain('decryptedKeys');
    expect(detailSource).not.toContain('handleDecryptKeys');
    expect(detailSource).not.toContain('setShowKeys');
  });

  test('클립보드 복사 경로가 없다', () => {
    expect(detailSource).not.toContain('navigator.clipboard');
    expect(detailSource).not.toContain('copyKey');
    expect(detailSource).not.toContain('KEYS_COPY');
  });

  test('API 시크릿 행은 테넌트 화면에서 숨긴다(운영자 전용)', () => {
    expect(detailSource).not.toContain('ADMIN_SHOP_PG_COPY.INFO_API_SECRET');
    expect(detailSource).not.toMatch(/apiSecret|secretKey/);
    expect(ADMIN_SHOP_PG_COPY.INFO_API_SECRET_VALUE).not.toMatch(/[A-Za-z0-9]{8,}/);
  });

  test('웹훅 시크릿 입력·저장 컨트롤은 숨기고 설정 여부 배지 + 운영자 전용 안내만 둔다', () => {
    expect(detailSource).toContain('ADMIN_SHOP_PG_COPY.WEBHOOK_OPS_ONLY_NOTICE');
    expect(detailSource).not.toContain('ADMIN_SHOP_PG_COPY.WEBHOOK_NOTICE');
    expect(detailSource).not.toContain('pg-webhook-secret-input');
    expect(detailSource).not.toContain('PG_WEBHOOK_SAVE');
    expect(detailSource).not.toContain('patchPgConfigurationWebhookSecret');
    expect(detailSource).not.toMatch(/type="password"/);
    expect(detailSource).toMatch(/isPortoneWebhookSecretConfigured/);
  });

  test('테스트 모드는 읽기 전용 표시만 (전환 컨트롤 없음)', () => {
    expect(detailSource).toContain('ADMIN_SHOP_PG_COPY.KEY_TEST_MODE');
    expect(detailSource).not.toMatch(/setTestMode|onToggleTestMode|patchPgConfigurationTestMode/);
  });
});

describe('pgApi — 테넌트 복호화 helper 제거', () => {
  test('테넌트 경로 decryptPgKeys export 가 없다', () => {
    const source = readSource(PG_API_SOURCE_PATH);

    expect(source).not.toContain('export const decryptPgKeys');
    expect(source).not.toContain('/decrypt-keys');
  });
});
