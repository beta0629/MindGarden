import React, { useState } from 'react';
import UnifiedModal from '../common/modals/UnifiedModal';

/**
 * UnifiedModal 테스트 컴포넌트
 * 다양한 모달 설정을 테스트할 수 있습니다.
 */
const UnifiedModalTest = () => {
  const [modals, setModals] = useState({
    basic: false,
    confirm: false,
    form: false,
    large: false,
    loading: false
  });

  const openModal = (type) => {
    setModals(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setModals(prev => ({ ...prev, [type]: false }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('폼 제출됨');
    closeModal('form');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🎯 UnifiedModal 테스트</h1>
      <p>다양한 모달 설정을 테스트해보세요.</p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button 
          onClick={() => openModal('basic')}
          style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          기본 모달
        </button>
        
        <button 
          onClick={() => openModal('confirm')}
          style={{ padding: '10px 20px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          확인 모달
        </button>
        
        <button 
          onClick={() => openModal('form')}
          style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          폼 모달
        </button>
        
        <button 
          onClick={() => openModal('large')}
          style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          큰 모달
        </button>
        
        <button 
          onClick={() => openModal('loading')}
          style={{ padding: '10px 20px', backgroundColor: '#fd7e14', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          로딩 모달
        </button>
      </div>

      {/* 기본 모달 */}
      <UnifiedModal
        isOpen={modals.basic}
        onClose={() => closeModal('basic')}
        title="기본 모달"
        subtitle="이것은 기본 모달입니다."
        size="medium"
        variant="default"
      >
        <p>이것은 기본 모달의 내용입니다.</p>
        <p>ESC 키를 누르거나 배경을 클릭하면 닫힙니다.</p>
      </UnifiedModal>

      {/* 확인 모달 */}
      <UnifiedModal
        isOpen={modals.confirm}
        onClose={() => closeModal('confirm')}
        title="확인 모달"
        subtitle="정말로 이 작업을 수행하시겠습니까?"
        size="small"
        variant="confirm"
        actions={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => closeModal('confirm')}
              style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              취소
            </button>
            <button 
              onClick={() => closeModal('confirm')}
              style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              확인
            </button>
          </div>
        }
      >
        <p>이 작업은 되돌릴 수 없습니다.</p>
      </UnifiedModal>

      {/* 폼 모달 */}
      <UnifiedModal
        isOpen={modals.form}
        onClose={() => closeModal('form')}
        title="폼 모달"
        subtitle="정보를 입력해주세요."
        size="medium"
        variant="form"
        actions={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button 
              type="button"
              onClick={() => closeModal('form')}
              style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              취소
            </button>
            <button 
              type="submit"
              form="test-form"
              style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              저장
            </button>
          </div>
        }
      >
        <form id="test-form" onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이름:</label>
            <input 
              type="text" 
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              placeholder="이름을 입력하세요"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이메일:</label>
            <input 
              type="email" 
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              placeholder="이메일을 입력하세요"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>메모:</label>
            <textarea 
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', height: '80px' }}
              placeholder="메모를 입력하세요"
            />
          </div>
        </form>
      </UnifiedModal>

      {/* 큰 모달 */}
      <UnifiedModal
        isOpen={modals.large}
        onClose={() => closeModal('large')}
        title="큰 모달"
        subtitle="더 많은 내용을 표시할 수 있습니다."
        size="large"
        variant="default"
      >
        <div style={{ height: '400px', overflowY: 'auto', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h3>스크롤 가능한 내용</h3>
          {Array.from({ length: 50 }, (_, i) => (
            <p key={i}>이것은 {i + 1}번째 줄입니다. 스크롤을 확인해보세요.</p>
          ))}
        </div>
      </UnifiedModal>

      {/* 로딩 모달 */}
      <UnifiedModal
        isOpen={modals.loading}
        onClose={() => closeModal('loading')}
        title="로딩 모달"
        subtitle="데이터 처리 중입니다"
        size="medium"
        variant="default"
        loading={true}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h4 style={{ color: 'var(--color-text-primary)', marginBottom: '16px' }}>
            📊 데이터 처리 중
          </h4>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
            서버에서 정보를 가져오고 있습니다.
          </p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            잠시만 기다려주세요...
          </p>
        </div>
      </UnifiedModal>
    </div>
  );
};

export default UnifiedModalTest;
