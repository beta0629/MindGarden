import React from 'react';
import './SocialAccountsSection.css';

const SocialAccountsSection = ({ 
  socialAccounts, 
  onLinkAccount, 
  onUnlinkAccount 
}) => {
  return (
    <div className="mypage-section">
      <h2>소셜 계정 관리</h2>
      <div className="social-accounts-list">
        {socialAccounts.length > 0 ? (
          socialAccounts.map((account) => (
            <div key={account.id} className="social-account-item">
              <div className="social-account-info">
                <div className="social-provider-icon">
                  {account.provider === 'KAKAO' ? (
                    <i className="bi bi-chat-dots-fill social-icon social-icon--kakao"></i>
                  ) : account.provider === 'NAVER' ? (
                    <i className="bi bi-n-circle-fill social-icon social-icon--naver"></i>
                  ) : (
                    <i className="bi bi-person-circle"></i>
                  )}
                </div>
                <div className="social-account-details">
                  <h3>{account.provider === 'KAKAO' ? '카카오' : account.provider === 'NAVER' ? '네이버' : account.provider} 계정</h3>
                  <p>{account.providerUsername || '사용자명 없음'}</p>
                  {account.providerProfileImage && (
                    <div className="social-profile-image">
                      <img 
                        src={account.providerProfileImage} 
                        alt="소셜 프로필 이미지"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="social-account-actions">
                <button 
                  className="unlink-btn"
                  onClick={() => onUnlinkAccount(account.provider)}
                >
                  연동 해제
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-social-accounts">
            <p>연동된 소셜 계정이 없습니다.</p>
          </div>
        )}
        
        <div className="link-new-account">
          <h3>새로운 소셜 계정 연동</h3>
          <div className="link-options">
            <button 
              className="link-btn kakao"
              onClick={() => onLinkAccount('KAKAO')}
            >
              <i className="bi bi-chat-dots-fill"></i>
              카카오 계정 연동
            </button>
            <button 
              className="link-btn naver"
              onClick={() => onLinkAccount('NAVER')}
            >
              <i className="bi bi-n-circle-fill"></i>
              네이버 계정 연동
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialAccountsSection;
