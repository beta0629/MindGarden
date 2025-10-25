/**
 * Modal 컴포넌트 사용 예시
 */

import {useState} from 'react';

import Button from '../Button/Button';

import Modal from './Modal';

const ModalExamples = () => {const [modals, setModals] = useState({basic: false,
    withTitle: false,
    large: false,
    drawer: false,
    fullscreen: false,
    noCloseButton: false,
    noOverlayClose: false,
    noEscapeClose: false,
    loading: false,
    error: false,
    success: false,
    warning: false,
    info: false});

  const openModal = (modalName) => {setModals(prev => ({...prev, [modalName]: true}));};

  const closeModal = (modalName) => {setModals(prev => ({...prev, [modalName]: false}));};

  const closeAllModals = () => {setModals({basic: false,
      withTitle: false,
      large: false,
      drawer: false,
      fullscreen: false,
      noCloseButton: false,
      noOverlayClose: false,
      noEscapeClose: false,
      loading: false,
      error: false,
      success: false,
      warning: false,
      info: false});};

  return (<div className="mg-v2-v2-v2-section">
      <div className="mg-v2-v2-v2-section-header">
        <h2 className="mg-v2-v2-v2-section-title">Modal 컴포넌트 예시</h2>
        <p className="mg-v2-v2-v2-section-subtitle">
          ReactDOM.createPortal을 사용한 모달 컴포넌트의 다양한 사용법
        </p>
      </div>

      <div className="mg-v2-v2-v2-section-content">
        {/* 기본 사용법 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>기본 사용법</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button onClick={() => openModal('basic')}>
                기본 모달
              </Button>
              <Button onClick={() => openModal('withTitle')} variant="secondary">
                제목 있는 모달
              </Button>
            </div>
          </div>
        </div>

        {/* 크기 변형 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>크기 변형</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button onClick={() => openModal('small')} size="small">
                Small
              </Button>
              <Button onClick={() => openModal('medium')} size="medium">
                Medium
              </Button>
              <Button onClick={() => openModal('large')} size="large">
                Large
              </Button>
              <Button onClick={() => openModal('extraLarge')} variant="outline">
                Extra Large
              </Button>
            </div>
          </div>
        </div>

        {/* 변형 스타일 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>변형 스타일</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button onClick={() => openModal('drawer')} variant="secondary">
                Drawer
              </Button>
              <Button onClick={() => openModal('fullscreen')} variant="outline">
                Fullscreen
              </Button>
              <Button onClick={() => openModal('centered')} variant="ghost">
                Centered
              </Button>
            </div>
          </div>
        </div>

        {/* 닫기 옵션 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>닫기 옵션</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button onClick={() => openModal('noCloseButton')} variant="warning">
                닫기 버튼 없음
              </Button>
              <Button onClick={() => openModal('noOverlayClose')} variant="error">
                오버레이 클릭 비활성화
              </Button>
              <Button onClick={() => openModal('noEscapeClose')} variant="info">
                ESC 키 비활성화
              </Button>
            </div>
          </div>
        </div>

        {/* 상태별 모달 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>상태별 모달</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button onClick={() => openModal('loading')} variant="primary">
                로딩 모달
              </Button>
              <Button onClick={() => openModal('error')} variant="error">
                에러 모달
              </Button>
              <Button onClick={() => openModal('success')} variant="success">
                성공 모달
              </Button>
              <Button onClick={() => openModal('warning')} variant="warning">
                경고 모달
              </Button>
              <Button onClick={() => openModal('info')} variant="info">
                정보 모달
              </Button>
            </div>
          </div>
        </div>

        {/* 실제 사용 예시 */}
        <div className="mg-v2-v2-v2-card">
          <div className="mg-v2-v2-v2-card-header">
            <h3>실제 사용 예시</h3>
          </div>
          <div className="mg-v2-v2-v2-card-content">
            <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-md mg-v2-v2-v2-flex-wrap">
              <Button 
                icon="PLUS" 
                onClick={() => openModal('create')}
              >
                새로 만들기
              </Button>
              <Button 
                icon="EDIT" 
                variant="secondary"
                onClick={() => openModal('edit')}
              >
                편집
              </Button>
              <Button 
                icon="TRASH" 
                variant="error"
                onClick={() => openModal('delete')}
              >
                삭제
              </Button>
              <Button 
                icon="SETTINGS" 
                variant="outline"
                onClick={() => openModal('settings')}
              >
                설정
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <Modal
        isOpen={modals.basic}
        onClose={() => closeModal('basic')}
      >
        <div className="mg-v2-v2-v2-text-center">
          <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-mb-md">기본 모달</h3>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            이것은 기본 모달입니다. 오버레이를 클릭하거나 ESC 키를 눌러 닫을 수 있습니다.
          </p>
          <Button onClick={() => closeModal('basic')}>
            확인
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.withTitle}
        onClose={() => closeModal('withTitle')}
        title="제목 있는 모달"
      >
        <div className="mg-v2-v2-v2-text-center">
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            이 모달은 제목이 있습니다. 헤더에 제목이 표시됩니다.
          </p>
          <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-sm mg-v2-v2-v2-justify-center">
            <Button onClick={() => closeModal('withTitle')}>
              확인
            </Button>
            <Button variant="outline" onClick={() => closeModal('withTitle')}>
              취소
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modals.large}
        onClose={() => closeModal('large')}
        title="큰 모달"
        size="large"
      >
        <div>
          <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-mb-md">큰 모달</h3>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-md">
            이 모달은 큰 크기입니다. 더 많은 내용을 표시할 수 있습니다.
          </p>
          <div className="mg-v2-v2-v2-card mg-v2-v2-v2-mb-md">
            <div className="mg-v2-v2-v2-card-content">
              <h4 className="mg-v2-v2-v2-h4 mg-v2-v2-v2-mb-sm">카드 예시</h4>
              <p className="mg-v2-v2-v2-text-sm">
                모달 안에 카드를 넣을 수도 있습니다.
              </p>
            </div>
          </div>
          <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-sm mg-v2-v2-v2-justify-end">
            <Button variant="outline" onClick={() => closeModal('large')}>
              취소
            </Button>
            <Button onClick={() => closeModal('large')}>
              확인
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modals.drawer}
        onClose={() => closeModal('drawer')}
        title="드로어 모달"
        variant="drawer"
      >
        <div>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-md">
            이 모달은 드로어 스타일입니다. 화면 하단에서 올라옵니다.
          </p>
          <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-sm mg-v2-v2-v2-justify-center">
            <Button onClick={() => closeModal('drawer')}>
              확인
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modals.fullscreen}
        onClose={() => closeModal('fullscreen')}
        title="전체 화면 모달"
        variant="fullscreen"
      >
        <div className="mg-v2-v2-v2-text-center">
          <h3 className="mg-v2-v2-v2-h3 mg-v2-v2-v2-mb-md">전체 화면 모달</h3>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            이 모달은 전체 화면을 차지합니다. 모바일에서 유용합니다.
          </p>
          <Button onClick={() => closeModal('fullscreen')}>
            닫기
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.noCloseButton}
        onClose={() => closeModal('noCloseButton')}
        title="닫기 버튼 없음"
        showCloseButton={false}
      >
        <div className="mg-v2-v2-v2-text-center">
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            이 모달은 닫기 버튼이 없습니다. 오버레이 클릭이나 ESC 키로만 닫을 수 있습니다.
          </p>
          <Button onClick={() => closeModal('noCloseButton')}>
            확인
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.noOverlayClose}
        onClose={() => closeModal('noOverlayClose')}
        title="오버레이 클릭 비활성화"
        closeOnOverlayClick={false}
      >
        <div className="mg-v2-v2-v2-text-center">
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            이 모달은 오버레이 클릭으로 닫을 수 없습니다. 닫기 버튼이나 ESC 키를 사용하세요.
          </p>
          <Button onClick={() => closeModal('noOverlayClose')}>
            확인
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.noEscapeClose}
        onClose={() => closeModal('noEscapeClose')}
        title="ESC 키 비활성화"
        closeOnEscape={false}
      >
        <div className="mg-v2-v2-v2-text-center">
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            이 모달은 ESC 키로 닫을 수 없습니다. 닫기 버튼이나 오버레이 클릭을 사용하세요.
          </p>
          <Button onClick={() => closeModal('noEscapeClose')}>
            확인
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.loading}
        onClose={() => closeModal('loading')}
        title="로딩 모달"
        className="mg-v2-v2-v2-modal--loading"
      >
        <div className="mg-v2-v2-v2-text-center">
          <div className="mg-v2-v2-v2-icon mg-v2-v2-v2-icon--lg mg-v2-v2-v2-mb-md">
            <Icon name="LOADER" loading />
          </div>
          <p className="mg-v2-v2-v2-text-md">
            데이터를 불러오는 중입니다...
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={modals.error}
        onClose={() => closeModal('error')}
        title="에러 모달"
        className="mg-v2-v2-v2-modal--error"
      >
        <div className="mg-v2-v2-v2-text-center">
          <div className="mg-v2-v2-v2-icon mg-v2-v2-v2-icon--lg mg-v2-v2-v2-mb-md">
            <Icon name="ALERT_CIRCLE" color="ERROR" />
          </div>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            오류가 발생했습니다. 다시 시도해주세요.
          </p>
          <Button onClick={() => closeModal('error')}>
            확인
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.success}
        onClose={() => closeModal('success')}
        title="성공 모달"
        className="mg-v2-v2-v2-modal--success"
      >
        <div className="mg-v2-v2-v2-text-center">
          <div className="mg-v2-v2-v2-icon mg-v2-v2-v2-icon--lg mg-v2-v2-v2-mb-md">
            <Icon name="CHECK_CIRCLE" color="SUCCESS" />
          </div>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            작업이 성공적으로 완료되었습니다.
          </p>
          <Button onClick={() => closeModal('success')}>
            확인
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.warning}
        onClose={() => closeModal('warning')}
        title="경고 모달"
        className="mg-v2-v2-v2-modal--warning"
      >
        <div className="mg-v2-v2-v2-text-center">
          <div className="mg-v2-v2-v2-icon mg-v2-v2-v2-icon--lg mg-v2-v2-v2-mb-md">
            <Icon name="ALERT_TRIANGLE" color="WARNING" />
          </div>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?
          </p>
          <div className="mg-v2-v2-v2-flex mg-v2-v2-v2-gap-sm mg-v2-v2-v2-justify-center">
            <Button variant="outline" onClick={() => closeModal('warning')}>
              취소
            </Button>
            <Button variant="warning" onClick={() => closeModal('warning')}>
              계속
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modals.info}
        onClose={() => closeModal('info')}
        title="정보 모달"
        className="mg-v2-v2-v2-modal--info"
      >
        <div className="mg-v2-v2-v2-text-center">
          <div className="mg-v2-v2-v2-icon mg-v2-v2-v2-icon--lg mg-v2-v2-v2-mb-md">
            <Icon name="INFO" color="INFO" />
          </div>
          <p className="mg-v2-v2-v2-text-md mg-v2-v2-v2-mb-lg">
            이 기능에 대한 추가 정보입니다.
          </p>
          <Button onClick={() => closeModal('info')}>
            확인
          </Button>
        </div>
      </Modal>
    </div>);};

export default ModalExamples;
