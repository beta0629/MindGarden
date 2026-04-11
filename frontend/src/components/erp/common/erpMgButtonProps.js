/**
 * ERP 화면용 MGButton 시각 계약(mg-v2-button 클래스·variant/size 매핑).
 */

const VARIANT_TO_MG = {
  primary: 'primary',
  secondary: 'secondary',
  success: 'success',
  danger: 'danger',
  warning: 'warning',
  info: 'info',
  outline: 'outline',
  ghost: 'outline'
};

const SIZE_TO_MG = {
  sm: 'small',
  md: 'medium',
  lg: 'large'
};

export const ERP_MG_BUTTON_LOADING_TEXT = '처리중...';

export function mapErpVariantToMg(variant) {
  return VARIANT_TO_MG[variant] ?? 'primary';
}

export function mapErpSizeToMg(size) {
  return SIZE_TO_MG[size] ?? SIZE_TO_MG.md;
}

export function buildErpMgButtonClassName({ variant = 'primary', size = 'md', loading = false, className = '' }) {
  return [
    'mg-v2-button',
    `mg-v2-button-${variant}`,
    size !== 'md' && `mg-v2-button-${size}`,
    loading && 'mg-v2-button-loading',
    className
  ].filter(Boolean).join(' ');
}
