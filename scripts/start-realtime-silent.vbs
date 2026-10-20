Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "d:\1-Claude_Ai Projects - 2026-05\.vscode-shared\ganpans"
WshShell.Run "cmd.exe /c node scripts\realtime-photos-agent.js", 0, False
