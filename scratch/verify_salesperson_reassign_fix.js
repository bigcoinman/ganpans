const fs = require("fs");

// Mock LocalStorage & SessionStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};
global.sessionStorage = { ...global.localStorage };
global.window = global;
global.document = {
  getElementById: () => null,
  addEventListener: () => {},
  removeEventListener: () => {}
};

// 1. Load DataStore
const dataStoreCode = fs.readFileSync("data-store.js", "utf8");
eval(dataStoreCode);

// 2. Setup Test Data
const kim = { id: "sales_kim", name: "김영업", role: "business", bizCode: "260901", items: [] };
const park = { id: "sales_park", name: "박영업", role: "business", bizCode: "260902", items: [] };
const admin = { id: "admin", name: "최고관리자", role: "admin", bizCode: "ADMIN" };

localStorage.setItem("users", JSON.stringify([admin, kim, park]));

const appItem = {
  id: "260901-004",
  referrerCode: "260901",
  referrer_code: "260901",
  salespersonId: "sales_kim",
  salespersonName: "김영업",
  storeName: "대박맛집",
  ownerName: "이점주",
  ownerPhone: "010-1111-2222",
  status: "pending",
  isBizItem: false,
  appliedAt: new Date().toISOString()
};
localStorage.setItem("applications", JSON.stringify([appItem]));

console.log("=== 1단계: 초기 상태 검증 ===");
function filterAppsForUser(activeUser) {
  const apps = JSON.parse(localStorage.getItem("applications")) || [];
  return apps.filter(app => {
    const refCode = String(app.referrerCode || app.referrer_code || "").trim().toLowerCase();
    const salesId = String(app.salespersonId || "").trim().toLowerCase();
    const myBiz = String(activeUser.bizCode || "").trim().toLowerCase();
    const myId = String(activeUser.id || "").trim().toLowerCase();
    const myName = String(activeUser.name || "").trim().toLowerCase();

    const isAssignedToOtherSales = Boolean(
      (salesId && salesId !== myId && salesId !== myBiz) ||
      (refCode && refCode !== myBiz && refCode !== myId && refCode !== myName)
    );
    if (isAssignedToOtherSales) return false;

    const isMyId = app.userId === activeUser.id || app.registeredBy === activeUser.id || app.salespersonId === activeUser.id;
    const isMyPhone = activeUser.phone && app.ownerPhone && app.ownerPhone.replace(/[^0-9]/g, "") === activeUser.phone.replace(/[^0-9]/g, "");
    const isMyName = activeUser.name && app.ownerName === activeUser.name;
    const isMyBizCode = Boolean(refCode && (refCode === myBiz || refCode === myId || refCode === myName));

    return isMyId || isMyPhone || isMyName || isMyBizCode;
  });
}

let kimApps = filterAppsForUser(kim);
let parkApps = filterAppsForUser(park);
console.log("김영업(260901) 신청서 목록:", kimApps.map(a => a.id), "(예상: [260901-004])");
console.log("박영업(260902) 신청서 목록:", parkApps.map(a => a.id), "(예상: [])");
if (kimApps.length !== 1 || parkApps.length !== 0) throw new Error("1단계 실패!");

console.log("\n=== 2단계: 최고관리자가 박영업(260902)으로 담당자 변경 ===");
window.DataStore.updateApplicationReferrer("260901-004", "260902");

kimApps = filterAppsForUser(kim);
parkApps = filterAppsForUser(park);
console.log("변경 후 김영업(260901) 신청서 목록:", kimApps.map(a => a.id), "(예상: [])");
console.log("변경 후 박영업(260902) 신청서 목록:", parkApps.map(a => a.id), "(예상: [260901-004])");
if (kimApps.length !== 0) throw new Error("2단계 실패: 김영업 대시보드에서 사라지지 않음!");
if (parkApps.length !== 1) throw new Error("2단계 실패: 박영업 대시보드에 배정되지 않음!");
console.log("-> 결과: 김영업 대시보드에서 100% 완전 부존재(0건) 확인! 박영업 대시보드에 100% 정상 이관 확인!");

console.log("\n=== 3단계: 최고관리자가 본사 직접 접수로 해제 ===");
window.DataStore.updateApplicationReferrer("260901-004", "");

kimApps = filterAppsForUser(kim);
parkApps = filterAppsForUser(park);
console.log("해제 후 김영업(260901) 신청서 목록:", kimApps.map(a => a.id), "(예상: [])");
console.log("해제 후 박영업(260902) 신청서 목록:", parkApps.map(a => a.id), "(예상: [])");
if (kimApps.length !== 0 || parkApps.length !== 0) throw new Error("3단계 실패: 본사 접수 해제 시 잔재 노출!");
console.log("-> 결과: 본사 접수 전환 시 모든 영업자 화면에서 0건으로 완벽 제거 확인!");

console.log("\n🎉 [전수 검증 성공] 3단계 사전 자체 검증 100% 통과!");
