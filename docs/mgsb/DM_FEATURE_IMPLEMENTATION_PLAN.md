# DM(Direct Message) 기능 구현 계획

> **작성일:** 2025-11-17  
> **범위:** 커뮤니티 기능의 DM 기능 구현 로드맵 및 기술 사양  
> **대상:** 학원 등 확장 업종의 커뮤니티 기능

## 1. 개요

### 1.1 목적
- **학원 업종 우선**: 학생 간 실시간 메시지 교환 기능 제공 (시작 단계지만 경쟁력 강화)
- 커뮤니티 기능의 핵심 요소로 사용자 간 소통 활성화
- 기존 상담 메시지 시스템과 차별화된 1:1 대화 기능
- **차별화 포인트**: 다른 학원 관리 시스템에는 없는 실시간 DM 기능으로 메리트 제공

### 1.2 범위
- **포함:** 1:1 DM, 그룹 DM(향후), 실시간 알림, 읽음 상태 표시, **입력 중 표시(Typing Indicator)**
- **제외:** 파일 첨부(초기), 음성/영상 통화(향후), 이모지/스티커(향후)

### 1.3 비즈니스 가치
- **학원 업종 특화 가치**: 학생 간 소통 활성화로 학원 커뮤니티 참여도 증가
- **경쟁력 강화**: 시작 단계 기능이라도 없는 것보다는 있는 것이 차별화 포인트
- **사용자 참여도 증가**: 실시간 소통으로 학원 생활 만족도 향상
- **커뮤니티 활성화**: 학생-학생, 학생-강사 간 자연스러운 소통 채널 제공
- **고객 만족도 향상**: 편리한 메시징 기능으로 학원 선택 시 메리트 제공

## 2. 현재 시스템 분석

### 2.1 기존 메시지 시스템
- **상담 메시지 (ConsultationMessage)**: 상담사-내담자 간 메시지
- **시스템 알림 (SystemNotification)**: 공지사항 및 시스템 알림
- **폴링 방식**: 10초 간격으로 알림 카운트 조회

### 2.2 기존 인프라
- ✅ **WebSocket 의존성**: `spring-boot-starter-websocket` (pom.xml)
- ✅ **Redis 설정**: 캐시 및 세션 관리용으로 이미 구성됨
- ✅ **Nginx WebSocket 프록시**: 설정 완료
- ❌ **실제 WebSocket 구현**: 없음 (현재 REST API + 폴링)

### 2.3 데이터베이스
- **연결 풀**: HikariCP (최대 20개 연결)
- **Redis**: Jedis Pool (max-active: 8)
- **현재 부하**: 낮음 (상담 메시지 중심)

## 3. 아키텍처 설계

### 3.1 중개 서버 필요 여부

#### Phase 1: 초기 구현 (소규모, ~100명 동시 접속)
- ❌ **중개 서버 불필요**
- ✅ Spring Boot WebSocket 직접 구현
- ✅ 단일 서버에서 처리
- ✅ 구현 난이도: ⭐⭐ (보통, 2-3주)

#### Phase 2: 확장 단계 (100~1000명 동시 접속)
- ⚠️ **Redis Pub/Sub 활용** (이미 Redis 있음)
- ✅ Spring Boot + Redis Pub/Sub
- ✅ 중개 서버 없이 Redis만으로 확장 가능
- ✅ 구현 난이도: ⭐⭐⭐ (보통~어려움, 1-2주 추가)

#### Phase 3: 대규모 (1000명 이상 동시 접속)
- ✅ **메시지 브로커 필요** (RabbitMQ, Kafka 등)
- ✅ 별도 중개 서버 또는 클러스터링
- ✅ 구현 난이도: ⭐⭐⭐⭐ (어려움, 3-4주 추가)

### 3.2 추천 구현 전략

```
Phase 1 (초기) → Phase 2 (확장) → Phase 3 (대규모)
   ↓                ↓                  ↓
WebSocket      Redis Pub/Sub      Message Broker
직접 구현       서버 간 통신        (선택적)
```

## 4. 데이터베이스 설계

### 4.1 테이블 구조

```sql
-- DM 대화방 테이블
CREATE TABLE dm_conversation (
    conversation_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36),
    participant1_id BIGINT NOT NULL COMMENT '참여자 1 (User ID)',
    participant2_id BIGINT NOT NULL COMMENT '참여자 2 (User ID)',
    last_message_id VARCHAR(36) COMMENT '마지막 메시지 ID',
    last_message_at TIMESTAMP COMMENT '마지막 메시지 시간',
    participant1_unread_count INT DEFAULT 0 COMMENT '참여자 1의 읽지 않은 메시지 수',
    participant2_unread_count INT DEFAULT 0 COMMENT '참여자 2의 읽지 않은 메시지 수',
    is_blocked BOOLEAN DEFAULT FALSE COMMENT '차단 여부',
    blocked_by BIGINT COMMENT '차단한 사용자 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_tenant_branch (tenant_id, branch_id),
    INDEX idx_participant1 (participant1_id),
    INDEX idx_participant2 (participant2_id),
    INDEX idx_last_message_at (last_message_at DESC),
    UNIQUE KEY uk_participants (participant1_id, participant2_id, tenant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DM 메시지 테이블
CREATE TABLE dm_message (
    message_id VARCHAR(36) PRIMARY KEY,
    conversation_id VARCHAR(36) NOT NULL,
    sender_id BIGINT NOT NULL COMMENT '발신자 ID',
    receiver_id BIGINT NOT NULL COMMENT '수신자 ID',
    content TEXT NOT NULL COMMENT '메시지 내용',
    message_type VARCHAR(20) DEFAULT 'TEXT' COMMENT 'TEXT, IMAGE, FILE 등',
    is_read BOOLEAN DEFAULT FALSE COMMENT '읽음 여부',
    read_at TIMESTAMP NULL COMMENT '읽은 시간',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '삭제 여부',
    deleted_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_conversation (conversation_id, created_at DESC),
    INDEX idx_sender (sender_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_is_read (is_read, receiver_id),
    FOREIGN KEY (conversation_id) REFERENCES dm_conversation(conversation_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DM 차단 목록 테이블
CREATE TABLE dm_block (
    block_id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    blocker_id BIGINT NOT NULL COMMENT '차단한 사용자 ID',
    blocked_id BIGINT NOT NULL COMMENT '차단당한 사용자 ID',
    reason VARCHAR(255) COMMENT '차단 사유',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_blocker_blocked (blocker_id, blocked_id, tenant_id),
    INDEX idx_blocker (blocker_id),
    INDEX idx_blocked (blocked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 4.2 인덱스 전략
- **대화방 조회**: `participant1_id`, `participant2_id` 복합 인덱스
- **메시지 조회**: `conversation_id`, `created_at` 복합 인덱스
- **읽지 않은 메시지**: `is_read`, `receiver_id` 복합 인덱스
- **최신 대화방**: `last_message_at` 인덱스

## 5. 백엔드 구현 계획

### 5.1 Phase 1: WebSocket 직접 구현

#### 5.1.1 WebSocket 설정
```java
// WebSocketConfig.java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new DmWebSocketHandler(), "/ws/dm")
                .setAllowedOrigins("*")
                .withSockJS();
    }
}
```

#### 5.1.2 핵심 컴포넌트
- **DmWebSocketHandler**: WebSocket 연결 관리
- **DmMessageService**: 메시지 비즈니스 로직
- **DmConversationService**: 대화방 관리
- **DmNotificationService**: 실시간 알림 전송

#### 5.1.3 API 엔드포인트
```
GET  /api/dm/conversations              # 대화방 목록 조회
GET  /api/dm/conversations/{id}         # 대화방 상세 조회
POST /api/dm/conversations              # 새 대화방 생성
GET  /api/dm/conversations/{id}/messages # 메시지 목록 조회
POST /api/dm/messages                   # 메시지 전송
PUT  /api/dm/messages/{id}/read         # 메시지 읽음 처리
POST /api/dm/block                      # 사용자 차단
DELETE /api/dm/block/{id}               # 차단 해제
```

#### 5.1.4 WebSocket 이벤트 타입
```
클라이언트 → 서버:
- MESSAGE: 메시지 전송
- TYPING_START: 입력 시작 (상대방에게 알림)
- TYPING_STOP: 입력 중지 (상대방에게 알림)
- READ: 메시지 읽음 처리

서버 → 클라이언트:
- MESSAGE: 새 메시지 수신
- TYPING: 상대방 입력 중 표시
- READ: 상대방이 메시지를 읽음
- ERROR: 에러 발생
```

### 5.2 Phase 2: Redis Pub/Sub 도입

#### 5.2.1 Redis Pub/Sub 구조
```
채널 구조:
- dm:conversation:{conversationId}  # 특정 대화방 메시지
- dm:user:{userId}                  # 특정 사용자 알림
- dm:tenant:{tenantId}              # 테넌트 전체 알림 (선택적)
```

#### 5.2.2 서버 간 메시지 전송
```java
// RedisMessagePublisher.java
@Service
public class RedisMessagePublisher {
    
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    public void publishMessage(String conversationId, DmMessage message) {
        redisTemplate.convertAndSend("dm:conversation:" + conversationId, message);
    }
}
```

### 5.3 성능 최적화 전략

#### 5.3.1 메시지 배치 처리
- 메시지 저장: 배치 INSERT (100개 단위)
- 읽음 처리: 배치 UPDATE
- 알림 전송: 비동기 처리

#### 5.3.2 캐싱 전략
- 대화방 목록: Redis 캐시 (5분 TTL)
- 읽지 않은 메시지 수: Redis 캐시 (1분 TTL)
- 최근 메시지: Redis 캐시 (10분 TTL)
- **입력 중 상태**: Redis 캐시 (5초 TTL, 자동 만료)

#### 5.3.3 입력 중 표시 최적화
- **Debounce 처리**: 500ms 간격으로 이벤트 전송 (과도한 이벤트 방지)
- **자동 해제**: 3초 동안 입력이 없으면 자동으로 입력 중 해제
- **Redis TTL**: 입력 중 상태를 Redis에 저장하고 5초 후 자동 만료
- **메모리 효율**: 입력 중 상태는 메모리 사용량이 매우 적음 (~100 bytes/사용자)

#### 5.3.3 데이터베이스 최적화
- 메시지 아카이빙: 6개월 이상 된 메시지는 별도 테이블로 이동
- 읽지 않은 메시지 조회: 인덱스 최적화
- 대화방 목록 조회: 페이징 처리

## 6. 프론트엔드 구현 계획

### 6.1 WebSocket 클라이언트
```javascript
// DmWebSocketManager.js
class DmWebSocketManager {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.typingTimeout = null;
        this.isTyping = false;
    }
    
    connect(userId) {
        const wsUrl = `ws://${window.location.host}/ws/dm?userId=${userId}`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };
        
        this.ws.onclose = () => {
            this.reconnect();
        };
    }
    
    sendMessage(conversationId, content) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'MESSAGE',
                conversationId,
                content
            }));
        }
    }
    
    // 입력 중 표시 전송 (인스타그램/카카오톡 스타일)
    sendTypingIndicator(conversationId, isTyping) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'TYPING',
                conversationId,
                isTyping: isTyping
            }));
        }
    }
    
    // 입력 시작 시 자동으로 입력 중 표시 전송
    handleInputStart(conversationId) {
        if (!this.isTyping) {
            this.isTyping = true;
            this.sendTypingIndicator(conversationId, true);
        }
        
        // 3초 후 자동으로 입력 중 해제 (타이핑이 멈추면)
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.handleInputStop(conversationId);
        }, 3000);
    }
    
    // 입력 중지 시 입력 중 표시 해제
    handleInputStop(conversationId) {
        if (this.isTyping) {
            this.isTyping = false;
            this.sendTypingIndicator(conversationId, false);
        }
        clearTimeout(this.typingTimeout);
    }
    
    // 입력 중 표시 수신 처리
    handleTypingIndicator(data) {
        const { conversationId, userId, isTyping } = data;
        // UI에 입력 중 표시 업데이트
        this.onTypingIndicatorReceived(conversationId, userId, isTyping);
    }
}
```

### 6.2 UI 컴포넌트
- **DmConversationList**: 대화방 목록
- **DmChatWindow**: 채팅 창
- **DmMessageItem**: 메시지 아이템
- **DmInputBox**: 메시지 입력 박스 (입력 중 표시 포함)
- **DmTypingIndicator**: "상대방이 입력 중입니다..." 표시 컴포넌트
- **DmNotificationBadge**: 읽지 않은 메시지 배지

### 6.3 상태 관리
- **Redux/Context**: 대화방 목록, 현재 대화방, 메시지 목록
- **로컬 스토리지**: 최근 대화방 목록 캐시
- **실시간 업데이트**: WebSocket 이벤트로 상태 동기화

## 7. 서버 과부하 방지 전략

### 7.1 연결 수 제한
- **단일 서버**: 최대 1,000개 WebSocket 연결
- **연결당 메모리**: ~10KB
- **총 메모리**: ~10MB (1,000명 기준)

### 7.2 메시지 처리량 제한
- **초당 메시지 수**: 모니터링 및 알림
- **사용자당 초당 메시지**: 최대 10개 (Rate Limiting)
- **배치 처리**: 100개 단위로 DB 저장
- **입력 중 이벤트**: Debounce 처리로 초당 최대 2회 전송 (과도한 이벤트 방지)

### 7.3 데이터베이스 부하 관리
- **읽기 최적화**: 인덱스 활용, 캐싱
- **쓰기 최적화**: 배치 INSERT
- **연결 풀 모니터링**: HikariCP 메트릭 확인
- **쿼리 최적화**: N+1 문제 방지, 페이징 처리

### 7.4 모니터링 지표
- **WebSocket 연결 수**: 실시간 모니터링
- **메시지 처리량**: 초당 메시지 수
- **응답 시간**: 메시지 전송 응답 시간
- **에러율**: WebSocket 연결 실패율
- **DB 연결 풀 사용률**: HikariCP 메트릭

## 8. 보안 고려사항

### 8.1 인증 및 권한
- WebSocket 연결 시 JWT 토큰 검증
- 대화방 접근 권한 확인 (참여자만 접근 가능)
- 테넌트 격리 확인

### 8.2 입력 검증
- 메시지 내용 길이 제한 (최대 5,000자)
- XSS 방지 (HTML 이스케이프)
- SQL Injection 방지 (PreparedStatement)

### 8.3 차단 기능
- 사용자 차단 기능
- 스팸 메시지 자동 감지
- 신고 기능 (향후)

## 9. 구현 로드맵

### Phase 1: 기본 DM 기능 (2-3주)

#### Week 1: 백엔드 기반 구축
- [ ] 데이터베이스 테이블 생성 (dm_conversation, dm_message, dm_block)
- [ ] 엔티티 클래스 생성
- [ ] Repository 인터페이스 구현
- [ ] 기본 Service 로직 구현
- [ ] REST API 엔드포인트 구현

#### Week 2: WebSocket 구현
- [ ] WebSocket 설정 및 핸들러 구현
- [ ] 실시간 메시지 전송 로직
- [ ] 연결 관리 (연결/해제)
- [ ] 에러 처리 및 재연결 로직
- [ ] **입력 중 표시(Typing Indicator) 기능**
  - [ ] 입력 시작/중지 이벤트 처리
  - [ ] 상대방에게 입력 중 상태 전송
  - [ ] 자동 해제 로직 (3초 후)
  - [ ] UI에 입력 중 표시 컴포넌트

#### Week 3: 프론트엔드 구현
- [ ] WebSocket 클라이언트 구현
- [ ] 대화방 목록 UI
- [ ] 채팅 창 UI
- [ ] 메시지 전송/수신 기능
- [ ] 읽음 상태 표시
- [ ] **입력 중 표시 UI 구현**
  - [ ] 입력 시작/중지 이벤트 감지
  - [ ] "상대방이 입력 중입니다..." 표시
  - [ ] 애니메이션 효과 (점 3개 깜빡임)
  - [ ] 자동 해제 처리

### Phase 2: Redis Pub/Sub 도입 (1-2주, 선택적)

#### Week 1: Redis Pub/Sub 구현
- [ ] Redis Pub/Sub 설정
- [ ] 메시지 발행/구독 로직
- [ ] 서버 간 메시지 전송 테스트
- [ ] 기존 WebSocket과 통합

#### Week 2: 확장성 테스트
- [ ] 다중 서버 환경 테스트
- [ ] 부하 테스트 (1000명 동시 접속)
- [ ] 성능 최적화
- [ ] 모니터링 대시보드 구축

### Phase 3: 고급 기능 (향후)

- [ ] 그룹 DM 기능
- [ ] 파일 첨부 기능
- [ ] 이미지 전송 및 미리보기
- [ ] 메시지 검색 기능
- [ ] 메시지 아카이빙
- [ ] 읽음 확인 상세 (읽은 시간 표시)

## 10. 구현 체크리스트

### 10.1 데이터베이스
- [ ] `dm_conversation` 테이블 생성
- [ ] `dm_message` 테이블 생성
- [ ] `dm_block` 테이블 생성
- [ ] 인덱스 생성 및 최적화
- [ ] 마이그레이션 스크립트 작성

### 10.2 백엔드
- [ ] 엔티티 클래스 구현
- [ ] Repository 인터페이스 구현
- [ ] Service 로직 구현
- [ ] REST API 컨트롤러 구현
- [ ] WebSocket 핸들러 구현
- [ ] 인증 및 권한 검증
- [ ] 에러 처리 및 로깅
- [ ] 단위 테스트 작성

### 10.3 프론트엔드
- [ ] WebSocket 클라이언트 구현
- [ ] 대화방 목록 컴포넌트
- [ ] 채팅 창 컴포넌트
- [ ] 메시지 입력 컴포넌트
- [ ] **입력 중 표시 컴포넌트** (인스타그램/카카오톡 스타일)
  - [ ] 입력 시작/중지 이벤트 처리
  - [ ] "상대방이 입력 중입니다..." UI
  - [ ] 애니메이션 효과
- [ ] 읽지 않은 메시지 배지
- [ ] 실시간 알림 통합
- [ ] 반응형 디자인 적용

### 10.4 인프라 및 운영
- [ ] Nginx WebSocket 프록시 설정 확인
- [ ] Redis 설정 확인 (Phase 2)
- [ ] 모니터링 메트릭 설정
- [ ] 로그 수집 설정
- [ ] 부하 테스트 수행
- [ ] 성능 최적화

### 10.5 보안
- [ ] JWT 토큰 검증
- [ ] 입력 검증 및 XSS 방지
- [ ] SQL Injection 방지
- [ ] Rate Limiting 구현
- [ ] 차단 기능 구현

## 11. 성능 목표

### 11.1 응답 시간
- 메시지 전송 응답: < 100ms
- 대화방 목록 조회: < 200ms
- 메시지 목록 조회: < 300ms
- WebSocket 연결: < 500ms

### 11.2 처리량
- 초당 메시지 처리: 1,000개 이상
- 동시 WebSocket 연결: 1,000개 이상 (Phase 1)
- 동시 WebSocket 연결: 10,000개 이상 (Phase 2)

### 11.3 가용성
- WebSocket 연결 안정성: 99.9%
- 메시지 전달 성공률: 99.9%
- 서비스 가동률: 99.9%

## 12. 리스크 및 대응 방안

### 12.1 기술적 리스크

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| WebSocket 연결 불안정 | 높음 | 자동 재연결 로직, 폴백 메커니즘 |
| 메시지 전달 실패 | 높음 | 재시도 로직, DB 백업 저장 |
| 서버 과부하 | 중간 | 연결 수 제한, Rate Limiting |
| DB 부하 증가 | 중간 | 배치 처리, 캐싱, 아카이빙 |
| 메모리 부족 | 중간 | 연결당 메모리 모니터링, 연결 수 제한 |

### 12.2 운영 리스크

| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 스팸 메시지 | 중간 | Rate Limiting, 차단 기능 |
| 부적절한 내용 | 중간 | 신고 기능, 관리자 모니터링 |
| 개인정보 유출 | 높음 | 메시지 암호화, 접근 권한 강화 |
| 확장성 문제 | 중간 | Phase 2 Redis Pub/Sub 도입 |

## 13. 테스트 계획

### 13.1 단위 테스트
- Service 로직 테스트
- Repository 테스트
- WebSocket 핸들러 테스트
- 인증 및 권한 테스트

### 13.2 통합 테스트
- WebSocket 연결/해제 테스트
- 메시지 전송/수신 테스트
- 다중 사용자 동시 접속 테스트
- Redis Pub/Sub 테스트 (Phase 2)

### 13.3 부하 테스트
- 100명 동시 접속 테스트
- 500명 동시 접속 테스트
- 1,000명 동시 접속 테스트 (Phase 1 목표)
- 10,000명 동시 접속 테스트 (Phase 2 목표)

### 13.4 보안 테스트
- 인증 우회 시도 테스트
- 권한 없는 접근 테스트
- XSS 공격 테스트
- SQL Injection 테스트

## 14. 배포 계획

### 14.1 개발 환경
- WebSocket 연결 테스트
- 기본 기능 테스트
- 단위 테스트 실행

### 14.2 스테이징 환경
- 통합 테스트
- 부하 테스트
- 보안 테스트

### 14.3 운영 환경
- 단계적 롤아웃 (10% → 50% → 100%)
- 모니터링 강화
- 롤백 계획 준비

## 15. 관련 문서

- `PLATFORM_ROADMAP.md`: 전체 플랫폼 로드맵
- `SYSTEM_EXPANSION_PLAN.md`: 시스템 확장 계획
- `ARCHITECTURE_OVERVIEW.md`: 아키텍처 개요
- `DATABASE_DESIGN_SPEC.md`: 데이터베이스 설계 사양

## 16. 다음 단계

1. **즉시 시작 가능 항목**
   - [ ] 데이터베이스 스키마 설계 확정
   - [ ] API 스펙 정의
   - [ ] UI/UX 와이어프레임 작성

2. **설계 확정 필요 항목**
   - [ ] 메시지 길이 제한 정책
   - [ ] 차단 기능 정책
   - [ ] 아카이빙 정책 (보관 기간)

3. **협의 필요 항목**
   - [ ] Phase 1 vs Phase 2 범위 확정
   - [ ] 개발 일정 확정
   - [ ] 테스트 환경 구성

