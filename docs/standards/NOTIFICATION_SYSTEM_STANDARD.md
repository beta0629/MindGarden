# 공통 알림 시스템 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 통합 알림 시스템 표준입니다.

### 참조 문서
- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)
- [디자인 중앙화 표준](./DESIGN_CENTRALIZATION_STANDARD.md)

### 구현 위치
- **프론트엔드**: `frontend/src/components/common/UnifiedNotification.js`
- **백엔드**: `src/main/java/com/coresolution/consultation/service/NotificationService.java`
- **유틸리티**: `frontend/src/utils/notification.js`

---

## 🎯 알림 시스템 원칙

### 1. 통합 알림 컴포넌트 사용
```
모든 알림은 UnifiedNotification 컴포넌트를 통해 표시
```

**장점**:
- ✅ 일관된 UI/UX
- ✅ 중앙 집중식 관리
- ✅ 유지보수 용이

---

### 2. 알림 타입

#### 프론트엔드 알림 타입
```javascript
const NOTIFICATION_TYPES = {
  TOAST: 'toast',      // 일반 토스트 알림
  MODAL: 'modal',      // 모달 형태 알림
  BANNER: 'banner'     // 배너 형태 알림
};
```

#### 백엔드 알림 타입
```java
public enum NotificationType {
    CONSULTATION_CONFIRMED,   // 상담 확정
    CONSULTATION_REMINDER,    // 상담 리마인더
    REFUND_COMPLETED,        // 환불 완료
    SCHEDULE_CHANGED,        // 일정 변경
    PAYMENT_COMPLETED,       // 결제 완료
    DEPOSIT_PENDING_REMINDER // 입금 확인 대기 리마인더
}
```

---

### 3. 알림 변형 (Variant)

```javascript
const NOTIFICATION_VARIANTS = {
  SUCCESS: 'success',  // 성공 (녹색)
  ERROR: 'error',      // 에러 (빨간색)
  WARNING: 'warning',  // 경고 (노란색)
  INFO: 'info'         // 정보 (파란색)
};
```

---

## 💻 프론트엔드 알림 시스템

### 1. UnifiedNotification 컴포넌트

#### Props
```javascript
{
  type: 'toast' | 'modal' | 'banner',
  variant: 'success' | 'error' | 'warning' | 'info',
  message: string,
  title: string,              // modal 타입에서 사용
  duration: number,           // ms (기본값: 1000)
  position: string,           // 'top-right', 'top-center', 'bottom-right'
  actions: Array,             // 액션 버튼들
  autoClose: boolean,         // 자동 닫힘 여부 (기본값: true)
  onClose: Function,          // 닫기 핸들러
  onAction: Function,         // 액션 핸들러
  showCountdown: boolean,     // 카운트다운 표시 (modal)
  countdown: number           // 카운트다운 시간 (초)
}
```

---

### 2. NotificationManager 사용법

#### 기본 사용
```javascript
import notificationManager from '../../utils/notification';

// 성공 알림
notificationManager.success('저장되었습니다.');

// 에러 알림
notificationManager.error('저장에 실패했습니다.');

// 경고 알림
notificationManager.warning('입력값을 확인해주세요.');

// 정보 알림
notificationManager.info('새로운 알림이 있습니다.');
```

#### 고급 사용
```javascript
// 커스텀 duration
notificationManager.success('저장되었습니다.', 3000);

// 모달 알림
notificationManager.show({
  type: 'modal',
  variant: 'warning',
  title: '중복 로그인 감지',
  message: '다른 기기에서 로그인되었습니다.',
  showCountdown: true,
  countdown: 5,
  actions: [
    {
      label: '확인',
      variant: 'primary',
      onClick: () => {
        window.location.href = '/login';
      }
    }
  ]
});

// 액션 버튼이 있는 토스트
notificationManager.show({
  type: 'toast',
  variant: 'info',
  message: '새로운 메시지가 있습니다.',
  duration: 5000,
  actions: [
    {
      label: '확인',
      onClick: () => {
        window.location.href = '/messages';
      }
    },
    {
      label: '닫기',
      onClick: () => {
        // 알림만 닫기
      }
    }
  ]
});
```

---

### 3. CSS 클래스

#### 토스트 알림
```css
.mg-notification {
  position: fixed;
  z-index: var(--mg-z-tooltip);
  padding: var(--mg-spacing-4);
  border-radius: var(--mg-border-radius-md);
  box-shadow: var(--mg-shadow-lg);
  background-color: white;
  transition: all var(--mg-transition-base) ease;
}

/* 위치 */
.mg-notification--top-right {
  top: var(--mg-spacing-4);
  right: var(--mg-spacing-4);
}

.mg-notification--top-center {
  top: var(--mg-spacing-4);
  left: 50%;
  transform: translateX(-50%);
}

.mg-notification--bottom-right {
  bottom: var(--mg-spacing-4);
  right: var(--mg-spacing-4);
}

/* 변형 */
.mg-notification--success {
  border-left: 4px solid var(--mg-success);
}

.mg-notification--error {
  border-left: 4px solid var(--mg-error);
}

.mg-notification--warning {
  border-left: 4px solid var(--mg-warning);
}

.mg-notification--info {
  border-left: 4px solid var(--mg-info);
}
```

#### 모달 알림
```css
.mg-notification-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: var(--mg-z-modal);
  background-color: white;
  border-radius: var(--mg-border-radius-xl);
  box-shadow: var(--mg-shadow-xl);
  padding: var(--mg-spacing-6);
  max-width: 500px;
  width: 90%;
}

.mg-notification-modal__backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: var(--mg-z-modal-backdrop);
}
```

---

## 🔔 백엔드 알림 시스템

### 1. NotificationService 인터페이스

```java
public interface NotificationService {
    
    /**
     * 통합 알림 발송
     * 
     * @param user 수신자
     * @param notificationType 알림 타입
     * @param priority 우선순위
     * @param params 알림 파라미터
     * @return 발송 성공 여부
     */
    boolean sendNotification(
        User user, 
        NotificationType notificationType, 
        NotificationPriority priority, 
        String... params
    );
    
    /**
     * 상담 확정 알림
     */
    boolean sendConsultationConfirmed(
        User user, 
        String consultantName, 
        String consultationDate, 
        String consultationTime
    );
    
    /**
     * 상담 리마인더 알림 (1시간 전)
     */
    boolean sendConsultationReminder(
        User user, 
        String consultantName, 
        String consultationTime
    );
    
    /**
     * 환불 완료 알림
     */
    boolean sendRefundCompleted(
        User user, 
        String amount, 
        String refundDate
    );
    
    /**
     * 일정 변경 알림
     */
    boolean sendScheduleChanged(
        User user, 
        String oldDate, 
        String newDate
    );
    
    /**
     * 결제 완료 알림
     */
    boolean sendPaymentCompleted(
        User user, 
        String amount, 
        String paymentMethod
    );
}
```

---

### 2. 알림 우선순위

```java
public enum NotificationPriority {
    HIGH,    // 카카오 알림톡 우선
    MEDIUM,  // SMS 우선
    LOW      // 이메일 우선
}
```

#### 우선순위별 발송 순서
```
HIGH:   카카오 알림톡 → SMS → 이메일 → 시스템 내 알림
MEDIUM: SMS → 카카오 알림톡 → 이메일 → 시스템 내 알림
LOW:    이메일 → SMS → 카카오 알림톡 → 시스템 내 알림
```

---

### 3. 알림 발송 구현

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationServiceImpl implements NotificationService {
    
    private final KakaoAlimTalkService kakaoAlimTalkService;
    private final SmsAuthService smsAuthService;
    private final EmailService emailService;
    private final AlertRepository alertRepository;
    
    @Override
    public boolean sendNotification(
        User user, 
        NotificationType type, 
        NotificationPriority priority, 
        String... params
    ) {
        log.info("🔔 알림 발송 시작: 사용자={}, 타입={}, 우선순위={}", 
            user.getName(), type, priority);
        
        boolean success = false;
        
        // 우선순위에 따른 발송
        switch (priority) {
            case HIGH:
                success = sendKakaoAlimTalk(user, type, params);
                if (!success) success = sendSms(user, type, params);
                if (!success) success = sendEmail(user, type, params);
                break;
                
            case MEDIUM:
                success = sendSms(user, type, params);
                if (!success) success = sendKakaoAlimTalk(user, type, params);
                if (!success) success = sendEmail(user, type, params);
                break;
                
            case LOW:
                success = sendEmail(user, type, params);
                if (!success) success = sendSms(user, type, params);
                if (!success) success = sendKakaoAlimTalk(user, type, params);
                break;
        }
        
        // 시스템 내 알림 (항상 저장)
        sendSystemNotification(user, type, params);
        
        return success;
    }
    
    /**
     * 시스템 내 알림 발송 (Alert 테이블에 저장)
     */
    private boolean sendSystemNotification(User user, NotificationType type, String[] params) {
        try {
            Alert alert = Alert.builder()
                .userId(user.getId())
                .type(type.name())
                .priority("NORMAL")
                .status("UNREAD")
                .title(buildAlertTitle(type))
                .content(buildAlertContent(type, params))
                .summary(buildAlertSummary(type, params))
                .icon(getAlertIcon(type))
                .color(getAlertColor(type))
                .isDismissible(true)
                .autoDismissSeconds(30)
                .build();
            
            alertRepository.save(alert);
            
            log.info("✅ 시스템 내 알림 저장 완료: alertId={}", alert.getId());
            return true;
            
        } catch (Exception e) {
            log.error("시스템 내 알림 발송 실패", e);
            return false;
        }
    }
}
```

---

## 📊 알림 데이터 구조

### 1. Alert 엔티티

```java
@Entity
@Table(name = "alerts")
public class Alert extends BaseEntity {
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "type", nullable = false, length = 50)
    private String type;  // NotificationType
    
    @Column(name = "priority", nullable = false, length = 20)
    private String priority;  // NORMAL, HIGH, URGENT
    
    @Column(name = "status", nullable = false, length = 20)
    private String status;  // UNREAD, READ, DISMISSED
    
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;
    
    @Column(name = "summary", length = 500)
    private String summary;
    
    @Column(name = "icon", length = 50)
    private String icon;  // 아이콘 이름
    
    @Column(name = "color", length = 20)
    private String color;  // success, error, warning, info
    
    @Column(name = "is_dismissible")
    private Boolean isDismissible;  // 닫기 가능 여부
    
    @Column(name = "auto_dismiss_seconds")
    private Integer autoDismissSeconds;  // 자동 닫기 시간
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @Column(name = "dismissed_at")
    private LocalDateTime dismissedAt;
}
```

---

### 2. 알림 API

#### 알림 목록 조회
```
GET /api/v1/alerts
GET /api/v1/alerts?status=UNREAD
GET /api/v1/alerts?page=0&size=20
```

#### 알림 읽음 처리
```
PUT /api/v1/alerts/{id}/read
```

#### 알림 닫기
```
PUT /api/v1/alerts/{id}/dismiss
```

#### 모든 알림 읽음 처리
```
PUT /api/v1/alerts/read-all
```

---

## ✅ 체크리스트

### 프론트엔드 알림 사용 시
- [ ] UnifiedNotification 컴포넌트 사용
- [ ] notificationManager 유틸리티 사용
- [ ] 적절한 variant 선택 (success, error, warning, info)
- [ ] 적절한 duration 설정 (기본값: 1000ms)
- [ ] 중요한 알림은 modal 타입 사용
- [ ] 액션이 필요한 경우 actions 배열 제공

### 백엔드 알림 발송 시
- [ ] NotificationService 인터페이스 사용
- [ ] 적절한 NotificationType 선택
- [ ] 적절한 NotificationPriority 선택
- [ ] 시스템 내 알림 항상 저장 (Alert 테이블)
- [ ] 발송 실패 시 로그 기록
- [ ] 사용자 설정 확인 (알림 수신 동의)

---

## 🚫 금지 사항

### 1. 직접 alert() 사용 금지
```javascript
// ❌ 금지
alert('저장되었습니다.');

// ✅ 권장
notificationManager.success('저장되었습니다.');
```

### 2. 커스텀 알림 컴포넌트 생성 금지
```javascript
// ❌ 금지 - 새로운 알림 컴포넌트 생성
const MyCustomNotification = () => { ... };

// ✅ 권장 - UnifiedNotification 사용
import UnifiedNotification from './UnifiedNotification';
```

### 3. 인라인 스타일 금지
```javascript
// ❌ 금지
<div style={{ backgroundColor: '#4caf50' }}>알림</div>

// ✅ 권장
<div className="mg-notification mg-notification--success">알림</div>
```

---

## 💡 베스트 프랙티스

### 1. 명확한 메시지
```javascript
// Good
notificationManager.success('상담 예약이 완료되었습니다.');

// Better
notificationManager.success('2024-12-02 14:00 상담 예약이 완료되었습니다.');
```

### 2. 적절한 duration
```javascript
// 성공 메시지 - 짧게
notificationManager.success('저장되었습니다.', 1000);

// 에러 메시지 - 길게
notificationManager.error('저장에 실패했습니다. 다시 시도해주세요.', 5000);

// 중요한 정보 - 더 길게
notificationManager.info('시스템 점검이 예정되어 있습니다.', 10000);
```

### 3. 액션 버튼 제공
```javascript
notificationManager.show({
  type: 'toast',
  variant: 'success',
  message: '상담 예약이 완료되었습니다.',
  duration: 5000,
  actions: [
    {
      label: '예약 확인',
      onClick: () => {
        window.location.href = '/consultations';
      }
    }
  ]
});
```

---

## 📱 모바일 푸시 알림 시스템 (앱 개발용)

### 1. 푸시 알림 개요

모바일 앱 개발 시 사용할 푸시 알림 시스템 표준입니다.

**지원 플랫폼**:
- iOS (APNs - Apple Push Notification service)
- Android (FCM - Firebase Cloud Messaging)

---

### 2. 푸시 알림 타입

```java
public enum PushNotificationType {
    // 상담 관련
    CONSULTATION_CONFIRMED("상담 확정", "상담이 확정되었습니다."),
    CONSULTATION_REMINDER("상담 리마인더", "1시간 후 상담이 있습니다."),
    CONSULTATION_CANCELLED("상담 취소", "상담이 취소되었습니다."),
    
    // 결제 관련
    PAYMENT_COMPLETED("결제 완료", "결제가 완료되었습니다."),
    REFUND_COMPLETED("환불 완료", "환불이 완료되었습니다."),
    
    // 메시지 관련
    NEW_MESSAGE("새 메시지", "새로운 메시지가 도착했습니다."),
    
    // 시스템 관련
    SYSTEM_NOTICE("시스템 공지", "중요한 공지사항이 있습니다."),
    SYSTEM_MAINTENANCE("시스템 점검", "시스템 점검이 예정되어 있습니다.");
    
    private final String title;
    private final String defaultMessage;
}
```

---

### 3. 푸시 알림 우선순위

```java
public enum PushPriority {
    HIGH,      // 즉시 전송 (상담 리마인더, 긴급 공지)
    NORMAL,    // 일반 전송 (일반 메시지, 결제 완료)
    LOW        // 배치 전송 (마케팅, 이벤트)
}
```

---

### 4. 푸시 알림 데이터 구조

#### iOS (APNs) Payload
```json
{
  "aps": {
    "alert": {
      "title": "상담 리마인더",
      "body": "1시간 후 김철수 상담사와 상담이 있습니다.",
      "subtitle": "MindGarden"
    },
    "badge": 1,
    "sound": "default",
    "category": "CONSULTATION_REMINDER",
    "thread-id": "consultation-123"
  },
  "data": {
    "type": "CONSULTATION_REMINDER",
    "consultationId": "123",
    "consultantName": "김철수",
    "consultationTime": "2024-12-02T14:00:00",
    "deepLink": "mindgarden://consultations/123"
  }
}
```

#### Android (FCM) Payload
```json
{
  "notification": {
    "title": "상담 리마인더",
    "body": "1시간 후 김철수 상담사와 상담이 있습니다.",
    "icon": "ic_notification",
    "color": "#3b82f6",
    "sound": "default",
    "tag": "consultation-123",
    "click_action": "CONSULTATION_REMINDER"
  },
  "data": {
    "type": "CONSULTATION_REMINDER",
    "consultationId": "123",
    "consultantName": "김철수",
    "consultationTime": "2024-12-02T14:00:00",
    "deepLink": "mindgarden://consultations/123"
  },
  "android": {
    "priority": "high",
    "notification": {
      "channel_id": "consultation_reminders"
    }
  }
}
```

---

### 5. 푸시 알림 서비스 인터페이스

```java
public interface PushNotificationService {
    
    /**
     * 단일 사용자에게 푸시 알림 발송
     * 
     * @param userId 사용자 ID
     * @param type 알림 타입
     * @param title 제목
     * @param message 메시지
     * @param data 추가 데이터
     * @param priority 우선순위
     * @return 발송 성공 여부
     */
    boolean sendPushNotification(
        Long userId,
        PushNotificationType type,
        String title,
        String message,
        Map<String, String> data,
        PushPriority priority
    );
    
    /**
     * 여러 사용자에게 푸시 알림 발송 (배치)
     * 
     * @param userIds 사용자 ID 목록
     * @param type 알림 타입
     * @param title 제목
     * @param message 메시지
     * @param data 추가 데이터
     * @return 발송 성공 건수
     */
    int sendBatchPushNotification(
        List<Long> userIds,
        PushNotificationType type,
        String title,
        String message,
        Map<String, String> data
    );
    
    /**
     * 토픽 구독자에게 푸시 알림 발송
     * 
     * @param topic 토픽명
     * @param type 알림 타입
     * @param title 제목
     * @param message 메시지
     * @param data 추가 데이터
     * @return 발송 성공 여부
     */
    boolean sendTopicPushNotification(
        String topic,
        PushNotificationType type,
        String title,
        String message,
        Map<String, String> data
    );
    
    /**
     * FCM 토큰 등록
     * 
     * @param userId 사용자 ID
     * @param fcmToken FCM 토큰
     * @param deviceType 디바이스 타입 (iOS, Android)
     * @return 등록 성공 여부
     */
    boolean registerFcmToken(Long userId, String fcmToken, String deviceType);
    
    /**
     * FCM 토큰 삭제 (로그아웃 시)
     * 
     * @param userId 사용자 ID
     * @param fcmToken FCM 토큰
     * @return 삭제 성공 여부
     */
    boolean unregisterFcmToken(Long userId, String fcmToken);
    
    /**
     * 토픽 구독
     * 
     * @param userId 사용자 ID
     * @param topic 토픽명
     * @return 구독 성공 여부
     */
    boolean subscribeToTopic(Long userId, String topic);
    
    /**
     * 토픽 구독 해제
     * 
     * @param userId 사용자 ID
     * @param topic 토픽명
     * @return 구독 해제 성공 여부
     */
    boolean unsubscribeFromTopic(Long userId, String topic);
}
```

---

### 6. 푸시 알림 토큰 관리

#### FcmToken 엔티티
```java
@Entity
@Table(name = "fcm_tokens", indexes = {
    @Index(name = "idx_fcm_token_user", columnList = "userId"),
    @Index(name = "idx_fcm_token", columnList = "fcmToken")
})
public class FcmToken extends BaseEntity {
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "fcm_token", nullable = false, length = 500)
    private String fcmToken;
    
    @Column(name = "device_type", nullable = false, length = 20)
    private String deviceType;  // iOS, Android
    
    @Column(name = "device_id", length = 100)
    private String deviceId;
    
    @Column(name = "app_version", length = 20)
    private String appVersion;
    
    @Column(name = "os_version", length = 20)
    private String osVersion;
    
    @Column(name = "is_active")
    private Boolean isActive;
    
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;
}
```

---

### 7. 푸시 알림 채널 (Android)

```java
public enum PushNotificationChannel {
    CONSULTATION_REMINDERS(
        "consultation_reminders",
        "상담 리마인더",
        "상담 일정 알림",
        NotificationManager.IMPORTANCE_HIGH
    ),
    
    MESSAGES(
        "messages",
        "메시지",
        "새로운 메시지 알림",
        NotificationManager.IMPORTANCE_DEFAULT
    ),
    
    PAYMENTS(
        "payments",
        "결제",
        "결제 및 환불 알림",
        NotificationManager.IMPORTANCE_DEFAULT
    ),
    
    SYSTEM_NOTICES(
        "system_notices",
        "시스템 공지",
        "중요한 시스템 공지",
        NotificationManager.IMPORTANCE_HIGH
    ),
    
    MARKETING(
        "marketing",
        "마케팅",
        "이벤트 및 프로모션",
        NotificationManager.IMPORTANCE_LOW
    );
    
    private final String channelId;
    private final String channelName;
    private final String channelDescription;
    private final int importance;
}
```

---

### 8. 딥링크 (Deep Link) 규칙

```
형식: mindgarden://{screen}/{id}?{params}

예시:
- mindgarden://consultations/123
- mindgarden://messages/456
- mindgarden://payments/789
- mindgarden://profile
- mindgarden://notifications
```

#### 딥링크 처리 (React Native)
```javascript
import { Linking } from 'react-native';

// 딥링크 리스너 등록
Linking.addEventListener('url', handleDeepLink);

function handleDeepLink({ url }) {
  // mindgarden://consultations/123
  const route = url.replace('mindgarden://', '');
  const [screen, id, params] = parseRoute(route);
  
  switch (screen) {
    case 'consultations':
      navigation.navigate('ConsultationDetail', { id });
      break;
    case 'messages':
      navigation.navigate('MessageDetail', { id });
      break;
    case 'payments':
      navigation.navigate('PaymentDetail', { id });
      break;
    default:
      navigation.navigate('Home');
  }
}
```

---

### 9. 푸시 알림 설정 (사용자)

#### UserPushSettings 엔티티
```java
@Entity
@Table(name = "user_push_settings")
public class UserPushSettings extends BaseEntity {
    
    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;
    
    @Column(name = "push_enabled")
    private Boolean pushEnabled;  // 전체 푸시 알림 활성화
    
    @Column(name = "consultation_reminders")
    private Boolean consultationReminders;  // 상담 리마인더
    
    @Column(name = "message_notifications")
    private Boolean messageNotifications;  // 메시지 알림
    
    @Column(name = "payment_notifications")
    private Boolean paymentNotifications;  // 결제 알림
    
    @Column(name = "system_notices")
    private Boolean systemNotices;  // 시스템 공지
    
    @Column(name = "marketing_notifications")
    private Boolean marketingNotifications;  // 마케팅 알림
    
    @Column(name = "night_mode_enabled")
    private Boolean nightModeEnabled;  // 야간 모드 (22:00-08:00 알림 차단)
    
    @Column(name = "vibration_enabled")
    private Boolean vibrationEnabled;  // 진동
    
    @Column(name = "sound_enabled")
    private Boolean soundEnabled;  // 소리
}
```

---

### 10. 푸시 알림 로그

#### PushNotificationLog 엔티티
```java
@Entity
@Table(name = "push_notification_logs", indexes = {
    @Index(name = "idx_push_log_user", columnList = "userId"),
    @Index(name = "idx_push_log_type", columnList = "notificationType"),
    @Index(name = "idx_push_log_sent_at", columnList = "sentAt")
})
public class PushNotificationLog extends BaseEntity {
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "fcm_token", length = 500)
    private String fcmToken;
    
    @Column(name = "notification_type", nullable = false, length = 50)
    private String notificationType;
    
    @Column(name = "title", nullable = false, length = 200)
    private String title;
    
    @Column(name = "message", columnDefinition = "TEXT")
    private String message;
    
    @Column(name = "data", columnDefinition = "JSON")
    private String data;
    
    @Column(name = "priority", length = 20)
    private String priority;
    
    @Column(name = "sent_at")
    private LocalDateTime sentAt;
    
    @Column(name = "is_success")
    private Boolean isSuccess;
    
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(name = "device_type", length = 20)
    private String deviceType;
}
```

---

### 11. 푸시 알림 API

#### 토큰 등록
```
POST /api/v1/push/tokens
```

**요청**:
```json
{
  "fcmToken": "dXJlLWZjbS10b2tlbi1oZXJl...",
  "deviceType": "iOS",
  "deviceId": "ABC123",
  "appVersion": "1.0.0",
  "osVersion": "iOS 17.0"
}
```

#### 푸시 설정 조회
```
GET /api/v1/push/settings
```

**응답**:
```json
{
  "success": true,
  "data": {
    "pushEnabled": true,
    "consultationReminders": true,
    "messageNotifications": true,
    "paymentNotifications": true,
    "systemNotices": true,
    "marketingNotifications": false,
    "nightModeEnabled": true,
    "vibrationEnabled": true,
    "soundEnabled": true
  }
}
```

#### 푸시 설정 수정
```
PUT /api/v1/push/settings
```

**요청**:
```json
{
  "consultationReminders": true,
  "messageNotifications": false,
  "nightModeEnabled": true
}
```

#### 토픽 구독
```
POST /api/v1/push/topics/subscribe
```

**요청**:
```json
{
  "topic": "system_notices"
}
```

---

### 12. 푸시 알림 테스트

```java
@RestController
@RequestMapping("/api/v1/push/test")
@RequiredArgsConstructor
public class PushNotificationTestController {
    
    private final PushNotificationService pushNotificationService;
    
    /**
     * 테스트 푸시 알림 발송
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendTestPush(
        @RequestParam Long userId,
        @RequestParam String title,
        @RequestParam String message
    ) {
        Map<String, String> data = new HashMap<>();
        data.put("type", "TEST");
        data.put("timestamp", LocalDateTime.now().toString());
        
        boolean success = pushNotificationService.sendPushNotification(
            userId,
            PushNotificationType.SYSTEM_NOTICE,
            title,
            message,
            data,
            PushPriority.NORMAL
        );
        
        return ResponseEntity.ok(Map.of("success", success));
    }
}
```

---

### 13. 푸시 알림 베스트 프랙티스

#### 1. 명확한 메시지
```java
// Good
title: "상담 리마인더"
message: "1시간 후 김철수 상담사와 상담이 있습니다."

// Better
title: "상담 리마인더"
message: "오후 2시 김철수 상담사와 상담이 있습니다. (1시간 전)"
```

#### 2. 적절한 우선순위
```java
// 긴급 알림 - HIGH
pushNotificationService.sendPushNotification(
    userId, 
    PushNotificationType.CONSULTATION_REMINDER,
    title, 
    message, 
    data, 
    PushPriority.HIGH
);

// 일반 알림 - NORMAL
pushNotificationService.sendPushNotification(
    userId, 
    PushNotificationType.PAYMENT_COMPLETED,
    title, 
    message, 
    data, 
    PushPriority.NORMAL
);

// 마케팅 - LOW
pushNotificationService.sendPushNotification(
    userId, 
    PushNotificationType.MARKETING,
    title, 
    message, 
    data, 
    PushPriority.LOW
);
```

#### 3. 딥링크 제공
```java
Map<String, String> data = new HashMap<>();
data.put("type", "CONSULTATION_REMINDER");
data.put("consultationId", "123");
data.put("deepLink", "mindgarden://consultations/123");
```

#### 4. 사용자 설정 존중
```java
// 사용자 푸시 설정 확인
UserPushSettings settings = userPushSettingsRepository.findByUserId(userId);

if (!settings.getPushEnabled()) {
    log.info("푸시 알림 비활성화: userId={}", userId);
    return false;
}

if (!settings.getConsultationReminders() && 
    type == PushNotificationType.CONSULTATION_REMINDER) {
    log.info("상담 리마인더 알림 비활성화: userId={}", userId);
    return false;
}

// 야간 모드 확인
if (settings.getNightModeEnabled() && isNightTime()) {
    log.info("야간 모드 활성화: userId={}", userId);
    return false;
}
```

---

## 📞 문의

공통 알림 시스템 표준 관련 문의:
- 프론트엔드 팀
- 백엔드 팀
- 모바일 앱 팀

**최종 업데이트**: 2025-12-02

