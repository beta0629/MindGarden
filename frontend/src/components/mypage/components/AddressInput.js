import React, { useState, useEffect } from 'react';
import { apiGet } from '../../../utils/ajax';
import notificationManager from '../../../utils/notification';

const AddressInput = ({ postalCode, address, addressDetail, onAddressChange, isEditing }) => {
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

  useEffect(() => {
    const loadAddressTypeCodes = async () => {
      try {
        setLoadingCodes(true);
        const response = await apiGet('/api/v1/common-codes?codeGroup=ADDRESS_TYPE');
        if (response && response.length > 0) {
          setAddressTypeOptions(
            response.map((code) => ({
              value: code.codeValue,
              label: code.codeLabel,
              icon: code.icon
            }))
          );
        }
      } catch (error) {
        console.error('주소 유형 코드 로드 실패:', error);
        setAddressTypeOptions([
          { value: 'HOME', label: '집', icon: '🏠' },
          { value: 'WORK', label: '회사', icon: '🏢' },
          { value: 'OFFICE', label: '사무실', icon: '🏛️' },
          { value: 'BRANCH', label: '지점', icon: '🏪' },
          { value: 'EMERGENCY', label: '비상연락처', icon: '🚨' },
          { value: 'OTHER', label: '기타', icon: '📍' }
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

  const handleAddressChangeField = (e) => {
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
        oncomplete(data) {
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
    <div className="mg-mypage__address-grid">
      <div className="mg-mypage__form-row">
        <label className="mg-mypage__form-label" htmlFor="mg-mypage-address-type">
          주소 유형
        </label>
        <select
          className="mg-mypage__form-control"
          id="mg-mypage-address-type"
          value={addressType}
          onChange={handleAddressTypeChange}
          disabled={!isEditing || loadingCodes}
        >
          {addressTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon ? `${option.icon} ` : ''}
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mg-mypage__form-row mg-mypage__form-row--stack">
        <span className="mg-mypage__form-label" id="mg-mypage-postal-label">
          우편번호
        </span>
        <div className="mg-mypage__postal-row">
          <input
            className="mg-mypage__form-control"
            type="text"
            aria-labelledby="mg-mypage-postal-label"
            value={localPostalCode}
            onChange={handlePostalCodeChange}
            disabled={!isEditing}
            placeholder="우편번호"
          />
          {isEditing ? (
            <button type="button" className="mg-v2-button mg-v2-button--outline" onClick={handleAddressSearch}>
              주소 검색
            </button>
          ) : null}
        </div>
      </div>

      <div className="mg-mypage__form-row">
        <label className="mg-mypage__form-label" htmlFor="mg-mypage-address-line">
          주소
        </label>
        <input
          className="mg-mypage__form-control"
          id="mg-mypage-address-line"
          type="text"
          value={localAddress}
          onChange={handleAddressChangeField}
          disabled={!isEditing}
          placeholder="주소"
        />
      </div>

      <div className="mg-mypage__form-row">
        <label className="mg-mypage__form-label" htmlFor="mg-mypage-address-detail">
          상세주소
        </label>
        <input
          className="mg-mypage__form-control"
          id="mg-mypage-address-detail"
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
