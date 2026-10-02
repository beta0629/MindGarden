/**
 * CheckoutSameDayModal 레이아웃 회귀 가드.
 * 요약 래퍼가 .mg-v2-ad-b0kla(min-height 100vh) 를 공유해 결제 방식 라디오·입력 필드가
 * 모달 스크롤 밖으로 밀려 「신용카드」 고정처럼 보이던 문제 재발 방지.
 *
 * @author CoreSolution
 * @since 2026-10-02
 */

const fs = require('fs');
const path = require('path');

const readSource = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

describe('CheckoutSameDayModal — 요약 래퍼 높이 리셋', () => {
  test('모달 본문 안 b0kla 요약 래퍼는 min-height: auto 로 리셋된다', () => {
    const css = readSource('CheckoutSameDayModal.css');
    expect(css).toMatch(
      /\.mg-v2-checkout-same-day-modal__body\s+\.mg-v2-ad-b0kla\.mg-v2-mapping-creation-modal\s*\{[^}]*min-height:\s*auto;/
    );
  });

  test('요약 래퍼 마크업이 리셋 셀렉터와 일치한다', () => {
    const js = readSource('CheckoutSameDayModal.js');
    expect(js).toContain('className="mg-v2-checkout-same-day-modal__body"');
    expect(js).toContain('className="mg-v2-ad-b0kla mg-v2-mapping-creation-modal"');
  });
});
