const fs = require("fs");

// 시나리오 1: 일반 점주가 영업자 코드로 신청한 건을 점주 본인이 볼 때
const ownerUser = { id: "user_owner", name: "홍점주", role: "user", phone: "010-1234-5678" };
const ownerApp = {
  id: "B-260901-001",
  userId: "user_owner",
  ownerName: "홍점주",
  ownerPhone: "010-1234-5678",
  referrerCode: "B-260901",
  salespersonId: "sales_kim"
};

// 시나리오 2: 영업자 김영업이 볼 때 (B-260901)
const kim = { id: "sales_kim", name: "김영업", role: "business", bizCode: "B-260901" };

// 시나리오 3: 영업자 박영업이 볼 때 (B-260902)
const park = { id: "sales_park", name: "박영업", role: "business", bizCode: "B-260902" };

function checkFilter(activeUser, app) {
  const refCode = String(app.referrerCode || app.referrer_code || '').trim().toLowerCase();
  const salesId = String(app.salespersonId || '').trim().toLowerCase();
  const myBiz = String(activeUser.bizCode || '').trim().toLowerCase();
  const myId = String(activeUser.id || '').trim().toLowerCase();
  const myName = String(activeUser.name || '').trim().toLowerCase();

  // 1. 점주 본인 신청 건 확인
  const isMyOwnApp = Boolean(
    (app.userId && app.userId === activeUser.id) ||
    (app.registeredBy && app.registeredBy === activeUser.id) ||
    (activeUser.phone && app.ownerPhone && app.ownerPhone.replace(/[^0-9]/g, '') === activeUser.phone.replace(/[^0-9]/g, '')) ||
    (activeUser.name && app.ownerName && app.ownerName === activeUser.name)
  );

  // 2. 일반 회원/점주인 경우: 본인 신청건이면 100% 정상 노출
  if (activeUser.role !== 'business') {
    return isMyOwnApp;
  }

  // 3. 영업자 회원인 경우: 최고관리자 SSOT 기준 적용
  const isAssignedToOtherSales = Boolean(
    (salesId && salesId !== myId && salesId !== myBiz) ||
    (refCode && refCode !== myBiz && refCode !== myId && refCode !== myName)
  );
  if (isAssignedToOtherSales) return false;

  const isMyBizCode = Boolean(refCode && (refCode === myBiz || refCode === myId || refCode === myName));
  const isMyAssigned = Boolean(salesId && (salesId === myId || salesId === myBiz));

  return isMyBizCode || isMyAssigned || isMyOwnApp;
}

console.log("1. 일반 점주가 자기 신청서 볼 때:", checkFilter(ownerUser, ownerApp)); // true 여야 함
console.log("2. 담당 영업자 김영업이 볼 때:", checkFilter(kim, ownerApp)); // true 여야 함
console.log("3. 다른 영업자 박영업이 볼 때:", checkFilter(park, ownerApp)); // false 여야 함

// 최고관리자가 박영업으로 변경했을 때:
ownerApp.referrerCode = "B-260902";
ownerApp.salespersonId = "sales_park";
console.log("\n-- 최고관리자가 박영업으로 변경 후 --");
console.log("1. 일반 점주가 자기 신청서 볼 때:", checkFilter(ownerUser, ownerApp)); // 여전히 true 여야 함!
console.log("2. 이전 영업자 김영업이 볼 때:", checkFilter(kim, ownerApp)); // false (사라져야 함!)
console.log("3. 새 영업자 박영업이 볼 때:", checkFilter(park, ownerApp)); // true (배정되어야 함!)
