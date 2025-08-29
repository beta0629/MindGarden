import React from 'react';
import './SecuritySection.css';

const SecuritySection = ({ onPasswordReset }) => {
  return (
    <div className="mypage-section">
      <h2>보안</h2>
      <div className="security-list">
        <div className="security-item">
          <div className="security-info">
            <h3>비밀번호 변경</h3>
            <p>현재 비밀번호를 변경합니다</p>
          </div>
          <button className="security-btn">변경</button>
        </div>
        <div className="security-item">
          <div className="security-info">
            <h3>비밀번호 찾기</h3>
            <p>비밀번호를 잊어버린 경우 재설정합니다</p>
          </div>
          <button className="security-btn" onClick={onPasswordReset}>
            재설정
          </button>
        </div>
        <div className="security-item">
          <div className="security-info">
            <h3>2단계 인증</h3>
            <p>추가 보안을 위해 2단계 인증을 설정합니다</p>
          </div>
          <button className="security-btn">설정</button>
        </div>
      </div>
    </div>
  );
};

export default SecuritySection;
