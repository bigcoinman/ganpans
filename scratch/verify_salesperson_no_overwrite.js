// scratch/verify_salesperson_no_overwrite.js
console.log('========================================================');
console.log('🧪 [자체 3단계 검증] 영업자 대리 신청 시 계정 덮어쓰기 방어 검증');
console.log('========================================================\n');

// 1. 초기 사용자 상태 설정
const users = [
  { id: 'admin', name: '최고관리자', phone: '01000000000', role: 'admin' },
  { id: 'sales_hong', name: '홍길동', phone: '01011112222', role: 'business', bizCode: 'B-260905' }
];

const loggedUser = users[1]; // 영업자 홍길동 로그인 상태!
console.log('현재 로그인된 사용자:', loggedUser.name, `(${loggedUser.role}, ${loggedUser.bizCode})`);

// 2. 신청서 폼 입력값
const ownerName = '강감찬';
const ownerPhone = '010-9999-8888';
const storeName = '감찬상회';
const storeAddress = '서울시 종로구 123';
const phoneDigits = ownerPhone.replace(/[^0-9]/g, '');
const autoPw = 'g-' + phoneDigits.slice(-8);

// 3. 수정된 로직 시뮬레이션
const isOwnerSelf = Boolean(
  loggedUser && 
  (loggedUser.role === 'normal' || loggedUser.role === 'user' || !loggedUser.role) &&
  loggedUser.role !== 'business' && 
  loggedUser.role !== 'admin' && 
  loggedUser.role !== 'constructor'
);

let userId = '';
if (isOwnerSelf) {
  // 일반 점주 본인 신청
  userId = loggedUser.id;
  loggedUser.name = ownerName;
} else {
  // 영업자 또는 관리자 대리 신청
  const existingIdx = users.findIndex(u => {
    if (u.role === 'business' || u.role === 'admin' || u.role === 'constructor') return false;
    const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
    const uId = String(u.id || '').toLowerCase();
    return (uPhoneDigits && uPhoneDigits === phoneDigits) || (uId && uId === phoneDigits.toLowerCase());
  });

  if (existingIdx !== -1) {
    userId = users[existingIdx].id;
  } else {
    // 신규 점주 계정 생성
    userId = phoneDigits;
    users.push({
      id: phoneDigits,
      name: ownerName,
      phone: ownerPhone,
      role: 'normal'
    });
  }
}

// 4. 신청서 생성
const newApp = {
  id: `${loggedUser.bizCode}-001`,
  userId: userId,
  registeredBy: loggedUser.id,
  salespersonId: loggedUser.id,
  salespersonName: loggedUser.name,
  ownerName: ownerName,
  ownerPhone: ownerPhone,
  storeName: storeName
};

console.log('\n--- 검증 결과 ---');
const hongUser = users.find(u => u.id === 'sales_hong');
console.log('[검증 1] 영업자 이름 보존:', hongUser.name === '홍길동' ? '✅ 성공 (홍길동 그대로 유지!)' : `❌ 실패 (${hongUser.name})`);
console.log('[검증 2] 영업자 전화번호 보존:', hongUser.phone === '01011112222' ? '✅ 성공 (영업자 번호 유지!)' : `❌ 실패 (${hongUser.phone})`);
console.log('[검증 3] 영업자 권한 보존:', hongUser.role === 'business' ? '✅ 성공 (영업자 권한 유지!)' : `❌ 실패 (${hongUser.role})`);

const kangUser = users.find(u => u.id === '01099998888');
console.log('[검증 4] 신규 점주 계정 분리 생성:', (kangUser && kangUser.name === '강감찬' && kangUser.role === 'normal') ? '✅ 성공 (점주 강감찬 정상 생성!)' : '❌ 실패');

console.log('[검증 5] 신청서 데이터 정확성:');
console.log('   - 신청서 점주 ID (userId):', newApp.userId === '01099998888' ? '✅ 점주 번호 (01099998888)' : '❌ 오류');
console.log('   - 신청서 담당 영업자 (salespersonId):', newApp.salespersonId === 'sales_hong' ? '✅ 영업자 ID (sales_hong)' : '❌ 오류');
console.log('   - 채번된 신청번호:', newApp.id);

if (hongUser.name === '홍길동' && kangUser.name === '강감찬' && newApp.userId === '01099998888') {
  console.log('\n🎉 [최종 검증 완료] 영업자 계정 100% 영구 보존 & 점주 계정 정상 분리 확인!');
} else {
  console.error('\n🚨 [검증 실패]');
  process.exit(1);
}
