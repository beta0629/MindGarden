/**
 * 온보딩 Step7(사업자·약관) 라우팅·상수 잠금
 */

import { TRINITY_CONSTANTS } from '../../constants/trinity';

describe('온보딩 사업자·약관 Step7 SSOT', () => {
  test('ONBOARDING_STEPS_V2 includes merchant legal after basic info', () => {
    const steps = TRINITY_CONSTANTS.ONBOARDING_STEPS_V2;
    expect(steps[0].stepKey).toBe(1);
    expect(steps[1].stepKey).toBe(7);
    expect(steps[1].label).toBe('사업자·약관');
    expect(TRINITY_CONSTANTS.ONBOARDING_STEP.MERCHANT_LEGAL).toBe(7);
  });

  test('copy promises settings reuse and allows empty mail-order', () => {
    const ml = TRINITY_CONSTANTS.MERCHANT_LEGAL;
    expect(ml.STEP_DESCRIPTION).toMatch(/나중에 설정에서 또 쓰지 않아요/);
    expect(ml.MAIL_ORDER_NOTE).toMatch(/통신판매|설정/);
  });
});
