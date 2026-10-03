import React from 'react';
import MypageSectionPanel from '../layout/MypageSectionPanel';
import MypageDefinitionRows from '../layout/MypageDefinitionRows';
import MypageActionButton from '../layout/MypageActionButton';
import {
  MYPAGE_SECTION_KEYS,
  MYPAGE_SECTION_LABELS,
  MYPAGE_SECTION_CAPTIONS,
  MYPAGE_SOCIAL_PROVIDER_LABELS,
  MYPAGE_SOCIAL_COPY
} from '../../../constants/mypageRoleLayout';

const SOCIAL_PROVIDERS = ['KAKAO', 'NAVER'];

const maskIdentifier = (text) => {
  if (!text) return '';
  if (text.includes('@')) {
    const [local, domain] = text.split('@');
    const vis = local.slice(0, 2);
    return `${vis}***@${domain}`;
  }
  if (text.length > 6) {
    return `${text.slice(0, 3)}***${text.slice(-2)}`;
  }
  return text;
};

const providerLabel = (provider) => MYPAGE_SOCIAL_PROVIDER_LABELS[provider] || provider || MYPAGE_SOCIAL_COPY.OTHER;

/**
 * 연결된 계정 — 카카오/네이버 행 (상태 칩 · 연결/해제)
 */
const SocialAccountsSection = ({ socialAccounts, onLinkAccount, onUnlinkAccount }) => {
  const list = Array.isArray(socialAccounts) ? socialAccounts : [];

  const rows = SOCIAL_PROVIDERS.map((provider) => {
    const linkedAccount = list.find((a) => a.provider === provider);
    const isLinked = !!linkedAccount;
    return {
      key: `social-${provider.toLowerCase()}`,
      label: providerLabel(provider),
      value: isLinked
        ? (maskIdentifier(linkedAccount.providerUsername) || MYPAGE_SOCIAL_COPY.LINKED)
        : MYPAGE_SOCIAL_COPY.NOT_LINKED_VALUE,
      caption: isLinked ? MYPAGE_SOCIAL_COPY.LINKED : MYPAGE_SOCIAL_COPY.NOT_LINKED,
      action: isLinked ? (
        <MypageActionButton
          variant="ghost"
          onClick={() => onUnlinkAccount(linkedAccount.provider, linkedAccount.id)}
          aria-label={`${providerLabel(provider)} ${MYPAGE_SOCIAL_COPY.UNLINK}`}
        >
          {MYPAGE_SOCIAL_COPY.UNLINK}
        </MypageActionButton>
      ) : (
        <MypageActionButton
          variant="outline"
          onClick={() => onLinkAccount(provider)}
          preventDoubleClick
          aria-label={`${providerLabel(provider)} ${MYPAGE_SOCIAL_COPY.LINK}`}
        >
          {MYPAGE_SOCIAL_COPY.LINK}
        </MypageActionButton>
      )
    };
  });

  return (
    <MypageSectionPanel
      sectionKey={MYPAGE_SECTION_KEYS.SOCIAL}
      title={MYPAGE_SECTION_LABELS[MYPAGE_SECTION_KEYS.SOCIAL]}
      caption={MYPAGE_SECTION_CAPTIONS[MYPAGE_SECTION_KEYS.SOCIAL]}
    >
      <MypageDefinitionRows rows={rows} testId="mypage-social-rows" />
    </MypageSectionPanel>
  );
};

export default SocialAccountsSection;
