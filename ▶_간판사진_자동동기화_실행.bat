@echo off
chcp 65001 > nul
title [간판지원단] 신청업체 사진 자동분류 다운로드 에이전트
color 0B
echo.
echo ===============================================================
echo   [간판지원단] 최고관리자 신청업체 사진 자동분류 동기화
echo ===============================================================
echo.
cd /d "d:\1-Claude_Ai Projects - 2026-05\.vscode-shared\ganpans"
node scripts\sync-photos-agent.js
if %errorlevel% neq 0 (
  echo.
  echo [오류] 동기화 중 오류가 발생했습니다. 오류 내용을 확인하세요.
) else (
  echo.
  echo [완료] 모든 동기화 작업이 성공적으로 끝났습니다.
)
echo.
echo 창을 닫으려면 아무 키나 누르세요...
pause > nul
