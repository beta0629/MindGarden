import React from 'react';
import './SettingsSection.css';

const SettingsSection = () => {
  return (
    <div className="mypage-section">
      <h2>설정</h2>
      <div className="settings-list">
        <div className="setting-item">
          <div className="setting-info">
            <h3>알림 설정</h3>
            <p>이메일 및 푸시 알림을 관리합니다</p>
          </div>
          <button className="setting-btn">설정</button>
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <h3>언어 설정</h3>
            <p>사용 언어를 변경합니다</p>
          </div>
          <button className="setting-btn">설정</button>
        </div>
        <div className="setting-item">
          <div className="setting-info">
            <h3>테마 설정</h3>
            <p>화면 테마를 변경합니다</p>
          </div>
          <button className="setting-btn">설정</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
