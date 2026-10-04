import React, { useEffect } from 'react';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { useUnsavedChangesGuard } from '../useUnsavedChangesGuard';

/**
 * 미저장 가드 — 뒤로 가기 취소 시 입력·마운트 유지, 이미 확인받은 닫기는 다시 묻지 않음 (PR R · B1·B2).
 *
 * <p>실제 브라우저에서는 라우터의 popstate 리스너가 화면 가드보다 먼저 실행돼, 뒤로 가기를 취소해도
 * 대시보드가 렌더됐다가 일지 화면이 다시 마운트되며 입력이 사라졌다. 관문 리스너는 앱 진입 시(이 훅
 * 모듈 import 시) 라우터보다 먼저 등록되므로, 그 뒤에 등록된 리스너(라우터 역할)는 취소된 뒤로 가기와
 * 원복 이동을 모두 받지 않아야 한다.</p>
 */
describe('useUnsavedChangesGuard — 뒤로 가기 취소·확인 1회', () => {
  let confirmSpy;
  let mounts;
  let homeRenders;

  const FormPage = ({ onRelease }) => {
    const navigate = useNavigate();
    const { releaseGuard } = useUnsavedChangesGuard({ when: true, confirmMessage: '떠날까요?' });
    useEffect(() => {
      mounts += 1;
    }, []);
    return (
      <div>
        <span data-testid="page">form</span>
        <input aria-label="본문" defaultValue="" />
        <button type="button" onClick={() => navigate(-1)}>뒤로</button>
        <button
          type="button"
          onClick={() => {
            onRelease?.();
            releaseGuard();
            navigate(-1);
          }}
        >
          확인받은 닫기
        </button>
      </div>
    );
  };
  const Home = () => {
    const navigate = useNavigate();
    homeRenders += 1;
    return (
      <div>
        <span data-testid="page">home</span>
        <button type="button" onClick={() => navigate('/form')}>작성</button>
      </div>
    );
  };
  const App = () => (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/form" element={<FormPage />} />
      </Routes>
    </BrowserRouter>
  );

  const openFormAndType = () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '작성' }));
    expect(screen.getByTestId('page')).toHaveTextContent('form');
    fireEvent.change(screen.getByLabelText('본문'), { target: { value: '작성 중 입력' } });
    confirmSpy.mockClear();
    homeRenders = 0;
  };

  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    mounts = 0;
    homeRenders = 0;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('뒤로 가기 취소 — 이후 등록된 popstate 리스너(라우터 역할)는 이탈·원복 이벤트를 받지 않고, 입력·마운트 유지', async () => {
    openFormAndType();
    const laterListener = jest.fn();
    window.addEventListener('popstate', laterListener);
    try {
      await act(async () => {
        window.history.back();
      });
      await waitFor(() => expect(confirmSpy).toHaveBeenCalledWith('떠날까요?'));
      await waitFor(() => expect(window.location.pathname).toBe('/form'));
      // 원복 history.go 의 popstate 까지 처리될 시간을 준다.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });
      expect(laterListener).not.toHaveBeenCalled();
      expect(homeRenders).toBe(0);
      expect(mounts).toBe(1);
      expect(screen.getByLabelText('본문')).toHaveValue('작성 중 입력');
      expect(confirmSpy).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener('popstate', laterListener);
    }
  });

  it('뒤로 가기 확인 — 라우터에 그대로 전달돼 이전 화면으로 이동', async () => {
    openFormAndType();
    confirmSpy.mockReturnValue(true);
    await act(async () => {
      window.history.back();
    });
    await waitFor(() => expect(screen.getByTestId('page')).toHaveTextContent('home'));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
  });

  it('releaseGuard 후 이동(이미 확인받은 닫기) — 네이티브 확인창을 다시 띄우지 않는다', async () => {
    openFormAndType();
    fireEvent.click(screen.getByRole('button', { name: '확인받은 닫기' }));
    await waitFor(() => expect(screen.getByTestId('page')).toHaveTextContent('home'));
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('releaseGuard 하지 않은 navigate(-1) 는 여전히 한 번 확인한다', () => {
    openFormAndType();
    fireEvent.click(screen.getByRole('button', { name: '뒤로' }));
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('page')).toHaveTextContent('form');
  });
});
