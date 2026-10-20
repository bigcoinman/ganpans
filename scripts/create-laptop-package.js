const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist', '간판지원단_노트북_동기화팩');
const scriptsDistDir = path.join(distDir, 'scripts');

if (!fs.existsSync(scriptsDistDir)) {
  fs.mkdirSync(scriptsDistDir, { recursive: true });
}

// 1. 노트북용 ▶_간판사진_자동동기화_실행.bat
const laptopSyncBat = [
  '@echo off',
  'chcp 65001 > nul',
  'title [간판지원단] 노트북 간판사진 자동동기화 다운로더',
  'color 0B',
  'echo.',
  'echo ===============================================================',
  'echo    [간판지원단] 노트북 간판사진 자동동기화 다운로더 가동',
  'echo ===============================================================',
  'echo.',
  'echo [1단계] 시스템 필수 환경(Node.js) 검사 중...',
  'where node > nul 2>&1',
  'if errorlevel 1 (',
  '    color 0C',
  '    echo.',
  '    echo ===============================================================',
  '    echo  ⚠️ [안내] 노트북에 Node.js 프로그램이 설치되어 있지 않습니다.',
  '    echo ===============================================================',
  '    echo.',
  '    echo  동기화 에이전트를 구동하려면 Node.js (무료/1분 설치)가 필요합니다.',
  '    echo  엔터 키를 누르시면 공식 다운로드 사이트가 즉시 열립니다.',
  '    echo.',
  '    pause',
  '    start https://nodejs.org/ko/download/',
  '    exit /b 1',
  ')',
  '',
  'echo    ✅ Node.js 환경이 정상 확인되었습니다.',
  'echo.',
  'echo [2단계] Supabase 클라우드 실시간 접속 및 사진 동기화 시작...',
  'echo.',
  'cd /d "%~dp0"',
  'node scripts\\sync-photos-agent.js',
  'set SYNC_STATUS=%errorlevel%',
  'echo.',
  'if %SYNC_STATUS% equ 0 (',
  '    color 0A',
  '    echo ===============================================================',
  '    echo   🎉 노트북 사진 동기화 다운로드가 성공적으로 완료되었습니다!',
  '    echo ===============================================================',
  '    echo.',
  '    echo  다운로드된 폴더를 지금 바로 탐색기로 열어보시겠습니까?',
  '    echo  (Y: 지금 열기 / N: 창 닫기)',
  '    set /p OPEN_CHOICE="  선택 [Y/N]: "',
  '    if /i "%OPEN_CHOICE%"=="Y" (',
  '        if exist "E:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록" (',
  '            explorer "E:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록"',
  '        ) else if exist "D:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록" (',
  '            explorer "D:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록"',
  '        ) else if exist "C:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록" (',
  '            explorer "C:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록"',
  '        ) else (',
  '            explorer "%USERPROFILE%\\간판지원단_신청업체_목록"',
  '        )',
  '    )',
  ') else (',
  '    color 0C',
  '    echo [오류] 다운로드 중 문제가 발생했습니다. 인터넷 연결을 확인해 주세요.',
  ')',
  'echo.',
  'echo 창을 닫으려면 아무 키나 누르세요...',
  'pause > nul'
].join('\r\n') + '\r\n';

// 2. 노트북용 ▶_실시간_사진동기화_실행.bat
const laptopRealtimeBat = [
  '@echo off',
  'chcp 65001 > nul',
  'title [간판지원단] 노트북 초경량 실시간 사진동기화 모니터링',
  'color 0A',
  'echo.',
  'echo ===============================================================',
  'echo   [간판지원단] 노트북 실시간 감시 에이전트 가동 (종료: 창 닫기)',
  'echo ===============================================================',
  'echo.',
  'where node > nul 2>&1',
  'if errorlevel 1 (',
  '    color 0C',
  '    echo [안내] Node.js가 필요합니다. https://nodejs.org 에서 설치해 주세요.',
  '    pause',
  '    exit /b 1',
  ')',
  'cd /d "%~dp0"',
  'node scripts\\realtime-photos-agent.js',
  'pause'
].join('\r\n') + '\r\n';

// 3. 노트북용 ⏹️_실시간_사진동기화_종료.bat
const laptopStopBat = [
  '@echo off',
  'chcp 65001 > nul',
  'title [간판지원단] 실시간 에이전트 종료',
  'color 0C',
  'echo.',
  'powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like \'*realtime-photos-agent.js*\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host \'에이전트 프로세스(PID:\' $_.ProcessId \') 종료 완료\' }"',
  'echo [완료] 실시간 에이전트가 종료되었습니다.',
  'timeout /t 2 > nul'
].join('\r\n') + '\r\n';

// 4. 초간단 설명서
const guideText = [
  '====================================================================',
  '   [간판지원단] 노트북 전용 사진 자동분류 동기화팩 사용설명서',
  '====================================================================',
  '',
  '이 패키지는 대표님께서 지방 출장이나 해외 체류 중일 때,',
  '집 컴퓨터를 전혀 켜놓지 않고도 노트북에서 언제든지 최신 간판사진을',
  '영업자별/업체별 폴더로 자동 다운로드받으실 수 있는 전용 도구입니다.',
  '',
  '--------------------------------------------------------------------',
  ' [1] 최초 1회 준비사항 (노트북에서 딱 1번만)',
  '--------------------------------------------------------------------',
  '1. 본 압축 파일(간판지원단_노트북_원클릭_동기화팩.zip)을',
  '   노트북의 바탕화면이나 원하시는 폴더에 압축을 풉니다.',
  '2. 노트북에 Node.js 프로그램이 깔려있지 않다면:',
  '   - 배치파일 실행 시 자동으로 설치 페이지가 열립니다.',
  '   - 또는 https://nodejs.org/ko 에서 [LTS 버전]을 1분 만에 설치합니다.',
  '',
  '--------------------------------------------------------------------',
  ' [2] 사진 다운로드 실행 방법 (매우 간단!)',
  '--------------------------------------------------------------------',
  '1. 노트북이 인터넷(와이파이 또는 핫스팟)에 연결되어 있는지 확인합니다.',
  '2. [ ▶_간판사진_자동동기화_실행.bat ] 파일을 더블 클릭합니다.',
  '3. 약 5~10초 만에 클라우드 서버에서 최신 접수건의 사진들이',
  '   노트북 하드디스크에 자동 분류 다운로드됩니다!',
  '',
  '--------------------------------------------------------------------',
  ' [3] 사진이 저장되는 폴더 위치 (스마트 자동 감지)',
  '--------------------------------------------------------------------',
  '- E: 드라이브(외장하드/USB/보조드라이브)로 폴더를 옮겨두신 경우:',
  '  👉 프로그램이 E드라이브의 폴더를 스스로 감지하여, 앞으로 모든 신규 사진을 E드라이브로 쏙 다운로드합니다!',
  '',
  '- 노트북에 D: 드라이브가 있는 경우:',
  '  👉 D:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록\\',
  '',
  '- 노트북에 C: 드라이브만 있는 경우:',
  '  👉 C:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록\\',
  '',
  '※ 다운로드가 끝나면 "탐색기를 여시겠습니까?"에서 [Y]를 누르시면',
  '   저장된 폴더(E:, D:, C: 중 실제 저장된 곳)가 화면에 바로 뜹니다.',
  '',
  '※ 다른 특정 위치(외장하드 F:, 바탕화면 등)에 저장하고 싶으시면:',
  '   동봉된 [저장위치_설정(선택사항).txt] 파일에 원하시는 경로를 적어두시면 됩니다.',
  '',
  '--------------------------------------------------------------------',
  ' [4] 실시간 모니터링 기능 (선택사항)',
  '--------------------------------------------------------------------',
  '- 노트북을 켜놓고 일하시는 동안 신규 접수건이 들어올 때마다',
  '  실시간으로 자동 다운로드받고 싶으시면:',
  '  👉 [ ▶_실시간_사진동기화_실행.bat ]을 더블 클릭해 두시면 됩니다.',
  '===================================================================='
].join('\r\n') + '\r\n';

// 5. 저장위치 설정 템플릿 파일
const customConfigTemplate = [
  '# [간판지원단] 사진 다운로드 저장 위치 설정 파일 (선택사항)',
  '# 기본값: E드라이브나 D드라이브의 폴더를 프로그램이 알아서 자동 감지합니다.',
  '# 만약 특정 드라이브나 폴더에 고정으로 저장하고 싶으시면 아래 주석(#)을 지우고 경로를 입력하세요.',
  '# 예시 1: E:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록',
  '# 예시 2: F:\\외장하드\\간판사진',
  ''
].join('\r\n') + '\r\n';

fs.writeFileSync(path.join(distDir, '저장위치_설정(선택사항).txt'), customConfigTemplate, 'utf8');

// 파일 쓰기
fs.writeFileSync(path.join(distDir, '▶_간판사진_자동동기화_실행.bat'), laptopSyncBat, 'utf8');
fs.writeFileSync(path.join(distDir, '▶_실시간_사진동기화_실행.bat'), laptopRealtimeBat, 'utf8');
fs.writeFileSync(path.join(distDir, '⏹️_실시간_사진동기화_종료.bat'), laptopStopBat, 'utf8');
fs.writeFileSync(path.join(distDir, '📖_노트북_초간단_사용설명서.txt'), guideText, 'utf8');

// supabase-config.js 및 scripts 복사
fs.copyFileSync(path.join(repoRoot, 'supabase-config.js'), path.join(distDir, 'supabase-config.js'));
fs.copyFileSync(path.join(repoRoot, 'scripts', 'sync-photos-agent.js'), path.join(scriptsDistDir, 'sync-photos-agent.js'));
fs.copyFileSync(path.join(repoRoot, 'scripts', 'realtime-photos-agent.js'), path.join(scriptsDistDir, 'realtime-photos-agent.js'));

console.log('✅ 노트북 배포 패키지 파일 생성 완료:', distDir);

// ZIP 압축 생성 (PowerShell Compress-Archive 활용)
const zipName = '간판지원단_노트북_원클릭_동기화팩.zip';
const targetZip1 = path.join(process.env.USERPROFILE, 'Desktop', zipName);
const targetZip2 = path.join('D:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록', zipName);
const targetZip3 = path.join(repoRoot, zipName);

const psZipCmd = `powershell -NoProfile -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${targetZip3}' -Force"`;
try {
  execSync(psZipCmd);
  console.log('✅ ZIP 압축 생성 완료:', targetZip3);

  // 바탕화면 및 대상 폴더로 복사
  fs.copyFileSync(targetZip3, targetZip1);
  console.log('✅ 바탕화면 ZIP 복사 완료:', targetZip1);

  if (fs.existsSync('D:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록')) {
    fs.copyFileSync(targetZip3, targetZip2);
    console.log('✅ 대상 폴더 ZIP 복사 완료:', targetZip2);
  }
} catch (e) {
  console.error('❌ ZIP 생성 실패:', e.message);
}
