import React, { useEffect, useRef } from 'react';
import { useSession } from '../../contexts/SessionContext';
import UnifiedModal from './modals/UnifiedModal';
import Button from '../ui/Button/Button';

/**
 * 컴팩트 확인 모달 컴포넌트
 * 로그아웃 같은 간단한 확인 작업에 사용하는 작은 크기 모달
 * 사용처: SimpleHamburgerMenu.
 * @deprecated ConfirmModal 사용 권장. 통일 시 ConfirmModal에 size="compact" 지원 검토 가능.
 *
 * @param {Object} props - 컴포넌트 props
 * @param {boolean} props.isOpen - 모달 열림/닫힘 상태
 * @param {function} props.onClose - 모달 닫기 핸들러
 * @param {function} props.onConfirm - 확인 버튼 클릭 핸들러
 * @param {string} props.title - 모달 제목
 * @param {string} props.message - 확인 메시지
 * @param {string} props.confirmText - 확인 버튼 텍스트
 * @param {string} props.cancelText - 취소 버튼 텍스트
 * @param {string} props.type - 모달 타입 (default, danger)
 */
const CompactConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  message = '정말로 진행하시겠습니까?',
  confirmText = '확인',
  cancelText = '취소',
  type = 'default'
}) => {
  const { setModalOpen } = useSession();
  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen !== prevIsOpenRef.current) {
      setModalOpen(isOpen);
      if (isOpen) {
        console.log('📱 컴팩트 확인 모달 열림 - 세션 체크 일시 중단');
      } else {
        console.log('📱 컴팩트 확인 모달 닫힘 - 세션 체크 재개');
      }
      prevIsOpenRef.current = isOpen;
    }
  }, [isOpen, setModalOpen]);

  useEffect(() => {
    return () => {
      setModalOpen(false);
      console.log('📱 컴팩트 확인 모달 언마운트 - 세션 체크 재개');
    };
  }, []);

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <UnifiedModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      backdropClick
      showCloseButton
      actions={
        <>
          <Button variant="outline" size="medium" onClick={onClose} preventDoubleClick={false}>
            {cancelText}
          </Button>
          <Button
            variant={type === 'danger' ? 'danger' : 'primary'}
            size="medium"
            onClick={handleConfirm}
            preventDoubleClick={false}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p
        style={{
          textAlign: 'center',
          margin: 0,
          fontSize: '14px',
          color: 'var(--color-text-secondary)',
          lineHeight: '1.5'
        }}
      >
        {message}
      </p>
    </UnifiedModal>
  );
};

export default CompactConfirmModal;
