/**
 * ConsultationPackagePublicList — 이용기간 quiet note · token CSS
 *
 * @author CoreSolution
 * @since 2026-09-11
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(ROOT, name), 'utf8');

describe('ConsultationPackagePublicList usage period disclosure', () => {
  const js = read('ConsultationPackagePublicList.js');
  const css = read('ConsultationPackagePublicList.css');
  const constants = fs.readFileSync(
    path.resolve(__dirname, '../../../constants/legalPublic.js'),
    'utf8'
  );

  test('h2 아래 quiet note로 이용기간·결제유형 고지 상수를 렌더한다', () => {
    expect(js).toMatch(/CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE/);
    expect(js).toMatch(/CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE/);
    expect(js).toMatch(/mg-consultation-package-public__note/);
    expect(js).toMatch(/consultation-package-usage-period-note/);
    expect(js).toMatch(/consultation-package-payment-type-note/);
    expect(js.indexOf('mg-consultation-package-public__title')).toBeLessThan(
      js.indexOf('mg-consultation-package-public__note')
    );
  });

  test('이용기간·결제 문구는 2개월/1년/일시불이며 허위 90일을 쓰지 않는다', () => {
    expect(constants).toMatch(/CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE/);
    expect(constants).toMatch(/CONSULTATION_PACKAGE_PAYMENT_TYPE_NOTE/);
    expect(constants).toMatch(/단회기: 결제일부터 2개월 내 소진/);
    expect(constants).toMatch(/패키지\(최대 20회기\): 결제일부터 1년 내 소진/);
    expect(constants).toMatch(/무제한 유효기간은 없습니다/);
    expect(constants).toMatch(/일시불만 가능합니다\(정기결제·구독 없음\)/);
    expect(constants).not.toMatch(/달력상 일수 제한 없음/);
    expect(constants).not.toMatch(
      /CONSULTATION_PACKAGE_USAGE_PERIOD_NOTE\s*=\s*[^;]*90일/
    );
  });

  test('note 스타일은 muted 토큰만 사용한다 (하드코딩 색 금지)', () => {
    expect(css).toMatch(/\.mg-consultation-package-public__note/);
    expect(css).toMatch(/color:\s*var\(--cpp-muted\)/);
    expect(css).not.toMatch(
      /\.mg-consultation-package-public__note\s*\{[^}]*#[0-9a-fA-F]{3,8}/
    );
  });
});
