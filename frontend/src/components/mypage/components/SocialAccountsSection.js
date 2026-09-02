import React from 'react';
import MGButton from '../../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../../erp/common/erpMgButtonProps';

const maskIdentifier = (text) => {
  if (!text) return '—';
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

const providerLabel = (provider) => {
  if (provider === 'KAKAO') return 'Kakao';
  if (provider === 'NAVER') return 'Naver';
  return provider || '기타';
};

const SocialAccountsSection = ({ socialAccounts, onLinkAccount, onUnlinkAccount, onSupportClick }) => {
  const list = Array.isArray(socialAccounts) ? socialAccounts : [];
  const kakaoAccount = list.find((a) => a.provider === 'KAKAO');
  const naverAccount = list.find((a) => a.provider === 'NAVER');

  const renderRow = (provider, linkedAccount) => {
    const isLinked = !!linkedAccount;
    return (
      <li key={provider} className="mg-mypage-clinic-os__list-item">
        <div className="mg-mypage-clinic-os__list-item-main">
          <div className="mg-mypage-clinic-os__action-row">
            <span className="mg-mypage-clinic-os__provider-label" aria-hidden="true">
              {provider === 'KAKAO' ? 'K' : provider === 'NAVER' ? 'N' : '·'}
            </span>
            <div>
              <p className="mg-mypage-clinic-os__item-title">{providerLabel(provider)}</p>
              {isLinked ? (
                <p className="mg-mypage-clinic-os__readonly-value">
                  {maskIdentifier(linkedAccount.providerUsername)}
                </p>
              ) : (
                <p className="mg-mypage-clinic-os__section-description">아직 연결되지 않았습니다.</p>
              )}
            </div>
          </div>
        </div>
        <div className="mg-mypage-clinic-os__list-item-meta">
          {isLinked ? (
            <>
              <span className="mg-v2-status-badge mg-v2-badge--success" role="status">
                연결됨
              </span>
              <MGButton
                type="button"
                variant="danger"
                size="small"
                className={buildErpMgButtonClassName({ variant: 'danger', size: 'sm', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => onUnlinkAccount(linkedAccount.provider, linkedAccount.id)}
                preventDoubleClick={false}
              >
                연결 해제
              </MGButton>
            </>
          ) : (
            <>
              <span className="mg-v2-status-badge mg-v2-badge--neutral" role="status">
                미연결
              </span>
              <MGButton
                type="button"
                variant="primary"
                size="small"
                className={buildErpMgButtonClassName({ variant: 'primary', size: 'sm', loading: false })}
                loadingText={ERP_MG_BUTTON_LOADING_TEXT}
                onClick={() => onLinkAccount(provider)}
              >
                연결하기
              </MGButton>
            </>
          )}
        </div>
      </li>
    );
  };

  return (
    <article className="mg-mypage-clinic-os__section" aria-labelledby="mg-mypage-social-title">
      <div className="mg-mypage-clinic-os__section-head">
        <div className="mg-mypage-clinic-os__section-head-text">
          <h2 id="mg-mypage-social-title" className="mg-mypage-clinic-os__section-title">
            연결된 계정
          </h2>
        </div>
      </div>
      <ul className="mg-mypage-clinic-os__list">
        {renderRow('KAKAO', kakaoAccount)}
        {renderRow('NAVER', naverAccount)}
      </ul>
      <div className="mg-mypage-clinic-os__card-actions">
        <MGButton
          type="button"
          variant="ghost"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'ghost', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={onSupportClick}
          preventDoubleClick={false}
        >
          고객센터
        </MGButton>
      </div>
    </article>
  );
};

export default SocialAccountsSection;
