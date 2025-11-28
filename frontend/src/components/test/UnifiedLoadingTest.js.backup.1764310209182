import React, { useState } from 'react';
import UnifiedLoading from '../common/UnifiedLoading';

/**
 * UnifiedLoading 테스트 컴포넌트
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
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          인라인 로딩
        </button>
        
        <button 
          onClick={() => toggleLoading('fullscreen')}
          style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          전체화면 로딩
        </button>
        
        <button 
          onClick={() => toggleLoading('page')}
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          페이지 로딩
        </button>
        
        <button 
          onClick={() => toggleLoading('button')}
          style={{ padding: '10px 20px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          버튼 로딩
        </button>
        
        <button 
          onClick={() => toggleLoading('dots')}
          style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          도트 로딩
        </button>
        
        <button 
          onClick={() => toggleLoading('pulse')}
          style={{ padding: '10px 20px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          펄스 로딩
        </button>
        
        <button 
          onClick={() => toggleLoading('bars')}
          style={{ padding: '10px 20px', backgroundColor: '#20c997', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          바 로딩
        </button>
      </div>

      {/* 인라인 로딩 */}
      {loadingStates.inline && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>인라인 로딩</h3>
          <UnifiedLoading 
            type="inline"
            text="데이터를 불러오는 중..."
            size="medium"
            variant="spinner"
          />
        </div>
      )}

      {/* 페이지 로딩 */}
      {loadingStates.page && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', minHeight: '200px' }}>
          <h3>페이지 로딩</h3>
          <UnifiedLoading 
            type="page"
            text="페이지를 불러오는 중..."
            size="large"
            variant="spinner"
          />
        </div>
      )}

      {/* 버튼 로딩 */}
      {loadingStates.button && (
        <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h3>버튼 로딩</h3>
          <button style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <UnifiedLoading 
              type="button"
              text=""
              size="small"
              variant="spinner"
              showText={false}
              centered={false}
            />
            저장 중...
          </button>
        </div>
      )}

      {/* 다양한 스타일 로딩 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        {loadingStates.dots && (
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
            <h4>도트 로딩</h4>
            <UnifiedLoading 
              type="inline"
              text="도트 로딩 중..."
              size="medium"
              variant="dots"
            />
          </div>
        )}
        
        {loadingStates.pulse && (
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
            <h4>펄스 로딩</h4>
            <UnifiedLoading 
              type="inline"
              text="펄스 로딩 중..."
              size="medium"
              variant="pulse"
            />
          </div>
        )}
        
        {loadingStates.bars && (
          <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', textAlign: 'center' }}>
            <h4>바 로딩</h4>
            <UnifiedLoading 
              type="inline"
              text="바 로딩 중..."
              size="medium"
              variant="bars"
            />
          </div>
        )}
      </div>

      {/* 전체화면 로딩 */}
      {loadingStates.fullscreen && (
        <UnifiedLoading 
          type="fullscreen"
          text="전체 화면 로딩 중..."
          size="large"
          variant="spinner"
        />
      )}
    </div>
  );
};

export default UnifiedLoadingTest;
