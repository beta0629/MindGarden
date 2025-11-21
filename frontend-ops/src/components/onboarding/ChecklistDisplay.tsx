interface ChecklistDisplayProps {
  checklistJson: string | null | undefined;
}

interface ChecklistData {
  adminPassword?: string;
  paymentType?: string;
  paymentMethodToken?: string;
  billingKey?: string;
  customerKey?: string;
  [key: string]: any;
}

export default function ChecklistDisplay({ checklistJson }: ChecklistDisplayProps) {
  if (!checklistJson || checklistJson.trim() === "") {
    return (
      <div className="checklist-empty">
        <p>등록된 체크리스트가 없습니다.</p>
      </div>
    );
  }

  let checklistData: ChecklistData | null = null;
  try {
    checklistData = JSON.parse(checklistJson);
  } catch (error) {
    // JSON 파싱 실패 시 원본 표시
    return (
      <div className="checklist-error">
        <p className="checklist-error__title">체크리스트 파싱 오류</p>
        <pre className="checklist-error__content">{checklistJson}</pre>
      </div>
    );
  }

  if (!checklistData || typeof checklistData !== 'object') {
    return (
      <div className="checklist-empty">
        <p>유효하지 않은 체크리스트 데이터입니다.</p>
      </div>
    );
  }

  // 민감한 정보 마스킹 함수
  const maskSensitiveValue = (value: string | undefined, type: 'password' | 'token' | 'key'): string => {
    if (!value) return '-';
    if (type === 'password') {
      return '••••••••';
    }
    if (type === 'token' || type === 'key') {
      if (value.length > 8) {
        return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
      }
      return '••••';
    }
    return value;
  };

  // 필드 라벨 매핑
  const fieldLabels: Record<string, string> = {
    adminPassword: '관리자 비밀번호',
    paymentType: '결제 타입',
    paymentMethodToken: '결제 수단 토큰',
    billingKey: '빌링 키',
    customerKey: '고객 키',
    pricingPlanId: '요금제 ID',
    businessType: '업종 타입',
    businessCategory: '업종 카테고리',
    region: '지역',
    address: '주소',
    contactPhone: '연락처',
  };

  // 필드 표시 순서
  const displayOrder = [
    'businessType',
    'businessCategory',
    'region',
    'address',
    'contactPhone',
    'pricingPlanId',
    'paymentType',
    'customerKey',
    'billingKey',
    'paymentMethodToken',
    'adminPassword',
  ];

  // 표시할 필드 필터링 및 정렬
  const displayFields = displayOrder
    .filter(key => checklistData![key] !== undefined && checklistData![key] !== null)
    .map(key => ({
      key,
      label: fieldLabels[key] || key,
      value: checklistData![key],
      isSensitive: ['adminPassword', 'paymentMethodToken', 'billingKey', 'customerKey'].includes(key),
    }));

  // 나머지 필드들 추가
  const otherFields = Object.keys(checklistData)
    .filter(key => !displayOrder.includes(key))
    .map(key => ({
      key,
      label: fieldLabels[key] || key,
      value: checklistData![key],
      isSensitive: false,
    }));

  return (
    <div className="checklist-display">
      {displayFields.length > 0 && (
        <dl className="checklist-display__list">
          {displayFields.map((field) => (
            <div key={field.key} className="checklist-display__item">
              <dt className="checklist-display__label">{field.label}</dt>
              <dd className="checklist-display__value">
                {field.isSensitive ? (
                  <span className="checklist-display__masked">
                    {field.key === 'adminPassword'
                      ? maskSensitiveValue(String(field.value), 'password')
                      : maskSensitiveValue(String(field.value), 'token')}
                  </span>
                ) : (
                  <span>{String(field.value)}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      
      {otherFields.length > 0 && (
        <details className="checklist-display__other">
          <summary className="checklist-display__other-summary">
            기타 정보 ({otherFields.length}개)
          </summary>
          <dl className="checklist-display__list">
            {otherFields.map((field) => (
              <div key={field.key} className="checklist-display__item">
                <dt className="checklist-display__label">{field.label}</dt>
                <dd className="checklist-display__value">
                  <span>{String(field.value)}</span>
                </dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </div>
  );
}

