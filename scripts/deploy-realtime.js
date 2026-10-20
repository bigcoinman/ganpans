const fs = require('fs');
const path = require('path');

const startupFolder = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const desktopFolder = path.join(process.env.USERPROFILE, 'Desktop');
const targetFolder = 'D:\\1-경기경제과학진흥원\\1- 2027년 간판지원단 신청업체 목록';

// 1. VBS Content (Silent Background)
const vbsContent = [
  'Set WshShell = CreateObject("WScript.Shell")',
  'WshShell.CurrentDirectory = "d:\\1-Claude_Ai Projects - 2026-05\\.vscode-shared\\ganpans"',
  'WshShell.Run "cmd.exe /c node scripts\\realtime-photos-agent.js", 0, False'
].join('\r\n') + '\r\n';

// 2. Stop BAT Content
const stopBatContent = [
  '@echo off',
  'chcp 65001 > nul',
  'title [간판지원단] 실시간 동기화 에이전트 종료',
  'color 0C',
  'echo.',
  'echo ===============================================================',
  'echo   [간판지원단] 실시간 백그라운드 동기화 에이전트 종료 중...',
  'echo ===============================================================',
  'echo.',
  'powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like \'*realtime-photos-agent.js*\' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host \'에이전트 프로세스(PID:\' $_.ProcessId \')를 안전하게 종료했습니다.\' }"',
  'echo.',
  'echo [완료] 실시간 에이전트가 정상적으로 종료되었습니다.',
  'echo.',
  'echo 창을 닫으려면 아무 키나 누르세요...',
  'pause > nul'
].join('\r\n') + '\r\n';

// 3. Console Monitoring BAT Content (Visible Window)
const consoleBatContent = [
  '@echo off',
  'chcp 65001 > nul',
  'title [간판지원단] 초경량 실시간 사진동기화 모니터링 (종료: 창 닫기)',
  'color 0A',
  'cd /d "d:\\1-Claude_Ai Projects - 2026-05\\.vscode-shared\\ganpans"',
  'node scripts\\realtime-photos-agent.js',
  'pause'
].join('\r\n') + '\r\n';

fs.writeFileSync(path.join(__dirname, 'start-realtime-silent.vbs'), vbsContent, 'utf8');
fs.writeFileSync(path.join(__dirname, 'stop-realtime.bat'), stopBatContent, 'utf8');
fs.writeFileSync(path.join(__dirname, 'start-realtime-console.bat'), consoleBatContent, 'utf8');

// Deploy to Desktop, Target Folder, and Startup Folder
const desktopFiles = [
  { path: path.join(desktopFolder, '▶_실시간_사진동기화_시작(백그라운드).vbs'), content: vbsContent },
  { path: path.join(desktopFolder, '▶_실시간_사진동기화_모니터링창_실행.bat'), content: consoleBatContent },
  { path: path.join(desktopFolder, '⏹️_실시간_사진동기화_종료.bat'), content: stopBatContent },
  { path: path.join(startupFolder, '간판지원단_실시간_동기화_에이전트.vbs'), content: vbsContent }
];

const targetFiles = [
  { path: path.join(targetFolder, '▶_실시간_사진동기화_시작(백그라운드).vbs'), content: vbsContent },
  { path: path.join(targetFolder, '▶_실시간_사진동기화_모니터링창_실행.bat'), content: consoleBatContent },
  { path: path.join(targetFolder, '⏹️_실시간_사진동기화_종료.bat'), content: stopBatContent }
];

for (const item of [...desktopFiles, ...targetFiles]) {
  try {
    fs.writeFileSync(item.path, item.content, 'utf8');
    console.log('✅ 배포 완료:', item.path);
  } catch (e) {
    console.error('❌ 배포 실패:', item.path, e.message);
  }
}

console.log('🎉 모든 실시간 에이전트 런처 배포 완료!');
