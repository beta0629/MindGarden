# Alert/Confirm 마이그레이션 가이드

**작성일**: 2025-01-XX  
**버전**: 1.0

## ✅ 변경 완료된 파일

1. **FinancialManagement.js** ✅
   - `window.confirm` → `ConfirmModal` 컴포넌트
   - `alert` → `notificationManager.success/error/info`

2. **UnifiedScheduleComponent.js** ✅
   - `alert` → `notificationManager.warning/error/success`

3. **WellnessManagement.js** ✅
   - `window.confirm` → `ConfirmModal` 컴포넌트

## 📋 변경 패턴

### Alert → 공통 알림 변경

**Before:**
```javascript
alert('거래가 성공적으로 삭제되었습니다.');
alert('거래 삭제에 실패했습니다: ' + result.message);
alert('거래 삭제 중 오류가 발생했습니다.');
alert('거래 수정 기능은 준비중입니다.');
```

**After:**
```javascript
notificationManager.success('거래가 성공적으로 삭제되었습니다.');
notificationManager.error('거래 삭제에 실패했습니다: ' + result.message);
notificationManager.error('거래 삭제 중 오류가 발생했습니다.');
notificationManager.info('거래 수정 기능은 준비중입니다.');
```

**Import 추가:**
```javascript
import notificationManager from '../../utils/notification';
```

### Confirm → 공통 컨펌 모달 변경

**Before:**
```javascript
if (!window.confirm('정말로 이 코드를 삭제하시겠습니까?')) {
    return;
}

// 또는

const confirmed = await new Promise((resolve) => {
    notificationManager.confirm('정말로 이 코드를 삭제하시겠습니까?', resolve);
});
if (!confirmed) {
    return;
}
```

**After:**
```javascript
// 1. State 추가
const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default', // default, danger, warning, success
    onConfirm: null
});

// 2. Import 추가
import ConfirmModal from '../common/ConfirmModal';

// 3. 사용
const handleDeleteCode = async (codeId) => {
    setConfirmModal({
        isOpen: true,
        title: '코드 삭제 확인',
        message: '정말로 이 코드를 삭제하시겠습니까?',
        type: 'danger',
        onConfirm: async () => {
            try {
                setLoading(true);
                const response = await apiDelete(`/api/common-codes/${codeId}`);
                
                if (response.success) {
                    notificationManager.success('코드가 삭제되었습니다!');
                    loadGroupCodes(selectedGroup);
                } else {
                    notificationManager.error(response.message || '코드 삭제에 실패했습니다.');
                }
            } catch (error) {
                console.error('코드 삭제 실패:', error);
                notificationManager.error('코드 삭제 중 오류가 발생했습니다.');
            } finally {
                setLoading(false);
            }
        }
    });
};

// 4. 컴포넌트 렌더링 추가 (return 문 내부)
<ConfirmModal
    isOpen={confirmModal.isOpen}
    onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', type: 'default', onConfirm: null })}
    onConfirm={confirmModal.onConfirm}
    title={confirmModal.title}
    message={confirmModal.message}
    type={confirmModal.type}
/>
```

## ⚠️ 변경 대상 파일 목록

다음 파일들도 동일한 패턴으로 변경이 필요합니다:

1. `admin/CommonCodeManagement.js` - `notificationManager.confirm` 사용
2. `admin/MappingManagement.js` - `notificationManager.confirm` 사용 (2곳)
3. `admin/VacationManagementModal.js` - `notificationManager.confirm` 사용
4. `admin/ConsultantManagement.js` - `notificationManager.confirm` 사용
5. `erp/ItemManagement.js` - `notificationManager.confirm` 사용
6. `admin/mapping/PartialRefundModal.js` - `notificationManager.confirm` 사용
7. `finance/RecurringExpenseModal.js` - `notificationManager.confirm` 사용
8. `admin/SystemNotificationManagement.js` - `notificationManager.confirm` 사용 (3곳)
9. `erp/ImprovedTaxManagement.js` - `notificationManager.confirm` 사용
10. `erp/BudgetManagement.js` - `notificationManager.confirm` 사용
11. `super-admin/PaymentManagement.js` - `notificationManager.confirm` 사용
12. `mypage/MyPage.js` - `notificationManager.confirm` 사용
13. `mypage/ProfileEdit.js` - `notificationManager.confirm` 사용
14. `admin/UserManagement.js` - `notificationManager.confirm` 사용
15. `admin/BranchManagement.js` - `notificationManager.confirm` 사용
16. `admin/AccountManagement.js` - `notificationManager.confirm` 사용

## ✅ 공통 알림 사용법

### notificationManager 메서드

```javascript
// 성공 알림
notificationManager.success('작업이 완료되었습니다.');

// 오류 알림
notificationManager.error('작업에 실패했습니다.');

// 경고 알림
notificationManager.warning('주의가 필요합니다.');

// 정보 알림
notificationManager.info('정보를 확인해주세요.');

// 커스텀 타입
notificationManager.show('메시지', 'success', 3000); // type, duration
```

## ✅ 공통 컨펌 모달 사용법

### ConfirmModal 컴포넌트

```javascript
// State 선언
const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'default', // default, danger, warning, success
    onConfirm: null
});

// 모달 열기
setConfirmModal({
    isOpen: true,
    title: '삭제 확인',
    message: '정말로 삭제하시겠습니까?',
    type: 'danger',
    onConfirm: () => {
        // 삭제 로직
    }
});

// 모달 닫기
setConfirmModal({ isOpen: false, title: '', message: '', type: 'default', onConfirm: null });

// JSX에서 렌더링
<ConfirmModal
    isOpen={confirmModal.isOpen}
    onClose={() => setConfirmModal({ isOpen: false, title: '', message: '', type: 'default', onConfirm: null })}
    onConfirm={confirmModal.onConfirm}
    title={confirmModal.title}
    message={confirmModal.message}
    type={confirmModal.type}
/>
```

## 📝 주의사항

1. **필수 알림 유지**: 브라우저 기본 기능이나 보안 관련 알림은 필요 시 유지
2. **테스트/백업 파일 제외**: `.backup.js`, `.test.js`, `.stories.js` 파일은 제외
3. **일관성**: 모든 파일에서 동일한 패턴 사용

## 🔄 다음 단계

나머지 파일들도 동일한 패턴으로 변경 진행 필요합니다.

