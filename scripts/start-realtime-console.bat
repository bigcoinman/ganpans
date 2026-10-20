@echo off
chcp 65001 > nul
title [간판지원단] 초경량 실시간 사진동기화 모니터링 (종료: 창 닫기)
color 0A
cd /d "d:\1-Claude_Ai Projects - 2026-05\.vscode-shared\ganpans"
node scripts\realtime-photos-agent.js
pause
