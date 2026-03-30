import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../utils/ajax';
import './AddressInput.css';
import notificationManager from '../../../utils/notification';

const AddressInput = ({ 
  postalCode, 
  address, 
  addressDetail, 
  onAddressChange, 
  isEditing 
}) => {
  const [addressType, setAddressType] = useState('HOME');
  const [localPostalCode, setLocalPostalCode] = useState(postalCode || '');
  const [localAddress, setLocalAddress] = useState(address || '');
  const [localAddressDetail, setLocalAddressDetail] = useState(addressDetail || '');
  const [addressTypeOptions, setAddressTypeOptions] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  useEffect(() => {
    setLocalPostalCode(postalCode || '');
    setLocalAddress(address || '');
    setLocalAddressDetail(addressDetail || '');
  }, [postalCode, address, addressDetail]);

  // 주소 유형 코드 로드
  useEffect(() => {
    const loadAddressTypeCodes = async () => {
      try {
        setLoadingCodes(true);
        const response = await apiGet('/api/v1/common-codes?codeGroup=ADDRESS_TYPE');
        if (response && response.length > 0) {
          const options = response.map(code => ({
            value: code.codeValue,
            label: code.codeLabel,
            icon: code.icon,
            color: code.colorCode,
            description: code.description
          }));
          setAddressTypeOptions(options);
        }
      } catch (error) {
        console.error('주소 유형 코드 로드 실패:', error);
        // 실패 시 기본값 설정
        setAddressTypeOptions([
          { value: 'HOME', label: '집', icon: '🏠', color: 'var(--mg-primary-500)', description: '자택 주소' },
          { value: 'WORK', label: '회사', icon: '🏢', color: 'var(--mg-success-500)', description: '직장 주소' },
          { value: 'OFFICE', label: '사무실', icon: '🏛️', color: 'var(--mg-purple-500)', description: '사무실 주소' },
          { value: 'BRANCH', label: '지점', icon: '🏪', color: 'var(--mg-warning-500)', description: '지점 주소' },
          { value: 'EMERGENCY', label: '비상연락처', icon: '🚨', color: 'var(--mg-error-500)', description: '비상연락처 주소' },
          // ⚠️ 표준화 2025-12-05: 하드코딩된 색상값을 CSS 변수로 변경 필요: #6b7280 -> var(--mg-custom-6b7280)
          { value: 'OTHER', label: '기타', icon: '📍', color: '#6b7280', description: '기타 주소' }
        ]);
      } finally {
        setLoadingCodes(false);
      }
    };

    loadAddressTypeCodes();
  }, []);

  const handleAddressTypeChange = (e) => {
    const newType = e.target.value;
    setAddressType(newType);
    onAddressChange({
      addressType: newType,
      postalCode: localPostalCode,
      address: localAddress,
      addressDetail: localAddressDetail
    });
  };

  const handlePostalCodeChange = (e) => {
    const value = e.target.value;
    setLocalPostalCode(value);
    onAddressChange({
      addressType,
      postalCode: value,
      address: localAddress,
      addressDetail: localAddressDetail
    });
  };

  const handleAddressChange = (e) => {
    const value = e.target.value;
    setLocalAddress(value);
    onAddressChange({
      addressType,
      postalCode: localPostalCode,
      address: value,
      addressDetail: localAddressDetail
    });
  };

  const handleAddressDetailChange = (e) => {
    const value = e.target.value;
    setLocalAddressDetail(value);
    onAddressChange({
      addressType,
      postalCode: localPostalCode,
      address: localAddress,
      addressDetail: value
    });
  };

  const handleAddressSearch = () => {
    if (window.daum && window.daum.Postcode) {
      new window.daum.Postcode({
        oncomplete: function(data) {
          setLocalPostalCode(data.zonecode);
          setLocalAddress(data.address);
          onAddressChange({
            addressType,
            postalCode: data.zonecode,
            address: data.address,
            addressDetail: localAddressDetail
          });
        }
      }).open();
    } else {
      notificationManager.show('주소 검색 서비스를 불러올 수 없습니다.', 'info');
    }
  };

  return (
    <div className="address-input-container">
      <div className="form-group">
        <label>주소 타입</label>
        <select
          value={addressType}
          onChange={handleAddressTypeChange}
          disabled={!isEditing || loadingCodes}
          className="address-type-select"
        >
          {addressTypeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label} ({option.value})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>우편번호</label>
        <div className="postal-code-container">
          <input
            type="text"
            value={localPostalCode}
            onChange={handlePostalCodeChange}
            disabled={!isEditing}
            placeholder="우편번호"
            className="postal-code-input"
          />
          {isEditing && (
            <button
              type="button"
              onClick={handleAddressSearch}
              className="address-search-btn"
            >
              주소 검색
            </button>
          )}
        </div>
      </div>

      <div className="form-group">
        <label>주소</label>
        <input
          type="text"
          value={localAddress}
          onChange={handleAddressChange}
          disabled={!isEditing}
          placeholder="주소"
        />
      </div>

      <div className="form-group">
        <label>상세주소</label>
        <input
          type="text"
          value={localAddressDetail}
          onChange={handleAddressDetailChange}
          disabled={!isEditing}
          placeholder="상세주소"
        />
      </div>
    </div>
  );
};

export default AddressInput;
