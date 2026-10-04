# [간판지원단 단일 절대 설계도 (SYSTEM BLUEPRINT)]

> **헌법 원칙**: 간판지원단은 오직 `index.html` 단 하나의 '단일 반응형 웹(Single Responsive Web)'으로 통폐합된 단일 사이트이며, 모든 데이터는 수파베이스 `applications` 및 `users` 단 1개의 데이터 원천(SSOT)을 100% 절대 추종한다. 어떠한 독자 캐시, 독자 테이블, 이원화된 로직도 영구 엄격 금지한다.

---

## 🏛️ 간판지원단 공식 설계도 목차 (Blueprint Registry)

* **`[설계도-01] BP-SALES-DASHBOARD`**: 영업자 대시보드 2대 영역(상단 접수 / 하단 공정관리) 분리 및 시안/사진 연동 설계도
* **`[설계도-02] BP-APPLY-ACCOUNT`**: 온라인 간편 지원 신청 및 점주 계정 자동발급 설계도 *(공식 확정)*
* **`[설계도-03] BP-APP-LIFECYCLE`**: 신청서 생명주기 및 최고관리자 영업물건 승격 설계도
* **`[설계도-04] BP-CONSTRUCTOR-FLOW`**: 시공사 배정, 시안 업로드(1~5장) 및 시공 완료 증빙 설계도
* **`[설계도-05] BP-ADMIN-SSOT`**: 최고관리자 대시보드 절대 단일 원천(SSOT) 및 실시간 동시 연동 설계도
* **`[설계도-06] BP-APP-SHARE-INSTALL`**: 모바일 앱 공유(Web Share) 및 원클릭 홈 화면 바로가기(PWA) 설치 설계도 *(공식 확정)*
* **`[설계도-07] BP-AUTH-RECOVERY`**: 로그인 팝업 내 아이디 찾기 및 비밀번호 재설정 단일 연동 설계도 *(공식 확정)*
* **`[설계도-08] BP-TRAFFIC-DIET`**: 트래픽 다이어트 및 Supabase 대역폭(Egress) 영구 방어 설계도 *(공식 확정)*
* **`[설계도-09] BP-CLEAN-PIPELINE`**: 땜빵 금지, 구형 찌꺼기 전수 삭제 및 단일 파이프라인(Clean Slate Single Pipeline) 보존 설계도 *(공식 확정)*

---

## 📐 [설계도-01] BP-SALES-DASHBOARD: 영업자 대시보드 2대 영역 분리 및 시안/사진 연동 설계도

### 1. 2대 영역의 명확한 역할 정의
| 구분 | **상단: [내 온라인 간편 지원 신청 내역]** | **하단: [내 영업물건 현황 및 진행상황]** |
| :--- | :--- | :--- |
| **업무 성격** | **초기 접수 창구** (씨앗 단계) | **정식 사업 공정 관리 본체** (열매 단계) |
| **노출 조건** | 내 영업자 코드(`referrerCode`)로 인입된 모든 초기 신청서 | 최고관리자가 **'영업물건으로 변경(isBizItem: true)'** 승인한 물건만 |
| **주요 상태** | `서류준비 & 접수대기`, `심사대기` 등 초기 상태 | `접수완료`, `대상자선정`, `간판시공 준비중`, `간판시공완료` |
| **현장사진** | 영업자 본인이 현장에서 찍어 등록/확인 | 원본 `applications`와 100% 동기화된 현장사진 확인/다운로드 |
| **디자인 시안** | 점주 검토 여부만 표기 <br/>*(※ 영업자에게 점주용 승인버튼 노출 차단)* | **시안 확인의 핵심 장소!**<br/>- 시안 장수 및 `[시안 크게보기]` 공용 모달<br/>- 점주 승인 여부 실시간 확인 |

### 2. 시안/사진 단일 원천 원칙
- 상단과 하단 카드는 서로 다른 사본을 만들지 않고, 오직 `applications` 단일 레코드만 100% 참조한다.
- 시안 크게보기는 `window.viewDraftModal(appId)`, 사진 다운로드는 `window.downloadApplicationPhotos(appId)` 단일 함수만 사용한다.

---

## 📐 [설계도-02] BP-APPLY-ACCOUNT: 온라인 간편 지원 신청 및 점주 계정 자동발급 설계도 *(공식 확정)*

### 1. 명확한 원칙 (Clear & Absolute Principles)
1. **누가 신청하든 계정의 주인은 100% '점주'다**:
   - 점주 본인이 직접 신청했든, 영업자(김만석 등)가 대리 신청했든 상관없이, 신청 건의 주인(`userId`, `ownerName`, `ownerPhone`)은 **100% '신청 업체 점주'**에게 귀속된다.
2. **영업자/관리자 로그인 계정 100% 영구 보존**:
   - 대리 신청 시, 현재 로그인된 영업자나 관리자의 계정 정보(이름, 휴대폰, 아이디, 비밀번호, 권한)는 **단 1비트도 덮어쓰거나 수정하지 않고 영구 보존**한다.
   - 영업자는 신청서의 `salespersonId`(담당자) 및 `registeredBy`(접수자)로만 안전하게 기록된다.
3. **[핵심 불변 헌법] 일반회원(점주) 가입 정보 100% 영구 보존 원칙 (Non-destructive Profile Preservation)**:
   - 본인이 원하는 아이디와 비밀번호로 직접 가입한 일반회원(점주)이 로그인해서 신청서를 쓰거나, 기존 가입된 점주의 전화번호로 신청서가 접수되었을 때, 회원의 기존 개인정보(`users`: 아이디, 비밀번호, 가입 주소, 가입 전화번호, 이메일 등)는 **절대로 임의 변경·훼손·덮어쓰기하면 안 되며 100% 불변 보존**한다.
   - 지원신청서는 '매장 지원사업 접수 신청'일 뿐, '회원 개인정보 수정 폼'이 아니다. 회원 정보 수정은 오직 본인의 [마이페이지 > 회원정보 수정]을 통해서만 수행된다.
4. **[핵심 불변 헌법] 신청서 데이터의 완전 독립 분리 저장 원칙 (Decoupled Application Data SSOT)**:
   - 신청서에 입력된 매장 상호, 매장 주소(`storeAddress`), 대표자 연락처(`ownerPhone`), 이메일 등은 **오직 `applications`라는 별개의 신청서 레코드에만 독립 분리 저장**된다.
   - 신청서에 입력된 매장 주소나 연락처로 회원 프로필(`users.address`, `users.phone`)을 덮어쓰거나 조건부로 채워넣는 일체의 변조 로직을 영구 엄격 금지한다.
5. **신규 비회원 점주 임시 비밀번호 보존 원칙**:
   - 신규 비회원 점주 건인 경우에만 점주 휴대폰번호 기반 계정이 신규 채번(`isNewAccount: true`)되고, 채번된 임시 비밀번호(`g-XXXXXXXX`)를 팝업창에 100% 정확하게 출력한다.
   - 이미 가입된 계정인 경우에는 임시 비밀번호 발급이나 재설정이 원천 차단되며, 기존 계정 안내 문구만 노출된다.
6. **신규 신청서 현장사진 타임스탬프(`photoUpdatedAt`) 최초 접수 0초 각인 및 캐싱 원칙 (Initial Photo Timestamp SSOT)**:
   - 신규 온라인 신청서 접수 시 현장사진이 첨부된 경우, 신청 접수 시각(`applyPhotoTime = now.getTime()`)을 `photoUpdatedAt`으로 즉시 발행하여 `memoPayload`와 `newApp`에 영구 기록한다.
   - 동시에 `PhotoCacheManager.set`에 즉시 캐싱하여, 접수 직후 마이페이지 [신청내역]에서 점주가 사진을 열람할 때 Supabase 클라우드 재다운로드 없이 0바이트(0ms)로 즉시 조회하도록 보장한다.
   - 사진이 미등록된 채로 접수된 후 점주 대시보드에서 등록하거나 추가/교체하는 경우에도 `handleApplicationPhotoUploadProcess`를 통해 100% 동일한 타임스탬프 파이프라인을 탑승한다.

### 2. 신청 완료 팝업 안내 분기 기준 매트릭스
| 신청자 상황 | 점주 계정 신규 여부 | 팝업창 아이디 표시 | 팝업창 비밀번호 표시 |
| :--- | :---: | :--- | :--- |
| **① 비회원 점주 직접 신청** | **신규 생성** (`isNewAccount`) | 점주 휴대폰번호 (`010...`) | **`• 임시 비밀번호: g-XXXXXXXX`** |
| **② 영업자가 점주 대리 신청** | **신규 생성** (`isNewAccount`) | 점주 휴대폰번호 (`010...`) | **`• 임시 비밀번호: g-XXXXXXXX`** |
| **③ 이미 가입된 점주가 신청** | **기존 계정 유지** | 점주 기존 아이디 | `기존 가입하신 계정으로 바로 조회 가능합니다` |
| **④ 점주 본인이 로그인 후 신청**| **기존 계정 유지** | 점주 본인 아이디 | `기존 가입하신 계정으로 바로 조회 가능합니다` |

### 3. 설계도 보존법칙 (모든 설계도는 일원화 할 것 - 이원화 절대 금지)
1. **단일 파이프라인 일원화 (`applications` vs `users` 책임 분리)**:
   - `applications`는 지원사업 신청 건의 정보를 담는 단일 원천이며, `users`는 회원 인증 및 권한 프로필을 담는 단일 원천이다. 두 테이블 간의 무분별한 필드 오염이나 종속적 덮어쓰기를 영구 금지한다.
2. **신청서 경로를 통한 프로필 수정 이원화 원천 금지**:
   - 지원신청서 접수 파이프라인(`submitApplication`)에서 `window.SupabaseSync.updateUser` 또는 `users[curUserIdx] = ...`를 호출하여 사용자 프로필을 변조하는 일체의 우회 이원화 코드를 영구 금지한다.
3. **비밀번호 임의 생성/재설정 이원화 원천 금지**:
   - 가입 회원의 비밀번호는 [설계도-07]의 [비밀번호 재설정] 경로 외에는 그 어떤 이유로도 자동 재발급되거나 덮어써질 수 없다.

### 4. 자동 검문소 (검증망) 영구 감시 규칙 (Automated Blueprint Guard Rules)
배포(`npm run deploy`) 전 실행되는 자동 검문소(`scripts/verify-blueprint.js`)에서 다음 6대 항목을 전수 검사하며, 단 1개라도 불일치 시 배포는 원천 차단된다:
1. **[검문 1] 영업자 대리 신청 시 영업자 계정 덮어쓰기 방어**: `isOwnerSelf` 판정식 및 영업자 프로필 보존 검증.
2. **[검문 2] 로그인 점주 신청 시 회원 프로필 덮어쓰기 찌꺼기 100% 부존재 검증**: `isOwnerSelf` 분기 내 `finalUserAddress`, `updateUser` 찌꺼기 0건 검사.
3. **[검문 3] 기존 회원 매칭 신청 시 회원 프로필 덮어쓰기 찌꺼기 100% 부존재 검증**: `existingIdx !== -1` 분기 내 프로필 덮어쓰기 및 임시비밀번호 재발급 찌꺼기 0건 검사.
4. **[검문 4] 신규 점주 임시 비밀번호 정상 노출 보존**: `isExistingAccount` 분기 및 `loginNoticePw` 정상 매핑 검사.
5. **[검문 5] 신청서 userId 점주 ID 귀속 원칙**: `userId`의 점주 ID 귀속 및 `registeredBy` 분리 기록 검사.
6. **[검문 6] 신규 신청서 접수 시 photoUpdatedAt 타임스탬프 탑재 및 PhotoCacheManager 캐싱 준수**: `app.js`의 `applyForm` 제출 로직 내 `applyPhotoTime`, `memoPayload.photoUpdatedAt`, `PhotoCacheManager.set` 탑재 검증.

---

## 📐 [설계도-03] BP-APP-LIFECYCLE: 신청서 생명주기 및 최고관리자 영업물건 승격 설계도

### 1. 핵심 불변 원칙 (Absolute Rules)
1. **영역 분리의 절대 기준 (`isBizItem: true`)**:
   - 접수된 신청서는 최고관리자의 직권 승인(`isBizItem: true`) 전까지 오직 상단 `[내 온라인 간편 지원 신청 내역]`에 머무른다.
   - 최고관리자가 [영업물건 승인]을 클릭한 순간에만 하단 `[내 영업물건 현황 및 진행상황]`으로 승격 진입한다.
2. **점주 시안 승인권 단독 보유 및 영업자 모니터링 원칙**:
   - 간판 디자인 시안의 최종 승인 권한(`window.approveDraftByOwner`)은 실소비자인 **점주 본인에게만 부여**된다.
   - 영업자는 영업물건 카드 내에서 점주의 승인 여부를 **실시간 모니터링**할 수 있으며, 영업자에게 점주용 승인 버튼은 일체 노출되지 않는다.
3. **단일 원천(SSOT) 상태 전이 원칙**:
   - 별도의 복제 테이블이나 독자 캐시를 두지 않고, 오직 `applications` 단일 테이블의 상태값(`status`, `processStatus`, `isBizItem`, `assignedConstructorId`, `draftStatus`) 전이로 **최고관리자 ↔ 영업자 ↔ 시공사 ↔ 점주** 4대 화면이 0초 실시간으로 100% 동시 연동된다.

### 2. 전체 7단계 생명주기 흐름도 (Lifecycle Flow)
```mermaid
graph TD
    A["1. 홈페이지 신청서 접수<br/>(점주 직접신청 or 영업자 대리신청)"] --> B["[상단] 내 온라인 간편 지원 신청 내역<br/>- 서류준비 & 접수대기 상태<br/>- 현장사진 등록/확인"]
    
    B -->|최고관리자가 '영업물건 승인' 클릭 (isBizItem: true)| C["[하단] 내 영업물건 현황 및 진행상황 진입<br/>- 공단/진흥원 실제 접수 관리<br/>- 접수완료 & 심사대기"]
    
    C -->|공단 심사 통과| D["★ 대상자 선정<br/>- 시공업체 배정 완료"]
    
    D --> E["시공사가 간판 디자인 시안 등록 (1~5장)"]
    
    E --> F["점주: [신청내역]에서 시안 확인 후 '시안 승인'<br/>영업자: [영업물건]에서 시안 확인 및 점주 승인여부 모니터링"]
    
    F --> G["간판 시공 준비 및 시공 완료<br/>- 시공 완료사진 및 계산서 증빙"]
```

### 3. 단계별 상세 공정 및 권한별 역할 매트릭스
| 단계 | 공정 단계명 | 상태값 (DB 필드) | 최고관리자 역할 | 담당 영업자 역할 | 배정 시공사 역할 | 일반 점주 역할 |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **1단계** | **신청서 접수** | `status: '서류준비 & 접수대기'`<br/>`isBizItem: false` | 신규 접수 인입 확인 | 점주 대리 접수 or 본인 코드 인입 확인 | (권한 없음 / 미노출) | 본인 직접 신청 접수 (자동 임시비번 발급) |
| **2단계** | **상단 접수 대기** | `status: '서류준비 & 접수대기'` | 신청 서류 적격 여부 검토 | 현장 사진 업로드 및 점주 서류 보완 지원 | (권한 없음 / 미노출) | 마이페이지에서 본인 신청 내역 및 현장사진 확인 |
| **3단계** | **영업물건 승격** | `isBizItem: true`<br/>`processStatus: '접수예정'` | **[영업물건 승인] 클릭** (하단 승격 확정) | 하단 **[내 영업물건]**으로 자동 진입 확인 | (권한 없음 / 미노출) | 마이페이지 상태 실시간 확인 |
| **4단계** | **공단 접수 & 대상자 선정** | `processStatus: '대상자선정'`<br/>`assignedConstructorId` 지정 | 공단 심사결과 반영 및 **담당 시공사 배정** | 공단 심사 통과 및 시공사 배정 모니터링 | 본인 업체로 배정된 신규 건 수임 확인 | 지원사업 최종 선정 통보 확인 |
| **5단계** | **디자인 시안 등록** | `draftPhotos: [...]`<br/>`draftStatus: 'pending'` | 시공사가 올린 시안 모니터링 | 시안 확인 및 점주에게 확인 안내 | **디자인 시안 (1~5장) 압축 업로드** | 마이페이지에서 디자인 시안 도착 알림 확인 |
| **6단계** | **시안 승인 & 모니터링** | `draftStatus: 'approved'` | 시안 승인 완료 상태 관제 | **점주 시안 승인 여부 실시간 확인** | **점주 시안 승인 확인 후 실물 제작 착수** | **`[시안 승인 / 마음에 듭니다]` 클릭** (최종 승인) |
| **7단계** | **간판 시공 & 공정 완료** | `processStatus: '간판시공완료'`<br/>`constructionPhotos: [...]` | 시공 완료사진 검수 및 정산 승인 | 최종 시공 완료 확인 및 수수료 정산 대기 | **시공 완료사진(최대 5장) & 계산서 등록** | 새 간판 시공 완료 확인 및 사업 종료 |

### 4. [설계도-03 절대 헌법] 5대 명확한 원칙 및 단일 일원화 보존법칙 (Permanent SSOT Preservation Law)

모든 권한 화면(최고관리자, 영업자, 시공사, 일반점주)과 데이터 파이프라인은 아래 5대 절대 원칙을 영구 불변의 헌법으로 준수하며, **어떠한 독자 분기, 독자 캐시, 별도 배열 쪼개기 등 이원화도 100% 영구 엄격 금지**한다:

1. **제1원칙 (단일 절대 SSOT 원칙 - 이원화 영구 금지)**:
   - 모든 온라인 간편 지원 신청서, 승격된 영업물건, 배정된 시공물건 데이터의 단일 진실의 원천(SSOT)은 오직 **`applications` 단일 테이블**이다.
   - `users.items`는 `applications`의 단순 투영(View/Cache)일 뿐 독자적 데이터를 갖지 않으며, 모든 CUD(생성/수정/삭제) 작업은 반드시 `applications`를 단일 기준으로 0초 일원화 처리한다.
   - 영업자나 시공사가 독립된 별도 배열이나 독자적인 캐시 테이블을 생성하여 조작하는 모든 형태의 데이터 이원화를 영구 엄격 차단한다.
2. **제2원칙 (상태 독립성 및 신청서 심사 상태 영구 보존 원칙 - Non-destructive State Transition)**:
   - 좌측 [신청서 목록]의 고유 심사 상태(`app.status`: `pending`, `approved`, `unqualified`, `rejected`, `giveup`)와 우측 [영업물건 진행상황]의 공정 단계(`receiptStatus`: `업체신청`/`접수예정`/`접수완료`, `progressStatus`: `지원대기중`/`심사대기중`/`대상자선정`/`간판시공 준비중`/`간판시공완료`)는 상호 독립된 라이프사이클을 가진다.
   - `updateItemStatus`를 통해 우측 [영업물건]의 접수나 진행상태를 아무리 변경하거나 이전 단계(`접수예정`, `지원대기중` 등)로 되돌려도, 좌측 [신청서 목록]의 고유 심사 상태인 `app.status`(`approved` 즉 `서류준비 & 접수대기` 등)는 절대 `pending`(`사업시행 전 사전등록업체`)으로 임의 리셋/덮어써지지 않고 100% 영구 보존된다.
   - 단, 사용자가 명시적으로 지원사업 탈락(`rejected`)이나 포기(`giveup`)로 전이하는 경우에만 심사 상태가 탈락/포기로 연동된다.
3. **제3원칙 (클린 슬레이트 시공 배정 및 배정 취소 원칙 - Clean Slate Assignment)**:
   - 시공사 배정 시 `assignedConstructorId`, `assignedConstructorName` 등이 `applications` 단일 원천에 즉시 기록되고 10초 상태 락(`_recentStatusUpdates`)에 등록된다.
   - 최고관리자가 시공업체 진행현황에서 [배정취소]를 실행하는 경우, 시공사 정보 초기화뿐만 아니라 시안 사진 배열(`signDraftPhotos`), 시안 심사상태(`draftStatus`), 시안 승인일자(`draftApprovedAt`), 시공완료 사진 배열(`constructionPhotos`), 세금계산서(`constructionInvoice`), 시공사진 카운트(`constPhotoCount`) 등 모든 시공 증빙 찌꺼기를 100% 완전 소멸(Clean Slate)하여 영업물건(미배정) 상태로 안전하게 복귀한다.
   - 점주 대시보드 및 영업자 대시보드의 [시공 완료사진 확인] 박스는 실제 유효한 시공업체가 배정되어 있고(`hasAssignedConstructor`) 시공이 완료된 경우(`isCompleted && cCount > 0`)에만 노출되며, 배정 취소 시 0초 만에 완벽 소멸된다.
4. **제4원칙 (사진 및 시안 카운트·수정시각(photoUpdatedAt) 영구 불변 보존 원칙 - Photo Count & Timestamp SSOT Preservation)**:
   - `toggleBizItem` (영업물건 승격/해제), `assignConstructorToBizItem`, `updateItemStatus` 등 모든 상태 전이 단계에서 `photoCount`는 절대 0으로 초기화되거나 덮어써지지 않으며, `Math.max(memo.photoCount, app.photosCount, ...)`를 통해 영구 보존된다.
   - 신청서가 최초 접수될 때 부여된 사진 수정시각(`photoUpdatedAt`)과 업로드/삭제 시 갱신되는 타임스탬프는 7단계 생명주기 전체에 걸쳐 1비트도 유실되지 않고 영구 보존되며, 시공사 배정 시 시공사 대시보드로 100% 온전하게 인계된다.
   - 대시보드 목록의 다운로드 버튼은 로컬 카운트에 의존하여 `disabled` 처리하지 않고 항상 클릭 가능하며, 클릭 시 `ensureApplicationPhotosLoaded`를 통해 Supabase DB 단일 원천으로부터 즉시 온디맨드 로딩하여 사진 열람 및 다운로드를 100% 보장한다.
   - 최고관리자만 사진 모달창(`showPhotoDownloadModal`) 내 각 사진 우측 상단 `[삭제 🗑️]` 버튼을 통해 잘못 등록된 특정 1장만 선별 삭제할 수 있으며(`window.deleteApplicationSinglePhoto`), 삭제 시 남은 사진과 `photoCount`, `photoUpdatedAt`이 0초 실시간으로 일원화 갱신된다. 모든 사진이 삭제되어 0장이 된 경우 점주 대시보드에는 `[현장 사진 재등록 필요]` 배지가 표시된다.
5. **제5원칙 (4대 권한 0초 실시간 동시 연동 및 단일 바인딩 원칙 - Realtime Sync & Single Binding)**:
   - 최고관리자 ↔ 영업자 ↔ 시공업체 ↔ 일반 점주 4대 권한 화면은 `DataStore.notifyAll(true)` 및 `_recentStatusUpdates` 락에 의해 단일 반응형 웹 내에서 0초 실시간으로 100% 동시 동기화된다.
   - 모바일 대시보드 헤더 및 버튼에 인라인 핸들러(`onclick`)와 JS `addEventListener`를 중복 바인딩하여 2회 연속 충돌 발화되는 현상을 영구 차단한다.

---

## 📐 [설계도-04] BP-CONSTRUCTOR-FLOW: 시공사 배정, 시안 업로드/삭제 및 시공 완료 증빙 설계도 *(공식 확정)*

* **노출 대상**: 최고관리자가 본인 시공사 코드(`constCode`)로 배정한 물건만 노출 (`DataStore.getConstructionJobs`).
* **핵심 라이프사이클**:
  1. **시공사 배정**: 최고관리자가 영업물건에서 시공사를 배정하는 즉시 시공사 대시보드 및 영업물건에 실시간 노출 (`assignedConstructorId`, `constructionStatus: 'before_construction'`).
  2. **간판 디자인 시안 업로드/삭제**: 최대 5장, 90KB 이하 초경량 자동 압축 병렬 업로드 및 개별/전체 즉각 삭제 (`signDraftPhotos`, `constructionStatus: 'design_draft'`).
  3. **점주 시안 승인권 단독 보유 & 간판제작 착수**: 점주 본인이 마이페이지 또는 시안 모달에서 [시안 승인 / 마음에 듭니다] 클릭 시 `draftStatus: 'owner_approved'` 확정 및 `constructionStatus: 'in_construction'`으로 0초 전 사용자 동시 전이. (관리자는 필요시 직권확정 가능)
  4. **시공 완료 사진(최대 5장) 및 세금계산서 업로드**: 시공 완료 보고 (`constructionStatus: 'after_construction'`, `progressStatus: '간판시공완료'`).
  5. **최고관리자 최종 정산 종결**: 증빙 확인 후 정산 완료 (`constructionStatus: 'completed'`).
  6. **시공 배정 취소 시 클린 슬레이트 소멸**: 시공 배정 취소 시 시안 및 시공사진/계산서 증빙 100% 완전 소멸 (Clean Slate) 후 영업물건(미배정) 복귀.

### 1. 명확한 원칙 (Clear & Absolute Principles)

1. **제1원칙 (최고관리자/DB 절대 단일 원천 원칙 - Draft & Construction Photos SSOT Single Origin)**:
   - 디자인 시안 사진(`signDraftPhotos`), 심사상태(`draftStatus`), 시공 후 현장사진(`constructionPhotos`)은 오직 최고관리자 DB(`applications`)만이 유일무이한 단일 진실의 원천(SSOT)이다.
   - 영업자나 점주의 로컬 캐시에 과거 사진이 더 많이 남아있더라도 서버의 사진 수가 우선하며(`local.length > server.length` 판정문 및 `!appObj.constructionPhotos` 복원 잔재 영구 금지), 삭제된 시안 및 시공사진을 로컬 캐시나 `users.items`에서 되살려내는 어떠한 좀비 부활 코드도 영구 엄격 금지한다.

2. **제2원칙 (클린 슬레이트 시안 & 시공 증빙 삭제 및 전 사용자 동시 저장 원칙 - Clean Slate Deletion & Multi-user Sync)**:
   - 시공사 또는 관리자가 시안이나 시공 후 사진을 1장 또는 전체 삭제하는 즉시, `applications`와 해당 물건을 공유하는 모든 사용자(`users.items` - 영업자, 시공사, 관리자)의 저장소에서 동일 인덱스의 사진이 0초 만에 동시 소멸한다.
   - 단 1명의 유저만 저장하고 넘어가는 단편 코드(`updatedUid`)를 영구 금지하고, 관련 유저 전원(`usersToSync`)을 배열로 수집하여 Supabase 클라우드에 비동기 백그라운드로 100% 동시 저장한다. (시안 업로드/삭제, 시공사진 업로드/삭제, 간판종류 변경, 시공상태 전이, 시공완료보고 전체 적용)

3. **제3원칙 (0초 동적 모달 인플레이스 사일런트 리프레시 원칙 - In-place Modal Silent Refresh)**:
   - 최고관리자나 점주가 `[시안 확인 및 삭제]` 모달(`modal-view-draft-preview`) 또는 `[시공 후 사진 확인 및 삭제]` 모달(`modal-view-const-photos-preview`)을 열어놓고 있는 상태에서 사진이 추가/삭제되거나 상태가 변경되면, 모달을 닫고 다시 열 필요 없이 모달 내부 DOM이 0초 만에 실시간으로 자동 갱신(`viewDraftModal(id, true)`, `viewConstructionPhotosModal(id, true)`)된다.
   - 잔여 사진이 0장이 되면 안내 토스트와 함께 모달이 안전하게 자동 종료(`closeDraftModal()`, `closeConstPhotosModal()`)된다.

4. **제4원칙 (크로스 탭 & Realtime 전방위 0초 동기화 원칙 - Cross-Tab & Realtime Sync)**:
   - 시공사가 시안/시공 증빙을 변경하는 즉시 `storage` 이벤트(`ganpan_cross_tab_sync`)와 Supabase Realtime WebSocket을 동시에 발화하여, 동일 기기의 다른 탭(관리자 ↔ 시공사 ↔ 영업자)과 다른 기기(점주 모바일) 모두 0초 만에 완벽 동기화 리렌더링된다.

5. **제5원칙 (초경량 자동 압축 & 단일 온디맨드 조회 원칙 - Strict Compression & On-demand Fetch)**:
   - 모든 시안 및 시공 사진 업로드는 `compressImageToBase64` 단일 함수를 통해 90KB 이하(최대 1200px)로 강제 압축 후 등록한다.
   - 목록 조회 시에는 고용량 사진 필드를 배제하여 대역폭 Egress 누수를 99% 차단하고, 사진 확대/모달 확인 시에만 온디맨드로 조회한다.

6. **제6원칙 (점주 단독 시안 승인권 및 간판제작 착수 즉시 동기화 원칙 - Owner Approval & Construction Transition SSOT)**:
   - 간판 디자인 시안의 실소비자 승인 권한(`window.approveDraftByOwner`)은 실소비자인 점주 본인에게 단독 부여된다.
   - 점주가 시안을 승인(`owner_approved`)하거나 관리자가 직권 확정(`admin_approved`)하는 즉시, `constructionStatus`는 `before_construction` / `design_draft`에서 **`in_construction` (간판 제작·시공 착수)**으로 0초 만에 낙관적 갱신(Optimistic Update)되며, 로컬 `applications`, `users.items`, `_recentStatusUpdates` 락 및 Supabase DB에 100% 동일하게 일원화 반영된다.

7. **제7원칙 (시공업체 대시보드 점주 현장사진 타임스탬프(`photoUpdatedAt`) SSOT 추종 및 캐시 자동 무효화 원칙 - Constructor Photo Timestamp SSOT)**:
   - 시공업체 대시보드(`DataStore.getConstructionJobs`)에 표시되는 점주 현장사진은 오직 최고관리자 및 실서버 `applications.memo.photoUpdatedAt`을 단일 기준으로 추종한다.
   - 점주나 관리자가 사진을 교체(동일 장수 1장 ➔ 1장 교체 포함)하여 `photoUpdatedAt`이 갱신된 경우, 시공업체 화면의 `downloadApplicationPhotos` 호출 시 `expectedUpdatedAt`을 전달하여 로컬 브라우저의 구형 사진 캐시(`PhotoCacheManager`)를 0초 만에 강제 만료(무효화)시키고 Supabase DB로부터 최신 사진을 온디맨드로 즉시 재조회한다.
   - 이를 통해 시공업체 화면에서 잘못 업로드되었던 과거 사진이 계속 노출되는 캐시 잠김 현상을 원천 차단한다.
8. **제8원칙 (시공 후 사진 및 시안 추가 등록 시 실서버 DB 사전 조회 ➔ 100% 누적 병합(Cumulative Merge) 원칙 - Cumulative Photo Merge SSOT)**:
   - `handleJobPhotoUploadCommon` 및 `handleJobDraftUploadCommon` 실행 시, 로컬 메모리 캐시에 의존하지 않고 반드시 Supabase DB 실서버의 현재 등록 사진을 단 1회 직접 온디맨드 조회(`select('construction_photos, memo')` / `select('memo')`)하여 기존 등록본을 완벽히 확보한다.
   - 실서버 기존 사진 뒤에 신규 사진을 안전하게 이어붙여(`existingList.concat(newPhotos)`), 최대 5장 슬롯 한도 내에서 누적 병합(Cumulative Merge) 처리 후 원자적(Atomic)으로 저장한다.
   - 이를 통해 시공업체 폰과 최고관리자 PC 등 다중 기기 간에 누가 먼저 올리고 나중에 추가하든 단 1장의 사진 유실이나 덮어쓰기 파괴 없이 100% 누적 보존을 영구 보장한다.

---

### 2. 시공사 배정 및 시안·시공 증빙 7단계 상세 공정 매트릭스
| 공정 단계 | 수행 주체 | 핵심 동작 및 트리거 | 4대 권한 화면 반영 결과 | DB 및 스토리지 저장 규격 |
| :--- | :--- | :--- | :--- | :--- |
| **① 시공사 배정** | 최고관리자 | 영업물건 진행상황에서 시공사 선택 (`assignConstructorToBizItem`) | 시공사 대시보드에 즉시 배정건 노출, 영업자 대시보드에 시공사명 노출 | `assignedConstructorId`, `constructionStatus: 'before_construction'` |
| **② 시안 등록** | 시공사 | 간판 디자인 시안 파일 선택 (`handleJobDraftUploadCommon`) | 최대 5장 등록, 4대 화면 모달에서 시안 확인 가능 | 90KB 이하 자동압축 Base64, `signDraftPhotos: [...]`, `constructionStatus: 'design_draft'` |
| **③ 시안 개별/전체 삭제** | 시공사/관리자 | 시안 모달에서 [이 시안 삭제] / [전체 삭제] 클릭 | 사일런트 리프레시 0초 반영, 0장 시 모달 자동 종료 | `applications` & `usersToSync` 배열 동시 소멸 (Clean Slate) |
| **④ 점주 시안 승인** | 점주 (관리자 직권) | 마이페이지/모달에서 [시안 승인 / 마음에 듭니다] 클릭 (`approveDraftByOwner`) | 점주 승인 배지 즉시 점등, 시공사 화면에 제작 착수 표시 | `draftStatus: 'owner_approved'`, `constructionStatus: 'in_construction'` |
| **⑤ 시공완료 증빙 등록** | 시공사 | 시공 후 사진(최대 5장) 및 계산서 업로드 (`handleJobPhotoUploadCommon`) | 시공사 및 관리자 화면에 사진 장수 뱃지 즉시 갱신 | 90KB 이하 자동압축 Base64, `constructionPhotos: [...]` |
| **⑥ 시공완료 보고** | 시공사 | [시공 완료 보고] 버튼 클릭 (`reportJobCompletionCommon`) | 관리자 화면에 시공완료 및 최종 정산 검수 대기 표시 | `constructionStatus: 'after_construction'`, `progressStatus: '간판시공완료'` |
| **⑦ 최고관리자 정산 종결** | 최고관리자 | 증빙 사진/계산서 검수 후 [정산 완료] 선택 (`updateJobConstructionStatusCommon`) | 전 화면 정산 완료 상태 동기화, 사업 공정 최종 완료 종결 | `constructionStatus: 'completed'` |
| **[예외] 시공 배정 취소** | 최고관리자 | [배정취소] 클릭 (`cancelJobConstructorAssignment`) | 시공사 목록에서 제외, 영업물건(미배정) 상태로 복귀 | 시안/시공사진/계산서 증빙 100% 완전 소멸 (`_clearConstPhotos: true`) |

---

### 3. 설계도 보존법칙 (모든 설계도는 일원화 할 것 - 이원화 절대 금지)
1. **시안 모달 단일 일원화 (`viewDraftModal` 단일 함수)**:
   - 점주 마이페이지, 영업자 상단 신청내역, 영업자 하단 영업물건, 시공사 진행현황, 최고관리자 대시보드 5개 영역 모두 오직 `window.viewDraftModal` 단일 함수만을 호출하며, 권한별 독자 모달(`viewDraftModalMob`, `viewDraftModalForSales` 등) 생성을 영구 엄격 금지한다.
2. **시공 후 사진 모달 단일 일원화 (`viewConstructionPhotosModal` 단일 함수)**:
   - 4대 권한 화면의 시공 후 사진 확인 및 삭제는 오직 `window.viewConstructionPhotosModal` 단일 함수로 일원화한다.
3. **전 관련 사용자(`usersToSync`) 동시 저장 단일 파이프라인**:
   - 시안 업로드/삭제, 시공사진 업로드/삭제, 간판종류 변경, 시공상태 전이 시 단 1명의 유저만 저장하고 넘어가는 단편 코드(`updatedUid`)를 영구 금지하고, 관련 유저 전원(`usersToSync`)을 배열로 수집하여 Supabase 클라우드에 비동기 백그라운드로 100% 동시 저장한다.
4. **좀비 부활 금지 단일 파이프라인**:
   - 사진 삭제 시 로컬 캐시나 `users.items`에서 삭제된 사진을 되살려내는 일체의 코드(`prevItem.signDraftPhotos`, `!appObj.constructionPhotos` 복원 등)를 영구 배제하고 오직 최신 `applications`만을 100% 절대 추종한다.
5. **시공 배정 취소 시 클린 슬레이트 완전 소멸 (Clean Slate)**:
   - 최고관리자가 [배정취소] 또는 [재배정] 실행 시, 이전 시공사의 시안(`signDraftPhotos`), 시공사진(`constructionPhotos`), 세금계산서(`constructionInvoice`), 사진 카운트(`constPhotoCount`), 승인 상태(`draftStatus: 'pending'`) 등 모든 시공 증빙 찌꺼기를 100% 완전 소각한다.

---

### 4. 자동 검문소 (검증망) 영구 감시 규칙 (Automated Blueprint Guard Rules)
배포(`npm run deploy`) 전 실행되는 자동 검문소(`scripts/verify-blueprint.js`)에서 다음 12대 항목을 전수 검사하며, 단 1개라도 불일치 시 배포는 원천 차단된다:
1. **[검문 1] 시안 SSOT 단일 기준 준수**: `local.length > server.length` 판정문 100% 부존재 검증.
2. **[검문 2] 시안 삭제 시 좀비 사진 부활 방어**: `prevItem.signDraftPhotos` 복원 코드 100% 부존재 검증.
3. **[검문 3] 시안 및 시공 상태 변경 시 전 관련 사용자 동시 저장**: `usersToSync` 수집 및 `SupabaseSync.updateUser` 동시 저장 준수.
4. **[검문 4] 시안 확인 모달 인플레이스 사일런트 리프레시 지원**: `closeDraftModal` 및 `isSilentRefresh` 모달 자동 갱신 검증.
5. **[검문 5] 크로스 탭 0초 동기화 리스너 장착 준수**: `ganpan_cross_tab_sync` 스토리지 이벤트 동기화 검증.
6. **[검문 6] 영업자 하단 카드 시안 SSOT 단일 기준 연결 준수**: `item.signDraftPhotos` 이원화 fallback 부존재 검증.
7. **[검문 7] 시공사진 삭제 시 좀비 사진 부활 방어**: `!appObj.constructionPhotos` 복원 코드 100% 부존재 검증.
8. **[검문 8] 시공사진 모달 인플레이스 사일런트 리프레시 지원**: `closeConstPhotosModal` 및 `isSilentRefresh` 모달 자동 갱신 검증.
9. **[검문 9] 시공 사진/상태/간판종류 전수 usersToSync 적용**: `updatedUid` 단편 찌꺼기 100% 부존재 검증.
10. **[검문 10] 점주/관리자 시안 승인 시 constructionStatus in_construction 0초 일원화 동기화 준수**: 점주 승인 즉시 로컬 및 서버 `constructionStatus`의 `in_construction` 전이 일치 검증.
11. **[검문 11] 시공업체 대시보드 점주 현장사진 타임스탬프(photoUpdatedAt) SSOT 연동 준수**: `data-store.js`의 `getConstructionJobs` 내 `photoUpdatedAt` 탑재 및 `app.js`의 `renderConstructorDashboardMob` 내 `expectedUpdatedAt` 전달 검증.
12. **[검문 12] 시공사진 및 시안 추가 등록 시 실서버 DB 사전 조회 및 누적 병합(concat) 준수**: `data-store.js`의 `handleJobPhotoUploadCommon` 및 `handleJobDraftUploadCommon` 내 Supabase DB 사전 조회(`supabaseClient.from('applications').select`) 및 `concat` 누적 병합 로직 탑재 검증.

---

## 📐 [설계도-05] BP-ADMIN-SSOT: 최고관리자 대시보드 절대 단일 원천(SSOT) 및 6대 표준 메뉴 설계도

### 1. 명확한 원칙 (Clear & Absolute Principles)
1. **최고관리자 절대 단일 진실의 원천(SSOT) 헌법 (Admin Absolute SSOT Law)**:
   - 간판지원단 플랫폼의 모든 데이터(`applications`, `users`, `inquiries`, `popups`)의 유일무이한 단일 진실의 원천은 '최고관리자 대시보드'이다.
   - 영업자, 시공사, 일반점주 등 모든 하위 권한 화면은 독자적인 데이터를 소유할 수 없으며, 오직 최고관리자 대시보드의 데이터를 실시간 100% 그대로 추종한다.
2. **부존재 일치 의무 (Non-existence Sync Law)**:
   - 최고관리자 대시보드에 존재하지 않는 건(최고관리자가 삭제한 신청서, 영업물건 등록을 해제한 건, 삭제된 회원)은 하위 대시보드(영업자/시공사/점주)에서도 **0초 만에 완벽하게 0건(완전 부존재)**이어야 한다.
   - 과거 캐시나 독자 배열 잔재로 인해 관리자 화면에 없는 건이 하위 화면에 노출되는 것을 영구 엄격 금지한다.
3. **2대 독립 라이프사이클 절대 분리 원칙 (Independent Lifecycle Separation Law)**:
   - 좌측 [신청서 목록]의 고유 심사 상태(`app.status`: `pending`, `approved`, `unqualified`, `rejected`, `giveup`)와 우측 [영업물건 진행상황]의 공정 단계(`receiptStatus`: `업체신청`/`접수예정`/`접수완료`, `progressStatus`: `지원대기중`/`심사대기중`/`대상자선정`/`간판시공 준비중`/`간판시공완료`)는 상호 간섭할 수 없는 완전 독립 라이프사이클을 유지한다.
   - 우측 공정 상태가 변경되거나 시공사가 배정되더라도 좌측 심사 상태가 침범되거나 임의 롤백(`pending`)되는 것을 원천 차단한다.
4. **영업자 매칭 3+1 단일 식별 헌법 (Permanent Salesperson Identification SSOT)**:
   - 3대 신청 경로(영업자 직접 신청, 비회원 점주 코드 입력 신청, 회원 업주 코드 입력 신청) 모두 `referrerCode(bizCode)`로 단일 식별된다.
   - 최고관리자가 대시보드에서 신청서의 담당 영업자를 직권 수정/변경(`openAssignBizUserModal`)하는 경우, 변경된 영업자 코드가 즉시 반영되며 해당 영업자 대시보드로 실시간 0초 귀속 연동된다.
5. **원클릭 즉각 반응 & 모바일 폼 보호 (Interaction Lock & Optimistic UI)**:
   - 상태 변경, 영업물건 토글, 영업자 변경 등 관리자 조작 시 0초 만에 화면 UI를 즉시 갱신하고, Supabase 클라우드 저장은 비동기 백그라운드로 안전하게 수행한다.
   - 관리자가 드롭다운(`SELECT`)이나 텍스트입력(`INPUT`, `TEXTAREA`)을 조작 중일 때는 백그라운드 동기화로 인한 화면 전체 DOM 재생성을 엄격히 차단한다.

---

### 2. 최고관리자 6대 표준 메뉴 및 상세 공정 매트릭스
| 번호 | 표준 메뉴명 | 탭 식별자 | 핵심 역할 및 기능 | 연계 하위 화면 및 SSOT 동기화 규칙 |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **회원 정보 관리** | `users` | 전체 회원 명부 조회, 실시간 검색, 일반/영업자/시공사/관리자 등급 관리, 회원 영구 삭제 | `role: 'deleted'` 처리 시 즉시 명부 배제 및 세션 동기화 |
| **2** | **영업자 승인 및 시공사 승인** | `requests`, `constructors` | 회원 등급 전환 신청 건 승인 및 반려 (`approveUserConversionMob`, `rejectUserConversionMob`) | 승인 시 고유 식별코드(`B-XXXXXX`, `C-XXXXXX`) 발급, 즉시 해당 전용 대시보드 권한 개방 |
| **3** | **신청서 목록** (좌측 배치) | `apps` | 온라인 간편 지원 접수건 5대 심사 상태 관리, 담당 영업자 직권 변경, 현장사진 확인/등록, 영업물건 토글 | `app.status` 5대 심사 상태 관리, 영업자 마이페이지 상단 "내 신청내역"과 0초 동기화 |
| **4** | **영업물건 진행상황** (우측 배치) | `items` | 공단 접수 영업물건 관리, 접수 3종 및 진행 5종 상태 조작, 시공사 배정 | `isBizItem === true`인 건만 추출, 영업자 하단 "내 영업물건 현황"과 100% 동기화 |
| **5** | **시공업체 진행현황** (전체 시공 배정건) | `const-progress` | 시공사 배정건 공정 관리(시공 5단계), 간판종류 지정, 디자인 시안 검수/직권확정, 시공사진 검증, 배정 취소 | 시공사 대시보드와 100% 양방향 동기화, 배정 취소 시 클린슬레이트 소각 |
| **6** | **3초 간편문의 & 팝업창 관리** | `inquiries`, `popups` | 간편 문의 접수건 상담 완료/대기 토글 및 삭제, 실시간 메인 공지 팝업 등록/수정/삭제 | 메인 홈 팝업 및 문의 접수 파이프라인과 실시간 직통 연동 |

---

### 3. 설계도 보존법칙 (모든 설계도는 일원화 할 것 - 이원화 절대 금지)
1. **단일 반응형 웹(`Single Responsive Web`) 100% 일원화**:
   - PC웹과 모바일 웹의 분리 또는 이원화 분기 코드를 영구 배제하고, `renderAdminDashboardMob` 단일 렌더러와 `window.switchAdminTab` 단일 탭 제어 엔진으로 100% 일원화한다.
2. **독자 클라우드 재조회 및 독자 캐시 영구 금지 (Zero Dual Fetch & Zero Dual Cache)**:
   - `fetchAndRenderAdminApplicationsFresh`, `fetchAndRenderAdminUsersFresh` 등 화면별 독자 클라우드 재조회 찌꺼기를 영구 배제하고, 오직 `SupabaseSync.syncAllData` 단일 파이프라인 및 `DataStore` SSOT 원본만을 직접 읽고 갱신한다.
3. **독자 데이터 복제 배열 영구 금지**:
   - `users.items`로 독자 복제본을 만들지 않고 오직 `applications` 단일 테이블을 단일 원천으로 하여 `getAdminBizItems()` 및 `getConstructionJobs()`를 동적으로 산출한다.
4. **공용 모달 단일화**:
   - 시안 크게보기는 `window.viewDraftModal`, 사진 다운로드/확인은 `window.downloadApplicationPhotos` 단일 공용 함수만을 호출한다.

---

### 4. 자동 검문소 (검증망) 영구 감시 규칙 (Automated Blueprint Guard Rules)
배포(`npm run deploy`) 전 실행되는 자동 검문소(`scripts/verify-blueprint.js`)에서 다음 7대 항목을 전수 검사하며, 단 1개라도 불일치 시 배포는 원천 차단된다:
1. **[검문 1] 최고관리자 단일 탭 전환 엔진 준수**: `app.js` 내 `window.switchAdminTab` 단일 함수 구비 및 표준 메뉴 식별자 분기 검증.
2. **[검문 2] 최고관리자 단일 렌더러 일원화 준수**: `app.js` 내 `renderAdminDashboardMob` 단일 렌더러 장착 및 독자 렌더러 찌꺼기 부존재 검증.
3. **[검문 3] 영업물건 SSOT 단일 추출 엔진 준수**: `data-store.js` 내 `DataStore.getAdminBizItems`의 `isBizItem` 단일 원천 검증.
4. **[검문 4] 시공업체 진행현황 SSOT 단일 추출 준수**: `data-store.js` 내 `DataStore.getConstructionJobs` 단일 추출 엔진 검증.
5. **[검문 5] 최고관리자 직권 영업자 변경 SSOT 연동 준수**: `window.openAssignBizUserModal` 및 `reassignSalesperson` 단일 파이프라인 검증.
6. **[검문 6] 시안 크게보기 단일 공용 함수 준수**: `window.viewDraftModal` 호출 일원화 검증.
7. **[검문 7] 사진 확인/다운로드 단일 공용 함수 준수**: `window.downloadApplicationPhotos` 호출 일원화 검증.

---

## 📐 [설계도-06] BP-APP-SHARE-INSTALL: 모바일 앱 공유(Web Share) 및 원클릭 홈 화면 바로가기(PWA) 설치 설계도

### 1. 2대 핵심 기능 역할 정의
* **기능 1: [모바일 앱 공유하기] (`#pwa-share-btn` / `window.handleAppShare`)**
  - 스마트폰(모바일 브라우저): `navigator.share` 네이티브 호출로 카카오톡, 문자, 밴드 등으로 공식 링크(`https://ganpans.com`) 즉시 전송.
  - PC/미지원 환경: 클립보드 자동 복사 & 공유 안내창 표출.
* **기능 2: [홈 화면 바로가기 버튼 만들기] (`#pwa-shortcut-btn` / `window.handleAppShortcut`)**
  - 안드로이드/크롬/삼성인터넷: `beforeinstallprompt`를 통해 스마트폰 공식 시스템 창("홈 화면에 추가하시겠습니까?") 원클릭 발화 ➔ 점주가 [추가] 1회 클릭 시 바탕화면에 즉시 아이콘 생성.
  - 이미 설치된 기기: `isStandalone` 감지 후 친절한 확인 안내.
  - 아이폰(iOS 사파리): `하단 공유(⎋) ➔ [홈 화면에 추가 (+)]` 1줄 명쾌한 안내.
  - 카카오톡 인앱: 외부 브라우저(크롬/사파리) 자동 전환 연결.

### 2. 기술 인프라 3대 불변 원칙 (Absolute Rules)
1. **무(無)캐시 통과형 서비스워커 (`sw.js`) 절대 준수**:
   - PWA 설치 요건을 100% 충족하되, 캐시를 0% 저장하고 실시간 네트워크(`fetch(event.request)`)로 패스스루하여 화면/데이터 캐시 왜곡 영구 방지.
2. **단일 표준 도메인(`https://ganpans.com`) 단일화**:
   - 구형 `/app` 리다이렉트나 임시 파라미터를 배제하고 공식 단일 도메인만 참조.
3. **이벤트 단일 바인딩 의무 (Rule #4)**:
   - 인라인 `onclick`과 자바스크립트 `addEventListener` 중복 바인딩을 영구 엄격 금지하며, 단일 이벤트 발화로 충돌 방어.

---

## 📐 [설계도-07] BP-AUTH-RECOVERY: 로그인 팝업 내 아이디 찾기 및 비밀번호 재설정 단일 연동 설계도

### 1. 명확한 원칙 (Clear & Absolute Principles)
1. **단일 반응형 웹 내 4대 상태 완전 일원화**:
   - 로그인 팝업(`auth-modal`)은 별도의 독립 페이지나 외부 분기 없이 단 하나의 모달 창 내에서 **`login` ↔ `signup` ↔ `find-id` ↔ `find-pw` 4대 상태**를 0ms 즉각 전환으로 100% 수용한다.
2. **비회원 점주 및 가입 회원 통합 포괄 매칭 (Rule #5)**:
   - `users` 테이블에 정식 가입된 회원뿐만 아니라, 온라인 간편 신청서(`applications`)를 통해 자동 채번된 비회원 점주 계정까지 단일 엔진으로 완벽하게 수용하여 데이터 누락을 원천 차단한다.
3. **1회 터치 즉각 반응 및 모바일 폼 보호 (Rule #2, #4)**:
   - 인라인 단일 이벤트 바인딩(`onclick`, `onsubmit`)을 준수하여 2회 중복 발화 충돌을 방지하고, 폼 제출 시 새로고침 없는 부드러운 즉각 응답을 보장한다.
4. **보안 단방향 암호화 & Supabase 클라우드 실시간 동기화**:
   - 비밀번호는 SHA-256 단방향 암호화를 필수로 거치며, 로컬 `DataStore`와 Supabase 클라우드 DB `users.password_hash`에 즉시 동시 기록된다.

### 2. 설계도 보존법칙 (모든 설계도는 일원화 할 것 - 이원화 절대 금지)
1. **단일 탭 전환 엔진(`window.switchAuthTab`) 일원화**:
   - 모달 내 화면 전환은 오직 `window.switchAuthTab` 단 하나의 함수로만 제어하며, 임의의 인라인 스타일 직접 조작이나 독자 모달을 만드는 일체의 이원화를 영구 엄격 금지한다.
2. **Supabase `password_hash` 단일 컬럼 표준 준수**:
   - 비밀번호는 `users` 테이블의 `password_hash` 단 하나의 공식 컬럼으로만 저장·대조하며, 구형 임시 컬럼(`pw`, `user_pw` 등)이나 독자 테이블 분기를 생성하는 것을 원천 금지한다.
3. **독자 계정 캐시 부존재 의무 (Zero Local Dual Cache)**:
   - `find_id_cache`, `find_pw_cache` 등 별도의 임시 세션이나 독자 배열을 절대 생성하지 않으며, 오직 최신 `DataStore`와 Supabase `users`/`applications` SSOT 원본만을 직접 읽고 갱신한다.
4. **신청서 autoAccount 양방향 일원화 최신화**:
   - 비회원 점주 건의 비밀번호가 변경된 경우, `applications.autoAccount.pw`까지 100% 동일하게 동시 최신화하여 향후 점주 계정 복구 시에도 단 1비트의 불일치도 발생하지 않도록 보장한다.

### 3. 자동 검문소 (검증망) 영구 감시 규칙 (Automated Blueprint Guard Rules)
배포(`npm run deploy`) 전 실행되는 자동 검문소(`scripts/verify-blueprint.js`)에서 다음 5대 항목을 전수 검사하며, 단 1개라도 불일치 시 배포는 원천 차단된다:
1. **[검문 1] switchAuthTab 4대 상태 분기 검증**: `tab === 'find-id'`, `tab === 'find-pw'` 정상 구현 확인.
2. **[검문 2] 핵심 실행 함수 3대 세트 구비 검증**: `window.executeFindId`, `window.executeFindPw`, `window.executeResetPw` 누락 여부 검사.
3. **[검문 3] Supabase 클라우드 직통 연동 검증**: `window.SupabaseSync.upsertUser` 및 `password_hash` 컬럼 갱신 코드 존재 검사.
4. **[검문 4] 단일 이벤트 바인딩 무결성 검증**: `index.html` 내 찾기 버튼 및 폼의 인라인 단일 바인딩 및 중복 `addEventListener` 부존재 검사.
5. **[검문 5] 유령/이원화 코드 부존재 검증**: `find_id_cache`, `find_pw_cache` 등 찌꺼기 패턴 0건 전수 검사.

### 4. 4대 화면 상태 전환 매트릭스 및 실행 규격
| 상태 (`tab`) | 상단 탭 (`.auth-tabs`) | 활성 패널 (`.auth-pane.active`) | 입력창 포커스 & 폼 라이프사이클 |
| :--- | :---: | :---: | :--- |
| **`login`** (로그인) | **표시** (`style.display=''`) | `#login-pane` | 찾기 입력 폼 및 결과 박스 자동 초기화(리셋) |
| **`signup`** (회원가입) | **표시** (`style.display=''`) | `#signup-pane` | 아이디 중복검사 상태 초기화 |
| **`find-id`** (아이디 찾기) | **숨김** (`style.display='none'`) | `#find-id-pane` | 이름(`#find-id-name`) 자동 포커스 (50ms) / 뒤로가기 버튼 지원 |
| **`find-pw`** (비밀번호 찾기) | **숨김** (`style.display='none'`) | `#find-pw-pane` | 아이디(`#find-pw-id`) 자동 포커스 (50ms) / 뒤로가기 버튼 지원 |

* **아이디 찾기 완료 시**: 아이디 마스킹 안내 후 `[로그인하러 가기]` 클릭 시 로그인 화면으로 0초 전환 + 아이디 자동 기입 + 비밀번호 입력란 자동 포커스.
* **비밀번호 재설정 완료 시**: 1단계 계정 확인 ➔ 2단계 새 비밀번호 실시간 유효성 검사 ➔ 3단계 SHA-256 해싱 & Supabase `password_hash` 직통 저장 ➔ 1.2초 후 로그인 화면 자동 복귀.

---

## 📐 [설계도-08] BP-TRAFFIC-DIET: 트래픽 다이어트 및 Supabase 대역폭(Egress) 영구 방어 설계도

### 1. 명확한 원칙 (Clear & Absolute Principles)
1. **육안 선명도 100% 보존 & 초경량 강제 압축 원칙**:
   - 모바일 및 PC 웹 화면에서 상호명, 전화번호, 시공 외관 디테일을 또렷하게 식별할 수 있는 해상도(긴 변 최대 800px, JPEG 품질 0.70)를 유지하면서, 파일당 용량을 **최대 80~90KB 이하**로 강제 제한한다.
   - 3장을 업로드해도 총 용량은 250KB 미만을 유지하여, 기존 1MB 이상의 과도한 Base64 누적을 원천 차단한다.
2. **목록 동기화 시 사진 배제 원칙 (Column Selection)**:
   - 대시보드 목록(전체 신청서 목록, 영업물건 목록 등)을 동기화하거나 정기 폴링할 때는 무거운 Base64 사진 컬럼(`image_url`, `construction_photos`, `construction_invoice`)을 **100% 제외하고 텍스트 메타데이터만 선별 조회(`select('id, user_id, ...')`)**하여 대역폭 전송량을 99% 이상 절감한다.
3. **사진 온디맨드 단일 조회 및 영구/세션 캐싱 (Zero Duplicate Fetch)**:
   - 사진 데이터는 사용자가 [사진 보기], [모달 열기], [시안 다운로드] 버튼을 직접 클릭했을 때만 해당 1건에 대해 개별 쿼리(`eq('id', appId)`)로 단일 조회하여 가져온다.
   - 한 번 불러온 사진(신규 신청서 접수 시 첨부된 사진 포함)은 브라우저 캐시(`PhotoCacheManager`, 세션/로컬스토리지)에 보관하여, 같은 사진을 반복 열람할 때 Supabase 통신 없이 **트래픽 0바이트(0ms 즉시 표시)**로 렌더링한다.
4. **Realtime WebSocket 대역폭 누수 차단 (Debounce 300ms)**:
   - Supabase Realtime WebSocket `postgres_changes` 이벤트 발생 시, 단시간 내 다중 이벤트 발화로 인한 연쇄 전체 동기화를 차단하기 위해 **300ms 디바운스(Debounce)**를 필수로 장착한다.
5. **Fallback 쿼리 경량화 고정 (Zero Full Row Fallback)**:
   - 선별 조회가 실패하는 예외 상황의 fallback 쿼리에서도 `select('*')` 사용을 영구 금지하며, 반드시 사진 컬럼을 제외한 메타데이터 컬럼 목록으로만 쿼리한다.
6. **사진 캐시 무효화 시 사진 장수 및 수정시각(`photoUpdatedAt`) 동시 대조 원칙 (Timestamp-based Cache Invalidation)**:
   - `PhotoCacheManager`는 불필요한 네트워크 대역폭(Egress)을 방어하기 위해 브라우저 세션/로컬 스토리지를 활용하되, 캐시 유효성을 검사할 때 사진 장수(`count`)뿐만 아니라 `expectedUpdatedAt > cached.photoUpdatedAt` 수정 시각을 필수로 대조한다.
   - 사진 장수가 1장으로 동일하더라도 사진 내용이 교체되면 타임스탬프 대조를 통해 구형 캐시를 즉시 파기하고 최신본을 단 1회 온디맨드로 안전하게 조회한다.
   - 이를 통해 "대역폭 누수 차단(99% 절감)"과 "최신 데이터 0초 동기화"를 단 1비트의 충돌 없이 100% 양립시킨다.
7. **사진 등록 시 실서버 최신본 사전 조회 및 누적 병합 원칙 (Pre-upload DB Fetch & Merge)**:
   - 목록 동기화 시 대역폭 절감을 위해 사진 데이터를 제외(Column Selection)하더라도, 사용자가 사진을 '추가 등록'하는 쓰기(Write) 시점에는 Supabase DB의 기존 사진을 온디맨드로 실시간 1회 조회하여 기존 등록본을 100% 확보한 뒤 누적 병합(Merge)한다.
   - 이를 통해 '네트워크 트래픽 99% 절감'과 '다중 기기 등록 시 덮어쓰기 데이터 유실 방어'를 충돌 없이 완벽히 양립시킨다.

### 2. 설계도 보존법칙 (모든 설계도는 일원화 할 것 - 이원화 절대 금지)
1. **단일 압축 엔진(`compressImageFile` / `compressImageToBase64`) 일원화**:
   - 신청서 접수, 시공사 시안 등록, 시공완료 사진 등 모든 이미지 업로드는 오직 `security-utils.js`의 `compressImageFile(file, 90 * 1024)` 단일 함수로만 처리하며, 임의의 독자 압축 함수 생성이나 300KB 이상의 구형 파라미터 재도입을 영구 금지한다.
2. **DB 저장 Base64 용량 100KB 이하 유지 의무**:
   - Supabase `applications` 테이블의 사진 컬럼에 저장되는 개별 이미지 데이터는 장당 100KB 이하를 엄격히 준수하며, 신청서 1개 행의 총 JSON 용량은 300KB 미만(텍스트 포함)을 지향한다.
3. **독자 사진 캐시/테이블 분기 부존재 의무**:
   - 사진 데이터를 다루기 위한 별도의 로컬 복제 테이블이나 독자 캐시 배열을 생성하지 않고, 오직 `PhotoCacheManager` 및 `applications` SSOT 원본만을 직접 읽고 갱신한다.

### 3. 자동 검문소 (검증망) 영구 감시 규칙 (Automated Blueprint Guard Rules)
배포(`npm run deploy`) 전 실행되는 자동 검문소(`scripts/verify-blueprint.js`)에서 다음 6대 항목을 전수 검사하며, 단 1개라도 불일치 시 배포는 원천 차단된다:
1. **[검문 1] 이미지 압축 기본 규격 검증**: `compressImageFile` 및 `compressImageToBase64` 기본값이 `90 * 1024`(90KB), `max_size = 800`으로 설정되어 있는지 검사.
2. **[검문 2] 목록 동기화 시 사진 배제 쿼리 검증**: `security-utils.js` 내 applications 조회 쿼리에서 `image_url` 배제 선별 쿼리가 유지되고 있는지 검사.
3. **[검문 3] Fallback 쿼리 select('*') 부존재 검증**: fallback 쿼리에서 `select('*')`가 0건인지 전수 검사.
4. **[검문 4] Realtime 300ms 디바운스 엔진 검증**: WebSocket 변경 감지 시 `triggerDebouncedSync` 및 `setTimeout(..., 300)` 탑재 여부 검사.
5. **[검문 5] PhotoCacheManager photoUpdatedAt 타임스탬프 기반 캐시 무효화 준수**: `security-utils.js` 내 `PhotoCacheManager.get` 및 `ensureApplicationPhotosLoaded`의 `expectedUpdatedAt` 검증 코드 탑재 검사.
6. **[검문 6] 사진 추가 등록 시 실서버 DB 사전 조회 및 누적 병합 준수**: `data-store.js`의 `handleJobPhotoUploadCommon` 내 Supabase DB 사전 조회(`supabaseClient.from('applications').select`) 및 누적 병합 로직 탑재 검사.

### 4. 사진 규격 및 대역폭 최적화 매트릭스
| 구분 | 기존 규격 (트래픽 폭증기) | **[설계도-08] 확정 규격 (영구 방어)** | 최적화 효과 |
| :--- | :--- | :--- | :--- |
| **최대 해상도** | 긴 변 1,200px | **긴 변 800px** (모바일 Retina 2배 해상도) | 선명도 100% 유지 + 면적 55% 축소 |
| **파일당 최대 용량** | 300 KB | **80 ~ 90 KB 이하 (품질 0.70)** | 파일당 70% 용량 다이어트 |
| **신청서(3장 기준)** | 약 900 KB ~ 1.2 MB | **약 200 ~ 250 KB 이하** | 1건당 Egress 75% 절감 |
| **목록 동기화** | 전체 Base64 포함 조회 위험 | **사진 컬럼 100% 배제 (선별 텍스트)** | Egress 99% 원천 절감 |
| **Realtime 동기화** | 이벤트 발화마다 즉시 재조회 | **300ms 디바운스 묶음 처리** | 소켓 폭풍 및 대역폭 누수 차단 |
| **사진 재열람** | 매 열람마다 네트워크 다운로드 | **PhotoCacheManager 브라우저 캐싱** | 중복 조회 트래픽 0 바이트 |

---

## 📐 [설계도-09] BP-CLEAN-PIPELINE: 땜빵 금지, 구형 찌꺼기 전수 삭제 및 단일 파이프라인(Clean Slate Single Pipeline) 보존 설계도

### 1. 3대 절대 헌법 원칙 (Absolute Constitutional Rules)
1. **구형 레거시 및 이원화 분기문 전수 추적 삭제 (Zero Residue / Clean Slate)**:
   - 수정 사항이 생겼을 때, 기존 흐름을 그대로 둔 채 옆에 우회로를 덧붙이는 땜빵 행위를 영구 엄격 금지한다.
   - 반드시 관련된 구형 레거시 코드, 임시 분기문, 이중 조회 함수를 100% 전수 추적하여 삭제(도려내기)한 후, 가장 단순한 단 1개의 파이프라인으로 전면 재구축한다.
2. **임시방편 우회 장치(락, 타이머, 우회 조건문) 영구 금지**:
   - 눈앞의 증상만 모면하기 위한 임시 우회 락(`_recentStatusUpdates` 남용, 임의 플래그 덮어쓰기), 지연 타이머(`setTimeout`으로 재덮어쓰기), 화면 렌더링 중 독자 쿼리 발동을 일체 쓰지 않는다.
   - 단일 진실의 원천(SSOT)에 따라 데이터가 1회 기록되면 전체 화면이 0초 만에 안정적으로 리렌더링되는 단순 무결 구조를 유지한다.
3. **단일 클라우드 동기화 엔진 일원화 (Single SSOT Sync Engine)**:
   - 모든 클라우드 동기화는 오직 `security-utils.js`의 `SupabaseSync.syncAllData()` 단 하나의 공식 파이프라인으로만 처리한다.
   - 화면 함수(`renderAdminDashboardMob` 등) 내부에 독자적인 DB 조회(`client.from`)나 임의의 `fetch...Fresh` 유령 함수를 삽입하는 것을 영구 금지한다.

### 2. 자동 검문소 (`verify-blueprint.js`) 영구 감시 규칙
1. **[검문 1] 독자 직통 클라우드 조회 찌꺼기 100% 부존재 검증**:
   - `fetchAndRenderAdminApplicationsFresh`, `fetchAndRenderAdminUsersFresh` 등 독자 조회 함수 부존재 검사.
2. **[검문 2] 화면 렌더링 함수 내 독자 DB 쿼리 부존재 검증**:
   - `renderAdminDashboardMob` 등 렌더링 함수 바디 내에 독자 Supabase 쿼리(`client.from`) 부존재 검사.
3. **[검문 3] 렌더링 루프 재조회 우회 타이머 부존재 검증**:
   - 화면 렌더링 함수 내에서 `skipSync`를 무시하고 비동기로 클라우드를 재조회하는 이중 쿼리 부존재 검사.

---

## 🔒 이원화 절대 금지 및 설계도 보존 법칙 (Zero Dual-Architecture)

1. **단일 데이터 참조 의무**: 어떤 화면이든 `applications` 레코드 원본을 직접 읽어야 하며, 사본 캐시 생성을 금지한다.
2. **단일 함수 호출 의무**: 팝업이나 모달을 특정 역할 전용으로 이원화 분기하지 않는다.
3. **자동 검문소 통과 의무**: 모든 코드 변경은 `npm run verify` (`scripts/verify-blueprint.js`)를 100% 통과해야만 배포할 수 있다.
