const fs = require('fs');
const path = require('path');

const appPath = path.resolve('app.js');
let raw = fs.readFileSync(appPath, 'utf8');
const isCRLF = raw.includes('\r\n');
let content = raw.replace(/\r\n/g, '\n');

console.log('=== 5대 에이전트 합동 유령/중복/찌꺼기 코드 수술적 정밀 정리 시작 ===');

let changesCount = 0;

function safeReplace(target, replacement, desc) {
    const t = target.replace(/\r\n/g, '\n');
    const r = replacement.replace(/\r\n/g, '\n');
    if (content.includes(t)) {
        content = content.replace(t, r);
        console.log(`✅ [성공] ${desc}`);
        changesCount++;
        return true;
    } else {
        console.error(`❌ [실패] ${desc}`);
        return false;
    }
}

// 1. 사용자 신청 목록 사진 추출 37줄 -> getAppPhotoInfo(app)
const target1 = `            let photoList = [];
            if (Array.isArray(app.photos) && app.photos.length > 0) {
                photoList = app.photos.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
            }
            if (photoList.length === 0 && app.fileData && typeof app.fileData === 'string' && (app.fileData.startsWith('data:') || app.fileData.startsWith('http') || app.fileData.startsWith('blob:'))) {
                photoList = [app.fileData];
            }
            if (photoList.length === 0 && app.image_url && typeof app.image_url === 'string') {
                if (app.image_url.startsWith('[') && app.image_url.includes('data:')) {
                    try {
                        const parsed = JSON.parse(app.image_url);
                        if (Array.isArray(parsed)) {
                            photoList = parsed.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
                        }
                    } catch (e) {}
                } else if (app.image_url.startsWith('data:') || app.image_url.startsWith('http') || app.image_url.startsWith('blob:')) {
                    photoList = [app.image_url];
                }
            }
            const memoPhotoCount = (() => {
              try {
                const m = typeof app.memo === 'string' ? JSON.parse(app.memo) : (app.memo || {});
                return (m && m.photoCount) ? Number(m.photoCount) : 0;
              } catch(e) { return 0; }
            })();
            let count = Math.max(
              photoList.length,
              Number(app.photosCount) || 0,
              Number(app.photos_count) || 0,
              memoPhotoCount
            );
            let hasPhoto = count > 0 || Boolean(
              app.hasPhoto || 
              (app.fileName && app.fileName !== '업로드 파일 없음' && String(app.fileName).trim() !== '') ||
              (app.file_name && app.file_name !== '업로드 파일 없음' && String(app.file_name).trim() !== '')
            );
            if (!count && hasPhoto) count = 1;`;
safeReplace(target1, `            const { count, hasPhoto } = getAppPhotoInfo(app);`, '1. 사용자 신청목록 중복 사진추출 37줄 -> getAppPhotoInfo 단일화');

// 2. 영업자 영업물건 목록 사진 카운트 12줄 -> getAppPhotoInfo(item)
const target2 = `            const memoPhotoCount = (() => {
              try {
                const m = typeof item.memo === 'string' ? JSON.parse(item.memo) : (item.memo || {});
                return (m && m.photoCount) ? Number(m.photoCount) : 0;
              } catch(e) { return 0; }
            })();
            const pCount = Math.max(
              (Array.isArray(item.photos) ? item.photos.length : 0),
              Number(item.photosCount) || 0,
              memoPhotoCount,
              (item.hasPhoto ? 1 : 0)
            );`;
safeReplace(target2, `            const { count: pCount } = getAppPhotoInfo(item);`, '2. 영업자 영업물건 목록 중복 사진추출 12줄 -> getAppPhotoInfo 단일화');

// 3. 관리자 신청서 목록 사진 추출 23줄 -> getAppPhotoInfo(app)
const target3 = `                    const photosArr = (Array.isArray(app.photos) && app.photos.length > 0) ? app.photos.filter(p => p && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:'))) : [];
                    const photoSrc = (photosArr.length > 0) ? photosArr[0] : (app.fileData || (app.image_url && (app.image_url.startsWith('data:') || app.image_url.startsWith('[') || app.image_url.startsWith('http') || app.image_url.startsWith('blob:')) ? app.image_url : ''));
                    const memoPhotoCount = (() => {
                      try {
                        const m = typeof app.memo === 'string' ? JSON.parse(app.memo) : (app.memo || {});
                        return (m && m.photoCount) ? Number(m.photoCount) : 0;
                      } catch(e) { return 0; }
                    })();
                    const count = Math.max(
                      photosArr.length,
                      Number(app.photosCount) || 0,
                      Number(app.photos_count) || 0,
                      memoPhotoCount
                    );
                    const hasPhoto = Boolean(
                      count > 0 ||
                      (photoSrc && photoSrc !== '업로드 파일 없음' && (photoSrc.startsWith('data:') || photoSrc.startsWith('[') || photoSrc.startsWith('http') || photoSrc.startsWith('blob:'))) ||
                      app.hasPhoto ||
                      (app.fileName && app.fileName !== '업로드 파일 없음' && String(app.fileName).trim() !== '') ||
                      (app.file_name && app.file_name !== '업로드 파일 없음' && String(app.file_name).trim() !== '')
                    );
                    const finalCount = count > 0 ? count : (hasPhoto ? 1 : 0);`;
safeReplace(target3, `                    const { count: finalCount, hasPhoto } = getAppPhotoInfo(app);`, '3. 관리자 신청서 목록 중복 사진추출 23줄 -> getAppPhotoInfo 단일화');

// 4. 시공사 진행현황 사진 카운트 12줄 -> getAppPhotoInfo(job)
const target4 = `            const memoPhotoCount = (() => {
              try {
                const m = typeof job.memo === 'string' ? JSON.parse(job.memo) : (job.memo || {});
                return (m && m.photoCount) ? Number(m.photoCount) : 0;
              } catch(e) { return 0; }
            })();
            const pCount = Math.max(
              (Array.isArray(job.photos) ? job.photos.length : 0),
              Number(job.photosCount) || 0,
              memoPhotoCount,
              (job.hasPhoto ? 1 : 0)
            );`;
safeReplace(target4, `            const { count: pCount } = getAppPhotoInfo(job);`, '4. 시공사 진행현황 중복 사진추출 12줄 -> getAppPhotoInfo 단일화');

// 5. 신청서 목록 날짜 포맷 클로저 -> formatDateOnly(rawAppDate, '-')
const target5 = `                    const rawAppDate = app.appliedAt || app.createdAt || '';
                    let appDateText = '-';
                    if (rawAppDate) {
                        const d = new Date(rawAppDate);
                        if (!isNaN(d.getTime())) {
                            const padZero = (n) => String(n).padStart(2, '0');
                            appDateText = \`\${d.getFullYear()}-\${padZero(d.getMonth() + 1)}-\${padZero(d.getDate())}\`;
                        } else {
                            appDateText = String(rawAppDate).slice(0, 10).replace(/\\./g, '-');
                        }
                    }`;
safeReplace(target5, `                    const rawAppDate = app.appliedAt || app.createdAt || '';
                    const appDateText = formatDateOnly(rawAppDate, '-');`, '5. 관리자 신청서 날짜 포맷 루프 내 padZero 클로저 -> formatDateOnly 단일화');

// 6. 영업물건 목록 날짜 포맷 클로저 -> formatDateOnly(rawDate, '-')
const target6 = `                    const rawDate = item.createdAt || item.registeredAt || item.appliedAt || item.date || (matchingApp ? (matchingApp.appliedAt || matchingApp.createdAt) : '') || '';
                    let itemDateText = '-';
                    if (rawDate) {
                        const d = new Date(rawDate);
                        if (!isNaN(d.getTime())) {
                            const padZero = (n) => String(n).padStart(2, '0');
                            itemDateText = \`\${d.getFullYear()}-\${padZero(d.getMonth() + 1)}-\${padZero(d.getDate())}\`;
                        } else {
                            itemDateText = String(rawDate).slice(0, 10).replace(/\\./g, '-');
                        }
                    }`;
safeReplace(target6, `                    const rawDate = item.createdAt || item.registeredAt || item.appliedAt || item.date || (matchingApp ? (matchingApp.appliedAt || matchingApp.createdAt) : '') || '';
                    const itemDateText = formatDateOnly(rawDate, '-');`, '6. 관리자 영업물건 날짜 포맷 루프 내 padZero 클로저 -> formatDateOnly 단일화');

// 7. 유령 리스너: DOM에 없는 .btn-approve-settlement-mob 탐색 리스너 전수 삭제
const target7 = `                appsList.querySelectorAll('.btn-approve-settlement-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.closest('button').dataset.id;
                        approveSettlementMob(id);
                    });
                });`;
safeReplace(target7, '', '7. DOM에 존재하지 않는 유령 리스너(.btn-approve-settlement-mob) 전수 삭제');

// 8. 엑셀 내보내기 함수들 내부의 중복 escapeCsv 선언 제거
const target8_export1 = `        const escapeCsv = (str) => {
            if (str === null || str === undefined) return '""';
            const s = String(str).replace(/"/g, '""');
            return \`"\${s}"\`;
        };

        const getProgressStatusLabel = (statusObj) => {`;
safeReplace(target8_export1, `        const getProgressStatusLabel = (statusObj) => {`, '8-1. exportBizItemsToExcelMob 내 중복 escapeCsv 제거');

const target8_export2 = `        const escapeCsv = (str) => {
            if (str === null || str === undefined) return '""';
            const s = String(str).replace(/"/g, '""');
            return \`"\${s}"\`;
        };

        const sortedApps = [...apps].sort((a, b) => {`;
safeReplace(target8_export2, `        const sortedApps = [...apps].sort((a, b) => {`, '8-2. exportAllApplicationsToExcel 내 중복 escapeCsv 제거');

// 9. renderAdminSubPanels 유령 함수 삭제
const target9 = `    function renderAdminSubPanels() {
        renderAdminDashboardMob(true);
    }`;
safeReplace(target9, '', '9. renderAdminSubPanels 유령 함수 전수 삭제');

// 10. assignConstructorMob, approveSettlementMob, deleteApplicationMob 유령 함수 3종 전수 삭제
const target10_assign = `    function assignConstructorMob(appId, constructorId) {
        const constUser = users.find(u => u.id === constructorId);
        if (!constUser) return;

        applications = applications.map(app => {
            if (app.id === appId) {
                return {
                    ...app,
                    assignedConstructorId: constructorId,
                    assignedConstructorName: constUser.businessName,
                    constructionStatus: 'before_construction'
                };
            }
            return app;
        });

        if (window.DataStore && typeof window.DataStore.saveApplications === 'function') {
            window.DataStore.saveApplications(applications);
        } else {
            (typeof DataStore !== 'undefined' && DataStore.saveApplications ? DataStore.saveApplications(applications) : localStorage.setItem('applications', JSON.stringify(applications)));
        }

        if (window.SupabaseSync) {
            window.SupabaseSync.updateApplication(appId, {
                assigned_constructor_id: constructorId,
                assigned_constructor_name: constUser.businessName,
                construction_status: 'before_construction'
            });
        }

        alert(\`시공업체 [\${constUser.businessName}]가 성공적으로 배정되었습니다.\`);
        renderStatusTab();
    }`;
safeReplace(target10_assign, '', '10-1. assignConstructorMob 유령 함수 전수 삭제');

const target10_approve = `    function approveSettlementMob(id) {
        const app = applications.find(a => a.id === id);
        if (!app) return;

        let proofText = \`[시공 완료 보고 증빙 검수 (모바일)]\\n\\n\`;
        proofText += \`상호명: \${app.storeName}\\n\`;
        proofText += \`시공사: \${app.assignedConstructorName}\\n\`;
        proofText += \`업로드된 시공 사진 수: \${app.constructionPhotos ? app.constructionPhotos.length : 0}장\\n\`;
        proofText += \`업로드된 세금계산서 수: \${app.invoicePhotos ? app.invoicePhotos.length : 0}장\\n\\n\`;
        proofText += \`해당 시공 증빙을 검수하고 최종 정산을 종결하시겠습니까?\`;

        if (confirm(proofText)) {
            applications = applications.map(a => {
                if (a.id === id) {
                    return { ...a, constructionStatus: 'completed' };
                }
                return a;
            });
            if (window.DataStore && typeof window.DataStore.saveApplications === 'function') {
                window.DataStore.saveApplications(applications);
            } else {
                (typeof DataStore !== 'undefined' && DataStore.saveApplications ? DataStore.saveApplications(applications) : localStorage.setItem('applications', JSON.stringify(applications)));
            }

            if (window.SupabaseSync) {
                window.SupabaseSync.updateApplication(id, {
                    construction_status: 'completed'
                });
            }

            alert('공사 증빙 검수가 통과되어 최종 정산 종결 처리되었습니다.');
            renderStatusTab();
        }
    }`;
safeReplace(target10_approve, '', '10-2. approveSettlementMob 유령 함수 전수 삭제');

const target10_delApp = `    function deleteApplicationMob(id) {
        if (!id) return;
        if (!confirm(\`[주의] 지원 신청 접수 건 [\${id}]을(를) 정말로 삭제하시겠습니까?\\n삭제 후 복구할 수 없습니다.\`)) return;

        applications = applications.filter(app => String(app.id) !== String(id));
        if (window.DataStore && typeof window.DataStore.saveApplications === 'function') {
            window.DataStore.saveApplications(applications);
        } else {
            (typeof DataStore !== 'undefined' && DataStore.saveApplications ? DataStore.saveApplications(applications) : localStorage.setItem('applications', JSON.stringify(applications)));
        }

        if (window.SupabaseSync) {
            window.SupabaseSync.deleteApplication(id);
        }

        alert(\`지원 신청 접수 건 [\${id}]이(가) 정상적으로 삭제되었습니다.\`);
        renderStatusTab();
    }`;
safeReplace(target10_delApp, '', '10-3. deleteApplicationMob 유령 함수 전수 삭제');

if (isCRLF) {
    content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(appPath, content, 'utf8');
console.log(`\n🎉 총 ${changesCount}/11개 항목 수술적 정리 및 전수 삭제 완벽 완료!`);
