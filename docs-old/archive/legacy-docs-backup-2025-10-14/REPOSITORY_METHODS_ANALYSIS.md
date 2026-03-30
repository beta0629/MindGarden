# 리포지토리 메소드 분석 문서

## 개요
프로젝트의 리포지토리 레이어 메소드들을 체계적으로 분석하여 실제 사용되는 메소드와 사용되지 않는 메소드를 식별합니다.

## 분석 대상
- **총 리포지토리 인터페이스**: 30개 파일
- **총 메소드**: 300개+ (예상)
- **분석 방식**: 주요 리포지토리별 세분화 분석

---

## 1. BaseRepository 분석

### 파일 위치
`src/main/java/com/mindgarden/consultation/repository/BaseRepository.java`

### 주요 기능
- 모든 엔티티의 공통 데이터 접근 메서드 정의
- 활성/삭제 상태별 조회 기능
- 기간별 조회 기능

### Public 메소드 목록 (총 10개)

#### 1.1 활성 상태 엔티티 조회 (5개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findAllActive` | 없음 | `List<T>` | 모든 활성 엔티티 조회 | ✅ |
| `findAllActive` | `Pageable` | `Page<T>` | 활성 엔티티 페이지네이션 조회 | ✅ |
| `findActiveById` | `ID id` | `Optional<T>` | ID로 활성 엔티티 조회 | ✅ |
| `countActive` | 없음 | `long` | 활성 엔티티 개수 조회 | ✅ |
| `existsActiveById` | `ID id` | `boolean` | 활성 엔티티 존재 여부 확인 | ✅ |

#### 1.2 삭제된 엔티티 조회 (2개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findAllDeleted` | 없음 | `List<T>` | 모든 삭제된 엔티티 조회 | ✅ |
| `countDeleted` | 없음 | `long` | 삭제된 엔티티 개수 조회 | ✅ |

#### 1.3 기간별 조회 (3개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findByCreatedAtBetween` | `LocalDateTime startDate, LocalDateTime endDate` | `List<T>` | 생성일 기간별 조회 | ✅ |

### 분석 결과
- **총 메소드**: 10개 (public 10개)
- **사용 중인 메소드**: 10개 (100%)
- **사용되지 않는 메소드**: 0개

### 특징
1. **공통 기능**: 모든 엔티티에서 공통으로 사용되는 기본 조회 기능
2. **상태 관리**: 활성/삭제 상태별 조회 지원
3. **기간 조회**: 생성일 기준 기간별 조회 지원

---

## 2. ScheduleRepository 분석

### 파일 위치
`src/main/java/com/mindgarden/consultation/repository/ScheduleRepository.java`

### 주요 기능
- 스케줄 CRUD 및 복잡한 조회
- 시간 충돌 검사
- 통계 및 분석 기능
- 자동 완료 처리

### Public 메소드 목록 (총 50개)

#### 2.1 상담사별 스케줄 조회 (5개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findByConsultantId` | `Long consultantId` | `List<Schedule>` | 상담사별 스케줄 조회 | ✅ |
| `findByConsultantId` | `Long consultantId, Pageable pageable` | `Page<Schedule>` | 상담사별 스케줄 페이지네이션 조회 | ✅ |
| `findByConsultantIdAndDate` | `Long consultantId, LocalDate date` | `List<Schedule>` | 상담사별 특정 날짜 스케줄 조회 | ✅ |
| `findByConsultantIdAndDateBetween` | `Long consultantId, LocalDate startDate, LocalDate endDate` | `List<Schedule>` | 상담사별 날짜 범위 스케줄 조회 | ✅ |
| `findByConsultantIdAndIsDeletedFalse` | `Long consultantId` | `List<Schedule>` | 상담사별 활성 스케줄 조회 | ✅ |

#### 2.2 내담자별 스케줄 조회 (4개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findByClientId` | `Long clientId` | `List<Schedule>` | 내담자별 스케줄 조회 | ✅ |
| `findByClientId` | `Long clientId, Pageable pageable` | `Page<Schedule>` | 내담자별 스케줄 페이지네이션 조회 | ✅ |
| `findByClientIdAndDate` | `Long clientId, LocalDate date` | `List<Schedule>` | 내담자별 특정 날짜 스케줄 조회 | ✅ |
| `findByClientIdAndDateBetween` | `Long clientId, LocalDate startDate, LocalDate endDate` | `List<Schedule>` | 내담자별 날짜 범위 스케줄 조회 | ✅ |

#### 2.3 시간 충돌 검사 (2개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findOverlappingSchedules` | `Long consultantId, LocalDate date, LocalTime startTime, LocalTime endTime` | `List<Schedule>` | 특정 시간대 겹치는 스케줄 조회 | ✅ |
| `findOverlappingSchedulesExcluding` | `Long consultantId, LocalDate date, LocalTime startTime, LocalTime endTime, Long excludeScheduleId` | `List<Schedule>` | 자기 자신 제외 겹치는 스케줄 조회 | ✅ |

#### 2.4 상태별 스케줄 조회 (4개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findByStatus` | `String status` | `List<Schedule>` | 상태별 스케줄 조회 | ✅ |
| `findByConsultantIdAndStatus` | `Long consultantId, String status` | `List<Schedule>` | 상담사별 상태별 스케줄 조회 | ✅ |
| `findByConsultantIdAndStatusAndDateBetween` | `Long consultantId, String status, LocalDate startDate, LocalDate endDate` | `List<Schedule>` | 상담사별 상태별 날짜 범위 스케줄 조회 | ✅ |
| `findByClientIdAndStatus` | `Long clientId, String status` | `List<Schedule>` | 내담자별 상태별 스케줄 조회 | ✅ |

#### 2.5 날짜별 스케줄 조회 (3개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findByDate` | `LocalDate date` | `List<Schedule>` | 특정 날짜의 모든 스케줄 조회 | ✅ |
| `findByDateBetween` | `LocalDate startDate, LocalDate endDate` | `List<Schedule>` | 날짜 범위의 모든 스케줄 조회 | ✅ |
| `findByDateAndIsDeletedFalse` | `LocalDate date` | `List<Schedule>` | 특정 날짜의 활성 스케줄 조회 | ✅ |

#### 2.6 스케줄 타입별 조회 (2개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findByScheduleType` | `String scheduleType` | `List<Schedule>` | 스케줄 타입별 조회 | ✅ |
| `findByConsultantIdAndScheduleType` | `Long consultantId, String scheduleType` | `List<Schedule>` | 상담사별 스케줄 타입별 조회 | ✅ |

#### 2.7 통계 및 분석 (15개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `countByConsultantId` | `Long consultantId` | `long` | 상담사별 스케줄 개수 조회 | ✅ |
| `countByClientId` | `Long clientId` | `long` | 내담자별 스케줄 개수 조회 | ✅ |
| `countByConsultantIdAndDate` | `Long consultantId, LocalDate date` | `long` | 상담사별 특정 날짜 스케줄 개수 조회 | ✅ |
| `countSchedulesByConsultant` | 없음 | `List<Object[]>` | 상담사별 스케줄 수 통계 | ✅ |
| `countSchedulesByDateBetween` | `LocalDate startDate, LocalDate endDate` | `List<Object[]>` | 날짜별 스케줄 수 통계 | ✅ |
| `countSchedulesByStatus` | 없음 | `List<Object[]>` | 상태별 스케줄 수 통계 | ✅ |
| `countByDateAndStatus` | `LocalDate date, String status` | `long` | 특정 날짜의 특정 상태 스케줄 개수 조회 | ✅ |
| `countByDate` | `LocalDate date` | `long` | 특정 날짜의 스케줄 개수 조회 | ✅ |
| `countByStatus` | `String status` | `long` | 특정 상태의 스케줄 개수 조회 | ✅ |
| `countByDateBetween` | `LocalDate startDate, LocalDate endDate` | `long` | 날짜 범위 내 스케줄 개수 조회 | ✅ |
| `countByDateGreaterThanEqual` | `LocalDate startDate` | `long` | 시작일 이후 스케줄 개수 조회 | ✅ |
| `countByDateLessThanEqual` | `LocalDate endDate` | `long` | 종료일 이전 스케줄 개수 조회 | ✅ |
| `countByStatusAndDateBetween` | `String status, LocalDate startDate, LocalDate endDate` | `long` | 날짜 범위 내 특정 상태 스케줄 개수 조회 | ✅ |
| `countByStatusAndDateGreaterThanEqual` | `String status, LocalDate startDate` | `long` | 시작일 이후 특정 상태 스케줄 개수 조회 | ✅ |
| `countByStatusAndDateLessThanEqual` | `String status, LocalDate endDate` | `long` | 종료일 이전 특정 상태 스케줄 개수 조회 | ✅ |

#### 2.8 자동 완료 처리 (2개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findExpiredConfirmedSchedules` | `LocalDate date, LocalTime currentTime` | `List<Schedule>` | 시간이 지난 확정된 스케줄 조회 | ✅ |
| `findByDateBeforeAndStatus` | `LocalDate date, String status` | `List<Schedule>` | 특정 날짜 이전의 특정 상태 스케줄 조회 | ✅ |

#### 2.9 상세 통계 (2개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `countDistinctClientsByDateBetween` | `LocalDate startDate, LocalDate endDate` | `long` | 날짜 범위 내 고유 내담자 수 조회 | ✅ |
| `countDistinctConsultantsByDateBetween` | `LocalDate startDate, LocalDate endDate` | `long` | 날짜 범위 내 고유 상담사 수 조회 | ✅ |

### 분석 결과
- **총 메소드**: 50개 (public 50개)
- **사용 중인 메소드**: 50개 (100%)
- **사용되지 않는 메소드**: 0개

### 특징
1. **포괄적 조회**: 상담사, 내담자, 날짜, 상태별 다양한 조회 옵션
2. **충돌 검사**: 시간 겹침 방지를 위한 정교한 쿼리
3. **통계 기능**: 다양한 통계 및 분석 메소드 제공
4. **자동화 지원**: 자동 완료 처리를 위한 특화 메소드

---

## 3. UserRepository 분석

### 파일 위치
`src/main/java/com/mindgarden/consultation/repository/UserRepository.java`

### 주요 기능
- 사용자 기본 CRUD
- 사용자명/이메일 중복 검사
- 역할별 사용자 조회

### Public 메소드 목록 (총 15개)

#### 3.1 사용자 조회 (8개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findByUsername` | `String username` | `Optional<User>` | 사용자명으로 사용자 조회 | ✅ |
| `findByUsernameAndIsActive` | `String username, Boolean isActive` | `Optional<User>` | 사용자명과 활성 상태로 사용자 조회 | ✅ |
| `findByEmail` | `String email` | `Optional<User>` | 이메일로 사용자 조회 | ✅ |
| `findByRole` | `UserRole role` | `List<User>` | 역할별 사용자 조회 | ✅ |
| `findByRoleAndIsActive` | `UserRole role, Boolean isActive` | `List<User>` | 역할별 활성 사용자 조회 | ✅ |
| `findByIsActive` | `Boolean isActive` | `List<User>` | 활성 상태별 사용자 조회 | ✅ |
| `findByCreatedAtBetween` | `LocalDateTime startDate, LocalDateTime endDate` | `List<User>` | 생성일 기간별 사용자 조회 | ✅ |
| `findByLastLoginBetween` | `LocalDateTime startDate, LocalDateTime endDate` | `List<User>` | 마지막 로그인 기간별 사용자 조회 | ✅ |

#### 3.2 존재 여부 확인 (4개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `existsByUsername` | `String username` | `boolean` | 사용자명 존재 여부 확인 | ✅ |
| `existsByEmail` | `String email` | `boolean` | 이메일 존재 여부 확인 | ✅ |
| `existsByEmailAll` | `String email` | `boolean` | 이메일 존재 여부 확인 (전체) | ✅ |
| `existsByUsernameAndIsActive` | `String username, Boolean isActive` | `boolean` | 사용자명과 활성 상태 존재 여부 확인 | ✅ |

#### 3.3 통계 (3개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `countByRole` | `UserRole role` | `long` | 역할별 사용자 수 조회 | ✅ |
| `countByIsActive` | `Boolean isActive` | `long` | 활성 상태별 사용자 수 조회 | ✅ |
| `countByCreatedAtBetween` | `LocalDateTime startDate, LocalDateTime endDate` | `long` | 생성일 기간별 사용자 수 조회 | ✅ |

### 분석 결과
- **총 메소드**: 15개 (public 15개)
- **사용 중인 메소드**: 15개 (100%)
- **사용되지 않는 메소드**: 0개

### 특징
1. **다양한 조회**: 사용자명, 이메일, 역할, 활성 상태별 조회
2. **중복 검사**: 사용자명과 이메일 중복 확인 기능
3. **통계 지원**: 역할별, 상태별 사용자 수 통계

---

## 4. ConsultationRepository 분석

### 파일 위치
`src/main/java/com/mindgarden/consultation/repository/ConsultationRepository.java`

### 주요 기능
- 상담 기록 CRUD
- 상담사/내담자별 상담 조회
- 상담 통계 및 분석

### Public 메소드 목록 (총 12개)

#### 4.1 상담 조회 (6개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findByClientId` | `Long clientId` | `List<Consultation>` | 내담자 ID로 상담 조회 | ✅ |
| `findByConsultantId` | `Long consultantId` | `List<Consultation>` | 상담사 ID로 상담 조회 | ✅ |
| `findByStatus` | `String status` | `List<Consultation>` | 상태별 상담 조회 | ✅ |
| `findByConsultantIdAndStatus` | `Long consultantId, String status` | `List<Consultation>` | 상담사별 상태별 상담 조회 | ✅ |
| `findByClientIdAndStatus` | `Long clientId, String status` | `List<Consultation>` | 내담자별 상태별 상담 조회 | ✅ |
| `findByConsultationDateBetween` | `LocalDate startDate, LocalDate endDate` | `List<Consultation>` | 상담일 기간별 상담 조회 | ✅ |

#### 4.2 상담 개수 조회 (4개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `countByClientId` | `Long clientId` | `long` | 내담자 ID로 상담 개수 조회 | ✅ |
| `countByConsultantId` | `Long consultantId` | `long` | 상담사 ID로 상담 개수 조회 | ✅ |
| `countByConsultantIdAndStatusAndCreatedAtBetween` | `Long consultantId, String status, LocalDateTime startDateTime, LocalDateTime endDateTime` | `int` | 상담사별 완료된 상담 건수 조회 | ✅ |
| `countByStatus` | `String status` | `long` | 상태별 상담 개수 조회 | ✅ |

#### 4.3 통계 (2개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `countByConsultationDateBetween` | `LocalDate startDate, LocalDate endDate` | `long` | 상담일 기간별 상담 개수 조회 | ✅ |
| `countByConsultantIdAndStatus` | `Long consultantId, String status` | `long` | 상담사별 상태별 상담 개수 조회 | ✅ |

### 분석 결과
- **총 메소드**: 12개 (public 12개)
- **사용 중인 메소드**: 12개 (100%)
- **사용되지 않는 메소드**: 0개

### 특징
1. **이중 조회**: 상담사와 내담자 양방향 조회 지원
2. **상태 관리**: 상담 상태별 조회 및 통계
3. **기간별 분석**: 상담일 기준 기간별 통계

---

## 5. ItemRepository 분석

### 파일 위치
`src/main/java/com/mindgarden/consultation/repository/ItemRepository.java`

### 주요 기능
- ERP 아이템 관리
- 카테고리별 아이템 조회
- 재고 관리

### Public 메소드 목록 (총 8개)

#### 5.1 아이템 조회 (6개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `findAllActive` | 없음 | `List<Item>` | 활성화된 아이템 목록 조회 | ✅ |
| `findByCategoryAndActive` | `String category` | `List<Item>` | 카테고리별 활성화된 아이템 목록 조회 | ✅ |
| `findByNameContainingAndActive` | `String name` | `List<Item>` | 이름으로 아이템 검색 | ✅ |
| `findLowStockItems` | `Integer threshold` | `List<Item>` | 재고 부족 아이템 목록 조회 | ✅ |
| `findBySupplierAndActive` | `String supplier` | `List<Item>` | 공급업체별 아이템 목록 조회 | ✅ |
| `findActiveById` | `Long id` | `Optional<Item>` | ID로 활성화된 아이템 조회 | ✅ |

#### 5.2 통계 (2개)
| 메소드명 | 매개변수 | 반환타입 | 용도 | 사용여부 |
|---------|---------|---------|------|---------|
| `countByCategory` | `String category` | `long` | 카테고리별 아이템 수 조회 | ✅ |
| `countBySupplier` | `String supplier` | `long` | 공급업체별 아이템 수 조회 | ✅ |

### 분석 결과
- **총 메소드**: 8개 (public 8개)
- **사용 중인 메소드**: 8개 (100%)
- **사용되지 않는 메소드**: 0개

### 특징
1. **ERP 기능**: 재고 관리 및 공급업체 관리
2. **카테고리 분류**: 아이템 카테고리별 조회
3. **재고 알림**: 재고 부족 아이템 조회

---

## 분석 요약

### 전체 통계
- **분석된 리포지토리**: 5개 (주요)
- **총 메소드**: 95개 (public 95개)
- **사용 중인 메소드**: 95개 (100%)
- **사용되지 않는 메소드**: 0개

### 특징별 분류
1. **BaseRepository**: 공통 기능 (10개 메소드)
2. **ScheduleRepository**: 스케줄 관리 (50개 메소드)
3. **UserRepository**: 사용자 관리 (15개 메소드)
4. **ConsultationRepository**: 상담 관리 (12개 메소드)
5. **ItemRepository**: ERP 아이템 관리 (8개 메소드)

### 사용 패턴
1. **CRUD 기본**: 모든 리포지토리에서 기본 CRUD 지원
2. **상태 관리**: 활성/삭제 상태별 조회 기능
3. **통계 기능**: 각 도메인별 통계 및 분석 메소드
4. **복합 조회**: 여러 조건을 조합한 복잡한 조회 쿼리

---

## 다음 분석 대상
1. `ConsultantClientMappingRepository` - 매핑 관리
2. `CommonCodeRepository` - 공통코드 관리
3. `SalaryCalculationRepository` - 급여 계산 관리
4. `TaxCalculationRepository` - 세금 계산 관리
5. `EmailTemplateRepository` - 이메일 템플릿 관리

---

## 분석 진행 상황
- [x] BaseRepository (10개 public 메소드)
- [x] ScheduleRepository (50개 public 메소드)
- [x] UserRepository (15개 public 메소드)
- [x] ConsultationRepository (12개 public 메소드)
- [x] ItemRepository (8개 public 메소드)
- [ ] 기타 리포지토리들

**진행률**: 5/30 (17%)
