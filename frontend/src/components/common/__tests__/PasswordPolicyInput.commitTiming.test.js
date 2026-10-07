/**
 * 공통 비밀번호 입력 — 제출 시점 값 확정·정책 안내 상시 표시.
 *
 * 화면 상태가 입력란을 따라오지 못한 채(입력 직후 제출·오래된 클로저·자동 완성) 제출돼도
 * validateCommitted 가 입력란의 현재 값을 돌려주므로 POST 본문에 빈 값(임시 비밀번호)이 실리지 않는다.
 */
import React, { useMemo, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import usePasswordPolicyField from '../../../hooks/usePasswordPolicyField';
import PasswordPolicyInput, { PasswordPolicyHint } from '../PasswordPolicyInput';
import '../../../i18n';

const VALID = 'Fake7!Qzm';
const HINT_TEXT = /영문 대·소문자·숫자·특수문자/;

/** 제출 핸들러가 첫 렌더의 상태(빈 값)를 붙잡고 있는 화면. */
function StaleClosureForm({ onPost, allowEmpty = false, initial = '' }) {
  const field = usePasswordPolicyField({ allowEmpty });
  const { validateCommitted } = field;
  const [password, setPassword] = useState(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const staleSubmit = useMemo(() => (event) => {
    event.preventDefault();
    const committed = validateCommitted(password);
    if (!committed.valid) {
      return;
    }
    onPost({ password: committed.value });
  }, []);
  return (
    <form data-testid="form" onSubmit={staleSubmit}>
      <PasswordPolicyInput
        field={field}
        id="pw"
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit" disabled={field.pending}>submit</button>
    </form>
  );
}

function input() {
  return document.querySelector('input[name="password"]');
}

describe('제출 시점 값 확정', () => {
  test('입력 직후 즉시 제출하면 POST 본문에 입력값이 들어간다(오래된 클로저여도)', () => {
    const onPost = jest.fn();
    render(<StaleClosureForm onPost={onPost} />);
    fireEvent.change(input(), { target: { value: VALID } });
    fireEvent.submit(screen.getByTestId('form'));
    expect(onPost).toHaveBeenCalledTimes(1);
    expect(onPost).toHaveBeenCalledWith({ password: VALID });
  });

  test('임시 비밀번호 화면(allowEmpty)에서도 입력값이 빈 값으로 바뀌어 나가지 않는다', () => {
    const onPost = jest.fn();
    render(<StaleClosureForm onPost={onPost} allowEmpty />);
    fireEvent.change(input(), { target: { value: VALID } });
    fireEvent.submit(screen.getByTestId('form'));
    expect(onPost).toHaveBeenCalledWith({ password: VALID });
  });

  test('change 이벤트 없이 입력란 값만 바뀐 경우(자동 완성)에도 입력란 값을 쓴다', () => {
    const onPost = jest.fn();
    render(<StaleClosureForm onPost={onPost} />);
    input().value = VALID;
    fireEvent.submit(screen.getByTestId('form'));
    expect(onPost).toHaveBeenCalledWith({ password: VALID });
  });

  test('필수 화면에서 빈 값이면 POST 하지 않고 필수 안내를 보인다', async() => {
    const onPost = jest.fn();
    render(<StaleClosureForm onPost={onPost} />);
    fireEvent.submit(screen.getByTestId('form'));
    expect(onPost).not.toHaveBeenCalled();
    expect(await screen.findByText('비밀번호를 입력해주세요.')).toBeInTheDocument();
  });

  test('화면 상태에 값이 남아 있어도 입력란을 비우고 즉시 제출하면 POST 하지 않는다', () => {
    const onPost = jest.fn();
    render(<StaleClosureForm onPost={onPost} initial={VALID} />);
    fireEvent.change(input(), { target: { value: '' } });
    fireEvent.submit(screen.getByTestId('form'));
    expect(onPost).not.toHaveBeenCalled();
  });

  test('정책 위반 값은 POST 하지 않는다', () => {
    const onPost = jest.fn();
    render(<StaleClosureForm onPost={onPost} />);
    fireEvent.change(input(), { target: { value: 'Zq7!PaSsWoRdx' } });
    fireEvent.submit(screen.getByTestId('form'));
    expect(onPost).not.toHaveBeenCalled();
  });

  test('입력 반영이 끝나면 제출 버튼은 다시 활성화된다', () => {
    render(<StaleClosureForm onPost={jest.fn()} />);
    fireEvent.change(input(), { target: { value: VALID } });
    expect(screen.getByRole('button', { name: 'submit' })).not.toBeDisabled();
  });
});

function HintForm({ initial = '', external = false }) {
  const field = usePasswordPolicyField();
  const [password, setPassword] = useState(initial);
  return (
    <form data-testid="form" onSubmit={(e) => { e.preventDefault(); field.validateCommitted(password); }}>
      <PasswordPolicyInput
        field={field}
        id="pw"
        name="password"
        hintExternal={external}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {external ? <PasswordPolicyHint field={field} id="pw" /> : null}
    </form>
  );
}

describe('정책 안내 상시 표시', () => {
  test.each([
    ['빈 값', '', false],
    ['미리 채운 값', VALID, false],
    ['외부 힌트 + 미리 채운 값', VALID, true]
  ])('%s 이어도 입력란 아래 정책 안내가 보이고 입력란과 연결된다', (_label, initial, external) => {
    render(<HintForm initial={initial} external={external} />);
    const hint = screen.getByText(HINT_TEXT);
    expect(hint).toHaveAttribute('id', 'pw-policy-hint');
    expect(input().getAttribute('aria-describedby')).toContain('pw-policy-hint');
  });

  test('정책 위반 오류가 떠도 안내는 사라지지 않는다', async() => {
    render(<HintForm external />);
    fireEvent.change(input(), { target: { value: 'noupper1!x' } });
    fireEvent.submit(screen.getByTestId('form'));
    expect(await screen.findByText(/대문자를 포함해야/)).toBeInTheDocument();
    expect(screen.getByText(HINT_TEXT)).toBeInTheDocument();
  });
});
