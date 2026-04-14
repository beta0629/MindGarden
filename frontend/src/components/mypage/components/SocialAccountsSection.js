import React from 'react';
import MGButton from '../../common/MGButton';

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
      <li key={provider} className="mg-mypage__list-item">
        <div className="mg-mypage__list-item-main">
          <div className="mg-mypage__readonly-row">
            <span className="mg-mypage__provider-glyph" aria-hidden="true">
              {provider === 'KAKAO' ? 'K' : provider === 'NAVER' ? 'N' : '·'}
            </span>
            <div>
              <p className="mg-mypage__device-name">{providerLabel(provider)}</p>
              {isLinked ? (
                <p className="mg-mypage__readonly-value">{maskIdentifier(linkedAccount.providerUsername)}</p>
              ) : (
                <p className="mg-mypage__section-description">아직 연결되지 않았습니다.</p>
              )}
            </div>
          </div>
        </div>
        <div className="mg-mypage__list-item-meta">
          {isLinked ? (
            <>
              <span className="mg-v2-status-badge mg-v2-badge--success" role="status">
                연결됨
              </span>
              <MGButton
                type="button"
                className="mg-v2-button mg-v2-button--outline mg-v2-button--danger"
                onClick={() => onUnlinkAccount(linkedAccount.provider, linkedAccount.id)}
                variant="danger"
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
                className="mg-v2-button mg-v2-button--primary"
                onClick={() => onLinkAccount(provider)}
                variant="primary"
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
    <article className="mg-v2-ad-b0kla__card mg-mypage__card" aria-labelledby="mg-mypage-social-title">
      <div className="mg-mypage__section-head">
        <span className="mg-mypage__section-accent" aria-hidden="true" />
        <div className="mg-mypage__section-head-text">
          <h2 id="mg-mypage-social-title" className="mg-mypage__section-title">
            연결된 계정
          </h2>
        </div>
      </div>
      <ul className="mg-mypage__list">
        {renderRow('KAKAO', kakaoAccount)}
        {renderRow('NAVER', naverAccount)}
      </ul>
      <div className="mg-v2-card-actions">
        <MGButton
          type="button"
          className="mg-v2-button mg-v2-button--outline"
          onClick={onSupportClick}
          variant="outline"
          preventDoubleClick={false}
        >
          고객센터
        </MGButton>
      </div>
    </article>
  );
};

export default SocialAccountsSection;
