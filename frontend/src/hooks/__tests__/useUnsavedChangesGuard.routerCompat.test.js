import React from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  BrowserRouter, Link, Route, Routes, RouterProvider, createMemoryRouter, useNavigate
} from 'react-router-dom';
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

  describe('BrowserRouter — navigate()·뒤로 가기 (#1419)', () => {
    const FormPage = ({ when = true }) => {
      const navigate = useNavigate();
      useUnsavedChangesGuard({ when, confirmMessage: '떠날까요?' });
      return (
        <div>
          <span data-testid="page">form</span>
          <button type="button" onClick={() => navigate('/done')}>저장 없이 이동</button>
          <button type="button" onClick={() => navigate('/form?tab=2')}>같은 화면 쿼리</button>
          <button type="button" onClick={() => navigate(-1)}>뒤로</button>
        </div>
      );
    };
    const Home = () => {
      const navigate = useNavigate();
      return (
        <div>
          <span data-testid="page">home</span>
          <button type="button" onClick={() => navigate('/form')}>작성</button>
        </div>
      );
    };
    const App = ({ when }) => (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/form" element={<FormPage when={when} />} />
          <Route path="/done" element={<span data-testid="page">done</span>} />
        </Routes>
      </BrowserRouter>
    );
    const openForm = (when = true) => {
      render(<App when={when} />);
      fireEvent.click(screen.getByRole('button', { name: '작성' }));
      expect(screen.getByTestId('page')).toHaveTextContent('form');
      confirmSpy.mockClear();
    };

    it('navigate() 이동 — 취소하면 화면·주소 유지, 확인하면 이동', () => {
      openForm();
      confirmSpy.mockReturnValue(false);
      fireEvent.click(screen.getByRole('button', { name: '저장 없이 이동' }));
      expect(confirmSpy).toHaveBeenCalledWith('떠날까요?');
      expect(screen.getByTestId('page')).toHaveTextContent('form');
      expect(window.location.pathname).toBe('/form');

      confirmSpy.mockReturnValue(true);
      fireEvent.click(screen.getByRole('button', { name: '저장 없이 이동' }));
      expect(screen.getByTestId('page')).toHaveTextContent('done');
      expect(window.location.pathname).toBe('/done');
    });

    it('같은 경로(쿼리만 변경) navigate 는 확인하지 않는다', () => {
      openForm();
      fireEvent.click(screen.getByRole('button', { name: '같은 화면 쿼리' }));
      expect(confirmSpy).not.toHaveBeenCalled();
      expect(window.location.search).toBe('?tab=2');
    });

    it('navigate(-1) — 취소하면 history.go 를 부르지 않는다', () => {
      openForm();
      const goSpy = jest.spyOn(window.history, 'go');
      confirmSpy.mockReturnValue(false);
      fireEvent.click(screen.getByRole('button', { name: '뒤로' }));
      expect(confirmSpy).toHaveBeenCalledTimes(1);
      expect(goSpy).not.toHaveBeenCalled();
    });

    it('navigate(-1) 확인 — 이동하고 popstate 에서 확인창을 다시 띄우지 않는다', async () => {
      openForm();
      confirmSpy.mockReturnValue(true);
      fireEvent.click(screen.getByRole('button', { name: '뒤로' }));
      await waitFor(() => expect(screen.getByTestId('page')).toHaveTextContent('home'));
      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });

    it('브라우저 뒤로 가기 — 취소하면 원래 화면·주소로 되돌린다', async () => {
      openForm();
      confirmSpy.mockReturnValue(false);
      await act(async () => {
        window.history.back();
      });
      await waitFor(() => expect(confirmSpy).toHaveBeenCalledWith('떠날까요?'));
      await waitFor(() => expect(window.location.pathname).toBe('/form'));
      expect(screen.getByTestId('page')).toHaveTextContent('form');
      expect(confirmSpy).toHaveBeenCalledTimes(1);
    });

    it('브라우저 뒤로 가기 — 확인하면 이전 화면으로 이동', async () => {
      openForm();
      confirmSpy.mockReturnValue(true);
      await act(async () => {
        window.history.back();
      });
      await waitFor(() => expect(screen.getByTestId('page')).toHaveTextContent('home'));
      expect(window.location.pathname).toBe('/');
    });

    it('미저장 변경이 없으면 navigate·뒤로 가기에 확인창이 없다', async () => {
      openForm(false);
      await act(async () => {
        window.history.back();
      });
      await waitFor(() => expect(screen.getByTestId('page')).toHaveTextContent('home'));
      expect(confirmSpy).not.toHaveBeenCalled();
    });

    it('화면을 떠나 가드가 언마운트되면 이후 뒤로 가기에 확인창이 없다', async () => {
      openForm();
      confirmSpy.mockReturnValue(true);
      fireEvent.click(screen.getByRole('button', { name: '저장 없이 이동' }));
      expect(screen.getByTestId('page')).toHaveTextContent('done');
      confirmSpy.mockClear();
      await act(async () => {
        window.history.back();
      });
      await waitFor(() => expect(window.location.pathname).toBe('/form'));
      expect(confirmSpy).not.toHaveBeenCalled();
    });
  });
});
