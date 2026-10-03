/**
 * 계정 관리 — 회원 탈퇴는 이 한 곳에서만 (페이지 = brick outline, 최종 확인 모달 = solid).
 * 탈퇴 대기 중이면 기존 WithdrawalPendingWidget 을 그대로 보여 준다.
 *
 * @author CoreSolution
 * @since 2026-10-03
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import MypageSectionPanel from '../layout/MypageSectionPanel';
import MypageDefinitionRows from '../layout/MypageDefinitionRows';
import MypageActionButton from '../layout/MypageActionButton';
import WithdrawalPendingWidget from './WithdrawalPendingWidget';
import {
  MYPAGE_SECTION_KEYS,
  MYPAGE_SECTION_LABELS,
  MYPAGE_SECTION_CAPTIONS,
  MYPAGE_FIELD_LABELS
} from '../../../constants/mypageRoleLayout';

const AccountManagementSection = ({
  onRequestWithdrawal,
  isWithdrawalPending,
  withdrawalStatus,
  onWithdrawalCancelled
}) => {
  const { t } = useTranslation('mypage');

  return (
    <MypageSectionPanel
      sectionKey={MYPAGE_SECTION_KEYS.ACCOUNT}
      title={MYPAGE_SECTION_LABELS[MYPAGE_SECTION_KEYS.ACCOUNT]}
      caption={MYPAGE_SECTION_CAPTIONS[MYPAGE_SECTION_KEYS.ACCOUNT]}
    >
      {isWithdrawalPending ? (
        <WithdrawalPendingWidget
          withdrawalExpiresAt={withdrawalStatus?.withdrawalExpiresAt}
          withdrawalRequestedAt={withdrawalStatus?.withdrawalRequestedAt}
          onCancelled={onWithdrawalCancelled}
        />
      ) : (
        <MypageDefinitionRows
          testId="mypage-account-rows"
          rows={[
            {
              key: 'withdrawal',
              label: MYPAGE_FIELD_LABELS.WITHDRAWAL,
              value: t('withdrawal.sectionDescription'),
              clamp: true,
              action: (
                <MypageActionButton
                  variant="danger-outline"
                  onClick={onRequestWithdrawal}
                  data-testid="mypage-security-withdrawal-button"
                >
                  {t('withdrawal.openModalButton')}
                </MypageActionButton>
              )
            }
          ]}
        />
      )}
    </MypageSectionPanel>
  );
};

export default AccountManagementSection;
