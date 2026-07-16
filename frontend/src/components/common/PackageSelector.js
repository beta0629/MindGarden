import React, { useState, useEffect } from 'react';
import { CODE_GROUP_CONSULTATION_PACKAGE } from '../../constants/packagePricingConstants';
import { toPackageOption } from '../../utils/packagePricing';
import notificationManager from '../../utils/notification';

/**
 * 공통 패키지 선택 컴포넌트
 * - 매칭 생성·회기 추가 등에서 재사용
 * - SSOT: `/admin/package-pricing` 과 동일하게 CONSULTATION_PACKAGE + extraData 사용
 * - 레거시 PACKAGE 공통코드·가격/회기 하드코딩 폴백 금지
 *
 * @author Core Solution
 * @since 2024-12-19
 */
const PackageSelector = ({
  value = '',
  onChange,
  placeholder = '패키지를 선택하세요',
  disabled = false,
  className = ''
}) => {
  const [packageOptions, setPackageOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPackageOptions();
  }, []);

  const formatDisplayText = (opt) => {
    const sessionsLabel = opt.sessions != null ? `${opt.sessions}회기` : '-회기';
    const priceLabel = opt.price != null ? `${Number(opt.price).toLocaleString()}원` : '-원';
    return `${opt.label} (${sessionsLabel}, ${priceLabel})`;
  };

  const loadPackageOptions = async() => {
    try {
      setLoading(true);
      const { getTenantCodes } = await import('../../utils/commonCodeApi');
      const codes = await getTenantCodes(CODE_GROUP_CONSULTATION_PACKAGE);

      if (!codes || codes.length === 0) {
        notificationManager.warning('등록된 상담 패키지가 없습니다. 패키지 요금 관리에서 등록해 주세요.');
        setPackageOptions([]);
        return;
      }

      const options = (codes || [])
        .map(toPackageOption)
        .filter((opt) => opt.value)
        .sort((a, b) => {
          if (a.sortOrder == null && b.sortOrder == null) return 0;
          if (a.sortOrder == null) return 1;
          if (b.sortOrder == null) return -1;
          return a.sortOrder - b.sortOrder;
        })
        .map((opt) => ({
          ...opt,
          displayText: formatDisplayText(opt)
        }));

      setPackageOptions(options);
    } catch (error) {
      console.error('패키지 옵션 로드 실패:', error);
      notificationManager.error('패키지 옵션을 불러오는데 실패했습니다.');
      setPackageOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    const selectedPackage = packageOptions.find((pkg) => pkg.value === selectedValue);

    if (selectedPackage && onChange) {
      onChange({
        value: selectedPackage.value,
        label: selectedPackage.label,
        sessions: selectedPackage.sessions,
        price: selectedPackage.price
      });
    }
  };

  return (
    <div className={`mg-form-group ${className}`}>
      <label className="mg-v2-label">패키지 선택</label>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled || loading}
        className={`mg-v2-form-select ${value ? 'package-selected' : ''}`}
      >
        <option value="">{loading ? '패키지 불러오는 중...' : placeholder}</option>
        {packageOptions.map((pkg) => (
          <option key={pkg.value} value={pkg.value}>
            {pkg.displayText}
          </option>
        ))}
      </select>
      {!loading && packageOptions.length === 0 && (
        <div className="mg-v2-form-help">
          패키지 요금 관리에서 활성 패키지를 등록하면 여기에 표시됩니다.
        </div>
      )}
      {value && (
        <div className="mg-v2-form-success">
          <span>✓</span>
          패키지 선택 완료 - 세션 수와 가격이 자동으로 설정되었습니다
        </div>
      )}
    </div>
  );
};

export default PackageSelector;
