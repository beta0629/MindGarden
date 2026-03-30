import React, { useState } from 'react';
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
        <button 
          onClick={() => toggleLoading('inline')}
          style={{ padding: '10px 20px', backgroundColor: 'var(--mg-primary-500)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          인라인 로딩
        </button>
        
        <button 
          onClick={() => toggleLoading('fullscreen')}
          style={{ padding: '10px 20px', backgroundColor: 'var(--mg-error-500)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          전체화면 로딩
        </button>
        
        <button 
          onClick={() => toggleLoading('page')}
          style={{ padding: '10px 20px', backgroundColor: 'var(--mg-success-500)', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          페이지 로딩
        </button>
        
        <button 
          onClick={() => toggleLoading('button')}
          style={{ padding: '10px 20px', backgroundColor: 'var(--mg-warning-500)', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          버튼 로딩
        </button>
        
        <button 
          onClick={() => toggleLoading('dots')}
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6f42c1 -> var(--mg-custom-6f42c1)
          style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          도트 로딩
        </button>
        
        <button 
          onClick={() => toggleLoading('pulse')}
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #fd7e14 -> var(--mg-custom-fd7e14)
          style={{ padding: '10px 20px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          펄스 로딩
        </button>
        
        <button 
          onClick={() => toggleLoading('bars')}
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #20c997 -> var(--mg-custom-20c997)
          style={{ padding: '10px 20px', backgroundColor: '#20c997', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          바 로딩
        </button>
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
          <button style={{ 
            padding: '10px 20px', 
            backgroundColor: 'var(--mg-primary-500)', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div className="mg-loading">로딩중...</div>
            저장 중...
          </button>
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
