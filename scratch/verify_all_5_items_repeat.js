// 5개 전문 에이전트 협업 4회 반복 심층 무결성 검증 스크립트
// 대상: 1번 ~ 5번 핵심 수정 항목

const fs = require('fs');
const path = require('path');

// 1. 브라우저 환경 모킹
const storage = {};
const localStorageMock = {
  getItem: (k) => (storage[k] !== undefined ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;
global.alert = function(msg) {};
global.confirm = function(msg) { return true; };

const dummyChain = {
  select: async () => ({ data: [], error: null }),
  update: async () => ({ data: [], error: null }),
  upsert: async () => ({ data: [], error: null }),
  insert: async () => ({ data: [], error: null }),
  delete: async () => ({ data: [], error: null }),
  eq: function() { return this; }
};

global.window = {
  localStorage: localStorageMock,
  sessionStorage: localStorageMock,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  location: { reload: () => {} },
  CustomEvent: function(type, detail) { return { type, detail }; },
  supabaseClient: {
    from: () => dummyChain,
    channel: () => ({ on: function() { return this; }, subscribe: function() { return this; } })
  },
  showToast: function(msg) {},
  showNotification: function(msg) {}
};

global.CustomEvent = global.window.CustomEvent;
global.document = {
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {},
  removeEventListener: () => {},
  visibilityState: 'visible'
};

// 2. DataStore 및 SecurityUtils 로드
const dataStoreCode = fs.readFileSync(path.join(__dirname, '../data-store.js'), 'utf8');
const securityCode = fs.readFileSync(path.join(__dirname, '../security-utils.js'), 'utf8');

eval(dataStoreCode);
eval(securityCode);

const DataStore = global.window.DataStore;
const SecurityUtils = global.window.SecurityUtils;

(async function runAllTests() {
  console.log("==================================================================");
  console.log("🚀 [5개 에이전트 합동 4회 반복 무결성 스트레스 테스트 시작]");
  console.log("==================================================================");

  let totalCycles = 4;
  let overallPass = true;

  for (let cycle = 1; cycle <= totalCycles; cycle++) {
    console.log(`\n------------------ [CYCLE ${cycle} / ${totalCycles} 검증 시작] ------------------`);
    global.localStorage.clear();

    // 초기 데이터 주입
    const initialUsers = [
      {
        id: 'sales1',
        name: '홍길동',
        email: 'sales1@test.com',
        role: 'business',
        bizCode: 'B-260901',
        items: [
          { id: 'item_1', name: '진수상회', ownerName: '김진수', ownerPhone: '010-1111-2222', receiptStatus: '업체신청', progressStatus: '지원대기중', signType: '플렉스 간판' },
          { id: 'item_2', name: '진수건업', ownerName: '김진수', ownerPhone: '010-1111-2222', receiptStatus: '업체신청', progressStatus: '지원대기중', signType: '채널 간판' }
        ]
      },
      {
        id: 'const1',
        name: '시공사A',
        email: 'const1@test.com',
        role: 'constructor',
        businessName: '(주)시공사A'
      }
    ];

    const initialApps = [
      {
        id: 'app_1',
        storeName: '진수상회',
        ownerName: '김진수',
        ownerPhone: '010-1111-2222',
        status: 'pending',
        receiptStatus: '업체신청',
        progressStatus: '지원대기중',
        assignedConstructorId: 'const1',
        signType: '간판지원신청', // 온라인 신청 기본값
        bizCode: 'B-260901',
        userId: 'sales1'
      },
      {
        id: 'app_2',
        storeName: '진수건업',
        ownerName: '김진수',
        ownerPhone: '010-1111-2222',
        status: 'pending',
        receiptStatus: '업체신청',
        progressStatus: '지원대기중',
        assignedConstructorId: '',
        signType: '채널 간판',
        bizCode: 'B-260901',
        userId: 'sales1'
      }
    ];

    DataStore.saveUsers(initialUsers);
    DataStore.saveApplications(initialApps);

    // [검증 1] 1번 항목: [신청서 목록] 5단계 심사 상태 1회 클릭 즉시 정상 변경 검증
    {
      console.log(`[Cycle ${cycle}] 1. [신청서 목록] 5단계 심사 상태 1회 클릭 변경 검증`);
      DataStore.updateApplicationStatus('app_1', 'submitted');
      let apps = DataStore.getApplications();
      let app1 = apps.find(a => a.id === 'app_1');
      if (app1.status !== 'submitted' || !app1.updatedAt) {
        console.error(`❌ [Cycle ${cycle}][1번 실패] status 불일치: ${app1.status}`);
        overallPass = false;
      } else {
        console.log(`  -> 통과: 상태 'submitted' 즉시 반영됨 (updatedAt: ${app1.updatedAt})`);
      }
    }

    // [검증 2] 2번 항목: [영업물건 진행상황] 동일 점주 복수 사업장(진수상회 vs 진수건업) 독립 변경 검증
    {
      console.log(`[Cycle ${cycle}] 2. [영업물건 진행상황] 동일 점주 복수 사업장 독립 변경 검증`);
      // 진수상회(app_1)만 '대상자선정'으로 변경
      DataStore.updateItemStatus('sales1', 'app_1', 'progress', '대상자선정');
      DataStore.updateItemStatus('sales1', 'app_1', 'receipt', '접수완료');

      let users = DataStore.getUsers();
      let sales = users.find(u => u.id === 'sales1');
      let item1 = sales.items.find(i => i.id === 'app_1' || i.id === 'item_1');
      let item2 = sales.items.find(i => i.id === 'item_2');

      let apps = DataStore.getApplications();
      let app1 = apps.find(a => a.id === 'app_1');
      let app2 = apps.find(a => a.id === 'app_2');

      if (app1.progressStatus !== '대상자선정' || app1.receiptStatus !== '접수완료') {
        console.error(`❌ [Cycle ${cycle}][2번 실패] app_1 상태 미반영: ${app1.progressStatus}, ${app1.receiptStatus}`);
        overallPass = false;
      } else if (app2.progressStatus === '대상자선정' || app2.receiptStatus === '접수완료') {
        console.error(`❌ [Cycle ${cycle}][2번 실패] app_2가 동시 오염됨! (app2: ${app2.progressStatus})`);
        overallPass = false;
      } else if (item2.progressStatus === '대상자선정') {
        console.error(`❌ [Cycle ${cycle}][2번 실패] item_2(진수건업)가 동시 오염됨!`);
        overallPass = false;
      } else {
        console.log(`  -> 통과: 진수상회만 '대상자선정'/'접수완료' 독립 변경됨, 진수건업은 '지원대기중' 유지됨`);
      }
    }

    // [검증 3] 4번 항목: [시공업체 진행현황] '대상자 선정' 변경 시 기본 UI '1. 플렉스 간판' 자동 노출 및 표준화 검증
    {
      console.log(`[Cycle ${cycle}] 4. [시공업체 진행현황] '대상자선정' 시 간판종류 '1. 플렉스 간판' 기본값 자동 설정 검증`);
      let jobs = DataStore.getConstructionJobs();
      let job1 = jobs.find(j => j.id === 'app_1');
      if (!job1) {
        console.error(`❌ [Cycle ${cycle}][4번 실패] 시공 작업 목록에 job1 없음`);
        overallPass = false;
      } else if (job1.signType !== '플렉스 간판') {
        console.error(`❌ [Cycle ${cycle}][4번 실패] job1.signType이 '플렉스 간판'이 아님: ${job1.signType}`);
        overallPass = false;
      } else {
        console.log(`  -> 통과: job1.signType이 자동으로 '플렉스 간판'으로 표준화 노출됨 (signType: ${job1.signType})`);
      }
    }

    // [검증 4] 3번 항목: [영업물건 ↔ 시공업체] 시공사 간판종류 변경 후 관리자 접수/진행 드롭다운 즉시 반영 검증
    {
      console.log(`[Cycle ${cycle}] 3. [영업물건 ↔ 시공업체] 간판종류 변경 후 관리자 드롭다운 1회 클릭 즉시 반영 검증`);
      // 시공사가 간판종류를 '채널 간판'으로 변경
      DataStore.updateJobSignType('app_1', '채널 간판');
      
      // 이후 관리자가 접수/진행 상태를 '간판시공 준비중'으로 변경
      DataStore.updateItemStatus('sales1', 'app_1', 'progress', '간판시공 준비중');

      let apps = DataStore.getApplications();
      let app1 = apps.find(a => a.id === 'app_1');
      let users = DataStore.getUsers();
      let sales = users.find(u => u.id === 'sales1');
      let item1 = sales.items.find(i => i.id === 'app_1' || i.id === 'item_1');

      if (app1.signType !== '채널 간판' || (item1 && item1.signType !== '채널 간판')) {
        console.error(`❌ [Cycle ${cycle}][3번 실패] signType 동기화 누락: app=${app1.signType}`);
        overallPass = false;
      } else if (app1.progressStatus !== '간판시공 준비중') {
        console.error(`❌ [Cycle ${cycle}][3번 실패] 관리자 접수/진행 상태 변경 먹통 발생! app=${app1.progressStatus}`);
        overallPass = false;
      } else {
        console.log(`  -> 통과: 시공사 간판종류 변경('채널 간판') 유지 및 관리자 상태 변경('간판시공 준비중') 1회 즉시 완벽 반영`);
      }
    }

    // [검증 5] 5번 항목: [새로고침 직후 2회 클릭 현상] 새로고침 직후 백그라운드 동기화 시 레이스 컨디션 방어 검증
    {
      console.log(`[Cycle ${cycle}] 5. [새로고침 직후 레이스 컨디션 방어] 최근 30초 수정 데이터 보존 검증`);
      // 관리자가 새로고침 직후 바로 상태를 '간판시공완료'로 1회 클릭 변경
      DataStore.updateItemStatus('sales1', 'app_1', 'progress', '간판시공완료');
      
      // 이 순간 백그라운드에서 구형 원격 데이터(이전 상태: 간판시공 준비중)가 도착하여 syncAllData 실행되는 상황 시뮬레이션
      const staleSupabaseApp = {
        id: 'app_1',
        store_name: '진수상회',
        owner_name: '김진수',
        phone: '010-1111-2222',
        status: 'approved',
        sign_type: '플렉스 간판', // 구형 간판종류
        memo: JSON.stringify({
          isBizItem: true,
          receiptStatus: '접수완료',
          progressStatus: '간판시공 준비중' // 구형 상태
        }),
        applied_at: new Date().toISOString()
      };

      global.window.supabaseClient = {
        from: function(tbl) {
          return {
            select: async function() {
              if (tbl === 'applications') return { data: [staleSupabaseApp], error: null };
              return { data: [], error: null };
            },
            update: async () => ({ data: [], error: null }),
            upsert: async () => ({ data: [], error: null }),
            insert: async () => ({ data: [], error: null }),
            delete: async () => ({ data: [], error: null }),
            eq: function() { return this; }
          };
        },
        channel: () => ({ on: function() { return this; }, subscribe: function() { return this; } })
      };

      // syncAllData 비동기 실행 및 대기
      await global.window.SupabaseSync.syncAllData();

      // 검증: 방금 수정한 '간판시공완료' 및 '채널 간판'이 롤백되지 않고 그대로 보존되어야 함
      let apps = DataStore.getApplications();
      let app1 = apps.find(a => a.id === 'app_1');

      if (app1.progressStatus !== '간판시공완료') {
        console.error(`❌ [Cycle ${cycle}][5번 실패] 백그라운드 동기화로 인해 '간판시공완료'가 '${app1.progressStatus}'(으)로 롤백됨!`);
        overallPass = false;
      } else if (app1.signType !== '채널 간판') {
        console.error(`❌ [Cycle ${cycle}][5번 실패] 간판종류가 롤백됨! signType=${app1.signType}`);
        overallPass = false;
      } else {
        console.log(`  -> 통과: 구형 백그라운드 데이터 유입에도 로컬 1회 클릭 변경('간판시공완료', '채널 간판') 100% 완벽 보존됨`);
      }
    }
  }

  console.log("\n==================================================================");
  if (overallPass) {
    console.log("🎯 [최종 결론] 5개 에이전트 합동 4회 반복 검증 결과: 100% 무결점 ALL PASS! 🎉");
  } else {
    console.log("❌ [최종 결론] 검증 중 실패 항목 발견! 추가 점검 필요");
  }
  console.log("==================================================================");
  process.exit(overallPass ? 0 : 1);
})();
