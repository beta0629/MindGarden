import React, { useState } from 'react';
import MGButton from '../common/MGButton';
// import UnifiedLoading from '../../components/common/UnifiedLoading'; // 임시 비활성화
/**
 * UnifiedLoading 테스트 컴포넌트
/**
 * 다양한 로딩 설정을 테스트할 수 있습니다.
 */
const UnifiedLoadingTest = () => {
  const [loadingStates, setLoadingStates] = useState({
    inline: false,
    fullscreen: false,
    page: false,
    button: false,
    dots: false,
    pulse: false,
    bars: false
  });

  const toggleLoading = (type) => {
    setLoadingStates(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔄 UnifiedLoading 테스트</h1>
      <p>다양한 로딩 설정을 테스트해보세요.</p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <MGButton variant="primary" size="medium" onClick={() => toggleLoading('inline')}>
          인라인 로딩
        </MGButton>

        <MGButton variant="danger" size="medium" onClick={() => toggleLoading('fullscreen')}>
          전체화면 로딩
        </MGButton>

        <MGButton variant="success" size="medium" onClick={() => toggleLoading('page')}>
          페이지 로딩
        </MGButton>

        <MGButton variant="warning" size="medium" onClick={() => toggleLoading('button')}>
          버튼 로딩
        </MGButton>

        <MGButton variant="info" size="medium" onClick={() => toggleLoading('dots')}>
          도트 로딩
        </MGButton>

        <MGButton variant="outline" size="medium" onClick={() => toggleLoading('pulse')}>
          펄스 로딩
        </MGButton>

        <MGButton variant="secondary" size="medium" onClick={() => toggleLoading('bars')}>
          바 로딩
        </MGButton>
      </div>

      {/* 인라인 로딩 */}
      {loadingStates.inline && (
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>인라인 로딩</h3>
          <div className="mg-loading">로딩중...</div>
        </div>
      )}

      {/* 페이지 로딩 */}
      {loadingStates.page && (
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', minHeight: '200px' }}>
          <h3>페이지 로딩</h3>
          <div className="mg-loading">로딩중...</div>
        </div>
      )}

      {/* 버튼 로딩 */}
      {loadingStates.button && (
        // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>버튼 로딩</h3>
          <MGButton variant="primary" size="medium" loading loadingText="저장 중...">
            저장
          </MGButton>
        </div>
      )}

      {/* 다양한 스타일 로딩 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {loadingStates.dots && (
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
            <h4>도트 로딩</h4>
            <div className="mg-loading">로딩중...</div>
          </div>
        )}
        
        {loadingStates.pulse && (
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
            <h4>펄스 로딩</h4>
            <div className="mg-loading">로딩중...</div>
          </div>
        )}
        
        {loadingStates.bars && (
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
            <h4>바 로딩</h4>
            <div className="mg-loading">로딩중...</div>
          </div>
        )}
      </div>

      {/* 전체화면 로딩 */}
      {loadingStates.fullscreen && (
        <div className="mg-loading">로딩중...</div>
      )}
    </div>
  );
};

export default UnifiedLoadingTest;
