/**
 * AdminShopOrdersPage — 환불 카피·미결제 취소 노출 스모크
 *
 * @author CoreSolution
 * @since 2026-09-17
 */

import fs from 'fs';
import path from 'path';

const pagePath = path.join(__dirname, '..', 'AdminShopOrdersPage.js');
const source = fs.readFileSync(pagePath, 'utf8');

describe('AdminShopOrdersPage source', () => {
  test('stale PG 미연동 MVP 카피가 없다', () => {
    expect(source).not.toMatch(/PG 실환불은 연동되지 않았습니다/);
  });

  test('포트원 실환불 연동 안내와 미결제 취소를 포함한다', () => {
    expect(source).toMatch(/PG\(포트원\) 실환불이 연동됩니다/);
    expect(source).toMatch(/cancelAdminShopOrder/);
    expect(source).toMatch(/미결제 취소/);
  });

  test('환불·취소 모달은 UnifiedModal actions + ModalFormActions 를 사용한다', () => {
    expect(source).not.toMatch(/\bfooter=\{/);
    expect(source).toMatch(/ModalFormActions/);
    expect(source).toMatch(/submitText="환불 실행"/);
    expect(source).toMatch(/submitText="취소 실행"/);
  });
});
