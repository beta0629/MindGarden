/**
 * pgApproval constants — maskMerchantId / display helpers
 *
 * @author CoreSolution
 * @since 2026-09-08
 */

import {
  PG_APPROVAL_COPY,
  isConnectionTestForcedForPending,
  maskMerchantId,
  resolveApproveTestConnection,
  resolveCenterDisplayName,
  resolvePgDisplayName,
  shouldShowReapprovalBadge
} from '../pgApproval';

describe('pgApproval helpers', () => {
  describe('SSOT labels', () => {
    it('Primary CTA·폼/확정 라벨이 SSOT와 일치한다', () => {
      expect(PG_APPROVAL_COPY.DETAIL).toBe('상세보기');
      expect(PG_APPROVAL_COPY.TEST_CONNECTION).toBe('연결 시험');
      expect(PG_APPROVAL_COPY.REVIEW_APPROVE).toBe('승인 검토');
      expect(PG_APPROVAL_COPY.REJECT).toBe('거부 검토');
      expect(PG_APPROVAL_COPY.REVIEW_REJECT).toBe('거부 검토');
      expect(PG_APPROVAL_COPY.CONFIRM_REJECT).toBe('거부 확정');
      expect(PG_APPROVAL_COPY.SUBMIT_APPROVE).toBe('승인 확정으로 진행');
      expect(PG_APPROVAL_COPY.CONFIRM_APPROVE).toBe('승인 확정');
      expect(PG_APPROVAL_COPY.RESULT_ACTIVE).toBe('사용중으로 전환');
      expect(PG_APPROVAL_COPY.REAPPROVAL_BADGE).toBe('재승인 대기');
      expect(PG_APPROVAL_COPY.DIFF_CHANNEL_KEY).toBe('채널 키');
      expect(PG_APPROVAL_COPY.DIFF_CHANNEL_KEY_TEST).toBe('테스트 채널 키');
      expect(PG_APPROVAL_COPY.TEST_BEFORE_APPROVE_PENDING_HINT).toBe(
        '대기 수정 시 연결 시험 필수'
      );
    });
  });

  describe('shouldShowReapprovalBadge', () => {
    it('hasPendingEdit true + APPROVED 이면 재승인 배지', () => {
      expect(
        shouldShowReapprovalBadge({
          hasPendingEdit: true,
          status: 'ACTIVE',
          approvalStatus: 'APPROVED'
        })
      ).toBe(true);
    });

    it('ACTIVE+PENDING 레거시도 true', () => {
      expect(
        shouldShowReapprovalBadge({
          status: 'ACTIVE',
          approvalStatus: 'PENDING'
        })
      ).toBe(true);
    });

    it('pending 없으면 false', () => {
      expect(
        shouldShowReapprovalBadge({
          hasPendingEdit: false,
          status: 'ACTIVE',
          approvalStatus: 'APPROVED'
        })
      ).toBe(false);
    });
  });

  describe('isConnectionTestForcedForPending / resolveApproveTestConnection', () => {
    it('pending 이면 연결 시험 강제', () => {
      expect(isConnectionTestForcedForPending({ hasPendingEdit: true })).toBe(true);
      expect(isConnectionTestForcedForPending({ hasPendingEdit: false })).toBe(false);
    });

    it('pending 이면 userChecked=false 여도 true', () => {
      expect(resolveApproveTestConnection(true, false)).toBe(true);
      expect(resolveApproveTestConnection(false, false)).toBe(false);
      expect(resolveApproveTestConnection(false, true)).toBe(true);
    });
  });

  describe('maskMerchantId', () => {
    it('짧으면 ****', () => {
      expect(maskMerchantId('ab')).toBe('****');
      expect(maskMerchantId('abcd')).toBe('****');
    });

    it('8자 이하면 앞2+****+뒤2', () => {
      expect(maskMerchantId('abcdef')).toBe('ab****ef');
      expect(maskMerchantId('abcdefgh')).toBe('ab****gh');
    });

    it('길면 앞4+****+뒤4', () => {
      expect(maskMerchantId('merchant12345678')).toBe('merc****5678');
    });

    it('빈 값은 —', () => {
      expect(maskMerchantId('')).toBe(PG_APPROVAL_COPY.MERCHANT_EMPTY);
      expect(maskMerchantId(null)).toBe(PG_APPROVAL_COPY.MERCHANT_EMPTY);
    });
  });

  describe('resolveCenterDisplayName', () => {
    it('센터명 우선, 없으면 tenantId', () => {
      expect(resolveCenterDisplayName({ centerName: '마음센터', tenantId: 't1' })).toBe('마음센터');
      expect(resolveCenterDisplayName({ tenantId: 't1' })).toBe('t1');
    });
  });

  describe('resolvePgDisplayName', () => {
    it('pgName 우선, 없으면 provider', () => {
      expect(resolvePgDisplayName({ pgName: '토스', pgProvider: 'TOSS' })).toBe('토스');
      expect(resolvePgDisplayName({ pgProvider: 'TOSS' })).toBe('TOSS');
    });
  });
});
