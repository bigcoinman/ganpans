const fs = require('fs');
const sec = fs.readFileSync('security-utils.js', 'utf8');

// Extract mapDbToApp code or run it
const target = {
  id: 'P-260928-001',
  user_id: '01088884485',
  owner_name: '시진핑',
  phone: '01088884485',
  store_name: '시진핑반점',
  store_address: '경기도 여주시 여주읍 2674',
  sign_type: '간판지원신청',
  referrer_code: '',
  status: 'pending',
  assigned_constructor_id: null,
  assigned_constructor_name: null,
  construction_status: 'before_construction',
  memo: '{"isBizItem":false,"receiptStatus":"접수예정","progressStatus":"지원대기중","constructionStatus":"before_construction","salespersonId":"","salespersonName":"","referrerCode":"","photoCount":1}',
  applied_at: '2026-09-28T10:27:04.835+00:00',
  created_at: '2026-09-28T10:27:04.035843+00:00'
};

// Simulate mapDbToApp fallback in fetchAndRenderAdminApplicationsFresh:
const fallbackMapped = {
  id: target.id,
  userId: target.user_id,
  ownerName: target.owner_name,
  ownerPhone: target.phone,
  storeName: target.store_name,
  storeAddress: target.store_address,
  signType: target.sign_type,
  referrerCode: target.referrer_code,
  status: target.status || 'pending',
  assignedConstructorId: target.assigned_constructor_id,
  assignedConstructorName: target.assigned_constructor_name,
  constructionStatus: target.construction_status || 'before_construction',
  memo: target.memo,
  appliedAt: target.applied_at || target.created_at,
  createdAt: target.created_at
};
console.log('Fallback mapped:', fallbackMapped);

// Now test how renderAdminDashboardMob sorts it:
const apps = [fallbackMapped];
let sortedApps = [...apps].sort((a, b) => {
  const timeA = new Date(a.appliedAt || a.createdAt || a.created_at || 0).getTime();
  const timeB = new Date(b.appliedAt || b.createdAt || b.created_at || 0).getTime();
  if (timeB !== timeA && !isNaN(timeA) && !isNaN(timeB)) {
      return timeB - timeA;
  }
  return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true, sensitivity: 'base' });
});
console.log('Sorted apps length:', sortedApps.length);
console.log('First sorted app:', sortedApps[0].id, sortedApps[0].storeName);
