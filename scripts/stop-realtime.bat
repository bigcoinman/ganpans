@echo off
chcp 65001 > nul
title [간판지원단] 실시간 동기화 에이전트 종료
color 0C
echo.
echo ===============================================================
echo   [간판지원단] 실시간 백그라운드 동기화 에이전트 종료 중...
echo ===============================================================
echo.
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*realtime-photos-agent.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force; Write-Host '에이전트 프로세스(PID:' $_.ProcessId ')를 안전하게 종료했습니다.' }"
echo.
echo [완료] 실시간 에이전트가 정상적으로 종료되었습니다.
echo.
echo 창을 닫으려면 아무 키나 누르세요...
pause > nul
