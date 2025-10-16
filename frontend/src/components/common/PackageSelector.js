import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';

/**
 * 공통 패키지 선택 컴포넌트
 * - 매칭 생성, 회기 추가 등에서 재사용
 * - 스샷과 동일한 UI/UX 제공
 * 
 * @author MindGarden
 * @version 1.0.0
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

    // 패키지 옵션 로드
    useEffect(() => {
        loadPackageOptions();
    }, []);

    const loadPackageOptions = async () => {
        try {
            setLoading(true);
            const response = await apiGet('/api/common-codes/group/PACKAGE');
            const data = response?.data || response || [];
            
            if (Array.isArray(data)) {
                const options = data.map(pkg => {
                    // SINGLE_30000 형태에서 가격 추출
                    const price = parseInt(pkg.codeValue.replace('SINGLE_', '')) || 30000;
                    const sessions = 1; // SINGLE 패키지는 모두 1회기
                    
                    return {
                        value: pkg.codeValue,
                        label: pkg.codeLabel || pkg.codeValue,
                        sessions: sessions,
                        price: price,
                        displayText: `${pkg.codeLabel || pkg.codeValue} (${sessions}회기, ${price.toLocaleString()}원)`
                    };
                });
                
                // Multi-Session 패키지들 추가
                const multiSessionPackages = [
                    { value: 'BASIC_20', label: '기본 패키지', sessions: 20, price: 200000, displayText: '기본 패키지 (20회기, 200,000원)' },
                    { value: 'STANDARD_20', label: '표준 패키지', sessions: 20, price: 400000, displayText: '표준 패키지 (20회기, 400,000원)' },
                    { value: 'PREMIUM_20', label: '프리미엄 패키지', sessions: 20, price: 600000, displayText: '프리미엄 패키지 (20회기, 600,000원)' },
                    { value: 'VIP_20', label: 'VIP 패키지', sessions: 20, price: 1000000, displayText: 'VIP 패키지 (20회기, 1,000,000원)' }
                ];
                
                setPackageOptions([...multiSessionPackages, ...options]);
            }
        } catch (error) {
            console.error('패키지 옵션 로드 실패:', error);
            // 기본 옵션 설정
            setPackageOptions([
                { value: 'BASIC_20', label: '기본 패키지', sessions: 20, price: 200000, displayText: '기본 패키지 (20회기, 200,000원)' },
                { value: 'SINGLE_30000', label: 'SINGLE_30000', sessions: 1, price: 30000, displayText: 'SINGLE_30000 (1회기, 30,000원)' },
                { value: 'SINGLE_35000', label: 'SINGLE_35000', sessions: 1, price: 35000, displayText: 'SINGLE_35000 (1회기, 35,000원)' },
                { value: 'SINGLE_40000', label: 'SINGLE_40000', sessions: 1, price: 40000, displayText: 'SINGLE_40000 (1회기, 40,000원)' },
                { value: 'SINGLE_45000', label: 'SINGLE_45000', sessions: 1, price: 45000, displayText: 'SINGLE_45000 (1회기, 45,000원)' },
                { value: 'SINGLE_50000', label: 'SINGLE_50000', sessions: 1, price: 50000, displayText: 'SINGLE_50000 (1회기, 50,000원)' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const selectedValue = e.target.value;
        const selectedPackage = packageOptions.find(pkg => pkg.value === selectedValue);
        
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
            <label className="mg-label">패키지 선택</label>
            <select
                value={value}
                onChange={handleChange}
                disabled={disabled || loading}
                className={`mg-input ${value ? 'package-selected' : ''}`}
                style={{
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")',
                    backgroundPosition: 'right 8px center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '16px',
                    paddingRight: '40px'
                }}
            >
                <option value="">{placeholder}</option>
                {packageOptions.map(pkg => (
                    <option key={pkg.value} value={pkg.value}>
                        {pkg.displayText}
                    </option>
                ))}
            </select>
            {value && (
                <div className="mg-form-success" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginTop: '8px',
                    color: 'var(--success-600)',
                    fontSize: 'var(--font-size-sm)'
                }}>
                    <span>✓</span>
                    패키지 선택 완료 - 세션 수와 가격이 자동으로 설정되었습니다
                </div>
            )}
        </div>
    );
};

export default PackageSelector;
