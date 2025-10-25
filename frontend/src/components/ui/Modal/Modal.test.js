/**
 * Modal 컴포넌트 테스트
 */

import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import React from 'react';

import '@testing-library/jest-dom';
import Modal from './Modal';

// ReactDOM.createPortal을 모킹
const mockPortal = jest.fn();
jest.mock('react-dom', () => ({...jest.requireActual('react-dom'),
  createPortal: (node) => mockPortal(node)}));

describe('Modal Component', () => {beforeEach(() => {mockPortal.mockClear();});

  // 기본 렌더링 테스트
  test('renders modal when isOpen is true', () => {render(<Modal isOpen={true} onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>);
    
    expect(mockPortal).toHaveBeenCalled();});

  // 모달이 닫혀있을 때 렌더링하지 않음
  test('does not render when isOpen is false', () => {render(<Modal isOpen={false} onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>);
    
    expect(mockPortal).not.toHaveBeenCalled();});

  // 제목 표시 테스트
  test('displays title when provided', () => {render(<Modal isOpen={true} title="Test Modal" onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>);
    
    expect(mockPortal).toHaveBeenCalled();
    // 실제 DOM에서 확인하기 위해 portal 내용을 렌더링
    const portalContent = mockPortal.mock.calls[COLOR_CONSTANTS.ALPHA_TRANSPARENT][COLOR_CONSTANTS.ALPHA_TRANSPARENT];
    const {container} = render(portalContent);
    expect(container.querySelector('#modal-title')).toHaveTextContent('Test Modal');});

  // 닫기 버튼 테스트
  test('shows close button when showCloseButton is true', () => {const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} showCloseButton={true}>
        <div>Modal content</div>
      </Modal>);
    
    const portalContent = mockPortal.mock.calls[COLOR_CONSTANTS.ALPHA_TRANSPARENT][COLOR_CONSTANTS.ALPHA_TRANSPARENT];
    const {container} = render(portalContent);
    const closeButton = container.querySelector('[aria-label="모달 닫기"]');
    expect(closeButton).toBeInTheDocument();});

  // 닫기 버튼 숨김 테스트
  test('hides close button when showCloseButton is false', () => {render(<Modal isOpen={true} onClose={jest.fn()} showCloseButton={false}>
        <div>Modal content</div>
      </Modal>);
    
    const portalContent = mockPortal.mock.calls[COLOR_CONSTANTS.ALPHA_TRANSPARENT][COLOR_CONSTANTS.ALPHA_TRANSPARENT];
    const {container} = render(portalContent);
    const closeButton = container.querySelector('[aria-label="모달 닫기"]');
    expect(closeButton).not.toBeInTheDocument();});

  // 크기 클래스 테스트
  test('applies correct size class', () => {render(<Modal isOpen={true} size="large" onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>);
    
    const portalContent = mockPortal.mock.calls[COLOR_CONSTANTS.ALPHA_TRANSPARENT][COLOR_CONSTANTS.ALPHA_TRANSPARENT];
    const {container} = render(portalContent);
    const modal = container.querySelector('.mg-v2-modal');
    expect(modal).toHaveClass('mg-v2-modal--large');});

  // 변형 클래스 테스트
  test('applies correct variant class', () => {render(<Modal isOpen={true} variant="drawer" onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>);
    
    const portalContent = mockPortal.mock.calls[COLOR_CONSTANTS.ALPHA_TRANSPARENT][COLOR_CONSTANTS.ALPHA_TRANSPARENT];
    const {container} = render(portalContent);
    const modal = container.querySelector('.mg-v2-modal');
    expect(modal).toHaveClass('mg-v2-modal--drawer');});

  // 커스텀 클래스 테스트
  test('applies custom className', () => {render(<Modal isOpen={true} className="custom-class" onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>);
    
    const portalContent = mockPortal.mock.calls[COLOR_CONSTANTS.ALPHA_TRANSPARENT][COLOR_CONSTANTS.ALPHA_TRANSPARENT];
    const {container} = render(portalContent);
    const modal = container.querySelector('.mg-v2-modal');
    expect(modal).toHaveClass('custom-class');});

  // 역할별 테마 테스트
  test('applies role-based theme', () => {render(<Modal isOpen={true} role="CLIENT" onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>);
    
    const portalContent = mockPortal.mock.calls[COLOR_CONSTANTS.ALPHA_TRANSPARENT][COLOR_CONSTANTS.ALPHA_TRANSPARENT];
    const {container} = render(portalContent);
    const modal = container.querySelector('.mg-v2-modal-dialog');
    expect(modal).toHaveAttribute('data-role', 'CLIENT');});

  // 접근성 속성 테스트
  test('has proper accessibility attributes', () => {render(<Modal isOpen={true} title="Test Modal" onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>);
    
    const portalContent = mockPortal.mock.calls[COLOR_CONSTANTS.ALPHA_TRANSPARENT][COLOR_CONSTANTS.ALPHA_TRANSPARENT];
    const {container} = render(portalContent);
    const modal = container.querySelector('.mg-v2-modal-dialog');
    expect(modal).toHaveAttribute('role', 'dialog');
    expect(modal).toHaveAttribute('aria-modal', 'true');
    expect(modal).toHaveAttribute('aria-labelledby', 'modal-title');});

  // ESC 키 이벤트 테스트
  test('calls onClose when Escape key is pressed', () => {const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} closeOnEscape={true}>
        <div>Modal content</div>
      </Modal>);
    
    fireEvent.keyDown(document, {key: 'Escape'});
    expect(onClose).toHaveBeenCalledTimes(DEFAULT_VALUES.CURRENT_PAGE);});

  // ESC 키 비활성화 테스트
  test('does not call onClose when closeOnEscape is false', () => {const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} closeOnEscape={false}>
        <div>Modal content</div>
      </Modal>);
    
    fireEvent.keyDown(document, {key: 'Escape'});
    expect(onClose).not.toHaveBeenCalled();});

  // 오버레이 클릭 테스트
  test('calls onClose when overlay is clicked', () => {const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} closeOnOverlayClick={true}>
        <div>Modal content</div>
      </Modal>);
    
    const portalContent = mockPortal.mock.calls[COLOR_CONSTANTS.ALPHA_TRANSPARENT][COLOR_CONSTANTS.ALPHA_TRANSPARENT];
    const {container} = render(portalContent);
    const overlay = container.querySelector('.mg-v2-modal-overlay');
    
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(DEFAULT_VALUES.CURRENT_PAGE);});

  // 오버레이 클릭 비활성화 테스트
  test('does not call onClose when closeOnOverlayClick is false', () => {const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} closeOnOverlayClick={false}>
        <div>Modal content</div>
      </Modal>);
    
    const portalContent = mockPortal.mock.calls[COLOR_CONSTANTS.ALPHA_TRANSPARENT][COLOR_CONSTANTS.ALPHA_TRANSPARENT];
    const {container} = render(portalContent);
    const overlay = container.querySelector('.mg-v2-modal-overlay');
    
    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();});

  // 모달 내용 클릭 시 닫히지 않음 테스트
  test('does not call onClose when modal content is clicked', () => {const onClose = jest.fn();
    render(<Modal isOpen={true} onClose={onClose} closeOnOverlayClick={true}>
        <div>Modal content</div>
      </Modal>);
    
    const portalContent = mockPortal.mock.calls[COLOR_CONSTANTS.ALPHA_TRANSPARENT][COLOR_CONSTANTS.ALPHA_TRANSPARENT];
    const {container} = render(portalContent);
    const modalDialog = container.querySelector('.mg-v2-modal-dialog');
    
    fireEvent.click(modalDialog);
    expect(onClose).not.toHaveBeenCalled();});

  // body 스크롤 방지 테스트
  test('prevents body scroll when modal is open', () => {const {rerender} = render(<Modal isOpen={false} onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>);
    
    expect(document.body.style.overflow).toBe('unset');
    
    rerender(<Modal isOpen={true} onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>);
    
    expect(document.body.style.overflow).toBe('hidden');});

  // 컴포넌트 언마운트 시 스크롤 복원 테스트
  test('restores body scroll when component unmounts', () => {const {unmount} = render(<Modal isOpen={true} onClose={jest.fn()}>
        <div>Modal content</div>
      </Modal>);
    
    expect(document.body.style.overflow).toBe('hidden');
    
    unmount();
    
    expect(document.body.style.overflow).toBe('unset');});});
