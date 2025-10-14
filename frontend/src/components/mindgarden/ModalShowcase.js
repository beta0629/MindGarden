import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { X, AlertTriangle } from 'lucide-react';

const ModalShowcase = () => {
  const [showBasicModal, setShowBasicModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const BasicModal = () => (
    showBasicModal ? ReactDOM.createPortal(
        <div className="mg-modal-overlay" onClick={() => setShowBasicModal(false)}>
          <div className="mg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mg-modal-header">
              <h3 className="mg-modal-title">기본 모달</h3>
              <button 
                className="mg-modal-close"
                onClick={() => setShowBasicModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mg-modal-body">
              <p className="mg-body-medium">
                이것은 기본 모달입니다. 닫기 버튼을 클릭하거나 외부를 클릭하면 모달이 닫힙니다.
              </p>
              <p className="mg-body-medium mg-mt-md">
                모달은 중요한 정보를 표시하거나 사용자의 입력을 받을 때 사용됩니다.
              </p>
            </div>
            <div className="mg-modal-footer">
              <button 
                className="mg-button mg-button-primary"
                onClick={() => setShowBasicModal(false)}
              >
                확인
              </button>
            </div>
          </div>
        </div>,
      document.body
    ) : null
  );

  const ConfirmModal = () => (
    showConfirmModal ? ReactDOM.createPortal(
        <div className="mg-modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="mg-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mg-modal-header">
              <div className="mg-flex mg-gap-sm" style={{ alignItems: 'center' }}>
                <AlertTriangle size={24} color="#f59e0b" />
                <h3 className="mg-modal-title">확인이 필요합니다</h3>
              </div>
              <button 
                className="mg-modal-close"
                onClick={() => setShowConfirmModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mg-modal-body">
              <p className="mg-body-medium">
                정말로 이 작업을 수행하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <div className="mg-modal-footer">
              <button 
                className="mg-button mg-button-outline"
                onClick={() => setShowConfirmModal(false)}
              >
                취소
              </button>
              <button 
                className="mg-button mg-button-danger"
                onClick={() => {
                  alert('작업이 완료되었습니다!');
                  setShowConfirmModal(false);
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>,
      document.body
    ) : null
  );

  return (
    <section className="mg-section">
      <h2 className="mg-h2 mg-text-center mg-mb-lg">모달</h2>
      
      <div className="mg-card mg-p-xl">
        <div className="mg-flex mg-gap-md" style={{ flexWrap: 'wrap' }}>
          <button 
            className="mg-button mg-button-primary"
            onClick={() => setShowBasicModal(true)}
          >
            기본 모달 열기
          </button>
          
          <button 
            className="mg-button mg-button-secondary"
            onClick={() => setShowConfirmModal(true)}
          >
            확인 모달 열기
          </button>
        </div>
      </div>
      
      <BasicModal />
      <ConfirmModal />
    </section>
  );
};

export default ModalShowcase;

