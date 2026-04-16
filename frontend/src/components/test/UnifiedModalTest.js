import React, { useState } from 'react';
import MGButton from '../common/MGButton';
import { buildErpMgButtonClassName, ERP_MG_BUTTON_LOADING_TEXT } from '../erp/common/erpMgButtonProps';
// import UnifiedModal from '../../components/common/modals/UnifiedModal'; // 임시 비활성화
/**
 * UnifiedModal 테스트 컴포넌트
/**
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
        <MGButton
          variant="primary"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'primary', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => openModal('basic')}
        >
          기본 모달
        </MGButton>

        <MGButton
          variant="warning"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'warning', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => openModal('confirm')}
        >
          확인 모달
        </MGButton>

        <MGButton
          variant="success"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'success', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => openModal('form')}
        >
          폼 모달
        </MGButton>

        <MGButton
          variant="info"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'info', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => openModal('large')}
        >
          큰 모달
        </MGButton>

        <MGButton
          variant="warning"
          size="medium"
          className={buildErpMgButtonClassName({ variant: 'warning', size: 'md', loading: false })}
          loadingText={ERP_MG_BUTTON_LOADING_TEXT}
          onClick={() => openModal('loading')}
        >
          로딩 모달
        </MGButton>
      </div>

      {/* 기본 모달 */}
      <div className="mg-modal"
        isOpen={modals.basic}
        onClose={() => closeModal('basic')}
        title="기본 모달"
        subtitle="이것은 기본 모달입니다."
        size="medium"
        variant="default"
      >
        <p>이것은 기본 모달의 내용입니다.</p>
        <p>ESC 키를 누르거나 배경을 클릭하면 닫힙니다.</p>
      </div>

      {/* 확인 모달 */}
      <div className="mg-modal"
        isOpen={modals.confirm}
        onClose={() => closeModal('confirm')}
        title="확인 모달"
        subtitle="정말로 이 작업을 수행하시겠습니까?"
        size="small"
        variant="confirm"
        actions={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <MGButton
              variant="secondary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => closeModal('confirm')}
            >
              취소
            </MGButton>
            <MGButton
              variant="danger"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'danger', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => closeModal('confirm')}
            >
              확인
            </MGButton>
          </div>
        }
      >
        <p>이 작업은 되돌릴 수 없습니다.</p>
      </div>

      {/* 폼 모달 */}
      <div className="mg-modal"
        isOpen={modals.form}
        onClose={() => closeModal('form')}
        title="폼 모달"
        subtitle="정보를 입력해주세요."
        size="medium"
        variant="form"
        actions={
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <MGButton
              type="button"
              variant="secondary"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'secondary', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
              onClick={() => closeModal('form')}
            >
              취소
            </MGButton>
            <MGButton
              type="submit"
              form="test-form"
              variant="success"
              size="small"
              className={buildErpMgButtonClassName({ variant: 'success', size: 'sm', loading: false })}
              loadingText={ERP_MG_BUTTON_LOADING_TEXT}
            >
              저장
            </MGButton>
          </div>
        }
      >
        <form id="test-form" onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이름:</label>
            <input 
              type="text" 
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              placeholder="이름을 입력하세요"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이메일:</label>
            <input 
              type="email" 
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              placeholder="이메일을 입력하세요"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>메모:</label>
            <textarea 
              // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #ddd -> var(--mg-custom-ddd)
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', height: '80px' }}
              placeholder="메모를 입력하세요"
            />
          </div>
        </form>
      </div>

      {/* 큰 모달 */}
      <div className="mg-modal"
        isOpen={modals.large}
        onClose={() => closeModal('large')}
        title="큰 모달"
        subtitle="더 많은 내용을 표시할 수 있습니다."
        size="large"
        variant="default"
      >
        <div style={{ height: '400px', overflowY: 'auto', padding: '10px', backgroundColor: 'var(--mg-gray-100)', borderRadius: '4px' }}>
          <h3>스크롤 가능한 내용</h3>
          {Array.from({ length: 50 }, (_, i) => (
            <p key={i}>이것은 {i + 1}번째 줄입니다. 스크롤을 확인해보세요.</p>
          ))}
        </div>
      </div>

      {/* 로딩 모달 */}
      <div className="mg-modal"
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
      </div>
    </div>
  );
};

export default UnifiedModalTest;
