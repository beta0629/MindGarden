import React, { useState, useEffect } from 'react';
import { apiGet } from '../../utils/ajax';

/**
 * 공통 패키지 선택 컴포넌트
/**
 * - 매칭 생성, 회기 추가 등에서 재사용
/**
 * - 스샷과 동일한 UI/UX 제공
/**
 * 
/**
 * @author MindGarden
/**
 * @version 1.0.0
/**
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
            // 표준화된 API 사용 (하위 호환성 유지)
            const { getCommonCodes } = await import('../../utils/commonCodeApi');
            let data = [];
            try {
                const codes = await getCommonCodes('PACKAGE');
                data = codes || [];
            } catch (error) {
                // 하위 호환성: 기존 API 사용
                const response = await apiGet('/api/common-codes/PACKAGE');
                data = response?.data || response || [];
            }
            
            if (Array.isArray(data)) {
                const options = data.map(pkg => {
                    let price, sessions;
                    
                    if (pkg.codeValue.startsWith('SINGLE_')) {
                        // SINGLE_30000 형태에서 가격 추출
                        price = parseInt(pkg.codeValue.replace('SINGLE_', '')) || 30000;
                        sessions = 1;
                    } else {
                        // Multi-Session 패키지들의 가격 매핑
                        switch (pkg.codeValue) {
                            case 'BASIC_20':
                                price = 200000;
                                sessions = 20;
                                break;
                            case 'STANDARD_20':
                                price = 400000;
                                sessions = 20;
                                break;
                            case 'PREMIUM_20':
                                price = 600000;
                                sessions = 20;
                                break;
                            case 'VIP_20':
                                price = 1000000;
                                sessions = 20;
                                break;
                            default:
                                price = 30000;
                                sessions = 1;
                        }
                    }
                    
                    return {
                        value: pkg.codeValue,
                        label: pkg.codeLabel || pkg.codeValue,
                        sessions: sessions,
                        price: price,
                        displayText: `${pkg.codeLabel || pkg.codeValue} (${sessions}회기, ${price.toLocaleString()}원)`
                    };
                });
                
                setPackageOptions(options);
            }
        } catch (error) {
            console.error('패키지 옵션 로드 실패:', error);
            // 스샷과 동일한 기본 옵션 설정
            const multiSessionPackages = [
                { value: 'BASIC_20', label: '기본 패키지', sessions: 20, price: 200000, displayText: '기본 패키지 (20회기, 200,000원)' },
                { value: 'STANDARD_20', label: '표준 패키지', sessions: 20, price: 400000, displayText: '표준 패키지 (20회기, 400,000원)' },
                { value: 'PREMIUM_20', label: '프리미엄 패키지', sessions: 20, price: 600000, displayText: '프리미엄 패키지 (20회기, 600,000원)' },
                { value: 'VIP_20', label: 'VIP 패키지', sessions: 20, price: 1000000, displayText: 'VIP 패키지 (20회기, 1,000,000원)' }
            ];
            
            // SINGLE 패키지들 (30,000원부터 100,000원까지)
            const singleSessionPackages = [];
            for (let price = 30000; price <= 100000; price += 5000) {
                singleSessionPackages.push({
                    value: `SINGLE_${price}`,
                    label: `SINGLE_${price}`,
                    sessions: 1,
                    price: price,
                    displayText: `SINGLE_${price} (1회기, ${price.toLocaleString()}원)`
                });
            }
            
            setPackageOptions([...multiSessionPackages, ...singleSessionPackages]);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const selectedValue = e.target.value;
        const selectedPackage = packageOptions.find(pkg => pkg.value === selectedValue);
        
        console.log('🔍 PackageSelector 선택:', {
            selectedValue,
            selectedPackage,
            allOptions: packageOptions.slice(0, 5) // 처음 5개만 로그
        });
        
        if (selectedPackage && onChange) {
            console.log('✅ PackageSelector 변경 이벤트 전송:', {
                value: selectedPackage.value,
                label: selectedPackage.label,
                sessions: selectedPackage.sessions,
                price: selectedPackage.price
            });
            
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
                <option value="">{placeholder}</option>
                {packageOptions.map(pkg => (
                    <option key={pkg.value} value={pkg.value}>
                        {pkg.displayText}
                    </option>
                ))}
            </select>
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
