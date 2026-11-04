import unifiedLayoutManager, { SELF_POSITIONED_DROPDOWN_ATTR } from '../unifiedLayoutSystem';

describe('unifiedLayoutSystem registerDropdown 자체 포지셔닝 예외', () => {
  it('data-mg-self-positioned 팝오버는 position fixed 유지', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'listbox');
    el.setAttribute(SELF_POSITIONED_DROPDOWN_ATTR, '');
    el.style.position = 'fixed';
    el.style.top = '120px';
    unifiedLayoutManager.registerDropdown(el);
    expect(el.style.position).toBe('fixed');
    expect(el.style.top).toBe('120px');
  });
  it('속성 없는 일반 listbox는 기존대로 relative', () => {
    const el = document.createElement('div');
    el.setAttribute('role', 'listbox');
    el.style.position = 'fixed';
    unifiedLayoutManager.registerDropdown(el);
    expect(el.style.position).toBe('relative');
  });
});
