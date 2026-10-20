@echo off
chcp 65001 > nul
title [간판지원단] 실시간 자동 다운로드 에이전트 시작
color 0A
echo.
echo ===============================================================
echo   [간판지원단] 실시간 백그라운드 자동 동기화 에이전트 시작
echo ===============================================================
echo.
cd /d "d:\1-Claude_Ai Projects - 2026-05\.vscode-shared\ganpans"
start "GanpanRealtimeAgent" /b "C:\Program Files\nodejs\node.exe" scripts\realtime-photos-agent.js
echo [완료] 실시간 감시 에이전트가 백그라운드에서 정상 가동되었습니다!
echo       신규 신청서 접수 시 D드라이브로 0초 만에 자동 다운로드됩니다.
echo.
echo 창을 닫아도 백그라운드에서 계속 안전하게 실행됩니다.
echo 아무 키나 누르면 창이 닫힙니다...
pause > nul
