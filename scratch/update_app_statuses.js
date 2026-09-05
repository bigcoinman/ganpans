const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

const oldChunk1 = `            if (status === 'approved' || status === '서류제출 & 접수예정' || status === '승인 완료') return '승인 완료';
            if (status === 'rejected' || status === '지원사업 탈락' || status === '반려됨' || status === '지원사업탈락') return '지원사업 탈락';
            if (status === 'giveup' || status === '지원사업 포기' || status === '지원사업포기') return '지원사업 포기';
            return '심사대기중';`;

const newChunk1 = `            if (status === 'approved' || status === '서류준비 & 접수대기' || status === '서류제출 & 접수예정' || status === '승인 완료') return '서류준비 & 접수대기';
            if (status === 'unqualified' || status === '신청요건 미달업체') return '신청요건 미달업체';
            if (status === 'rejected' || status === '지원사업 탈락' || status === '반려됨' || status === '지원사업탈락') return '지원사업 탈락';
            if (status === 'giveup' || status === '지원사업 포기' || status === '지원사업포기') return '지원사업 포기';
            return '사업시행 전 사전등록업체';`;

const oldChunk2 = `        const rows = sortedApps.map((a, idx) => {
            let statusText = '심사대기중';
            if (a.status === 'approved' || a.status === '서류제출 & 접수예정') statusText = '서류제출 & 접수예정';
            else if (a.status === 'rejected' || a.status === '지원사업 탈락') statusText = '지원사업 탈락';
            else if (a.status === 'giveup' || a.status === '지원사업 포기') statusText = '지원사업 포기';`;

const newChunk2 = `        const rows = sortedApps.map((a, idx) => {
            let statusText = '사업시행 전 사전등록업체';
            if (a.status === 'approved' || a.status === '서류준비 & 접수대기' || a.status === '서류제출 & 접수예정' || a.status === '승인 완료') statusText = '서류준비 & 접수대기';
            else if (a.status === 'unqualified' || a.status === '신청요건 미달업체') statusText = '신청요건 미달업체';
            else if (a.status === 'rejected' || a.status === '지원사업 탈락') statusText = '지원사업 탈락';
            else if (a.status === 'giveup' || a.status === '지원사업 포기') statusText = '지원사업 포기';`;

const normalize = (s) => s.replace(/\r\n/g, '\n');

let norm = normalize(appJs);
if (norm.includes(normalize(oldChunk1))) {
    norm = norm.replace(normalize(oldChunk1), normalize(newChunk1));
    console.log('✅ Chunk 1 replaced');
}
if (norm.includes(normalize(oldChunk2))) {
    norm = norm.replace(normalize(oldChunk2), normalize(newChunk2));
    console.log('✅ Chunk 2 replaced');
}

fs.writeFileSync('app.js', norm.replace(/\n/g, '\r\n'), 'utf8');
console.log('All done!');
