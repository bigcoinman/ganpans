const activeUser = { id: 'robinhood', name: '김로빈', role: 'business', bizCode: 'B-260901' };

const apps = [
  {
    id: 'B-260901-001',
    storeName: '동희네 반찬가게',
    ownerName: '박동희',
    userId: 'robinhood', // Initially keyed in by robinhood
    referrerCode: '',     // Changed by admin to 본사직접접수
    salespersonId: '',
    salespersonName: '본사직접접수'
  },
  {
    id: 'B-260901-005',
    storeName: '안피사카페',
    ownerName: '허안나',
    userId: 'anfisanna',
    referrerCode: '',
    salespersonId: '',
    salespersonName: '본사직접접수'
  }
];

const filtered = apps.filter(app => {
  const refCode = String(app.referrerCode || app.referrer_code || '').trim().toLowerCase();
  const salesId = String(app.salespersonId || '').trim().toLowerCase();
  const myBiz = String(activeUser.bizCode || '').trim().toLowerCase();
  const myId = String(activeUser.id || '').trim().toLowerCase();
  const myName = String(activeUser.name || '').trim().toLowerCase();

  const isMyOwnApp = Boolean(
    (app.userId && app.userId === activeUser.id) ||
    (app.registeredBy && app.registeredBy === activeUser.id) ||
    (activeUser.phone && app.ownerPhone && app.ownerPhone.replace(/[^0-9]/g, '') === activeUser.phone.replace(/[^0-9]/g, '')) ||
    (activeUser.name && app.ownerName && app.ownerName === activeUser.name)
  );

  if (activeUser.role !== 'business') {
    return isMyOwnApp;
  }

  // 3. 영업자 회원인 경우: 최고관리자 SSOT 기준 절대 적용
  // 3-0) 최고관리자가 본사 직접 접수(담당 영업자 해제)로 지정한 건은 모든 영업자 목록에서 0초 완전 소멸 (부존재 일치 의무)
  const sName = String(app.salespersonName || '').trim();
  const isHeadquartersDirect = (!salesId && !refCode) || (sName === '본사직접접수' || sName === '본사 직접 접수');
  if (isHeadquartersDirect) return false;

  // 3-1) 최고관리자가 담당 영업자를 다른 사람으로 명시 지정한 건은 절대 내 목록에 노출 금지 (부존재 일치 의무)
  const isAssignedToOtherSales = Boolean(
    (salesId && salesId !== myId && salesId !== myBiz) ||
    (refCode && refCode !== myBiz && refCode !== myId && refCode !== myName)
  );
  if (isAssignedToOtherSales) return false;

  // 3-2) 내게 귀속된 건: 담당코드가 내 코드이거나, 내게 배정된 건만 표시 (단일 진실의 원천)
  const isMyBizCode = Boolean(refCode && (refCode === myBiz || refCode === myId || refCode === myName));
  const isMyAssigned = Boolean(salesId && (salesId === myId || salesId === myBiz));

  return isMyBizCode || isMyAssigned;
});

console.log('Filtered apps for 김로빈:', filtered.length);
console.assert(filtered.length === 0, 'Should be exactly 0 apps for 김로빈');
console.log('✅ PASS: 동희네 반찬가게 successfully completely disappeared from 김로빈 dashboard!');
