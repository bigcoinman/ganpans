# 4대 권한/역할 설계 구조 및 시공/정산 통합 연동 구현 계획서 (로그아웃 및 사용자명 오표기 수정 포함)

본 계획서는 일반 회원, 영업자, 시공업체, 최고관리자로 구성된 **4대 권한/역할 설계 구조**를 확립하고, 이들이 유기적으로 상호작용하는 **시공 및 정산 프로세스의 통합 연동**을 완벽하게 구현하며, 현재 보고된 **PC 웹 마이페이지 내 다른 사용자명(홍길동) 고정 표출 오류 및 로그아웃 미작동 기능상 오류**를 완벽하게 해결하기 위한 구현 계획서입니다.

---

## 1. 4대 권한/역할 설계 구조 및 시나리오

시스템은 아래와 같은 4개의 역할군을 가지며, 상호작용을 통해 신청부터 정산 종결까지 진행됩니다.

| 역할 (Role) | 주요 권한 및 화면 노출 시나리오 |
| :--- | :--- |
| **일반 회원 (`normal`)** | - 마이페이지에서 본인이 접수한 간편 지원 신청 내역 조회 및 취소<br>- 영업자 또는 시공업체 회원으로의 전환 신청 권한 제공 |
| **영업자 회원 (`business`)** | - 영업을 통해 획득한 점포의 간판 교체 신청(영업물건) 등록<br>- 등록된 영업물건들의 진행 현황(접수 상태 및 시공 상태) 실시간 모니터링 |
| **시공업체 회원 (`constructor`)** | - 최고관리자로부터 배정받은 시공 물건 목록 조회<br>- 시공 상태 변경(시공 전 -> 시공 중) 및 현장 사진/정산 증빙(세금계산서) 등록<br>- 증빙 등록 완료 후 '시공 완료 보고' 수행 |
| **최고관리자 (`admin`)** | - 일반 회원의 영업자/시공업체 승인 및 반려 처리<br>- 접수된 신청 건의 상태 관리 및 시공업체 배정<br>- 시공업체가 제출한 사진 및 세금계산서 검수 후 최종 '정산 종결' 처리 |

---

## 2. 발견된 작동 기능상 문제점 및 원인 분석

### ① `dashboard.js` 내 치명적인 구문(Syntax) 및 스코프 에러 (핵심 원인)
* **문제점**: `initPWA()` 내에서 PWA 공유 버튼(`pwaShareBtn`) 클릭 리스너의 닫는 괄호(`}); }`)가 누락되어 있습니다. 이로 인해 `renderConstructorDashboard`를 포함한 모든 시공사 제어 함수들이 공유 버튼 클릭 리스너 내부 콜백 함수로 묶여 버렸습니다. 또한, `DOMContentLoaded` 스코프 밖에 갇혀있어 `ReferenceError: renderConstructorDashboard is not defined`가 발생해 대시보드 진입 시 전체 스크립트 동작이 정지됩니다.
* **이로 인해 파생된 장애 현상**:
  1. **마이페이지 사용자명 고정 오류**: 대시보드 화면 로딩 시 자바스크립트가 뻗어 `renderDashboard()` 함수가 호출되지 못했습니다. 이 때문에 `dashboard.html`에 마크업으로 하드코딩되어 있던 기본 이름인 **"홍길동님"**이 로그인 사용자의 정보로 갱신되지 못하고 그대로 노출되었습니다.
  2. **로그아웃 작동 불가**: 마찬가지로 대시보드 스크립트 초기화 프로세스가 중단되어 로그아웃 버튼(`logout-btn`)에 이벤트 리스너가 등록되지 못해 아무리 클릭해도 작동하지 않았습니다.

### ② 메인/PWA 페이지 (`script.js` 내 Null Reference 에러)
* **문제점**: `script.js`의 `updateSessionUI()` 함수가 실행될 때, `app.html`에는 `#auth-btn` 요소가 존재하지 않아 `null`을 반환합니다. 이에 대해 Null 가드(Guard) 처리가 되어 있지 않아 `authBtn.style.display` 수정 시 `TypeError`가 발생했고, 자바스크립트 실행이 정지되어 메인 및 PWA 로그아웃 이벤트가 아예 작동하지 않았습니다.
* **해결 방안**: `script.js` 내의 `updateSessionUI()` 함수 내부에서 `authBtn`, `userInfoArea`, `navDashboard` 등 모든 DOM 참조 변수들에 대해 안전한 Null 가드 코드를 추가합니다.

### ③ 하이브리드 모바일 앱 뷰 로그아웃 미작동 (`app.js`)
* **문제점**: `app.js`에서 드로어 로그아웃 클릭 시 `pcLogoutBtn.click()`을 유도하지만, `pcLogoutBtn` 에 실제 처리를 담당하는 리스너 등록이 스크립트 에러로 인해 스킵되었을 경우 로그아웃이 처리되지 않고 묻히는 현상이 발생합니다.
* **해결 방안**: `app.js` 내의 드로어 로그아웃 이벤트 핸들러에서 자체적으로 `localStorage.removeItem('activeUser')`를 먼저 수행하여 스크립트 장애와 무관하게 즉시 세션이 제거되도록 이중 보장 처리합니다.

### ④ `updateSessionUI` 내 시공업체 역할 맵핑 누락
* **문제점**: 대시보드 상단 헤더에 사용자 정보를 표시할 때, 시공업체(`role: 'constructor'`) 세션 정보가 누락되어 있어 '시공업체' 대신 '일반'으로 노출되는 문제가 있습니다.
* **해결 방안**: `role === 'constructor'` 조건에 대해 `roleText = '시공업체'` 맵핑을 명시적으로 추가합니다.

### ⑤ 최고관리자 콘솔의 회원전환 승인 로직의 버그 (역할 혼선)
* **문제점**: 일반 회원이 '시공업체' 회원으로 승인을 요청(`pending_constructor`)하더라도, `approveUserConversion` 함수가 무조건 `role: 'business'`(영업자)로 전환하고 영업자 코드를 발급하는 버그가 있습니다.
* **해결 방안**: 해당 유저의 전환 대기 상태(`conversionStatus`)가 `pending_constructor`인지 `pending`인지 확인하여 분기 처리합니다. 시공업체 승인인 경우 `role: 'constructor'`를 부여하고, 시공 코드(`CO-2026-XXXX`)를 발급하며, 업체 상호명 및 사업자등록번호 데이터를 정상 매핑합니다.

### ⑥ 시공/정산 통합 연동 정보 미흡 (고객/영업자 대시보드 연동)
* **문제점**: 시공사가 배정되고 시공 진행 중이거나 정산이 종결(`constructionStatus` 변경)되었음에도, 일반 회원과 영업자의 대시보드에서는 단순하게 '승인 완료' 배지만 보이고 시공 및 정산에 관한 상세 진행 현황이 업데이트되지 않아 실시간 연동 모니터링이 불가능합니다.
* **해결 방안**: 고객의 신청 내역(`renderUserApplicationsList`)과 영업자의 대시보드(`renderBusinessDashboard`) 렌더링 시, 신청서가 승인된 이후의 상태를 `constructionStatus` 값에 따라 동적으로 상세 맵핑하여 노출합니다.
  * `before_construction` $\rightarrow$ **시공사 배정 완료 (시공 전)**
  * `in_construction` $\rightarrow$ **시공 진행 중**
  * `after_construction` $\rightarrow$ **시공 완료 (검수 중)**
  * `completed` $\rightarrow$ **정산 종결 (최종 완료)**

---

## 3. Proposed Changes

### [MODIFY] [script.js](file:///d:/1-Claude_Ai%20Projects%20-%202026-05/.vscode-shared/ganpans/script.js)
* `updateSessionUI` 내 `authBtn`, `userInfoArea`, `navDashboard`, `headerUserName`에 대해 Null Guard 조건문 적용하여 런타임 중단 방지.

### [MODIFY] [dashboard.js](file:///d:/1-Claude_Ai%20Projects%20-%202026-05/.vscode-shared/ganpans/dashboard.js)
* `pwaShareBtn` 이벤트 리스너 괄호 구조 교정 및 시공사 함수들(`renderConstructorDashboard`, `updateJobConstructionStatus`, `handleJobPhotoUpload`, `handleJobInvoiceUpload`, `reportJobCompletion`)의 정의 위치를 `DOMContentLoaded` 최하단(PWA 외부)으로 이동.
* `updateSessionUI` 내 시공업체 롤 맵핑 추가.
* `approveUserConversion` 내 `pending_constructor` 조건 분기 구현.
* `renderUserApplicationsList` 및 `renderBusinessDashboard` 내 `constructionStatus`를 활용한 시공/정산 상태 연동 배지 렌더링 구현.

### [MODIFY] [app.js](file:///d:/1-Claude_Ai%20Projects%20-%202026-05/.vscode-shared/ganpans/app.js)
* `drawerLogoutBtn` 이벤트 핸들러에서 자체적으로 `activeUser` 세션을 파괴하도록 로직 보완.

---

## 4. Verification Plan

### Automated/Manual Verification
1. **구문 검증**: 코드 수정 후 브라우저 개발자 도구(F12) 콘솔 창에 Javascript 로딩 에러가 나타나지 않는지 확인.
2. **로그인한 유저명 표출 및 로그아웃 테스트**:
   * 일반 회원(`testuser`)이 아닌 다른 영업자 회원(`bizuser` / `biz123!`) 또는 시공사(`constuser` / `const123!`)로 로그인 $\rightarrow$ 마이페이지 진입 시 타이틀 영역에 하드코딩되었던 "홍길동님"이 아닌 실제 로그인한 사용자의 이름("김영업님" / "박시공님")이 정상 표출되는지 확인.
   * 각 대시보드 및 메인 웹 화면에서 "로그아웃" 버튼 클릭 시 alert창 출력과 함께 정상적으로 세션이 제거되고 화면이 갱신되는지 확인.
3. **시공사 신청 및 최고관리자 승인 테스트**:
   * 일반 회원(`testuser`)으로 로그인 $\rightarrow$ 시공사 전환 신청 진행.
   * 최고관리자(`admin`)로 로그인 $\rightarrow$ 회원 전환 목록에서 '시공업체 신청' 건 승인 $\rightarrow$ 시공 코드 발급 확인.
   * `testuser` 로그아웃 후 다시 로그인했을 때 헤더에 '홍길동님 (testuser) (시공업체)'로 표시되고 '시공업체 대시보드' 뷰가 정상 렌더링되는지 확인.
4. **시공사 배정 및 통합 상태 연동 테스트**:
   * 최고관리자(`admin`)로 로그인하여 접수된 간편 신청 건에 새로 승인된 시공사를 배정.
   * 시공사로 로그인하여 배정된 시공 물건을 확인하고 상태를 '시공 중'으로 변경.
   * 영업자 또는 일반 유저로 로그인하여 본인 신청 건의 상태 배지가 '시공 진행 중'으로 실시간 반영되는지 확인.
   * 시공사로 로그인하여 현장 사진과 정산서(영수증/계산서)를 등록하고 '시공 완료 보고'를 수행.
   * 영업자/일반 유저 화면에서 상태가 '시공 완료 (검수 중)'로 갱신되었는지 확인.
   * 최고관리자(`admin`)로 로그인 $\rightarrow$ '증빙확인/정산완료'를 눌러 최종 승인.
   * 전체 유저 대시보드 상에서 해당 건의 최종 상태가 '정산 종결'로 정상 표기되는지 검증.
