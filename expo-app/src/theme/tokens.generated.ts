/**
 * 생성 파일. 직접 수정하지 않는다.
 * 원본: design-tokens/tokens.json
 * 재생성: npm run tokens:generate
 *
 * 이름: tokens.json 키 a.b.c → mg.<group>['a.b.c'] 와 camelCase aBC.
 * 테넌트 덮어쓰기: applyTenantBrandOverride — brand.* 만.
 * 화면에서는 import 하지 않는다. 화면 적용은 다음 PR.
 *
 * shadow.* 는 웹 box-shadow 문자열이다.
 * 앱 elevation(card 2 / modal 12 / toast 6)은 화면 적용 PR에서 이 키에 맞춘다.
 */

export type MgColor = {
  readonly light: string;
  readonly dark: string;
  readonly hc: string;
};

export const mgModes = ['light', 'dark', 'hc'] as const;

export const mg = {
  color: {
    'surface.page': { light: '#FAF9F7', dark: '#14171A', hc: '#FFFFFF' },
    surfacePage: { light: '#FAF9F7', dark: '#14171A', hc: '#FFFFFF' },
    'surface.card': { light: '#FFFFFF', dark: '#1C2024', hc: '#FFFFFF' },
    surfaceCard: { light: '#FFFFFF', dark: '#1C2024', hc: '#FFFFFF' },
    'surface.sunken': { light: '#F3F1ED', dark: '#181B1F', hc: '#F2F2F2' },
    surfaceSunken: { light: '#F3F1ED', dark: '#181B1F', hc: '#F2F2F2' },
    'surface.overlay': { light: 'rgba(20,23,26,0.40)', dark: 'rgba(0,0,0,0.60)', hc: 'rgba(0,0,0,0.70)' },
    surfaceOverlay: { light: 'rgba(20,23,26,0.40)', dark: 'rgba(0,0,0,0.60)', hc: 'rgba(0,0,0,0.70)' },
    'text.primary': { light: '#1B2128', dark: '#ECEFF1', hc: '#000000' },
    textPrimary: { light: '#1B2128', dark: '#ECEFF1', hc: '#000000' },
    'text.secondary': { light: '#4A5560', dark: '#B6BEC5', hc: '#1F1F1F' },
    textSecondary: { light: '#4A5560', dark: '#B6BEC5', hc: '#1F1F1F' },
    'text.tertiary': { light: '#5E6973', dark: '#9AA4AD', hc: '#333333' },
    textTertiary: { light: '#5E6973', dark: '#9AA4AD', hc: '#333333' },
    'text.disabled': { light: '#8F979E', dark: '#626A72', hc: '#595959' },
    textDisabled: { light: '#8F979E', dark: '#626A72', hc: '#595959' },
    'text.inverse': { light: '#FFFFFF', dark: '#14171A', hc: '#FFFFFF' },
    textInverse: { light: '#FFFFFF', dark: '#14171A', hc: '#FFFFFF' },
    'border.subtle': { light: '#EBE6DF', dark: '#2A2F34', hc: '#767676' },
    borderSubtle: { light: '#EBE6DF', dark: '#2A2F34', hc: '#767676' },
    'border.default': { light: '#D4CFC8', dark: '#3A4046', hc: '#000000' },
    borderDefault: { light: '#D4CFC8', dark: '#3A4046', hc: '#000000' },
    'border.strong': { light: '#86807A', dark: '#7A838B', hc: '#000000' },
    borderStrong: { light: '#86807A', dark: '#7A838B', hc: '#000000' },
    'state.hover': { light: '#F3F1ED', dark: '#22272C', hc: '#E6E6E6' },
    stateHover: { light: '#F3F1ED', dark: '#22272C', hc: '#E6E6E6' },
    'state.selected.bg': { light: '#EEEBE6', dark: '#272C31', hc: '#E0E0E0' },
    stateSelectedBg: { light: '#EEEBE6', dark: '#272C31', hc: '#E0E0E0' },
    'state.selected.border': { light: '#86807A', dark: '#7A838B', hc: '#000000' },
    stateSelectedBorder: { light: '#86807A', dark: '#7A838B', hc: '#000000' },
    'state.disabled.bg': { light: '#EFEDEA', dark: '#202428', hc: '#F2F2F2' },
    stateDisabledBg: { light: '#EFEDEA', dark: '#202428', hc: '#F2F2F2' },
    'focus.ring': { light: '#1B2128', dark: '#ECEFF1', hc: '#000000' },
    focusRing: { light: '#1B2128', dark: '#ECEFF1', hc: '#000000' },
    'danger.text': { light: '#A63B35', dark: '#F29A90', hc: '#8B0000' },
    dangerText: { light: '#A63B35', dark: '#F29A90', hc: '#8B0000' },
    'danger.solid': { light: '#A63B35', dark: '#D9645A', hc: '#8B0000' },
    dangerSolid: { light: '#A63B35', dark: '#D9645A', hc: '#8B0000' },
    'danger.subtle': { light: '#FAEDEB', dark: '#3A2422', hc: '#FFFFFF' },
    dangerSubtle: { light: '#FAEDEB', dark: '#3A2422', hc: '#FFFFFF' },
    'warning.text': { light: '#8A4A06', dark: '#F0B865', hc: '#5C3200' },
    warningText: { light: '#8A4A06', dark: '#F0B865', hc: '#5C3200' },
    'warning.icon': { light: '#E2A33A', dark: '#D9A13B', hc: '#8A4A06' },
    warningIcon: { light: '#E2A33A', dark: '#D9A13B', hc: '#8A4A06' },
    'warning.subtle': { light: '#FBF3E3', dark: '#33291A', hc: '#FFFFFF' },
    warningSubtle: { light: '#FBF3E3', dark: '#33291A', hc: '#FFFFFF' },
    'success.text': { light: '#2E6A48', dark: '#8FD1A8', hc: '#0B4D27' },
    successText: { light: '#2E6A48', dark: '#8FD1A8', hc: '#0B4D27' },
    'success.subtle': { light: '#EAF3EC', dark: '#1E2E24', hc: '#FFFFFF' },
    successSubtle: { light: '#EAF3EC', dark: '#1E2E24', hc: '#FFFFFF' },
    'info.text': { light: '#2F5B86', dark: '#9CC2EA', hc: '#003A75' },
    infoText: { light: '#2F5B86', dark: '#9CC2EA', hc: '#003A75' },
    'info.subtle': { light: '#EBF1F7', dark: '#1E2833', hc: '#FFFFFF' },
    infoSubtle: { light: '#EBF1F7', dark: '#1E2833', hc: '#FFFFFF' },
  },
  brand: {
    'brand.primary': { light: '#0E5F5A', dark: '#4AA99E', hc: '#0A4F4B' },
    brandPrimary: { light: '#0E5F5A', dark: '#4AA99E', hc: '#0A4F4B' },
    'brand.primary.hover': { light: '#0A4F4B', dark: '#5FBBB0', hc: '#06302D' },
    brandPrimaryHover: { light: '#0A4F4B', dark: '#5FBBB0', hc: '#06302D' },
    'brand.on-primary': { light: '#FFFFFF', dark: '#0B1F1D', hc: '#FFFFFF' },
    brandOnPrimary: { light: '#FFFFFF', dark: '#0B1F1D', hc: '#FFFFFF' },
    'brand.logo': { light: 'tenant-asset', dark: 'tenant-asset', hc: 'tenant-asset' },
    brandLogo: { light: 'tenant-asset', dark: 'tenant-asset', hc: 'tenant-asset' },
  },
  size: {
    'touch.min': '44px',
    touchMin: '44px',
    'control.height.md': '44px',
    controlHeightMd: '44px',
    'control.height.sm': '36px (시각 높이, 누르기 영역은 44px로 확장)',
    controlHeightSm: '36px (시각 높이, 누르기 영역은 44px로 확장)',
    'icon.md': '20px',
    iconMd: '20px',
    'border.thin': '1px',
    borderThin: '1px',
    'focus.width': '2px',
    focusWidth: '2px',
    'focus.offset': '2px',
    focusOffset: '2px',
  },
  space: {
    '1': '4px',
    space1: '4px',
    '2': '8px',
    space2: '8px',
    '3': '12px',
    space3: '12px',
    '4': '16px',
    space4: '16px',
    '5': '20px',
    space5: '20px',
    '6': '24px',
    space6: '24px',
    '8': '32px',
    space8: '32px',
    '10': '40px',
    space10: '40px',
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    pill: '9999px',
  },
  font: {
    family: 'Pretendard, \'Noto Sans KR\', system-ui',
    'size.caption': '12px/16px',
    sizeCaption: '12px/16px',
    'size.body-sm': '13px/20px',
    sizeBodySm: '13px/20px',
    'size.body': '15px/22px',
    sizeBody: '15px/22px',
    'size.title-sm': '17px/24px',
    sizeTitleSm: '17px/24px',
    'size.title': '20px/28px',
    sizeTitle: '20px/28px',
    'size.display': '24px/32px',
    sizeDisplay: '24px/32px',
    'weight.regular': 400,
    weightRegular: 400,
    'weight.medium': 500,
    weightMedium: 500,
    'weight.bold': 700,
    weightBold: 700,
  },
  shadow: {
    card: '0 1px 2px rgba(20,23,26,0.05)',
    modal: '0 12px 32px rgba(20,23,26,0.16)',
    toast: '0 6px 16px rgba(20,23,26,0.14)',
  },
  layout: {
    'mobile.client.content.max': '480px',
    mobileClientContentMax: '480px',
    'mobile.client.gutter': '16px',
    mobileClientGutter: '16px',
    'table.collapse.breakpoint': '768px',
    tableCollapseBreakpoint: '768px',
    'toast.width': '360px',
    toastWidth: '360px',
    'toast.duration.info': '4000ms',
    toastDurationInfo: '4000ms',
    'toast.duration.error': '고정(닫기 버튼)',
    toastDurationError: '고정(닫기 버튼)',
    'modal.width.confirm': '400px',
    modalWidthConfirm: '400px',
  },
} as const;

export type MgTokens = typeof mg;

export function applyTenantBrandOverride<
  T extends { readonly brand: Readonly<Record<string, MgColor>> },
>(
  tokens: T,
  brandOverride?: Readonly<Record<string, MgColor>> | null,
): T {
  if (brandOverride == null) {
    return tokens;
  }
  const rejected: string[] = [];
  const brand: { [key: string]: MgColor } = { ...tokens.brand };
  for (const key of Object.keys(brandOverride)) {
    const next = brandOverride[key];
    const allowed = key.startsWith('brand.')
      && Object.prototype.hasOwnProperty.call(tokens.brand, key)
      && next != null
      && typeof next.light === 'string'
      && next.light.length > 0
      && typeof next.dark === 'string'
      && next.dark.length > 0
      && typeof next.hc === 'string'
      && next.hc.length > 0;
    if (!allowed || next == null) {
      rejected.push(key);
      continue;
    }
    brand[key] = { light: next.light, dark: next.dark, hc: next.hc };
  }
  if (rejected.length > 0) {
    throw new Error(
      `Tenant override may only change brand.* (rejected: ${rejected.join(', ')})`,
    );
  }
  return { ...tokens, brand } as T;
}
