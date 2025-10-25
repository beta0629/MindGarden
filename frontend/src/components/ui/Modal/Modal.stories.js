/**
 * Modal 컴포넌트 스토리
 */

import {useState} from 'react';

import Button from '../../components/ui/Button/Button';
import Modal from '../../components/ui/Modal/Modal';

export default {title: 'UI Components/Modal',
  component: Modal,
  parameters: {docs: {description: {component: 'ReactDOM.createPortal을 사용한 모달 컴포넌트'}}},
  argTypes: {isOpen: {control: 'boolean',
      description: '모달 열림 상태'},
    title: {control: 'text',
      description: '모달 제목'},
    size: {control: 'select',
      options: ['small', 'medium', 'large', 'extra-large'],
      description: '모달 크기'},
    variant: {control: 'select',
      options: ['default', 'centered', 'fullscreen', 'drawer'],
      description: '모달 변형'},
    showCloseButton: {control: 'boolean',
      description: '닫기 버튼 표시 여부'},
    closeOnOverlayClick: {control: 'boolean',
      description: '오버레이 클릭 시 닫기 여부'},
    closeOnEscape: {control: 'boolean',
      description: 'ESC 키로 닫기 여부'},
    role: {control: 'select',
      options: ['CLIENT', 'CONSULTANT', 'ADMIN'],
      description: '사용자 역할 (테마 적용)'},
    onClose: {action: 'closed',
      description: '모달 닫기 핸들러'}}};

const Template = (args) => {const [isOpen, setIsOpen] = useState(false);
  
  return (<div className="story-container">
      <Button onClick={() => setIsOpen(true)}>
        모달 열기
      </Button>
      <Modal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      >
        <div style={{textAlign: 'center'}}>
          <h3 style={{marginBottom: '15px'}}>모달 내용</h3>
          <p style={{marginBottom: '20px'}}>
            이것은 모달의 내용입니다. 오버레이를 클릭하거나 ESC 키를 눌러 닫을 수 있습니다.
          </p>
          <Button onClick={() => setIsOpen(false)}>
            확인
          </Button>
        </div>
      </Modal>
    </div>);};

export const Default = Template.bind({});
Default.args = {title: '기본 모달',
  size: 'medium',
  variant: 'default'};

export const Sizes = () => {const [modals, setModals] = useState({small: false,
    medium: false,
    large: false,
    extraLarge: false});

  const openModal = (size) => {setModals(prev => ({...prev, [size]: true}));};

  const closeModal = (size) => {setModals(prev => ({...prev, [size]: false}));};

  return (<div className="story-container">
      <div className="story-section">
        <h3>모달 크기</h3>
        <div className="story-flex">
          <Button onClick={() => openModal('small')}>Small</Button>
          <Button onClick={() => openModal('medium')}>Medium</Button>
          <Button onClick={() => openModal('large')}>Large</Button>
          <Button onClick={() => openModal('extraLarge')}>Extra Large</Button>
        </div>
      </div>

      <Modal
        isOpen={modals.small}
        onClose={() => closeModal('small')}
        title="Small Modal"
        size="small"
      >
        <div style={{textAlign: 'center'}}>
          <p>작은 크기의 모달입니다.</p>
          <Button onClick={() => closeModal('small')}>확인</Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.medium}
        onClose={() => closeModal('medium')}
        title="Medium Modal"
        size="medium"
      >
        <div style={{textAlign: 'center'}}>
          <p>중간 크기의 모달입니다.</p>
          <Button onClick={() => closeModal('medium')}>확인</Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.large}
        onClose={() => closeModal('large')}
        title="Large Modal"
        size="large"
      >
        <div style={{textAlign: 'center'}}>
          <p>큰 크기의 모달입니다.</p>
          <Button onClick={() => closeModal('large')}>확인</Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.extraLarge}
        onClose={() => closeModal('extraLarge')}
        title="Extra Large Modal"
        size="extra-large"
      >
        <div style={{textAlign: 'center'}}>
          <p>매우 큰 크기의 모달입니다.</p>
          <Button onClick={() => closeModal('extraLarge')}>확인</Button>
        </div>
      </Modal>
    </div>);};

export const Variants = () => {const [modals, setModals] = useState({default: false,
    centered: false,
    fullscreen: false,
    drawer: false});

  const openModal = (variant) => {setModals(prev => ({...prev, [variant]: true}));};

  const closeModal = (variant) => {setModals(prev => ({...prev, [variant]: false}));};

  return (<div className="story-container">
      <div className="story-section">
        <h3>모달 변형</h3>
        <div className="story-flex">
          <Button onClick={() => openModal('default')}>Default</Button>
          <Button onClick={() => openModal('centered')}>Centered</Button>
          <Button onClick={() => openModal('fullscreen')}>Fullscreen</Button>
          <Button onClick={() => openModal('drawer')}>Drawer</Button>
        </div>
      </div>

      <Modal
        isOpen={modals.default}
        onClose={() => closeModal('default')}
        title="Default Modal"
        variant="default"
      >
        <div style={{textAlign: 'center'}}>
          <p>기본 모달입니다.</p>
          <Button onClick={() => closeModal('default')}>확인</Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.centered}
        onClose={() => closeModal('centered')}
        title="Centered Modal"
        variant="centered"
      >
        <div style={{textAlign: 'center'}}>
          <p>중앙 정렬 모달입니다.</p>
          <Button onClick={() => closeModal('centered')}>확인</Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.fullscreen}
        onClose={() => closeModal('fullscreen')}
        title="Fullscreen Modal"
        variant="fullscreen"
      >
        <div style={{textAlign: 'center'}}>
          <p>전체 화면 모달입니다.</p>
          <Button onClick={() => closeModal('fullscreen')}>확인</Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.drawer}
        onClose={() => closeModal('drawer')}
        title="Drawer Modal"
        variant="drawer"
      >
        <div style={{textAlign: 'center'}}>
          <p>드로어 모달입니다.</p>
          <Button onClick={() => closeModal('drawer')}>확인</Button>
        </div>
      </Modal>
    </div>);};

export const CloseOptions = () => {const [modals, setModals] = useState({noCloseButton: false,
    noOverlayClose: false,
    noEscapeClose: false});

  const openModal = (type) => {setModals(prev => ({...prev, [type]: true}));};

  const closeModal = (type) => {setModals(prev => ({...prev, [type]: false}));};

  return (<div className="story-container">
      <div className="story-section">
        <h3>닫기 옵션</h3>
        <div className="story-flex">
          <Button onClick={() => openModal('noCloseButton')}>닫기 버튼 없음</Button>
          <Button onClick={() => openModal('noOverlayClose')}>오버레이 클릭 비활성화</Button>
          <Button onClick={() => openModal('noEscapeClose')}>ESC 키 비활성화</Button>
        </div>
      </div>

      <Modal
        isOpen={modals.noCloseButton}
        onClose={() => closeModal('noCloseButton')}
        title="닫기 버튼 없음"
        showCloseButton={false}
      >
        <div style={{textAlign: 'center'}}>
          <p>이 모달은 닫기 버튼이 없습니다. 오버레이 클릭이나 ESC 키로만 닫을 수 있습니다.</p>
          <Button onClick={() => closeModal('noCloseButton')}>확인</Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.noOverlayClose}
        onClose={() => closeModal('noOverlayClose')}
        title="오버레이 클릭 비활성화"
        closeOnOverlayClick={false}
      >
        <div style={{textAlign: 'center'}}>
          <p>이 모달은 오버레이 클릭으로 닫을 수 없습니다. 닫기 버튼이나 ESC 키를 사용하세요.</p>
          <Button onClick={() => closeModal('noOverlayClose')}>확인</Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.noEscapeClose}
        onClose={() => closeModal('noEscapeClose')}
        title="ESC 키 비활성화"
        closeOnEscape={false}
      >
        <div style={{textAlign: 'center'}}>
          <p>이 모달은 ESC 키로 닫을 수 없습니다. 닫기 버튼이나 오버레이 클릭을 사용하세요.</p>
          <Button onClick={() => closeModal('noEscapeClose')}>확인</Button>
        </div>
      </Modal>
    </div>);};

export const States = () => {const [modals, setModals] = useState({loading: false,
    error: false,
    success: false,
    warning: false,
    info: false});

  const openModal = (state) => {setModals(prev => ({...prev, [state]: true}));};

  const closeModal = (state) => {setModals(prev => ({...prev, [state]: false}));};

  return (<div className="story-container">
      <div className="story-section">
        <h3>상태별 모달</h3>
        <div className="story-flex">
          <Button onClick={() => openModal('loading')}>로딩</Button>
          <Button onClick={() => openModal('error')}>에러</Button>
          <Button onClick={() => openModal('success')}>성공</Button>
          <Button onClick={() => openModal('warning')}>경고</Button>
          <Button onClick={() => openModal('info')}>정보</Button>
        </div>
      </div>

      <Modal
        isOpen={modals.loading}
        onClose={() => closeModal('loading')}
        title="로딩 모달"
        className="mg-v2-v2-v2-modal--loading"
      >
        <div style={{textAlign: 'center'}}>
          <div style={{marginBottom: '15px'}}>로딩 중...</div>
          <p>데이터를 불러오는 중입니다...</p>
        </div>
      </Modal>

      <Modal
        isOpen={modals.error}
        onClose={() => closeModal('error')}
        title="에러 모달"
        className="mg-v2-v2-v2-modal--error"
      >
        <div style={{textAlign: 'center'}}>
          <p>오류가 발생했습니다. 다시 시도해주세요.</p>
          <Button onClick={() => closeModal('error')}>확인</Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.success}
        onClose={() => closeModal('success')}
        title="성공 모달"
        className="mg-v2-v2-v2-modal--success"
      >
        <div style={{textAlign: 'center'}}>
          <p>작업이 성공적으로 완료되었습니다.</p>
          <Button onClick={() => closeModal('success')}>확인</Button>
        </div>
      </Modal>

      <Modal
        isOpen={modals.warning}
        onClose={() => closeModal('warning')}
        title="경고 모달"
        className="mg-v2-v2-v2-modal--warning"
      >
        <div style={{textAlign: 'center'}}>
          <p>이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?</p>
          <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '15px'}}>
            <Button variant="outline" onClick={() => closeModal('warning')}>취소</Button>
            <Button variant="warning" onClick={() => closeModal('warning')}>계속</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modals.info}
        onClose={() => closeModal('info')}
        title="정보 모달"
        className="mg-v2-v2-v2-modal--info"
      >
        <div style={{textAlign: 'center'}}>
          <p>이 기능에 대한 추가 정보입니다.</p>
          <Button onClick={() => closeModal('info')}>확인</Button>
        </div>
      </Modal>
    </div>);};
