import React, { useState, useEffect } from 'react';
import './AddressInput.css';

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

  useEffect(() => {
    setLocalPostalCode(postalCode || '');
    setLocalAddress(address || '');
    setLocalAddressDetail(addressDetail || '');
  }, [postalCode, address, addressDetail]);

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
      alert('주소 검색 서비스를 불러올 수 없습니다.');
    }
  };

  return (
    <div className="address-input-container">
      <div className="form-group">
        <label>주소 타입</label>
        <select
          value={addressType}
          onChange={handleAddressTypeChange}
          disabled={!isEditing}
          className="address-type-select"
        >
          <option value="HOME">집</option>
          <option value="WORK">회사</option>
          <option value="OFFICE">사무실</option>
          <option value="BRANCH">지점</option>
          <option value="EMERGENCY">비상연락처</option>
          <option value="OTHER">기타</option>
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
