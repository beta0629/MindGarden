import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import './LoadingSpinnerDemo.css';

const LoadingSpinnerDemo = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggleLoading = () => {
    setIsLoading(!isLoading);
  };

  return (
    <div className="loading-demo-container">
      <h2>로딩 스피너 데모</h2>
      
      <div className="demo-section">
        <h3>기본 스피너</h3>
        <div className="demo-grid">
          <div className="demo-item">
            <h4>기본 (default)</h4>
            <LoadingSpinner text="기본 로딩" size="medium" />
          </div>
          
          <div className="demo-item">
            <h4>도트 (dots)</h4>
            <LoadingSpinner variant="dots" text="도트 로딩" size="medium" />
          </div>
          
          <div className="demo-item">
            <h4>펄스 (pulse)</h4>
            <LoadingSpinner variant="pulse" text="펄스 로딩" size="medium" />
          </div>
          
          <div className="demo-item">
            <h4>바 (bars)</h4>
            <LoadingSpinner variant="bars" text="바 로딩" size="medium" />
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h3>크기별 스피너</h3>
        <div className="demo-grid">
          <div className="demo-item">
            <h4>Small</h4>
            <LoadingSpinner text="작은 크기" size="small" />
          </div>
          
          <div className="demo-item">
            <h4>Medium</h4>
            <LoadingSpinner text="중간 크기" size="medium" />
          </div>
          
          <div className="demo-item">
            <h4>Large</h4>
            <LoadingSpinner text="큰 크기" size="large" />
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h3>특수 스타일</h3>
        <div className="demo-grid">
          <div className="demo-item">
            <h4>인라인 로딩</h4>
            <LoadingSpinner 
              text="인라인 로딩" 
              size="medium" 
              className="loading-spinner-inline"
            />
          </div>
          
          <div className="demo-item">
            <h4>텍스트 없음</h4>
            <LoadingSpinner 
              size="medium" 
              showText={false}
            />
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h3>전체 화면 로딩</h3>
        <button 
          className="demo-button"
          onClick={handleToggleLoading}
        >
          {isLoading ? '로딩 중지' : '전체 화면 로딩 시작'}
        </button>
        
        {isLoading && (
          <LoadingSpinner 
            text="전체 화면 로딩 중..." 
            size="large" 
            className="loading-spinner-fullscreen"
          />
        )}
      </div>

      <div className="demo-section">
        <h3>사용법</h3>
        <div className="usage-examples">
          <pre>{`// 기본 사용
<LoadingSpinner text="로딩 중..." size="medium" />

// 도트 스타일
<LoadingSpinner variant="dots" text="도트 로딩" size="medium" />

// 펄스 스타일
<LoadingSpinner variant="pulse" text="펄스 로딩" size="large" />

// 바 스타일
<LoadingSpinner variant="bars" text="바 로딩" size="small" />

// 전체 화면 로딩
<LoadingSpinner 
  text="전체 화면 로딩 중..." 
  size="large" 
  className="loading-spinner-fullscreen"
/>

// 인라인 로딩
<LoadingSpinner 
  text="인라인 로딩" 
  size="medium" 
  className="loading-spinner-inline"
/>

// 텍스트 없음
<LoadingSpinner size="medium" showText={false} />`}</pre>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinnerDemo;
