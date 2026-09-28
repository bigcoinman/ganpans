/**
 * ================================================================
 * [설계도-04] SSOT 완전 전환 후 5라운드 자체 검증 테스트
 * ================================================================
 * 목적: deleted_user_ids / deleted_app_ids 블랙리스트 완전 제거 후
 *       SSOT(Supabase 단일 진실의 원천) 방식이 3개 파일 전반에서
 *       올바르게 동작하는지 정적 코드 분석으로 5회 검증
 * 실행: node scratch/test_ssot_final_5rounds.js
 * ================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FILES = {
  dataStore: path.join(ROOT, 'data-store.js'),
  securityUtils: path.join(ROOT, 'security-utils.js'),
  appJs: path.join(ROOT, 'app.js'),
  indexHtml: path.join(ROOT, 'index.html'),
};

let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, label) {
  if (condition) {
    passCount++;
    results.push('  OK  ' + label);
  } else {
    failCount++;
    results.push('  FAIL ' + label);
  }
}

function readFile(key) {
  return fs.readFileSync(FILES[key], 'utf8');
}

console.log('');
console.log('== [설계도-04] SSOT 완전 전환 5라운드 자체 검증 테스트 ==');

// Round 1: 블랙리스트 쓰기 코드 완전 박멸
console.log('\n[Round 1] 블랙리스트 setItem 완전 박멸');
{
  const ds = readFile('dataStore');
  const su = readFile('securityUtils');
  const app = readFile('appJs');

  const dsBadApp = (ds.match(/localStorage\.setItem\(['"]deleted_app_ids/g) || []).length;
  const suBadApp = (su.match(/localStorage\.setItem\(['"]deleted_app_ids/g) || []).length;
  const appBadApp = (app.match(/localStorage\.setItem\(['"]deleted_app_ids/g) || []).length;
  assert(dsBadApp + suBadApp + appBadApp === 0, 'deleted_app_ids setItem 전무 (0건)');

  const dsBadUser = (ds.match(/localStorage\.setItem\(['"]deleted_user_ids/g) || []).length;
  const suBadUser = (su.match(/localStorage\.setItem\(['"]deleted_user_ids/g) || []).length;
  const appBadUser = (app.match(/localStorage\.setItem\(['"]deleted_user_ids/g) || []).length;
  assert(dsBadUser === 0, 'data-store.js: deleted_user_ids setItem 0건');
  assert(suBadUser === 0, 'security-utils.js: deleted_user_ids setItem 0건');
  assert(appBadUser === 0, 'app.js: deleted_user_ids setItem 0건');

  assert(!(/getDeletedAppIds\s*:\s*function/).test(ds), 'getDeletedAppIds 유령함수 정의 없음');
  assert(!(/getDeletedUserIds\s*:\s*function/).test(ds), 'getDeletedUserIds 유령함수 정의 없음');
  assert(!(/cleanseGhostApplications/).test(ds + su + app), 'cleanseGhostApplications 전무');
}

// Round 2: Supabase DB 삭제 단일 경로
console.log('\n[Round 2] 삭제 로직 Supabase SSOT 단일 경로');
{
  const su = readFile('securityUtils');
  const ds = readFile('dataStore');

  assert(/from\('applications'\)[\s\S]{0,100}\.delete\(\)/.test(su), 'deleteApplication Supabase .delete() 존재');
  assert(/from\('users'\)[\s\S]{0,100}\.delete\(\)/.test(su), 'deleteUser Supabase .delete() 존재');
  assert(/SupabaseSync\.deleteUser/.test(ds), 'data-store: SupabaseSync.deleteUser 위임');
}

// Round 3: UI 렌더링 블랙리스트 필터 제거
console.log('\n[Round 3] UI 렌더링 블랙리스트 필터 제거');
{
  const ds = readFile('dataStore');
  const su = readFile('securityUtils');

  const getUsersBlock = ds.match(/getUsers:\s*function[\s\S]{0,500}/)?.[0] || '';
  assert(!(/deleted_user_ids/.test(getUsersBlock)), 'getUsers(): deleted_user_ids 필터 없음');

  const freshUsersIdx = su.indexOf('const freshUsers = supaUsers');
  const freshUsersBlock = freshUsersIdx >= 0 ? su.slice(freshUsersIdx, freshUsersIdx + 400) : '';
  assert(!(/deleted_user_ids/.test(freshUsersBlock)), 'syncAllData freshUsers: deleted_user_ids 없음');

  assert(/role !== 'deleted'/.test(ds), 'data-store: role!==deleted 필터 유지');
  assert(/role !== 'deleted'/.test(su), 'security-utils: role!==deleted 필터 유지');
}

// Round 4: 진입 시 자동 정화 코드
console.log('\n[Round 4] 진입 시 잔여 localStorage 자동 정화');
{
  const ds = readFile('dataStore');
  const idx = readFile('indexHtml');
  const su = readFile('securityUtils');

  assert(/localStorage\.removeItem\('deleted_app_ids'\)/.test(ds), 'data-store: deleted_app_ids 자동 정화');
  assert(/localStorage\.removeItem\('deleted_app_ids'\)/.test(idx), 'index.html: deleted_app_ids 정화');
  assert(/junkKeys/.test(su) && /deleted_app_ids/.test(su), 'security-utils: junkKeys 배열 존재');
}

// Round 5: 비회원 신청서 저장 경로 무결성
console.log('\n[Round 5] 비회원 신청서 저장 경로 무결성');
{
  const su = readFile('securityUtils');

  assert(/async upsertApplication/.test(su), 'upsertApplication 함수 존재');
  assert(/user_id = null/.test(su), 'FK 오류 시 user_id=null 안전 재시도');
  assert(/upsert\(\[fullPayload\],\s*\{\s*onConflict:\s*'id'/.test(su), 'upsert onConflict:id 기반');

  const deleteAppIdx = su.indexOf('async deleteApplication');
  const deleteAppBlock = deleteAppIdx >= 0 ? su.slice(deleteAppIdx, deleteAppIdx + 500) : '';
  assert(!(/setItem.*deleted_app_ids/.test(deleteAppBlock)), 'deleteApplication: 블랙리스트 setItem 없음');
}

// 결과
console.log('\n=================================================');
console.log('최종 결과: ' + passCount + '/' + (passCount + failCount) + ' 통과');
console.log('=================================================');
results.forEach(r => console.log(r));
console.log('');

if (failCount === 0) {
  console.log('[전수 통과] SSOT 완전 전환 검증 100% 완료!');
  process.exit(0);
} else {
  console.log('[실패] ' + failCount + '건 미통과');
  process.exit(1);
}
