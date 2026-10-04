import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, Link, RouterProvider, createMemoryRouter } from 'react-router-dom';
import { useUnsavedChangesGuard } from '../useUnsavedChangesGuard';

/**
 * useUnsavedChangesGuard 라우터 호환 회귀 테스트.
 *
 * <p>P0: BrowserRouter 아래에서 useBlocker 를 호출하면
 * "useBlocker must be used within a data router" 로 화면이 크래시했다(#1409 후속).</p>
 */
const GuardProbe = ({ when = true, enableRouteBlocker = true, confirmMessage }) => {
  const { blocker } = useUnsavedChangesGuard({ when, enableRouteBlocker, confirmMessage });
  return (
    <div>
      <span data-testid="blocker-state">{blocker ? String(blocker.state) : 'none'}</span>
      <Link to="/other">다른 화면</Link>
    </div>
  );
};

describe('useUnsavedChangesGuard — 라우터 호환', () => {
  let confirmSpy;

  beforeEach(() => {
    // 앞 테스트의 Link 클릭으로 jsdom location 이 이동해 있으면
    // "같은 경로는 확인창 생략" 분기에 걸려 테스트가 서로 간섭한다.
    window.history.replaceState({}, '', '/');
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    confirmSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it('BrowserRouter 아래에서 크래시 없이 렌더되고 blocker 는 null 이다', () => {
    expect(() => render(
      <BrowserRouter>
        <GuardProbe />
      </BrowserRouter>
    )).not.toThrow();
    expect(screen.getByTestId('blocker-state')).toHaveTextContent('none');
  });

  it('data router 아래에서는 useBlocker 가 동작해 blocker 객체를 돌려준다', () => {
    const router = createMemoryRouter(
      [{ path: '/', element: <GuardProbe /> }, { path: '/other', element: <div>other</div> }],
      { initialEntries: ['/'] }
    );
    render(<RouterProvider router={router} />);
    expect(screen.getByTestId('blocker-state')).toHaveTextContent('unblocked');
  });

  it('미저장 변경이 있으면 beforeunload 리스너를 등록하고 해제한다', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');
    const { unmount } = render(
      <BrowserRouter>
        <GuardProbe when />
      </BrowserRouter>
    );
    expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('미저장 변경이 없으면 beforeunload 를 등록하지 않는다', () => {
    const addSpy = jest.spyOn(window, 'addEventListener');
    render(
      <BrowserRouter>
        <GuardProbe when={false} />
      </BrowserRouter>
    );
    expect(addSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('BrowserRouter 에서 같은 출처 링크 클릭 시 확인창을 띄운다', () => {
    render(
      <BrowserRouter>
        <GuardProbe when confirmMessage="떠날까요?" />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('link', { name: '다른 화면' }));
    expect(confirmSpy).toHaveBeenCalledWith('떠날까요?');
  });

  it('확인창에서 취소하면 링크 이동이 막힌다', () => {
    confirmSpy.mockReturnValue(false);
    render(
      <BrowserRouter>
        <GuardProbe when />
      </BrowserRouter>
    );
    const link = screen.getByRole('link', { name: '다른 화면' });
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    link.dispatchEvent(clickEvent);
    expect(confirmSpy).toHaveBeenCalled();
    expect(clickEvent.defaultPrevented).toBe(true);
  });

  it('미저장 변경이 없으면 링크 클릭에 확인창을 띄우지 않는다', () => {
    render(
      <BrowserRouter>
        <GuardProbe when={false} />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('link', { name: '다른 화면' }));
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
