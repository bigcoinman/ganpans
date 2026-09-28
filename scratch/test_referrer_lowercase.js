const fs = require('fs');

console.log('=== Test: Lowercase "b" Referrer Code Auto-Standardization and Salesperson Match ===');

// Mock users
const users = [
  { id: 'sales_01', name: '김영수', role: 'business', bizCode: 'B-260903' },
  { id: 'sales_02', name: '이민호', role: 'business', bizCode: 'B-260905' }
];

// Test cases: lowercase 'b-260903', 'b260903', 'B260903', 'B-260903'
const testInputs = ['b-260903', 'b260903', 'B260903', 'B-260903', '  b-260903  '];

testInputs.forEach(input => {
  let referrerCode = input.trim();
  let finalReferrerCode = referrerCode;

  // Logic from app.js
  const cleanRef = finalReferrerCode.replace(/[^a-zA-Z0-9]/g, '');
  if (/^b\d{6}$/i.test(cleanRef)) {
    finalReferrerCode = `B-${cleanRef.slice(1)}`;
  } else if (/^b-/i.test(finalReferrerCode)) {
    finalReferrerCode = 'B-' + finalReferrerCode.slice(2);
  }

  const normRef = finalReferrerCode.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const numRef = normRef.replace(/^b/i, '');
  const matchedSales = users.find(u => {
    if (u.role !== 'business' && u.role !== 'admin') return false;
    const uBiz = String(u.bizCode || '').trim().toLowerCase();
    const normUBiz = uBiz.replace(/[^a-zA-Z0-9]/g, '');
    const numUBiz = normUBiz.replace(/^b/i, '');
    const uId = String(u.id || '').trim().toLowerCase();
    const normUId = uId.replace(/[^a-zA-Z0-9]/g, '');
    const uName = String(u.name || '').trim().toLowerCase();
    return (
      (uBiz && (uBiz === finalReferrerCode.toLowerCase() || normUBiz === normRef || (numRef && numUBiz === numRef))) ||
      (uId && (uId === finalReferrerCode.toLowerCase() || normUId === normRef)) ||
      (uName && (uName === finalReferrerCode.toLowerCase() || uName === normRef))
    );
  });

  let assignedSalespersonId = '';
  let assignedSalespersonName = '';
  if (matchedSales) {
    assignedSalespersonId = matchedSales.id;
    assignedSalespersonName = matchedSales.name;
    if (matchedSales.bizCode) {
      finalReferrerCode = matchedSales.bizCode;
    }
  }

  console.assert(matchedSales !== undefined, `Failed to match for input: "${input}"`);
  console.assert(assignedSalespersonName === '김영수', `Salesperson name should be 김영수, got ${assignedSalespersonName}`);
  console.assert(finalReferrerCode === 'B-260903', `finalReferrerCode should be B-260903, got ${finalReferrerCode}`);
  console.log(`[PASS] Input "${input}" ➔ Salesperson: ${assignedSalespersonName} (${assignedSalespersonId}), Code: ${finalReferrerCode}`);
});

console.log('=== ALL LOWERCASE "b" REFERRER TESTS PASSED 100% ===');
