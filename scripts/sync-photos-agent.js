/**
 * scripts/sync-photos-agent.js
 * 
 * 최고관리자 대시보드 신청서 사진 자동 분류 다운로드 에이전트
 * - 대상 폴더: D:\1-경기경제과학진흥원\1- 2027년 간판지원단 신청업체 목록
 * - 영업자별 폴더 자동 생성: [영업자] 홍길동(B-260901)
 * - 취소 및 포기 업체 분기: [영업자] 홍길동(B-260901) / 흄흄흄흄 - 취소 & 포기 / 업체명_대표자 (신청번호)
 * - 정상 진행 업체: [영업자] 홍길동(B-260901) / 업체명_대표자 (신청번호)
 * - 중복 스마트 스킵 (Idempotent), 온디맨드 단일 사진 조회 (대역폭 보호)
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 오늘 날짜 문자열 반환 (YYYYMMDD)
function getTodayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

// 버퍼의 MD5 디지털 지문(해시) 계산
function getBufferHash(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}

// 폴더 내 기존 사진 파일들의 디지털 지문 및 최대 순번 스캔
function getExistingPhotoHashes(folderPath) {
  const hashSet = new Set();
  let maxIndex = 0;
  let fileCount = 0;
  if (!fs.existsSync(folderPath)) return { hashSet, maxIndex, fileCount };

  const files = fs.readdirSync(folderPath);
  for (const f of files) {
    const fullPath = path.join(folderPath, f);
    try {
      if (!fs.statSync(fullPath).isFile()) continue;
      const ext = path.extname(f).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) continue;

      fileCount++;
      const match = f.match(/_현장사진_(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxIndex) maxIndex = num;
      }

      const buf = fs.readFileSync(fullPath);
      if (buf.length > 0) {
        hashSet.add(getBufferHash(buf));
      }
    } catch (e) {}
  }
  return { hashSet, maxIndex, fileCount };
}

// 1. 스마트 드라이브 감지 및 기본 경로 설정
function resolveTargetRootDir() {
  if (process.env.GANPAN_TARGET_DIR) {
    return process.env.GANPAN_TARGET_DIR;
  }
  try {
    if (fs.existsSync('D:\\')) {
      return 'D:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록';
    }
  } catch (e) {}
  try {
    return 'C:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록';
  } catch (e) {}
  return path.join(process.env.USERPROFILE || process.env.HOME || '.', '간판지원단_신청업체_목록');
}

const TARGET_ROOT_DIR = resolveTargetRootDir();
const CANCELED_FOLDER_NAME = '흄흄흄흄 - 취소 & 포기';

// 2. Supabase 환경설정 로드
function loadSupabaseConfig() {
  const configPath = path.resolve(__dirname, '..', 'supabase-config.js');
  if (!fs.existsSync(configPath)) {
    throw new Error(`supabase-config.js 파일을 찾을 수 없습니다: ${configPath}`);
  }
  const content = fs.readFileSync(configPath, 'utf8');
  const urlMatch = content.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
  const keyMatch = content.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
  if (!urlMatch || !keyMatch) {
    throw new Error('supabase-config.js에서 URL 또는 ANON_KEY를 파싱할 수 없습니다.');
  }
  return { url: urlMatch[1], key: keyMatch[1] };
}

// 윈도우 파일/폴더명 안전 정제
function sanitizeFilename(name) {
  if (!name) return '미기재';
  return String(name).replace(/[\\/:*?"<>|]/g, '_').trim();
}

// REST API 호출 헬퍼
async function fetchSupabase(url, key, endpoint) {
  const resp = await fetch(`${url}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    }
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Supabase 요청 실패 (${resp.status}): ${errorText}`);
  }
  return await resp.json();
}

// 메인 에이전트 실행 함수
async function runSyncAgent() {
  const startTime = Date.now();
  console.log('===============================================================');
  console.log('   🚀 간판지원단 신청업체 사진 자동분류 다운로드 에이전트');
  console.log('===============================================================');
  console.log(`📁 저장 기준 경로: ${TARGET_ROOT_DIR}`);
  console.log(`🏷️ 취소/포기 격리 폴더명: ${CANCELED_FOLDER_NAME}`);
  console.log(`⏰ 실행 시작: ${new Date().toLocaleString('ko-KR')}\n`);

  // 루트 폴더 생성 보장
  if (!fs.existsSync(TARGET_ROOT_DIR)) {
    fs.mkdirSync(TARGET_ROOT_DIR, { recursive: true });
    console.log(`✅ 루트 폴더 생성 완료: ${TARGET_ROOT_DIR}`);
  }

  // 구 본사 분할 폴더들을 단일 [본사직접접수] 폴더로 자동 통합 마이그레이션
  const hqUnifiedDir = path.join(TARGET_ROOT_DIR, '[본사직접접수]');
  if (!fs.existsSync(hqUnifiedDir)) {
    fs.mkdirSync(hqUnifiedDir, { recursive: true });
  }
  const rootEntries = fs.readdirSync(TARGET_ROOT_DIR, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (entry.isDirectory() && (entry.name.includes('본사직접접수(P-') || entry.name === '[일반점주 접수]')) {
      const oldPath = path.join(TARGET_ROOT_DIR, entry.name);
      const subEntries = fs.readdirSync(oldPath);
      for (const sub of subEntries) {
        const srcPath = path.join(oldPath, sub);
        const destPath = path.join(hqUnifiedDir, sub);
        if (!fs.existsSync(destPath)) {
          fs.renameSync(srcPath, destPath);
        } else {
          // 이미 존재하면 하위 파일 덮어쓰기/병합
          try {
            fs.cpSync(srcPath, destPath, { recursive: true, force: true });
            fs.rmSync(srcPath, { recursive: true, force: true });
          } catch(e) {}
        }
      }
      try { fs.rmdirSync(oldPath); } catch(e) {}
      console.log(`🧹 구 분할 폴더 통합 완료: ${entry.name} ➔ [본사직접접수]`);
    }
  }

  const { url, key } = loadSupabaseConfig();

  // Step 1: 영업자 명부 로드 (users 테이블)
  console.log('🔍 [1/3] 영업자 명부 및 회원 데이터 로드 중...');
  const users = await fetchSupabase(url, key, 'users?select=id,name,role,biz_code');
  const salesMapByCode = {};
  const salesMapById = {};

  users.forEach(u => {
    if (u.biz_code) {
      salesMapByCode[u.biz_code.trim()] = u.name;
    }
    if (u.id) {
      salesMapById[u.id.trim()] = { name: u.name, biz_code: u.biz_code };
    }
  });

  // Step 2: 신청서 메타데이터 조회 (대역폭 보호: 사진 컬럼 제외)
  console.log('📋 [2/3] 신청서 목록 메타데이터 조회 중...');
  const appColumns = 'id,user_id,owner_name,phone,store_name,store_address,sign_type,referrer_code,status,assigned_constructor_name,construction_status,memo,applied_at,created_at';
  const applications = await fetchSupabase(url, key, `applications?select=${appColumns}&order=created_at.asc`);
  console.log(`📊 총 ${applications.length}건의 신청서가 접수되어 있습니다.\n`);

  // Step 3: 업체별 폴더 생성 및 사진 온디맨드 다운로드
  console.log('📂 [3/3] 영업자별 폴더 분류 및 사진 다운로드 동기화 시작...');
  console.log('---------------------------------------------------------------');

  let stats = {
    totalApps: applications.length,
    normalApps: 0,
    canceledApps: 0,
    downloadedPhotos: 0,
    skippedPhotos: 0,
    noPhotoApps: 0
  };

  for (let i = 0; i < applications.length; i++) {
    const app = applications[i];
    const progressPrefix = `[${String(i + 1).padStart(2, '0')}/${applications.length}]`;

    // 1) memo 파싱
    let memoObj = {};
    if (app.memo) {
      try {
        memoObj = typeof app.memo === 'string' ? JSON.parse(app.memo) : app.memo;
      } catch (e) {
        memoObj = {};
      }
    }

    // 2) 담당 영업자 식별
    let salesCode = memoObj.referrerCode || app.referrer_code || '';
    let salesName = memoObj.salespersonName || '';

    if (!salesCode && app.id && app.id.includes('-')) {
      const parts = app.id.split('-');
      if (parts.length >= 2) {
        salesCode = `${parts[0]}-${parts[1]}`;
      }
    }

    if (!salesName && salesCode && salesMapByCode[salesCode]) {
      salesName = salesMapByCode[salesCode];
    } else if (!salesName && app.user_id && salesMapById[app.user_id]) {
      salesName = salesMapById[app.user_id].name;
      salesCode = salesCode || salesMapById[app.user_id].biz_code;
    }

    // 영업자 폴더명 결정: 정식 영업자(B-코드)만 [영업자] 이름(코드), 그 외(P-코드, 본사, 일반)는 [본사직접접수] 단 1개로 통일
    let salesFolder;
    const isRegularSales = salesCode && salesCode.toUpperCase().startsWith('B-');
    if (isRegularSales) {
      const cleanName = salesName ? sanitizeFilename(salesName) : '영업자';
      salesFolder = path.join(TARGET_ROOT_DIR, `[영업자] ${cleanName}(${sanitizeFilename(salesCode)})`);
    } else {
      salesFolder = path.join(TARGET_ROOT_DIR, `[본사직접접수]`);
    }

    // 3) 취소 & 포기 여부 판별
    const isCanceled = (
      app.status === 'canceled' ||
      app.status === 'rejected' ||
      memoObj.progressStatus === '포기' ||
      memoObj.receiptStatus === '포기' ||
      memoObj.receiptStatus === '취소'
    );

    // 타깃 상위 폴더 (취소/포기 업체는 '흄흄흄흄 - 취소 & 포기' 격리 폴더로 이동)
    let parentFolder;
    if (isCanceled) {
      parentFolder = path.join(salesFolder, CANCELED_FOLDER_NAME);
      stats.canceledApps++;
    } else {
      parentFolder = salesFolder;
      stats.normalApps++;
    }

    // 4) 업체 전용 폴더명 생성: 상호명_대표자 (신청번호)
    const cleanStoreName = sanitizeFilename(app.store_name || '무명업체');
    const cleanOwnerName = sanitizeFilename(app.owner_name || '대표자미기재');
    const cleanAppId = sanitizeFilename(app.id || 'NO_ID');
    const storeFolderName = `${cleanStoreName}_${cleanOwnerName} (${cleanAppId})`;
    const storeFolderPath = path.join(parentFolder, storeFolderName);

    // 폴더 생성
    if (!fs.existsSync(storeFolderPath)) {
      fs.mkdirSync(storeFolderPath, { recursive: true });
    }

    // 5) 신청정보요약.txt 생성/최신화
    const summaryText = [
      `==================================================`,
      `  간판지원단 신청업체 상세 정보 요약`,
      `==================================================`,
      `■ 신청번호: ${app.id || '-'}`,
      `■ 상 호 명: ${app.store_name || '-'}`,
      `■ 대 표 자: ${app.owner_name || '-'}`,
      `■ 연 락 처: ${app.phone || '-'}`,
      `■ 사업장 주소: ${app.store_address || '-'}`,
      `■ 간판 종류: ${app.sign_type || '-'}`,
      `■ 접수 일시: ${app.applied_at || app.created_at || '-'}`,
      `■ 심사 상태: ${app.status || '대기'} ${isCanceled ? '★[취소/포기]' : ''}`,
      `■ 진행 상태: ${memoObj.progressStatus || '-'}`,
      `■ 접수 상태: ${memoObj.receiptStatus || '-'}`,
      `■ 담당 영업자: ${salesName || '미지정'} (${salesCode || '-'})`,
      `■ 배정 시공사: ${app.assigned_constructor_name || '미배정'}`,
      `■ 특이사항(메모): ${typeof app.memo === 'string' ? app.memo : JSON.stringify(app.memo || '')}`,
      `--------------------------------------------------`,
      `동기화 일시: ${new Date().toLocaleString('ko-KR')}`,
      `==================================================`
    ].join('\r\n');
    fs.writeFileSync(path.join(storeFolderPath, '신청정보요약.txt'), '\uFEFF' + summaryText, 'utf8');

    // 6) 사진 온디맨드 단일 조회
    const photoData = await fetchSupabase(url, key, `applications?select=id,image_url&id=eq.${encodeURIComponent(app.id)}`);
    const targetRow = photoData[0] || {};
    const rawImage = targetRow.image_url;

    let photoList = [];
    if (rawImage) {
      if (rawImage.startsWith('[')) {
        try {
          const parsed = JSON.parse(rawImage);
          if (Array.isArray(parsed)) {
            photoList = parsed.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http')));
          }
        } catch (e) {
          photoList = [rawImage];
        }
      } else if (rawImage.startsWith('data:') || rawImage.startsWith('http')) {
        photoList = [rawImage];
      }
    }

    if (photoList.length === 0) {
      stats.noPhotoApps++;
      console.log(`${progressPrefix} ${isCanceled ? '🚫[취소&포기]' : '📁'} ${cleanStoreName} (${cleanAppId}) | 사진 없음 (요약문서 저장)`);
      continue;
    }

    let downloadedCount = 0;
    let skippedCount = 0;
    const todayStr = getTodayString();

    // 해당 업체 폴더 내 기존 사진들의 디지털 지문(해시) 및 최대 순번 스캔
    let { hashSet: existingHashSet, maxIndex: currentMaxIndex, fileCount: existingCount } = getExistingPhotoHashes(storeFolderPath);

    for (let pIdx = 0; pIdx < photoList.length; pIdx++) {
      const photoItem = photoList[pIdx];
      let photoBuffer = null;
      let ext = 'jpg';

      if (photoItem.startsWith('data:image/')) {
        if (photoItem.startsWith('data:image/png')) ext = 'png';
        else if (photoItem.startsWith('data:image/webp')) ext = 'webp';
        else if (photoItem.startsWith('data:image/gif')) ext = 'gif';

        const base64Index = photoItem.indexOf(';base64,');
        if (base64Index !== -1) {
          const base64String = photoItem.substring(base64Index + 8);
          photoBuffer = Buffer.from(base64String, 'base64');
        }
      } else if (photoItem.startsWith('http')) {
        try {
          const imgResp = await fetch(photoItem);
          if (imgResp.ok) {
            const arrayBuffer = await imgResp.arrayBuffer();
            photoBuffer = Buffer.from(arrayBuffer);
            const lowerUrl = photoItem.toLowerCase();
            if (lowerUrl.includes('.png')) ext = 'png';
            else if (lowerUrl.includes('.webp')) ext = 'webp';
            else if (lowerUrl.includes('.gif')) ext = 'gif';
          }
        } catch (err) {
          console.error(`    ⚠️ 사진 URL 다운로드 실패 (${photoItem}): ${err.message}`);
        }
      }

      if (!photoBuffer || photoBuffer.length === 0) continue;

      // 디지털 지문(MD5 해시) 계산
      const photoHash = getBufferHash(photoBuffer);

      // 이미 내용(지문)이 100% 동일한 사진이 폴더에 있다면 스킵!
      if (existingHashSet.has(photoHash)) {
        skippedCount++;
        stats.skippedPhotos++;
        continue;
      }

      // [옵션 2 적용] 새로운 사진/교체된 사진인 경우: 기존 사진은 절대 덮어쓰지 않고 추가 보관
      let photoFileName;
      if (existingCount === 0) {
        // 최초 등록 시: 기본 넘버링 (현장사진_01.jpg, 02.jpg ...)
        currentMaxIndex++;
        photoFileName = `${cleanStoreName}_현장사진_${String(currentMaxIndex).padStart(2, '0')}.${ext}`;
      } else {
        // 기존 사진이 이미 있는 상태에서 추가/교체된 경우: 옵션 2 날짜 표기 포맷
        currentMaxIndex++;
        photoFileName = `${cleanStoreName}_현장사진_${String(currentMaxIndex).padStart(2, '0')}_추가_${todayStr}.${ext}`;
        let collisionIdx = 1;
        while (fs.existsSync(path.join(storeFolderPath, photoFileName))) {
          photoFileName = `${cleanStoreName}_현장사진_${String(currentMaxIndex).padStart(2, '0')}_추가_${todayStr}_${collisionIdx}.${ext}`;
          collisionIdx++;
        }
      }

      const photoFilePath = path.join(storeFolderPath, photoFileName);
      fs.writeFileSync(photoFilePath, photoBuffer);
      existingHashSet.add(photoHash);
      existingCount++;
      downloadedCount++;
      stats.downloadedPhotos++;
    }

    const statusTag = isCanceled ? '🚫 [취소&포기]' : '✅ [정상접수]';
    const detailMsg = downloadedCount > 0 
      ? `신규 ${downloadedCount}장 다운로드 완료${skippedCount > 0 ? ` (${skippedCount}장 스킵)` : ''}`
      : `전체 ${skippedCount}장 이미 최신 (스킵)`;

    console.log(`${progressPrefix} ${statusTag} ${cleanStoreName} (${cleanAppId}) ➔ ${detailMsg}`);
  }

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('===============================================================');
  console.log('   🎉 동기화 다운로드 작업이 성공적으로 완료되었습니다!');
  console.log('===============================================================');
  console.log(`⏱️ 총 소요 시간: ${durationSec}초`);
  console.log(`🏢 총 신청업체: ${stats.totalApps}개소 (정상: ${stats.normalApps}개소, 취소&포기: ${stats.canceledApps}개소)`);
  console.log(`📸 사진 다운로드 통계: 신규 다운로드 ${stats.downloadedPhotos}장 / 이미 존재(스킵) ${stats.skippedPhotos}장`);
  console.log(`📁 최종 저장 위치: ${TARGET_ROOT_DIR}`);
  console.log('===============================================================\n');

  return stats;
}

if (require.main === module) {
  runSyncAgent().catch(err => {
    console.error('❌ 동기화 에이전트 실행 중 오류 발생:', err);
    process.exit(1);
  });
}

module.exports = { runSyncAgent };
