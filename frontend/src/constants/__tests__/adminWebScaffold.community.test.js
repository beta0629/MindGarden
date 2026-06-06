import { buildCommunityModerationPatchBody } from '../adminWebScaffold';

describe('buildCommunityModerationPatchBody — BE 신규 계약 동기화 (P0 핫픽스)', () => {
  test('C1: APPROVED (legacy uppercase) → decision=APPROVE', () => {
    expect(buildCommunityModerationPatchBody('APPROVED'))
      .toEqual({ decision: 'APPROVE' });
  });

  test('C1-a: approve (legacy lowercase) → decision=APPROVE', () => {
    expect(buildCommunityModerationPatchBody('approve'))
      .toEqual({ decision: 'APPROVE' });
  });

  test('C1-b: APPROVE (신규 enum) → decision=APPROVE', () => {
    expect(buildCommunityModerationPatchBody('APPROVE'))
      .toEqual({ decision: 'APPROVE' });
  });

  test('C2: REJECTED + reasonCode + note → 신규 계약 본문', () => {
    expect(
      buildCommunityModerationPatchBody('REJECTED', {
        reasonCode: 'SPAM',
        note: '광고성 게시물'
      })
    ).toEqual({ decision: 'REJECT', reasonCode: 'SPAM', note: '광고성 게시물' });
  });

  test('C2-a: reject (lowercase) + 두번째 인자 string(legacy) → reasonCode 매핑', () => {
    expect(buildCommunityModerationPatchBody('reject', 'SPAM'))
      .toEqual({ decision: 'REJECT', reasonCode: 'SPAM' });
  });

  test('C2-b: REJECT + 빈 reasonCode/note → reasonCode/note 키 누락', () => {
    expect(
      buildCommunityModerationPatchBody('REJECT', { reasonCode: '   ', note: '' })
    ).toEqual({ decision: 'REJECT' });
  });

  test('C3: 잘못된 decision → throw', () => {
    expect(() => buildCommunityModerationPatchBody('PENDING'))
      .toThrow(/invalid decision/);
    expect(() => buildCommunityModerationPatchBody(null))
      .toThrow(/invalid decision/);
    expect(() => buildCommunityModerationPatchBody(undefined))
      .toThrow(/invalid decision/);
    expect(() => buildCommunityModerationPatchBody(''))
      .toThrow(/invalid decision/);
  });

  test('C4: 출력 본문에 legacy status/rejectReason 키 절대 없음', () => {
    const approveBody = buildCommunityModerationPatchBody('APPROVED');
    expect(approveBody).not.toHaveProperty('status');
    expect(approveBody).not.toHaveProperty('rejectReason');

    const rejectBody = buildCommunityModerationPatchBody('REJECTED', {
      reasonCode: 'OFFENSIVE',
      note: '욕설'
    });
    expect(rejectBody).not.toHaveProperty('status');
    expect(rejectBody).not.toHaveProperty('rejectReason');
  });

  test('C5: 호출부 legacy 패턴 — (action, rejectReason) 두 인자 그대로 흡수', () => {
    expect(buildCommunityModerationPatchBody('approve', ''))
      .toEqual({ decision: 'APPROVE' });
    expect(buildCommunityModerationPatchBody('reject', '광고성 게시물'))
      .toEqual({ decision: 'REJECT', reasonCode: '광고성 게시물' });
  });
});
